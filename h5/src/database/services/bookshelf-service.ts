import { db } from '../index'
import type { BookshelfRecord } from '../types'
import type { Book } from '@/views/bookshelf/book'

/** 加入书架 */
export async function addToBookshelf(book: BookshelfRecord): Promise<void> {
    await db.bookshelf.put(book)
}

/** 移出书架 */
export async function removeFromBookshelf(sourceId: string, bookId: string): Promise<void> {
    await db.bookshelf.delete([sourceId, bookId])
}

/** 获取书架列表（按加入时间倒序） */
export async function getBookshelfList(): Promise<BookshelfRecord[]> {
    return db.bookshelf.orderBy('addedAt').reverse().toArray()
}

/** 判断是否已在书架中 */
export async function isInBookshelf(sourceId: string, bookId: string): Promise<boolean> {
    const record = await db.bookshelf.get([sourceId, bookId])
    return record != null
}

/** 更新书架记录的最后阅读时间 */
export async function updateBookshelfLastReadAt(
    sourceId: string,
    bookId: string,
    lastReadAt: number
): Promise<void> {
    await db.bookshelf.update([sourceId, bookId], { lastReadAt })
}

/** 获取书架列表并关联阅读进度（按最后阅读时间倒序） */
export async function getBookshelfWithProgress(): Promise<Book[]> {
    const [shelfList, historyList] = await Promise.all([
        db.bookshelf.toArray(),
        db.readHistory.toArray(),
    ])

    const historyMap = new Map(
        historyList.map(h => [`${h.sourceId}-${h.bookId}`, h])
    )

    return shelfList
        .map(shelf => {
            const h = historyMap.get(`${shelf.sourceId}-${shelf.bookId}`)
            return {
                ...shelf,
                ...(h && {
                    lastReadChapterId: h.lastReadChapterId,
                    lastReadChapterTitle: h.lastReadChapterTitle,
                    lastReadChapterIndex: h.lastReadChapterIndex,
                    totalChapters: h.totalChapters,
                    readProgress: h.readProgress,
                    scrollPosition: h.scrollPosition,
                }),
            }
        })
        .sort((a, b) => b.lastReadAt - a.lastReadAt)
}
