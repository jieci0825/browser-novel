import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookApi } from '@/api'
import type { BookDetail, Chapter } from '@/api/types/book.type'
import {
    isInBookshelf,
    addToBookshelf,
    removeFromBookshelf,
} from '@/database/services/bookshelf-service'

export function useDetail() {
    const route = useRoute()
    const router = useRouter()

    const sourceId = route.params.sourceId as string
    const bookId = route.params.bookId as string

    const detail = ref<BookDetail | null>(null)
    const chapters = ref<Chapter[]>([])
    const loading = ref(true)
    const error = ref(false)
    const inBookshelf = ref(false)

    async function fetchData() {
        loading.value = true
        error.value = false

        try {
            const [detailRes, chaptersRes] = await Promise.all([
                bookApi.getDetail(sourceId, bookId),
                bookApi.getChapters(sourceId, bookId),
            ])

            detail.value = detailRes
            chapters.value = chaptersRes
            inBookshelf.value = await isInBookshelf(sourceId, bookId)
        } catch {
            error.value = true
        } finally {
            loading.value = false
        }
    }

    async function toggleBookshelf() {
        if (!detail.value) return

        if (inBookshelf.value) {
            await removeFromBookshelf(sourceId, bookId)
            inBookshelf.value = false
        } else {
            const d = detail.value
            await addToBookshelf({
                sourceId,
                bookId,
                sourceName: '',
                name: d.name,
                author: d.author,
                cover: d.cover || '',
                intro: d.intro || '',
                latestChapter: d.latestChapter || '',
                status: d.status || '',
                addedAt: Date.now(),
                lastReadAt: Date.now(),
            })
            inBookshelf.value = true
        }
    }

    function startReading() {
        if (!chapters.value.length) return
        router.push({
            name: 'read',
            params: {
                sourceId,
                bookId,
                chapterId: chapters.value[0]!.chapterId,
            },
        })
    }

    function goToChapter(chapter: Chapter) {
        router.push({
            name: 'read',
            params: {
                sourceId,
                bookId,
                chapterId: chapter.chapterId,
            },
        })
    }

    function goBack() {
        router.back()
    }

    onMounted(fetchData)

    return {
        detail,
        chapters,
        loading,
        error,
        inBookshelf,
        fetchData,
        toggleBookshelf,
        startReading,
        goToChapter,
        goBack,
    }
}
