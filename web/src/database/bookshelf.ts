import { db } from './index'
import type { BookshelfRecord } from './types'
import type { Book } from '@/views/bookshelf/book'

/** 获取书架书籍列表（合并阅读进度），按最后阅读时间降序排列 */
export async function getBookshelfBookList(): Promise<Book[]> {
    const [shelfList, historyList] = await Promise.all([
        db.bookshelf.orderBy('addedAt').reverse().toArray(),
        db.readHistory.toArray(),
    ])

    const historyMap = new Map(
        historyList.map(h => [`${h.sourceId}-${h.bookId}`, h])
    )

    return shelfList.map(shelf => ({
        ...shelf,
        ...historyMap.get(`${shelf.sourceId}-${shelf.bookId}`),
    }))
}

/** 添加书籍到书架 */
export async function addBookToShelf(book: BookshelfRecord): Promise<void> {
    await db.bookshelf.put(book)
}

/** 从书架移除书籍 */
export async function removeBookFromShelf(sourceId: string, bookId: string): Promise<void> {
    await db.bookshelf.delete([sourceId, bookId])
}

/** 判断书籍是否已在书架 */
export async function isBookInShelf(sourceId: string, bookId: string): Promise<boolean> {
    const record = await db.bookshelf.get([sourceId, bookId])
    return record != null
}
