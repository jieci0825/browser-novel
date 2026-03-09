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
    FieldRuleContext,
} from './types'
import { extractHtmlField, extractJsonField, getByPath } from './field-parser'
import { isArray, isFunction } from '../../utils/check-type'

// 默认用户代理
const DEFAULT_UA =
    'Mozilla/5.0 (Linux; Android 10; V1824A Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.186 Mobile Safari/537.36'

// 规则基础适配器
//  - 必须实现 BookSourceAdapter 接口
export class RuleBasedAdapter implements BookSourceAdapter {
    readonly sourceId: string
    readonly sourceName: string

    private rule: BookSourceRule // 书源规则
    private http: AxiosInstance
    private lastSearchAt = 0
    private lastSearchKeyword = ''
    private lastSearchResults: BookSearchItem[] = []

    constructor(rule: BookSourceRule) {
        // 初始化书源信息和 HTTP 客户端
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

    async search(
        keyword: string,
        page = 0,
        pageSize?: number
    ): Promise<BookSearchItem[]> {
        // 提取搜索规则
        const { search: rule } = this.rule

        // 检查搜索冷却时间
        if (rule.cooldown) {
            const remain = rule.cooldown - (Date.now() - this.lastSearchAt)
            if (remain > 0) {
                if (keyword === this.lastSearchKeyword) {
                    return this.lastSearchResults
                }
                throw new Error(
                    `${this.sourceName}搜索频率受限，请在 ${Math.ceil(
                        remain / 1000
                    )} 秒后重试`
                )
            }
        }

        const vars = {
            // encodeURIComponent - 对关键词进行 URL 编码
            keyword: encodeURIComponent(keyword),
            page: String(page),
            pageSize: String(pageSize ?? ''),
        }

        const url = this.buildUrl(rule.url, vars)
        const body = rule.body ? this.interpolate(rule.body, vars) : undefined

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
                cover: item.cover,
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
            cover: fields.cover,
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
        const seenIds = new Set<string>()
        const visitedUrls = new Set<string>()
        const maxPages = rule.pagination?.maxPages ?? 50
        let pageCount = 0

        while (url && pageCount < maxPages) {
            if (visitedUrls.has(url)) break
            visitedUrls.add(url)

            const data = await this.fetch(url, rule.method)

            const items = this.isJson()
                ? this.mapJsonList(data, rule.list, rule.fields)
                : this.mapHtmlList(data as string, rule.list, rule.fields)

            let newCount = 0
            for (const item of items) {
                if (!item.chapterId || !item.title) continue
                if (seenIds.has(item.chapterId)) continue
                seenIds.add(item.chapterId)
                allChapters.push({
                    chapterId: item.chapterId,
                    title: item.title,
                    index: allChapters.length,
                })
                newCount++
            }

            if (this.isJson() || !rule.pagination?.nextSelector) break
            if (pageCount > 0 && newCount === 0) break

            const $ = cheerio.load(data as string)
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
        const fnCtx: FieldRuleContext = {
            $,
            el: root,
            sourceUrl: this.rule.sourceUrl,
        }
        const title =
            typeof rule.fields.title === 'function'
                ? rule.fields.title(fnCtx)
                : extractHtmlField($, root, rule.fields.title)
        const rawContent =
            typeof rule.fields.content === 'function'
                ? rule.fields.content(fnCtx)
                : extractHtmlField($, root, rule.fields.content)
        const content = this.purifyText(rawContent, rule.purify)

        return { title, content }
    }

    /* ======================== internal: url & http ======================== */

    /**
     * 用于判断当前规则是否以 JSON 作为数据源，影响后续请求头和解析逻辑。
     */
    private isJson(): boolean {
        return this.rule.sourceType === 'json'
    }

    /**
     * 用于将模板中的 {{key}} 占位符替换成实际变量值，生成可请求的字符串。
     */
    private interpolate(
        template: string,
        vars: Record<string, string>
    ): string {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
    }

    /**
     * 用于基于模板和变量构建最终请求 URL，并将相对地址补全为绝对地址。
     */
    private buildUrl(
        template: string,
        vars: Record<string, string> = {}
    ): string {
        // 合并所有的变量
        const allVars = { baseUrl: this.rule.sourceUrl, ...vars }
        const url = this.interpolate(template, allVars)

        // 如果 URL 已经是绝对地址，则直接返回
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }

        // 将相对地址补全为绝对地址
        const base = this.rule.sourceUrl.replace(/\/$/, '')
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`
    }

    /**
     * 用于把抓取到的 href 统一解析为绝对 URL，便于后续稳定发起请求。
     */
    private resolveHref(href: string): string {
        if (href.startsWith('http://') || href.startsWith('https://')) {
            return href
        }
        const base = this.rule.sourceUrl.replace(/\/$/, '')
        return `${base}${href.startsWith('/') ? '' : '/'}${href}`
    }

    /**
     * 用于发起 HTTP 请求，并根据书源类型选择响应类型和请求头。
     */
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
        // 把 html 字符串交给 cheerio 解析成一个可查询的 DOM 结构
        //  - 此时的 $ 就类似浏览器中的 document，或者说 jQuery 中的 $
        const $ = cheerio.load(html)
        const results: Record<string, string>[] = []

        // 用选择器 listSelector 找到所有匹配元素，然后逐个遍历
        $(listSelector).each((_, el) => {
            // 这里的 el 就是列表项元素，$(el) 就是列表项元素的 cheerio 对象
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
        const fnCtx: FieldRuleContext = {
            $,
            el,
            sourceUrl: this.rule.sourceUrl,
        }
        for (const [key, rule] of Object.entries(fields)) {
            if (!rule) continue
            result[key] = isFunction(rule)
                ? rule(fnCtx)
                : extractHtmlField($, el, rule)
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
        if (!isArray(arr)) return []
        return arr.map(item => this.extractJsonFields(item, fields))
    }

    private extractJsonFields(
        data: unknown,
        fields: Record<string, FieldRule | undefined>
    ): Record<string, string> {
        const result: Record<string, string> = {}
        const fnCtx: FieldRuleContext = {
            data,
            sourceUrl: this.rule.sourceUrl,
        }
        for (const [key, rule] of Object.entries(fields)) {
            if (!rule) continue
            result[key] = isFunction(rule)
                ? rule(fnCtx)
                : extractJsonField(data, rule)
        }
        return result
    }

    /* ======================== internal: content purify ======================== */

    private purifyText(raw: string, options?: ContentPurifyOptions): string {
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
