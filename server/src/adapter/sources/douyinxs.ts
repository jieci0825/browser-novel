import type { BookSourceRule } from '../rule-based/types'

export const douyinxsRule: BookSourceRule = {
    sourceId: 'douyinxs',
    sourceName: '抖音小说',
    sourceUrl: 'https://www.douyinxs.com',

    // HTTP 配置
    http: {
        userAgent:
            'Mozilla/5.0 (Linux; Android 10; V1824A Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.186 Mobile Safari/537.36',
        headers: {
            Referer: 'https://www.douyinxs.com/',
        },
    },

    // 搜索规则
    search: {
        url: '/search/',
        method: 'POST',
        body: 'searchkey={{keyword}}&Submit=',
        contentType: 'application/x-www-form-urlencoded',
        list: '.novelslist2 li',
        excludePattern: '^作品名称$',
        cooldown: 120000,
        fields: {
            name: '.s2 a',
            bookId: '.s2 a@href',
            author: '.s4',
            latestChapter: '.s3 a',
            wordCount: '.s5',
            status: '.s7',
        },
    },

    // 详情规则
    detail: {
        url: '{{baseUrl}}{{bookId}}',
        fields: {
            name: '#info h1',
            author: '#info p:nth-of-type(1) | replace:^作\\s*者[：:]\\s*,',
            intro: '#intro p:nth-of-type(2) || #intro',
            latestChapter: '#list a',
            wordCount:
                '#info p:nth-of-type(3) | regex:(\\d+(?:\\.\\d+)?[万千]?)\\s*字',
            status: '#info p:nth-of-type(3) | regex:(连载|连载中|完结|已完结)',
            category: '.con_top a:nth-of-type(2)',
        },
    },

    // 章节列表规则
    chapters: {
        url: '{{baseUrl}}{{bookId}}',
        list: '#list dd a',
        fields: {
            chapterId: '@href',
            title: '@text',
        },
    },

    // 正文规则
    content: {
        url: '{{baseUrl}}{{chapterId}}',
        fields: {
            title: '.bookname h1 || h1 || title',
            content: '#content@html',
        },
        purify: {
            brToNewline: true,
            stripNbsp: true,
            trimLines: true,
            filterEmpty: true,
        },
    },
}
