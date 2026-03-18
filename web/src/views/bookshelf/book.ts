import type { BookshelfRecord, ReadHistoryRecord } from '@/database/types'

/** 书架展示用类型：书架记录 + 可选的阅读进度 */
export type Book = BookshelfRecord & Partial<Pick<ReadHistoryRecord,
    'lastReadChapterId' |
    'lastReadChapterTitle' |
    'lastReadChapterIndex' |
    'totalChapters' |
    'readProgress' |
    'scrollPosition'
>>
