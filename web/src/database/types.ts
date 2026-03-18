/** 书架记录 */
export interface BookshelfRecord {
    sourceId: string
    bookId: string
    sourceName: string
    name: string
    author: string
    cover: string
    intro: string
    latestChapter: string
    status: string
    addedAt: number
}

/** 阅读记录（浏览历史 + 阅读进度） */
export interface ReadHistoryRecord {
    sourceId: string
    bookId: string
    name: string
    author: string
    cover: string
    lastReadChapterId: string
    lastReadChapterTitle: string
    lastReadChapterIndex: number
    totalChapters: number
    readProgress: number
    scrollPosition: number
    lastReadAt: number
}

/** 章节缓存 */
export interface ChapterCacheRecord {
    sourceId: string
    bookId: string
    chapterId: string
    title: string
    content: string
    chapterIndex: number
    cachedAt: number
    lastAccessedAt: number
}
