import { onUnmounted, type Ref } from 'vue'
import { bookApi } from '@/api'
import type { Chapter } from '@/api/types/book.type'
import type { ReadHistoryRecord } from '@/database/types'
import {
    updateReadProgress,
    getReadProgress,
} from '@/database/services/read-history-service'
import { updateBookshelfLastReadAt } from '@/database/services/bookshelf-service'

interface UseReadProgressOptions {
    sourceId: string
    bookId: string
    currentChapterId: Ref<string>
    chapters: Ref<Chapter[]>
    inBookshelf: Ref<boolean>
}

interface BookInfo {
    name: string
    author: string
    cover: string
}

export function useReadProgress(options: UseReadProgressOptions) {
    const { sourceId, bookId, currentChapterId, chapters, inBookshelf } =
        options

    let bookInfo: BookInfo | null = null
    let initialRecord: ReadHistoryRecord | null = null
    let _pageIndex = 0
    let saveTimer: ReturnType<typeof setTimeout> | null = null

    const SAVE_DEBOUNCE_MS = 500

    const ready = loadBookInfo()

    async function loadBookInfo() {
        try {
            const existing = await getReadProgress(sourceId, bookId)
            if (existing) {
                bookInfo = {
                    name: existing.name,
                    author: existing.author,
                    cover: existing.cover,
                }
                initialRecord = existing
                return
            }
        } catch {
            // ignore
        }

        try {
            const detail = await bookApi.getDetail(sourceId, bookId)
            bookInfo = {
                name: detail.name,
                author: detail.author,
                cover: detail.cover ?? '',
            }
        } catch {
            bookInfo = { name: '', author: '', cover: '' }
        }
    }

    /** 消费初始阅读进度页码（仅同章节有效，且只能消费一次） */
    function consumeInitialPageIndex(chapterId: string): number {
        if (!initialRecord) return 0
        const pageIndex =
            String(initialRecord.lastReadChapterId) === String(chapterId)
                ? initialRecord.scrollPosition
                : 0
        initialRecord = null
        return pageIndex
    }

    function buildRecord(): ReadHistoryRecord | null {
        if (!bookInfo) return null

        const chapterId = currentChapterId.value
        const chapterList = chapters.value
        const idx = chapterList.findIndex(c => c.chapterId === chapterId)
        const chapter = chapterList[idx]
        if (!chapter) return null

        const total = chapterList.length

        return {
            sourceId,
            bookId,
            ...bookInfo,
            lastReadChapterId: chapterId,
            lastReadChapterTitle: chapter.title,
            lastReadChapterIndex: idx,
            totalChapters: total,
            readProgress:
                total > 0 ? Math.round(((idx + 1) / total) * 10000) / 100 : 0,
            scrollPosition: _pageIndex,
            lastReadAt: Date.now(),
        }
    }

    async function saveProgress() {
        const record = buildRecord()
        if (!record) return

        await updateReadProgress(record)

        if (inBookshelf.value) {
            await updateBookshelfLastReadAt(sourceId, bookId, record.lastReadAt)
        }
    }

    /** 由阅读器组件调用，更新页码并延迟保存进度 */
    function savePageProgress(pageIndex: number) {
        _pageIndex = pageIndex
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(saveProgress, SAVE_DEBOUNCE_MS)
    }

    onUnmounted(() => {
        if (saveTimer) {
            clearTimeout(saveTimer)
            saveTimer = null
        }
        saveProgress()
    })

    return { savePageProgress, ready, consumeInitialPageIndex }
}
