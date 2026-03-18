import Dexie, { type Table } from 'dexie'
import type {
    BookshelfRecord,
    ReadHistoryRecord,
    ChapterCacheRecord,
} from './types'

class NovelDatabase extends Dexie {
    bookshelf!: Table<BookshelfRecord>
    readHistory!: Table<ReadHistoryRecord>
    chapterCache!: Table<ChapterCacheRecord>

    constructor() {
        super('browser-novel')

        this.version(1).stores({
            bookshelf: '[sourceId+bookId], addedAt, lastReadAt',
            readHistory: '[sourceId+bookId], lastReadAt',
            chapterCache:
                '[sourceId+bookId+chapterId], [sourceId+bookId], lastAccessedAt',
        })
    }
}

export const db = new NovelDatabase()
