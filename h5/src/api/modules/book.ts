import request from '@/utils/request'
import type {
    BookSource,
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
    SearchStreamEvent,
} from '../types/book.type'

/** 获取可用书源列表 */
export function getSources() {
    return request<BookSource[]>({
        url: '/books/sources',
    })
}

/**
 * 聚合搜索（NDJSON 流式）
 *
 * 通过 fetch + ReadableStream 逐行读取 NDJSON，
 * 每解析出一个事件即通过 onEvent 回调通知调用方。
 */
export function searchAll(
    keyword: string,
    onEvent: (event: SearchStreamEvent) => void,
    signal?: AbortSignal
): Promise<void> {
    const url = `/api/books/search?keyword=${encodeURIComponent(keyword)}`

    return fetch(url, { signal }).then(async (res) => {
        if (!res.ok) throw new Error(`请求失败: ${res.status}`)

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop()!

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed) continue
                onEvent(JSON.parse(trimmed) as SearchStreamEvent)
            }
        }

        if (buffer.trim()) {
            onEvent(JSON.parse(buffer.trim()) as SearchStreamEvent)
        }
    })
}

/** 指定书源搜索 */
export function search(
    sourceId: string,
    keyword: string,
    page?: number,
    pageSize?: number
) {
    return request<BookSearchItem[]>({
        url: `/books/search/${sourceId}`,
        params: { keyword, page, pageSize },
    })
}

/** 获取书籍详情 */
export function getDetail(sourceId: string, bookId: string) {
    return request<BookDetail>({
        url: `/books/${sourceId}/detail`,
        params: { bookId },
    })
}

/** 获取章节目录 */
export function getChapters(sourceId: string, bookId: string) {
    return request<Chapter[]>({
        url: `/books/${sourceId}/chapters`,
        params: { bookId },
    })
}

/** 获取章节正文 */
export function getContent(
    sourceId: string,
    bookId: string,
    chapterId: string
) {
    return request<ChapterContent>({
        url: `/books/${sourceId}/content`,
        params: { bookId, chapterId },
    })
}
