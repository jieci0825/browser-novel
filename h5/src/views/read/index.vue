<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookApi } from '@/api'
import type { Chapter } from '@/api/types/book.type'
import {
    isInBookshelf,
    addToBookshelf,
} from '@/database/services/bookshelf-service'
import { readSettings, initReadSettings } from './config/read-settings'
import { useReadProgress } from './composables/use-read-progress'
import PagedReader from './components/paged-reader.vue'
import ScrollReader from './components/scroll-reader.vue'
import ReadToolbar from './components/read-toolbar.vue'
import ReadCatalogPopup from './components/read-catalog-popup.vue'
import ReadSettingsPopup from './components/read-settings-popup.vue'
import ReadStatusBar from './components/read-status-bar.vue'

defineOptions({ name: 'ReadPage' })

const route = useRoute()
const router = useRouter()

const sourceId = route.params.sourceId as string
const bookId = route.params.bookId as string

const chapters = ref<Chapter[]>([])
const inBookshelf = ref(true)
const chaptersLoading = ref(true)
const chapterStartPage = ref<'first' | 'last'>('first')
const pagedReaderRef = ref<InstanceType<typeof PagedReader> | null>(null)
const scrollReaderRef = ref<InstanceType<typeof ScrollReader> | null>(null)
const toolbarVisible = ref(false)
const settingsVisible = ref(false)
const catalogVisible = ref(false)

const currentChapterId = computed(() => route.params.chapterId as string)

const { savePageProgress, ready, consumeInitialPageIndex } = useReadProgress({
    sourceId,
    bookId,
    currentChapterId,
    chapters,
    inBookshelf,
})

const savedPageIndex = ref(0)

const currentIndex = computed(() =>
    chapters.value.findIndex(c => c.chapterId === currentChapterId.value)
)
const currentChapterName = computed(() => {
    const chapter = chapters.value[currentIndex.value]
    return chapter?.title ?? ''
})

const currentPage = computed(() => {
    const reader = pagedReaderRef.value ?? scrollReaderRef.value
    if (!reader) return 1
    return reader.currentPageIndex + 1
})

const totalPages = computed(() => {
    const reader = pagedReaderRef.value ?? scrollReaderRef.value
    if (!reader) return 1
    return Math.max(reader.pages.length, 1)
})

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(
    () =>
        currentIndex.value >= 0 &&
        currentIndex.value < chapters.value.length - 1
)

function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' && hasPrev.value) {
        goChapterFromToolbar('prev')
    } else if (e.key === 'ArrowRight' && hasNext.value) {
        goChapterFromToolbar('next')
    }
}

onMounted(async () => {
    initReadSettings()

    window.addEventListener('keydown', handleKeydown)
    checkBookshelf()

    await ready
    savedPageIndex.value = consumeInitialPageIndex(currentChapterId.value)

    await fetchChapters()
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

async function fetchChapters() {
    try {
        chaptersLoading.value = true
        const res = await bookApi.getChapters(sourceId, bookId)
        chapters.value = res
    } catch {
        // ignore
    } finally {
        chaptersLoading.value = false
    }
}

function goChapter(direction: 'prev' | 'next') {
    const idx = currentIndex.value + (direction === 'prev' ? -1 : 1)
    const chapter = chapters.value[idx]
    if (!chapter) return
    toolbarVisible.value = false
    router.replace({
        name: 'read',
        params: { sourceId, bookId, chapterId: chapter.chapterId },
    })
}

/** 通过工具栏或键盘切换章节时，始终从第一页开始 */
function goChapterFromToolbar(direction: 'prev' | 'next') {
    chapterStartPage.value = 'first'
    goChapter(direction)
}

/** PagedReader 内部跨章翻页后同步路由 */
function handleChapterChange(chapterId: string) {
    router.replace({
        name: 'read',
        params: { sourceId, bookId, chapterId },
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
    } catch {
        // ignore
    }
}

function handleCatalog() {
    catalogVisible.value = true
}

function handleCatalogSelect(chapterId: string) {
    if (chapterId === currentChapterId.value) return
    chapterStartPage.value = 'first'
    toolbarVisible.value = false
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

function handleToggleToolbar() {
    if (catalogVisible.value || settingsVisible.value) return
    toolbarVisible.value = !toolbarVisible.value
}

function scrollTo(position: 'top' | 'bottom') {
    const top = position === 'top' ? 0 : document.body.scrollHeight
    window.scrollTo({ top, behavior: 'smooth' })
}

function handlePageChange(pageIndex: number) {
    savedPageIndex.value = pageIndex
    savePageProgress(pageIndex)
}
</script>

<template>
    <div class="read-page">
        <div class="read-page-content-wrapper">
            <PagedReader
                ref="pagedReaderRef"
                v-if="chapters.length > 0 && readSettings.readMode === 'paginated'"
                :source-id="sourceId"
                :book-id="bookId"
                :chapter-id="currentChapterId"
                :chapters="chapters"
                :start-page="chapterStartPage"
                :initial-page-index="savedPageIndex"
                @toggle-toolbar="handleToggleToolbar"
                @chapter-change="handleChapterChange"
                @page-change="handlePageChange"
            />
            <ScrollReader
                ref="scrollReaderRef"
                v-else-if="chapters.length > 0"
                :source-id="sourceId"
                :book-id="bookId"
                :chapter-id="currentChapterId"
                :chapters="chapters"
                :initial-page-index="savedPageIndex"
                @toggle-toolbar="handleToggleToolbar"
                @chapter-change="handleChapterChange"
                @page-change="handlePageChange"
            />
            <div
                v-else-if="chaptersLoading"
                class="read-page-loading"
            >
                加载中...
            </div>
        </div>

        <ReadStatusBar
            :chapter-name="currentChapterName"
            :current-page="currentPage"
            :total-pages="totalPages"
            :current-chapter-index="currentIndex"
            :total-chapters="chapters.length"
        />

        <ReadToolbar
            :visible="toolbarVisible"
            :has-prev="hasPrev"
            :has-next="hasNext"
            :in-bookshelf="inBookshelf"
            @prev="goChapterFromToolbar('prev')"
            @next="goChapterFromToolbar('next')"
            @catalog="handleCatalog"
            @settings="handleSettings"
            @bookshelf="handleBookshelf"
            @add-to-bookshelf="handleAddToBookshelf"
            @scroll-top="scrollTo('top')"
            @scroll-bottom="scrollTo('bottom')"
        />

        <ReadCatalogPopup
            v-model="catalogVisible"
            :chapters="chapters"
            :current-chapter-id="currentChapterId"
            @select="handleCatalogSelect"
        />

        <ReadSettingsPopup v-model="settingsVisible" />
    </div>
</template>

<style scoped lang="scss">
.read-page {
    height: 100dvh;
    background-color: var(--read-content-bg, #f1f1f1);
    display: flex;
    flex-direction: column;

    &-content-wrapper {
        flex: 1;
        overflow: hidden;
    }

    &-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--read-text-color, #999);
        font-size: 14px;
    }
}
</style>
