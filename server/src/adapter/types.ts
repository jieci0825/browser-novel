/** 搜索结果 */
export interface BookSearchItem {
    sourceId: string
    bookId: string
    name: string
    author: string
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

/** 书源适配器接口 */
export interface BookSourceAdapter {
    readonly sourceId: string
    readonly sourceName: string

    /** 搜索书籍 */
    search(keyword: string, page?: number): Promise<BookSearchItem[]>

    /** 获取书籍详情 */
    getDetail(bookId: string): Promise<BookDetail>

    /** 获取章节目录 */
    getChapters(bookId: string): Promise<Chapter[]>

    /** 获取章节正文 */
    getContent(bookId: string, chapterId: string): Promise<ChapterContent>
}
