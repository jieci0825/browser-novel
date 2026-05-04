import type { BookSourceRule } from '../rule-based/types'
import * as cheerio from 'cheerio'

export const shenhuaxiaoshuoRule: BookSourceRule = {
    sourceId: 'shenhuazhihou',
    sourceName: '神话之后小说网',
    sourceUrl: 'https://www.shenhuazhihou.com',

    http: {
        userAgent:
            'Mozilla/5.0 (Linux; Android 10; V1824A Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.186 Mobile Safari/577.36',
        headers: {
            Referer: 'https://www.shenhuazhihou.com/',
        },
    },

    search: {
        cooldown: 30,
        url: 'https://www.shenhuazhihou.com/e/search/index.php',
        method: 'POST',
        contentType: 'application/x-www-form-urlencoded',
        body: 'tbname=bookname&show=title,writer&tempid=1&keyboard={{keyword}}',
        list: '.book-coverlist',
        fields: {
            name: '.name a',
            bookId: '.name a@href | regex:/book/([^/]+)(?:/|$)',
            author: '.author',
            cover: 'img@src',
            status: () => '未知',
            latestChapter: () => '无最新章节',
            wordCount: () => '未知',
            intro: '.intro',
        },
    },

    detail: {
        url: '{{baseUrl}}/book/{{bookId}}',
        fields: {
            name: 'h1',
            author: '.m-infos a',
            intro: 'p',
            cover: '.cover-block img@src',
            latestChapter: '.m-upd a',
            wordCount: () => '未知',
            status: '.m-infos span:nth-of-type(2) | replace:状态：,',
            category: () => '未知',
        },
    },

    chapters: {
        url: '{{baseUrl}}/book/{{bookId}}',
        list: '.line2 a',
        fields: {
            chapterId: '@href | regex:(\\d+)\\.html$',
            title: '@text',
        },
    },

    content: {
        url: '{{baseUrl}}/book/{{bookId}}/{{chapterId}}.html',
        fields: {
            content: '#chaptercontent@html',
            title: 'h1',
        },
        purify: {
            brToNewline: true,
            stripNbsp: true,
            trimLines: true,
            filterEmpty: true,
        },
    },
}
