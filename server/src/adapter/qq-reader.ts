import axios from 'axios'
import type {
    BookSourceAdapter,
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
} from './types'

const http = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; V1824A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.186 Mobile Safari/537.36',
    },
})

const REFERER =
    'https://bookshelf.html5.qq.com/qbread/categorylist?traceid=0809004&sceneid=FeedsTab'
const Q_GUID = '4aa27c7cf2d9aca3359656ea186488cb'

export class QQReaderAdapter implements BookSourceAdapter {
    readonly sourceId = 'qq-reader'
    readonly sourceName = 'QQ阅读'

    async search(keyword: string, page = 0): Promise<BookSearchItem[]> {
        const pageSize = 20
        const start = page * pageSize
        const end = start + pageSize - 1

        const { data } = await http.get(
            'https://newopensearch.reader.qq.com/wechat',
            { params: { keyword, start, end } }
        )

        if (!data?.booklist?.length) return []

        return data.booklist.map((item: any) => ({
            sourceId: this.sourceId,
            bookId: item.bid,
            name: item.title,
            author: item.author,
            intro: item.intro,
            wordCount: item.totalWords,
            status: item.updateInfo,
        }))
    }

    async getDetail(bookId: string): Promise<BookDetail> {
        const { data } = await http.get(
            'https://bookshelf.html5.qq.com/qbread/api/novel/intro-info',
            {
                params: { bookid: bookId },
                headers: { Referer: REFERER },
            }
        )

        const info = data?.data?.bookInfo
        if (!info) throw new Error('获取书籍详情失败')

        return {
            sourceId: this.sourceId,
            bookId: info.resourceID,
            name: info.resourceName,
            author: info.author,
            intro: info.summary,
            latestChapter: info.lastSerialname,
            wordCount: String(info.contentsize),
            status: info.isfinish ? '已完结' : '连载中',
            category: [info.subject, info.subtype].filter(Boolean).join(' · '),
        }
    }

    async getChapters(bookId: string): Promise<Chapter[]> {
        const { data } = await http.get(
            'https://bookshelf.html5.qq.com/qbread/api/book/all-chapter',
            {
                params: { bookId },
                headers: { Referer: REFERER },
            }
        )

        if (!data?.rows?.length) return []

        return data.rows.map((item: any, index: number) => ({
            chapterId: String(item.serialID),
            title: item.serialName,
            index,
        }))
    }

    async getContent(
        bookId: string,
        chapterId: string
    ): Promise<ChapterContent> {
        const { data } = await http.post(
            'https://novel.html5.qq.com/be-api/content/ads-read',
            {
                Scene: 'chapter',
                ContentAnchorBatch: [
                    {
                        BookID: bookId,
                        ChapterSeqNo: [Number(chapterId)],
                    },
                ],
            },
            {
                headers: {
                    'Q-GUID': Q_GUID,
                    'Content-Type': 'application/json',
                },
            }
        )

        const item = data?.data?.Content?.[0]
        if (!item) throw new Error('获取章节内容失败')

        const contentArr: string[] = item.Content || []
        const content = contentArr.join('\n')

        return {
            title: item.ChapterInfo?.Title || '',
            content,
        }
    }
}
