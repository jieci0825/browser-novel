import * as cheerio from 'cheerio'
import { browserPool } from '../browser/pool'
import type {
    BookSourceAdapter,
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
} from './types'

const BASE_URL = 'https://m.huanxiangxs.com'

export class HuanxiangAdapter implements BookSourceAdapter {
    readonly sourceId = 'huanxiang'
    readonly sourceName = '幻想小说'

    private async fetchHTML(
        url: string,
        waitSelector?: string
    ): Promise<string> {
        return browserPool.withPage(async page => {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            })
            if (waitSelector) {
                await page.waitForSelector(waitSelector, { timeout: 15000 })
            }
            return page.content()
        })
    }

    async search(keyword: string, page = 1): Promise<BookSearchItem[]> {
        const url = `${BASE_URL}/search/?keyword=${encodeURIComponent(
            keyword
        )}&t=0&page=${page}`
        const html = await this.fetchHTML(url, '.subject-item')
        const $ = cheerio.load(html)

        const results: BookSearchItem[] = []

        $('.subject-item').each((_, el) => {
            const $el = $(el)
            const $info = $el.find('.info')
            const $links = $info.find('a')

            const bookUrl = $links.eq(0).attr('href') || ''
            const bookId = this.extractPathId(bookUrl)
            if (!bookId) return

            results.push({
                sourceId: this.sourceId,
                bookId,
                name: $links.eq(0).text().trim(),
                author: $links.eq(1).text().trim(),
                intro: $info
                    .find('p')
                    .text()
                    .replace('【内容简介】', '')
                    .trim(),
                latestChapter: $links
                    .eq(3)
                    .text()
                    .replace('【最新章节】', '')
                    .trim(),
                wordCount: $el
                    .find('.pub')
                    .text()
                    .replace(/.+\/\s*/, '')
                    .trim(),
            })
        })

        return results
    }

    async getDetail(bookId: string): Promise<BookDetail> {
        const url = `${BASE_URL}${bookId}`
        const html = await this.fetchHTML(url)
        const $ = cheerio.load(html)

        const getMeta = (suffix: string) =>
            $(`meta[property$="${suffix}"]`).attr('content') || ''

        return {
            sourceId: this.sourceId,
            bookId,
            name: getMeta('book_name'),
            author: getMeta('author'),
            intro: getMeta('description'),
            latestChapter: getMeta('latest_chapter_name'),
            category: getMeta('category'),
            status: getMeta('status'),
        }
    }

    async getChapters(bookId: string): Promise<Chapter[]> {
        const detailHtml = await this.fetchHTML(`${BASE_URL}${bookId}`)
        const $detail = cheerio.load(detailHtml)
        const readUrl =
            $detail('meta[property$="read_url"]').attr('content') || ''

        if (!readUrl) throw new Error('获取目录地址失败')

        const tocUrl = readUrl.startsWith('http')
            ? readUrl
            : `${BASE_URL}${readUrl}`
        const html = await this.fetchHTML(tocUrl, '#chapter')
        const $ = cheerio.load(html)

        const chapters: Chapter[] = []

        $('#chapter a').each((index, el) => {
            const href = $(el).attr('href') || ''
            const chapterId = this.extractPathId(href)
            if (!chapterId) return

            chapters.push({
                chapterId,
                title: $(el).text().trim(),
                index,
            })
        })

        return chapters
    }

    async getContent(
        bookId: string,
        chapterId: string
    ): Promise<ChapterContent> {
        const url = `${BASE_URL}${chapterId}`
        const html = await this.fetchHTML(url, '#txt')
        const $ = cheerio.load(html)

        const paragraphs: string[] = []
        $('#txt p').each((_, el) => {
            let text = $(el).text().trim()
            text = text
                .replace(/".+最新章节！\s?/g, '')
                .replace(/阅读.+请关注幻想小说网.+/g, '')
                .trim()
            if (text) {
                paragraphs.push(text)
            }
        })

        const title = $('h1').first().text().trim() || $('title').text().trim()

        return {
            title,
            content: paragraphs.join('\n'),
        }
    }

    /** 从 URL 中提取路径作为 ID（如 /book/12345/ → /book/12345/） */
    private extractPathId(url: string): string {
        if (!url) return ''
        try {
            const u = new URL(url, BASE_URL)
            return u.pathname
        } catch {
            return url.startsWith('/') ? url : `/${url}`
        }
    }
}
