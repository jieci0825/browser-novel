import axios, { type AxiosInstance } from 'axios'
import * as cheerio from 'cheerio'
import type {
    BookSourceAdapter,
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
} from '../types'
import type {
    BookSourceRule,
    ContentPurifyOptions,
    FieldRule,
} from './types'
import {
    extractHtmlField,
    extractJsonField,
    getByPath,
} from './field-parser'

const DEFAULT_UA =
    'Mozilla/5.0 (Linux; Android 10; V1824A Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.186 Mobile Safari/537.36'

export class RuleBasedAdapter implements BookSourceAdapter {
    readonly sourceId: string
    readonly sourceName: string

    private rule: BookSourceRule
    private http: AxiosInstance
    private lastSearchAt = 0
    private lastSearchKeyword = ''
    private lastSearchResults: BookSearchItem[] = []

    constructor(rule: BookSourceRule) {
        this.rule = rule
        this.sourceId = rule.sourceId
        this.sourceName = rule.sourceName

        this.http = axios.create({
            timeout: rule.http?.timeout ?? 15000,
            headers: {
                'User-Agent': rule.http?.userAgent ?? DEFAULT_UA,
                ...rule.http?.headers,
            },
        })
    }

    /* ======================== search ======================== */

    async search(keyword: string, page = 0): Promise<BookSearchItem[]> {
        const { search: rule } = this.rule

        if (rule.cooldown) {
            const remain = rule.cooldown - (Date.now() - this.lastSearchAt)
            if (remain > 0) {
                if (keyword === this.lastSearchKeyword) {
                    return this.lastSearchResults
                }
                throw new Error(
                    `${this.sourceName}搜索频率受限，请在 ${Math.ceil(remain / 1000)} 秒后重试`
                )
            }
        }

        const vars = {
            keyword: encodeURIComponent(keyword),
            page: String(page),
        }
        const url = this.buildUrl(rule.url, vars)
        const body = rule.body
            ? this.interpolate(rule.body, vars)
            : undefined

        const data = await this.fetch(url, rule.method, body, rule.contentType)

        const rawItems = this.isJson()
            ? this.mapJsonList(data, rule.list, rule.fields)
            : this.mapHtmlList(data as string, rule.list, rule.fields)

        const exclude = rule.excludePattern
            ? new RegExp(rule.excludePattern)
            : null

        const results: BookSearchItem[] = rawItems
            .filter(item => {
                if (!item.name || !item.bookId) return false
                return !(exclude && exclude.test(item.name))
            })
            .map(item => ({
                sourceId: this.sourceId,
                bookId: item.bookId,
                name: item.name,
                author: item.author,
                intro: item.intro,
                latestChapter: item.latestChapter,
                wordCount: item.wordCount,
                status: item.status,
            }))

        if (rule.cooldown) {
            this.lastSearchAt = Date.now()
            this.lastSearchKeyword = keyword
            this.lastSearchResults = results
        }

        return results
    }

    /* ======================== detail ======================== */

    async getDetail(bookId: string): Promise<BookDetail> {
        const { detail: rule } = this.rule
        const url = this.buildUrl(rule.url, { bookId })
        const data = await this.fetch(url, rule.method)

        const fields = this.isJson()
            ? this.extractJsonFields(data, rule.fields)
            : this.extractHtmlPageFields(data as string, rule.fields)

        return {
            sourceId: this.sourceId,
            bookId,
            name: fields.name ?? '',
            author: fields.author ?? '',
            intro: fields.intro,
            latestChapter: fields.latestChapter,
            wordCount: fields.wordCount,
            status: fields.status,
            category: fields.category,
        }
    }

    /* ======================== chapters ======================== */

    async getChapters(bookId: string): Promise<Chapter[]> {
        const { chapters: rule } = this.rule
        const vars = { bookId }
        let url: string | null = this.buildUrl(rule.url, vars)

        const allChapters: Chapter[] = []
        const maxPages = rule.pagination?.maxPages ?? 50
        let pageCount = 0

        while (url && pageCount < maxPages) {
            const data = await this.fetch(url, rule.method)

            if (this.isJson()) {
                const items = this.mapJsonList(data, rule.list, rule.fields)
                for (const item of items) {
                    if (!item.chapterId || !item.title) continue
                    allChapters.push({
                        chapterId: item.chapterId,
                        title: item.title,
                        index: allChapters.length,
                    })
                }
                break
            }

            const $ = cheerio.load(data as string)
            $(rule.list).each((_, el) => {
                const item = this.extractFieldsFromEl(
                    $,
                    $(el),
                    rule.fields
                )
                if (!item.chapterId || !item.title) return
                allChapters.push({
                    chapterId: item.chapterId,
                    title: item.title,
                    index: allChapters.length,
                })
            })

            if (!rule.pagination?.nextSelector) break

            const nextHref = $(rule.pagination.nextSelector).attr('href')
            if (!nextHref) break

            url = this.resolveHref(nextHref)
            pageCount++
        }

        return allChapters
    }

    /* ======================== content ======================== */

    async getContent(
        bookId: string,
        chapterId: string
    ): Promise<ChapterContent> {
        const { content: rule } = this.rule
        const url = this.buildUrl(rule.url, { bookId, chapterId })
        const data = await this.fetch(url, rule.method)

        if (this.isJson()) {
            const fields = this.extractJsonFields(data, rule.fields)
            return {
                title: fields.title ?? '',
                content: fields.content ?? '',
            }
        }

        const $ = cheerio.load(data as string)

        if (rule.purify?.removeSelectors) {
            for (const sel of rule.purify.removeSelectors) {
                $(sel).remove()
            }
        }

        const root = $.root()
        const title = extractHtmlField($, root, rule.fields.title)
        const rawContent = extractHtmlField($, root, rule.fields.content)
        const content = this.purifyText(rawContent, rule.purify)

        return { title, content }
    }

    /* ======================== internal: url & http ======================== */

    private isJson(): boolean {
        return this.rule.sourceType === 'json'
    }

    private interpolate(
        template: string,
        vars: Record<string, string>
    ): string {
        return template.replace(
            /\{\{(\w+)\}\}/g,
            (_, key) => vars[key] ?? ''
        )
    }

    private buildUrl(
        template: string,
        vars: Record<string, string> = {}
    ): string {
        const allVars = { baseUrl: this.rule.sourceUrl, ...vars }
        const url = this.interpolate(template, allVars)
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        const base = this.rule.sourceUrl.replace(/\/$/, '')
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`
    }

    private resolveHref(href: string): string {
        if (href.startsWith('http://') || href.startsWith('https://')) {
            return href
        }
        const base = this.rule.sourceUrl.replace(/\/$/, '')
        return `${base}${href.startsWith('/') ? '' : '/'}${href}`
    }

    private async fetch(
        url: string,
        method: 'GET' | 'POST' = 'GET',
        body?: string,
        contentType?: string
    ): Promise<unknown> {
        const headers: Record<string, string> = {}
        if (body) {
            headers['Content-Type'] =
                contentType ??
                (this.isJson()
                    ? 'application/json'
                    : 'application/x-www-form-urlencoded')
        }

        const response = await this.http.request({
            url,
            method,
            data: body,
            responseType: this.isJson() ? 'json' : 'text',
            headers: Object.keys(headers).length ? headers : undefined,
        })
        return response.data
    }

    /* ======================== internal: html extraction ======================== */

    private mapHtmlList(
        html: string,
        listSelector: string,
        fields: Record<string, FieldRule | undefined>
    ): Record<string, string>[] {
        const $ = cheerio.load(html)
        const results: Record<string, string>[] = []

        $(listSelector).each((_, el) => {
            results.push(this.extractFieldsFromEl($, $(el), fields))
        })
        return results
    }

    private extractHtmlPageFields(
        html: string,
        fields: Record<string, FieldRule | undefined>
    ): Record<string, string> {
        const $ = cheerio.load(html)
        return this.extractFieldsFromEl($, $.root(), fields)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private extractFieldsFromEl(
        $: cheerio.CheerioAPI,
        el: cheerio.Cheerio<any>,
        fields: Record<string, FieldRule | undefined>
    ): Record<string, string> {
        const result: Record<string, string> = {}
        for (const [key, rule] of Object.entries(fields)) {
            if (rule) {
                result[key] = extractHtmlField($, el, rule)
            }
        }
        return result
    }

    /* ======================== internal: json extraction ======================== */

    private mapJsonList(
        data: unknown,
        listPath: string,
        fields: Record<string, FieldRule | undefined>
    ): Record<string, string>[] {
        const arr = getByPath(data, listPath)
        if (!Array.isArray(arr)) return []
        return arr.map(item => this.extractJsonFields(item, fields))
    }

    private extractJsonFields(
        data: unknown,
        fields: Record<string, FieldRule | undefined>
    ): Record<string, string> {
        const result: Record<string, string> = {}
        for (const [key, rule] of Object.entries(fields)) {
            if (rule) {
                result[key] = extractJsonField(data, rule)
            }
        }
        return result
    }

    /* ======================== internal: content purify ======================== */

    private purifyText(
        raw: string,
        options?: ContentPurifyOptions
    ): string {
        if (!options) return raw

        let text = raw

        if (options.brToNewline !== false) {
            text = text.replace(/<br\s*\/?>/gi, '\n')
        }
        if (options.stripNbsp !== false) {
            text = text.replace(/&nbsp;/g, ' ')
        }

        text = cheerio.load(`<div>${text}</div>`)('div').text()

        let lines = text.split('\n')
        if (options.trimLines !== false) {
            lines = lines.map(l => l.trim())
        }
        if (options.filterEmpty !== false) {
            lines = lines.filter(Boolean)
        }

        return lines.join('\n')
    }
}
