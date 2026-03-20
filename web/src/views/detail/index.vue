<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookApi } from '@/api'
import type { BookDetail, Chapter } from '@/api/types/book.type'
import DetailNavbar from './components/detail-navbar.vue'
import DetailHeader from './components/detail-header.vue'
import ChapterList from './components/chapter-list.vue'

defineOptions({ name: 'DetailPage' })

const route = useRoute()
const router = useRouter()

const sourceId = route.params.sourceId as string
const bookId = route.params.bookId as string

const detail = ref<BookDetail | null>(null)
const chapters = ref<Chapter[]>([])
const detailLoading = ref(true)
const chaptersLoading = ref(true)
const detailError = ref('')
const chaptersError = ref('')

onMounted(async () => {
    await Promise.allSettled([fetchDetail(), fetchChapters()])
})

async function fetchDetail() {
    try {
        detailLoading.value = true
        detailError.value = ''
        const res = await bookApi.getDetail(sourceId, bookId)
        detail.value = res
    } catch {
        detailError.value = '获取书籍详情失败'
    } finally {
        detailLoading.value = false
    }
}

async function fetchChapters() {
    try {
        chaptersLoading.value = true
        chaptersError.value = ''
        const res = await bookApi.getChapters(sourceId, bookId)
        chapters.value = res
    } catch {
        chaptersError.value = '获取章节列表失败'
    } finally {
        chaptersLoading.value = false
    }
}

function handleChapterClick(chapter: Chapter) {
    router.push({
        name: 'read',
        params: { sourceId, bookId, chapterId: chapter.chapterId },
    })
}
</script>

<template>
    <div class="detail-page">
        <DetailNavbar />
        <DetailHeader
            :detail="detail"
            :loading="detailLoading"
            :error="detailError"
            @retry="fetchDetail"
        />
        <ChapterList
            :chapters="chapters"
            :loading="chaptersLoading"
            :error="chaptersError"
            @retry="fetchChapters"
            @chapter-click="handleChapterClick"
        />
    </div>
</template>

<style scoped lang="scss">
.detail-page {
    min-height: 100vh;
    background-color: var(--color-bg-page);
    padding-bottom: 40px;
}
</style>
