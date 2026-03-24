import { bookApi } from '@/api'
import type { Chapter } from '@/api/types/book.type'
import { db } from '@/database'
import type { ChapterCacheRecord } from '@/database/types'
import type { ChapterBlock } from '../types/reader'

const MAX_MEMORY_CACHE = 10
const MAX_DB_CACHE = 50

export function useChapterLoader(
    sourceId: string,
    bookId: string,
    chapters: () => Chapter[]
) {
    const memoryCache = new Map<string, ChapterBlock>()

    /** 同步获取已缓存的章节（仅内存） */
    function get(chapterId: string): ChapterBlock | undefined {
        return memoryCache.get(chapterId)
    }

    /** 加载指定章节内容，优先从缓存取 */
    async function load(chapterId: string): Promise<ChapterBlock> {
        const cached = memoryCache.get(chapterId)
        if (cached) return cached

        const dbCached = await loadFromDB(chapterId)
        if (dbCached) {
            setMemoryCache(chapterId, dbCached)
            return dbCached
        }

        const res = await bookApi.getContent(sourceId, bookId, chapterId)
        const block: ChapterBlock = {
            chapterId,
            title: res.title,
            content: res.content,
        }

        setMemoryCache(chapterId, block)
        saveToDB(chapterId, block).catch(() => {})

        return block
    }

    /** 后台预加载相邻章节 */
    function prefetch(chapterIds: string[]) {
        for (const id of chapterIds) {
            if (!memoryCache.has(id)) {
                load(id).catch(() => {})
            }
        }
    }

    /** 预加载当前章节前后各 n 章 */
    function prefetchAround(currentChapterId: string, count = 1) {
        const list = chapters()
        const idx = list.findIndex(c => c.chapterId === currentChapterId)
        if (idx === -1) return

        const ids: string[] = []
        for (let i = 1; i <= count; i++) {
            if (idx - i >= 0) ids.push(list[idx - i]!.chapterId)
            if (idx + i < list.length) ids.push(list[idx + i]!.chapterId)
        }
        prefetch(ids)
    }

    function setMemoryCache(chapterId: string, block: ChapterBlock) {
        memoryCache.set(chapterId, block)
        if (memoryCache.size > MAX_MEMORY_CACHE) {
            const firstKey = memoryCache.keys().next().value as string
            memoryCache.delete(firstKey)
        }
    }

    async function loadFromDB(
        chapterId: string
    ): Promise<ChapterBlock | undefined> {
        try {
            const record = await db.chapterCache.get([
                sourceId,
                bookId,
                chapterId,
            ])
            if (!record) return undefined

            await db.chapterCache.update(
                [sourceId, bookId, chapterId],
                { lastAccessedAt: Date.now() }
            )

            return {
                chapterId: record.chapterId,
                title: record.title,
                content: record.content,
            }
        } catch {
            return undefined
        }
    }

    async function saveToDB(chapterId: string, block: ChapterBlock) {
        const list = chapters()
        const idx = list.findIndex(c => c.chapterId === chapterId)

        const record: ChapterCacheRecord = {
            sourceId,
            bookId,
            chapterId,
            title: block.title,
            content: block.content,
            chapterIndex: idx,
            cachedAt: Date.now(),
            lastAccessedAt: Date.now(),
        }

        await db.chapterCache.put(record)
        await cleanupDBCache()
    }

    async function cleanupDBCache() {
        try {
            const total = await db.chapterCache
                .where('[sourceId+bookId]')
                .equals([sourceId, bookId])
                .count()

            if (total <= MAX_DB_CACHE) return

            const overflow = total - MAX_DB_CACHE
            const toDelete = await db.chapterCache
                .where('[sourceId+bookId]')
                .equals([sourceId, bookId])
                .sortBy('lastAccessedAt')

            const keys = toDelete
                .slice(0, overflow)
                .map(
                    r =>
                        [r.sourceId, r.bookId, r.chapterId] as [
                            string,
                            string,
                            string,
                        ]
                )
            await db.chapterCache.bulkDelete(keys)
        } catch {
            // ignore
        }
    }

    return { get, load, prefetch, prefetchAround }
}
