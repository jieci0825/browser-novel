import { db } from '../index'
import type { ReadHistoryRecord } from '../types'

/** 更新阅读进度（upsert） */
export async function updateReadProgress(
    record: ReadHistoryRecord
): Promise<void> {
    await db.readHistory.put(record)
}

/** 获取某本书的阅读进度 */
export async function getReadProgress(
    sourceId: string,
    bookId: string
): Promise<ReadHistoryRecord | undefined> {
    return db.readHistory.get([sourceId, bookId])
}

/** 获取浏览历史列表（按最近阅读时间倒序） */
export async function getReadHistoryList(
    limit?: number
): Promise<ReadHistoryRecord[]> {
    const query = db.readHistory.orderBy('lastReadAt').reverse()
    return limit ? query.limit(limit).toArray() : query.toArray()
}

/** 删除某条阅读记录 */
export async function removeReadHistory(
    sourceId: string,
    bookId: string
): Promise<void> {
    await db.readHistory.delete([sourceId, bookId])
}

/** 清理超出上限的旧记录（默认保留 200 条） */
export async function cleanupOldHistory(maxCount = 200): Promise<void> {
    const total = await db.readHistory.count()
    if (total <= maxCount) return

    const overflow = total - maxCount
    // 按最近阅读时间升序，取出最旧的超出部分
    const toDelete = await db.readHistory
        .orderBy('lastReadAt')
        .limit(overflow)
        .toArray()
    const keys = toDelete.map(r => [r.sourceId, r.bookId] as [string, string])
    await db.readHistory.bulkDelete(keys)
}
