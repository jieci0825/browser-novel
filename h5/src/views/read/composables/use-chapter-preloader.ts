import { onUnmounted } from 'vue'
import { bookApi } from '@/api'
import type { Chapter, ChapterContent } from '@/api/types/book.type'
import type { ChapterCache } from '../types/reader'

interface PendingRequest {
    promise: Promise<ChapterContent>
    controller: AbortController
}

/** 管理章节内容的缓存与预加载，维护当前章 ±1 范围的缓存池并支持请求取消 */
export function useChapterPreloader(sourceId: string, bookId: string) {
    const cache = new Map<string, ChapterCache>()
    const pendingRequests = new Map<string, PendingRequest>()

    /** 加载指定章节内容，命中缓存直接返回，相同章节的并发请求会复用 */
    function loadChapter(chapterId: string): Promise<ChapterContent> {
        const cached = cache.get(chapterId)
        if (cached) return Promise.resolve(cached.content)

        const pending = pendingRequests.get(chapterId)
        if (pending) return pending.promise

        const controller = new AbortController()

        const promise = bookApi
            .getContent(sourceId, bookId, chapterId, controller.signal)
            .then((content) => {
                cache.set(chapterId, { content })
                return content
            })
            .finally(() => {
                pendingRequests.delete(chapterId)
            })

        pendingRequests.set(chapterId, { promise, controller })
        return promise
    }

    /** 预加载当前章节的前后各一章，同时淘汰超出 ±1 范围的缓存 */
    function preloadAdjacentChapters(
        currentChapterId: string,
        chapters: Chapter[]
    ): void {
        const idx = chapters.findIndex(
            (c) => c.chapterId === currentChapterId
        )
        if (idx === -1) return

        const retainIds: string[] = [currentChapterId]
        if (idx > 0) retainIds.push(chapters[idx - 1]!.chapterId)
        if (idx < chapters.length - 1)
            retainIds.push(chapters[idx + 1]!.chapterId)

        for (const id of retainIds) {
            if (!cache.has(id) && !pendingRequests.has(id)) {
                loadChapter(id).catch(() => {})
            }
        }

        evictCache(retainIds)
    }

    /** 将已有的章节内容直接写入缓存，避免重复请求 */
    function setChapter(chapterId: string, content: ChapterContent): void {
        cache.set(chapterId, { content })
    }

    /** 同步获取已缓存的章节数据，未缓存返回 undefined */
    function getChapter(chapterId: string): ChapterCache | undefined {
        return cache.get(chapterId)
    }

    /** 取消指定章节正在进行中的请求 */
    function cancelRequest(chapterId: string): void {
        const pending = pendingRequests.get(chapterId)
        if (!pending) return
        pending.controller.abort()
        pendingRequests.delete(chapterId)
    }

    /** 清理不在保留列表中的缓存和进行中的请求 */
    function evictCache(retainIds: string[]): void {
        const keepSet = new Set(retainIds)

        for (const id of Array.from(cache.keys())) {
            if (!keepSet.has(id)) {
                cache.delete(id)
            }
        }

        for (const id of Array.from(pendingRequests.keys())) {
            if (!keepSet.has(id)) {
                cancelRequest(id)
            }
        }
    }

    /** 取消所有进行中的请求并清空缓存 */
    function destroy(): void {
        for (const pending of pendingRequests.values()) {
            pending.controller.abort()
        }
        pendingRequests.clear()
        cache.clear()
    }

    onUnmounted(destroy)

    return {
        loadChapter,
        setChapter,
        preloadAdjacentChapters,
        getChapter,
        cancelRequest,
        evictCache,
        destroy,
    }
}
