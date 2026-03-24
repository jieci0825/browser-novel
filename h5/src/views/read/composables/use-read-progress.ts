import { watch, onMounted, onUnmounted, type Ref } from 'vue'
import { bookApi } from '@/api'
import type { Chapter } from '@/api/types/book.type'
import type { ReadHistoryRecord } from '@/database/types'
import {
    updateReadProgress,
    getReadProgress,
} from '@/database/services/read-history-service'
import { updateBookshelfLastReadAt } from '@/database/services/bookshelf-service'
import { readSettings } from '../config/read-settings'

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
    let scrollTimer: ReturnType<typeof setTimeout> | null = null
    let initialRecord: ReadHistoryRecord | null = null
    let _pageIndex = 0

    const SCROLL_DEBOUNCE_MS = 500

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

    function consumeInitialScroll(chapterId: string): number {
        if (!initialRecord) return 0
        const pos =
            String(initialRecord.lastReadChapterId) === String(chapterId)
                ? initialRecord.scrollPosition
                : 0
        initialRecord = null
        return pos
    }

    function buildRecord(): ReadHistoryRecord | null {
        if (!bookInfo) return null

        const chapterId = currentChapterId.value
        const chapterList = chapters.value
        const idx = chapterList.findIndex(c => c.chapterId === chapterId)
        const chapter = chapterList[idx]
        if (!chapter) return null

        const total = chapterList.length
        const scrollPosition =
            readSettings.readMode === 'paginated'
                ? _pageIndex
                : window.scrollY

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
            scrollPosition,
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

    /** 翻页模式下由 PagedReader 主动调用，更新页码并保存进度 */
    function savePagedProgress(pageIndex: number) {
        _pageIndex = pageIndex
        saveProgress()
    }

    function handleScroll() {
        if (scrollTimer) clearTimeout(scrollTimer)
        scrollTimer = setTimeout(saveProgress, SCROLL_DEBOUNCE_MS)
    }

    function addScrollListener() {
        window.addEventListener('scroll', handleScroll, { passive: true })
    }

    function removeScrollListener() {
        if (scrollTimer) clearTimeout(scrollTimer)
        window.removeEventListener('scroll', handleScroll)
    }

    watch(currentChapterId, () => {
        if (readSettings.readMode === 'scroll') {
            saveProgress()
        }
    })

    watch(
        () => readSettings.readMode,
        (mode, oldMode) => {
            if (oldMode === 'scroll') removeScrollListener()
            if (mode === 'scroll') addScrollListener()
        }
    )

    onMounted(() => {
        if (readSettings.readMode === 'scroll') {
            addScrollListener()
        }
    })

    onUnmounted(() => {
        removeScrollListener()
        saveProgress()
    })

    return { saveProgress, savePagedProgress, ready, consumeInitialScroll }
}
