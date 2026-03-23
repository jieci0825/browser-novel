/** 书源信息 */
export interface BookSource {
    sourceId: string
    sourceName: string
}

/** 搜索结果 */
export interface BookSearchItem {
    sourceId: string
    bookId: string
    sourceName?: string
    name: string
    author: string
    cover?: string
    intro?: string
    latestChapter?: string
    wordCount?: string
    status?: string
}

/** 书籍详情 */
export interface BookDetail {
    sourceId: string
    bookId: string
    name: string
    author: string
    cover?: string
    intro?: string
    latestChapter?: string
    wordCount?: string
    status?: string
    category?: string
}

/** 章节列表项 */
export interface Chapter {
    chapterId: string
    title: string
    index: number
}

/** 章节正文 */
export interface ChapterContent {
    title: string
    content: string
}

/** 聚合搜索流式响应 —— 单个书源的搜索结果 */
export interface SearchStreamResult {
    type: 'result'
    sourceId: string
    sourceName: string
    items: BookSearchItem[]
}

/** 聚合搜索流式响应 —— 书源搜索出错 */
export interface SearchStreamError {
    type: 'error'
    sourceId: string
    sourceName: string
    message: string
}

/** 聚合搜索流式响应 —— 全部完成 */
export interface SearchStreamDone {
    type: 'done'
}

export type SearchStreamEvent =
    | SearchStreamResult
    | SearchStreamError
    | SearchStreamDone
