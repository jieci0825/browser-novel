import type { BookSourceRule } from '../../rule-based/types'
import type * as cheerio from 'cheerio'

export const douxswRule: BookSourceRule = {
    sourceId: 'douxsw',
    sourceName: '抖音小说2',
    sourceUrl: 'https://m.douxsw.com',

    http: {
        userAgent:
            'Mozilla/5.0 (Linux; Android 10; V1824A Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.186 Mobile Safari/537.36',
        headers: {
            Referer: 'https://m.douxsw.com/',
        },
    },

    search: {
        url: '/search/',
        method: 'POST',
        body: 'searchkey={{keyword}}',
        contentType: 'application/x-www-form-urlencoded',
        list: '.bookbox',
        fields: {
            name: '.bookname a',
            bookId: '.bookname a@href | regex:/bqg/(\\d+)/',
            author: '.author | replace:^作者：,',
            cover: '.bookimg img@src',
            latestChapter: '.update a',
        },
    },

    chapters: {
        url: '{{baseUrl}}/bqg/{{bookId}}',
        list: ($: cheerio.CheerioAPI) => {
            if (!$) return []
            // 找到所有类名包含 'directoryArea' 的元素
            const directoryAreas = $('.directoryArea')
            // 只需要第二个
            const secondDirectoryArea = directoryAreas.eq(1)
            // 这个元素下面所有的 a 标签
            const aTags = secondDirectoryArea.find('a')
            return aTags.map((_, el) => $(el)).get()
        },
        fields: {
            chapterId: '@href | regex:(\\d+)\\.html$',
            title: '@text',
        },
        pagination: {
            nextSelector: '.index-container a:contains("下一页")',
        },
    },

    // 详情规则
    detail: {
        url: '{{baseUrl}}/bqg/{{bookId}}',
        fields: {
            name: '#top .title',
            author: '.synopsisArea_detail .author | replace:^作者：,',
            intro: '.review p',
            latestChapter: '.synopsisArea_detail .lastchapter a',
            wordCount:
                '#info p:nth-of-type(3) | regex:(\\d+(?:\\.\\d+)?[万千]?)\\s*字',
            status: ({ $ }) => {
                if (!$) return ''
                const detailDiv = $('.synopsisArea_detail')
                // 获取这个容器下面的第二个 p 元素
                const childs = detailDiv.children('p')
                const status = childs.eq(1).text().trim()
                return status.includes('完结') ? '已完结' : '连载中'
            },
            category: '.synopsisArea_detail .sort | replace:^类别：,',
        },
    },

    content: {},
}
