import { watch, onMounted, onUnmounted, type Ref } from 'vue'
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
    let scrollTimer: ReturnType<typeof setTimeout> | null = null
    let initialRecord: ReadHistoryRecord | null = null

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
            // DB 读取失败，继续尝试从接口获取
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

    /** 获取初始加载时应还原的滚动位置（仅首次调用生效，之后始终返回 0） */
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
            scrollPosition: window.scrollY,
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

    function handleScroll() {
        if (scrollTimer) clearTimeout(scrollTimer)
        scrollTimer = setTimeout(saveProgress, SCROLL_DEBOUNCE_MS)
    }

    watch(currentChapterId, () => {
        saveProgress()
    })

    onMounted(() => {
        window.addEventListener('scroll', handleScroll, { passive: true })
    })

    onUnmounted(() => {
        if (scrollTimer) clearTimeout(scrollTimer)
        window.removeEventListener('scroll', handleScroll)
        saveProgress()
    })

    return { saveProgress, ready, consumeInitialScroll }
}
