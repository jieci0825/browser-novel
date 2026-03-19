import type { BookSourceRule } from '../rule-based/types'
import * as cheerio from 'cheerio'

// https://ixdzs8.com/bsearch?q=%E6%8B%AC%E5%BC%A7%E7%AC%91%E7%AC%91

export const aixiadianzishuRule: BookSourceRule = {
    sourceId: 'aixiadianzishu',
    sourceName: '爱下电子书',
    sourceUrl: 'https://ixdzs8.com',

    http: {
        userAgent:
            'Mozilla/5.0 (Linux; Android 10; V1824A Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.186 Mobile Safari/577.36',
        headers: {
            Referer: 'https://ixdzs8.com/',
        },
    },

    search: {
        url: '/bsearch?q={{keyword}}',
        method: 'GET',
        contentType: 'application/x-www-form-urlencoded',
        list: '.burl',
        fields: {
            name: '.bname a',
            bookId: '.l-img a@href | regex:/read/(\\d+)/',
            author: '.bauthor a',
            cover: '.l-img img@src',
            latestChapter: '.l-last .l-chapter',
            status: '.end || .lz',
            wordCount: '.size',
            intro: '.l-p2',
        },
    },

    detail: {
        url: '{{baseUrl}}/read/{{bookId}}',
        fields: {
            name: 'h1',
            author: '.n-text p:nth-of-type(1) a',
            intro: ({ $ }) => {
                if (!$) return ''
                const intro = $('#intro').text()
                // 将 br 都替换成换行符
                return intro.replace(/<br\s*\/?>/gi, '\n')
            },
            latestChapter: '.n-text p:nth-of-type(4) a',
            wordCount: '.n-text .nsize',
            status: '.n-text p:nth-of-type(2) span',
            category: '.n-text p:nth-of-type(2) a',
        },
    },

    chapters: {
        fetchChapters: async ({ bookId, sourceUrl, fetch }) => {
            const resp = (await fetch(
                `${sourceUrl}/novel/clist/`,
                'POST',
                `bid=${bookId}`,
                'application/x-www-form-urlencoded'
            )) as any

            let chapters: any[] = []

            try {
                chapters = JSON.parse(resp).data as any[]
            } catch (error) {
                return []
            }

            return chapters
                .filter(v => v.ctype !== 1) // 过滤卷标题（无链接）
                .map(v => ({
                    chapterId: String(v.ordernum),
                    title: v.title,
                }))
        },
    },

    content: {
        fetchContent: async ({ bookId, chapterId, sourceUrl, fetchRaw }) => {
            const url = `${sourceUrl}/read/${bookId}/p${chapterId}.html`

            // 第一次请求，拿到 challenge 页面和 Set-Cookie
            const resp1 = await fetchRaw(url)
            let html = resp1.data as string

            // 检测到 challenge，带上 Cookie 重新请求
            const tokenMatch = html.match(/let token = "([^"]+)"/)
            if (tokenMatch) {
                const token = tokenMatch[1]
                const challengeUrl = `${url}?challenge=${encodeURIComponent(token)}`
                const cookieStr = (resp1.headers['set-cookie'] ?? [])
                    .map((c: string) => c.split(';')[0])
                    .join('; ')
                const resp2 = await fetchRaw(challengeUrl, { Cookie: cookieStr })
                html = resp2.data as string
            }

            const $ = cheerio.load(html)
            const title = $('h3').first().text().trim()
            const content = $('.page-content section').html() ?? ''

            return { title, content }
        },
        purify: {
            brToNewline: true,
            stripNbsp: true,
            trimLines: true,
            filterEmpty: true,
        },
    },
}
