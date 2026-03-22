<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookApi } from '@/api'
import type { ChapterContent, Chapter } from '@/api/types/book.type'
import {
    isInBookshelf,
    addToBookshelf,
} from '@/database/services/bookshelf-service'
import { ElMessage } from 'element-plus'
import { initReadSettings } from './config/read-settings'
import { useReadProgress } from './composables/use-read-progress'
import ReadContent from './components/read-content.vue'
import ReadSidebar from './components/read-sidebar.vue'
import ReadPagination from './components/read-pagination.vue'
import ReadSettingsDialog from './components/read-settings-dialog.vue'
import ReadCatalogDialog from './components/read-catalog-dialog.vue'

defineOptions({ name: 'ReadPage' })

const route = useRoute()
const router = useRouter()

const sourceId = route.params.sourceId as string
const bookId = route.params.bookId as string

const content = ref<ChapterContent | null>(null)
const chapters = ref<Chapter[]>([])
const inBookshelf = ref(true)
const contentLoading = ref(true)
const contentError = ref('')
const sidebarVisible = ref(false)
const settingsVisible = ref(false)
const catalogVisible = ref(false)

const currentChapterId = computed(() => route.params.chapterId as string)

const { ready, consumeInitialScroll } = useReadProgress({
    sourceId,
    bookId,
    currentChapterId,
    chapters,
    inBookshelf,
})

const currentIndex = computed(() =>
    chapters.value.findIndex(c => c.chapterId === currentChapterId.value)
)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(
    () =>
        currentIndex.value >= 0 &&
        currentIndex.value < chapters.value.length - 1
)

function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' && hasPrev.value) {
        goChapter('prev')
    } else if (e.key === 'ArrowRight' && hasNext.value) {
        goChapter('next')
    }
}

onMounted(async () => {
    initReadSettings()
    window.addEventListener('keydown', handleKeydown)
    checkBookshelf()
    await fetchChapters()
    await fetchContent()
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

watch(currentChapterId, () => {
    fetchContent()
})

async function fetchChapters() {
    try {
        const res = await bookApi.getChapters(sourceId, bookId)
        chapters.value = res
    } catch {
        // 章节列表获取失败不阻塞正文加载
    }
}

async function fetchContent() {
    try {
        contentLoading.value = true
        contentError.value = ''
        content.value = null
        const res = await bookApi.getContent(
            sourceId,
            bookId,
            currentChapterId.value
        )
        content.value = res
        await ready
        const scrollTop = consumeInitialScroll(currentChapterId.value)
        contentLoading.value = false
        await nextTick()
        window.scrollTo({ top: scrollTop })
    } catch {
        contentError.value = '获取章节内容失败'
    } finally {
        contentLoading.value = false
    }
}

function goChapter(direction: 'prev' | 'next') {
    const idx = currentIndex.value + (direction === 'prev' ? -1 : 1)
    const chapter = chapters.value[idx]
    if (!chapter) return
    router.replace({
        name: 'read',
        params: { sourceId, bookId, chapterId: chapter.chapterId },
    })
}

async function checkBookshelf() {
    inBookshelf.value = await isInBookshelf(sourceId, bookId)
}

async function handleAddToBookshelf() {
    try {
        const d = await bookApi.getDetail(sourceId, bookId)
        await addToBookshelf({
            sourceId: d.sourceId,
            bookId: d.bookId,
            sourceName: '',
            name: d.name,
            author: d.author,
            cover: d.cover ?? '',
            intro: d.intro ?? '',
            latestChapter: d.latestChapter ?? '',
            status: d.status ?? '',
            addedAt: Date.now(),
            lastReadAt: Date.now(),
        })
        inBookshelf.value = true
        ElMessage.success('已加入书架')
    } catch {
        ElMessage.error('加入书架失败，请重试')
    }
}

function handleCatalog() {
    catalogVisible.value = true
}

function handleCatalogSelect(chapterId: string) {
    if (chapterId === currentChapterId.value) return
    router.replace({
        name: 'read',
        params: { sourceId, bookId, chapterId },
    })
}

function handleBookshelf() {
    router.push({ name: 'bookshelf' })
}

function handleSettings() {
    settingsVisible.value = true
}

function scrollTo(position: 'top' | 'bottom') {
    const top = position === 'top' ? 0 : document.body.scrollHeight
    window.scrollTo({ top, behavior: 'smooth' })
}
</script>

<template>
    <div class="read-page">
        <ReadSidebar
            :visible="sidebarVisible"
            :in-bookshelf="inBookshelf"
            @catalog="handleCatalog"
            @settings="handleSettings"
            @bookshelf="handleBookshelf"
            @add-to-bookshelf="handleAddToBookshelf"
            @scroll-top="scrollTo('top')"
            @scroll-bottom="scrollTo('bottom')"
        />

        <ReadContent
            :content="content"
            :loading="contentLoading"
            :error="contentError"
            @retry="fetchContent"
            @click="sidebarVisible = !sidebarVisible"
        />

        <ReadPagination
            :has-prev="hasPrev"
            :has-next="hasNext"
            @prev="goChapter('prev')"
            @next="goChapter('next')"
        />

        <ReadCatalogDialog
            v-model="catalogVisible"
            :chapters="chapters"
            :current-chapter-id="currentChapterId"
            @select="handleCatalogSelect"
        />

        <ReadSettingsDialog v-model="settingsVisible" />
    </div>
</template>

<style scoped lang="scss">
.read-page {
    min-height: 100vh;
    background-color: var(--read-bg);
}
</style>
