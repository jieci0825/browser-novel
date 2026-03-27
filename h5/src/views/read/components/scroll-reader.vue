<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Chapter, ChapterContent } from '@/api/types/book.type'
import type { Page, ParagraphSlice } from '../types/reader'
import { readSettings } from '../config/read-settings'
import { usePagination } from '../composables/use-pagination'
import { useChapterPreloader } from '../composables/use-chapter-preloader'

interface LoadedChapter {
    chapterId: string
    paragraphs: string[]
    pages: Page[]
}

const props = withDefaults(
    defineProps<{
        sourceId: string
        bookId: string
        chapterId: string
        chapters: Chapter[]
        initialPageIndex?: number
    }>(),
    { initialPageIndex: 0 }
)

const emit = defineEmits<{
    'toggle-toolbar': []
    'chapter-change': [chapterId: string]
    'page-change': [pageIndex: number]
}>()

const SCROLL_THRESHOLD = 500
const MAX_LOADED_CHAPTERS = 5
const MAX_BEFORE_ACTIVE = 2
const MAX_AFTER_ACTIVE = MAX_LOADED_CHAPTERS - 1 - MAX_BEFORE_ACTIVE

const containerRef = ref<HTMLElement | null>(null)
const loadedChapters = ref<LoadedChapter[]>([])
const chapterLoading = ref(false)
const chapterError = ref('')
const bottomLoading = ref(false)
const topLoading = ref(false)
const reachedEnd = ref(false)
const reachedStart = ref(false)
const activeChapterId = ref(props.chapterId)
const currentPageIndex = ref(0)
let loadVersion = 0
let scrollThrottleTimer: ReturnType<typeof setTimeout> | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null

const { paginateWithCache, getPageHeight, syncMeasureStyles } =
    usePagination(containerRef)

const { loadChapter, preloadAdjacentChapters } = useChapterPreloader(
    props.sourceId,
    props.bookId
)

const exposedPages = computed(() => {
    const chapter = loadedChapters.value.find(
        c => c.chapterId === activeChapterId.value
    )
    return chapter?.pages ?? []
})

function parseParagraphs(content: ChapterContent): string[] {
    return [content.title, ...content.content.split('\n').filter(Boolean)]
}

function paginateChapter(chapterId: string, paragraphs: string[]): Page[] {
    return paginateWithCache(
        props.sourceId,
        props.bookId,
        chapterId,
        paragraphs,
        getPageHeight(),
        0
    ).pages
}

function toLoadedChapter(
    chapterId: string,
    content: ChapterContent
): LoadedChapter {
    const paragraphs = parseParagraphs(content)
    return {
        chapterId,
        paragraphs,
        pages: paginateChapter(chapterId, paragraphs),
    }
}

function findChapterIndex(chapterId: string): number {
    return props.chapters.findIndex(c => c.chapterId === chapterId)
}

function getNextChapterId(): string | null {
    if (loadedChapters.value.length === 0) return null
    const lastLoaded = loadedChapters.value[loadedChapters.value.length - 1]!
    const idx = findChapterIndex(lastLoaded.chapterId)
    if (idx === -1 || idx >= props.chapters.length - 1) return null
    return props.chapters[idx + 1]!.chapterId
}

function getPrevChapterId(): string | null {
    if (loadedChapters.value.length === 0) return null
    const firstLoaded = loadedChapters.value[0]!
    const idx = findChapterIndex(firstLoaded.chapterId)
    if (idx <= 0) return null
    return props.chapters[idx - 1]!.chapterId
}

function getSliceClass(slice: ParagraphSlice): Record<string, boolean> {
    return {
        'm-title': !!slice.isTitle,
        'm-partial': slice.charStart > 0 && !slice.isTitle,
    }
}

/** 判断某个分片是否为其所在页末尾的段落截断（用于抑制跨页段落间距） */
function isPageLastPartialEnd(
    chapter: LoadedChapter,
    page: Page,
    sliceIdx: number
): boolean {
    if (sliceIdx !== page.paragraphs.length - 1) return false
    const slice = page.paragraphs[sliceIdx]!
    const fullText = chapter.paragraphs[slice.paragraphIndex]
    return fullText ? slice.charEnd < fullText.length : false
}

/** 检测当前滚动位置对应的章节和页码 */
function updateVisiblePage() {
    const container = containerRef.value
    if (!container || loadedChapters.value.length === 0) return

    const containerRect = container.getBoundingClientRect()
    const viewportCenterY = containerRect.top + containerRect.height / 2
    const pageDivs = container.querySelectorAll<HTMLElement>(
        '.scroll-reader__page'
    )

    let bestEl: HTMLElement | null = null
    let bestDist = Infinity

    for (const el of pageDivs) {
        const rect = el.getBoundingClientRect()
        const center = rect.top + rect.height / 2
        const dist = Math.abs(center - viewportCenterY)
        if (dist < bestDist) {
            bestDist = dist
            bestEl = el
        }
    }

    if (!bestEl) return

    const chapterId = bestEl.dataset.chapterId!
    const pageIndex = parseInt(bestEl.dataset.pageIndex!, 10)

    if (chapterId !== activeChapterId.value) {
        activeChapterId.value = chapterId
        emit('chapter-change', chapterId)
    }
    currentPageIndex.value = pageIndex
}

async function loadCurrentChapter(chapterId: string, initialPage = 0) {
    const version = ++loadVersion
    chapterLoading.value = true
    chapterError.value = ''
    reachedEnd.value = false
    reachedStart.value = false
    bottomLoading.value = false
    topLoading.value = false

    try {
        const content = await loadChapter(chapterId)
        if (version !== loadVersion) return

        const loaded = toLoadedChapter(chapterId, content)
        loadedChapters.value = [loaded]
        activeChapterId.value = chapterId

        const clampedPage = Math.min(
            initialPage,
            Math.max(loaded.pages.length - 1, 0)
        )
        currentPageIndex.value = clampedPage

        const idx = findChapterIndex(chapterId)
        reachedEnd.value = idx === props.chapters.length - 1
        reachedStart.value = idx === 0

        preloadAdjacentChapters(chapterId, props.chapters)

        await nextTick()

        if (clampedPage > 0) {
            scrollToPage(chapterId, clampedPage)
        }
    } catch {
        if (version !== loadVersion) return
        chapterError.value = '章节加载失败'
    } finally {
        if (version === loadVersion) {
            chapterLoading.value = false
        }
    }

    if (loadVersion === version) {
        checkScrollPosition()
    }
}

/** 滚动容器到指定章节的指定页码位置 */
function scrollToPage(chapterId: string, pageIndex: number) {
    const container = containerRef.value
    if (!container) return

    const pageEl = container.querySelector<HTMLElement>(
        `.scroll-reader__page[data-chapter-id="${chapterId}"][data-page-index="${pageIndex}"]`
    )
    if (!pageEl) return

    const containerRect = container.getBoundingClientRect()
    const pageRect = pageEl.getBoundingClientRect()
    container.scrollTop += pageRect.top - containerRect.top
}

async function loadNextChapter() {
    if (bottomLoading.value || reachedEnd.value) return

    const nextId = getNextChapterId()
    if (!nextId) {
        reachedEnd.value = true
        return
    }

    bottomLoading.value = true
    try {
        const content = await loadChapter(nextId)
        loadedChapters.value.push(toLoadedChapter(nextId, content))

        reachedEnd.value =
            findChapterIndex(nextId) === props.chapters.length - 1

        preloadAdjacentChapters(nextId, props.chapters)

        await nextTick()
        await trimLoadedChapters()
        checkScrollPosition()
    } catch {
        // 静默失败，用户继续滚动时会再次触发
    } finally {
        bottomLoading.value = false
    }
}

async function loadPrevChapter() {
    if (topLoading.value || reachedStart.value) return

    const prevId = getPrevChapterId()
    if (!prevId) {
        reachedStart.value = true
        return
    }

    topLoading.value = true
    try {
        const content = await loadChapter(prevId)
        const container = containerRef.value
        if (!container) return

        const scrollTopBefore = container.scrollTop
        const scrollHeightBefore = container.scrollHeight

        loadedChapters.value.unshift(toLoadedChapter(prevId, content))

        await nextTick()
        const heightDiff = container.scrollHeight - scrollHeightBefore
        container.scrollTop = scrollTopBefore + heightDiff

        reachedStart.value = findChapterIndex(prevId) === 0

        preloadAdjacentChapters(prevId, props.chapters)

        await trimLoadedChapters()
    } catch {
        // 静默失败
    } finally {
        topLoading.value = false
    }
}

/** 当已加载章节超过上限时，移除距当前章节最远的章节 DOM 并修正滚动位置 */
async function trimLoadedChapters() {
    if (loadedChapters.value.length <= MAX_LOADED_CHAPTERS) return

    const container = containerRef.value
    if (!container) return

    const activeIdx = loadedChapters.value.findIndex(
        c => c.chapterId === activeChapterId.value
    )
    if (activeIdx === -1) return

    const chaptersAfter = loadedChapters.value.length - 1 - activeIdx
    if (chaptersAfter > MAX_AFTER_ACTIVE) {
        loadedChapters.value.splice(activeIdx + MAX_AFTER_ACTIVE + 1)
        reachedEnd.value = false
    }

    if (activeIdx > MAX_BEFORE_ACTIVE) {
        const removeCount = activeIdx - MAX_BEFORE_ACTIVE

        const chapterEls = container.querySelectorAll<HTMLElement>(
            '.scroll-reader__chapter'
        )
        let removedHeight = 0
        for (let i = 0; i < removeCount; i++) {
            if (chapterEls[i]) {
                removedHeight += chapterEls[i].offsetHeight
            }
        }

        loadedChapters.value.splice(0, removeCount)

        await nextTick()
        container.scrollTop -= removedHeight

        reachedStart.value = false
    }
}

function retryLoadChapter() {
    loadCurrentChapter(props.chapterId)
}

/** 点击屏幕中间 1/3 区域切换工具栏 */
function handleTap(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.scroll-reader__retry-btn')) return

    const rect = containerRef.value?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    if (x > rect.width / 3 && x < (rect.width * 2) / 3) {
        emit('toggle-toolbar')
    }
}

/** 节流处理滚动事件，150ms 内最多触发一次 */
function handleScroll() {
    if (scrollThrottleTimer) return
    scrollThrottleTimer = setTimeout(() => {
        scrollThrottleTimer = null
        checkScrollPosition()
    }, 150)
}

/** 检查滚动位置，距顶部或底部不足阈值时触发加载，同时更新可见页码 */
function checkScrollPosition() {
    const container = containerRef.value
    if (!container || chapterLoading.value) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    const distanceToTop = scrollTop

    if (distanceToBottom < SCROLL_THRESHOLD) {
        loadNextChapter()
    }

    if (distanceToTop < SCROLL_THRESHOLD) {
        loadPrevChapter()
    }

    updateVisiblePage()
}

/** 对所有已加载章节重新执行分页并更新可见页码 */
function repaginateAllChapters() {
    loadedChapters.value = loadedChapters.value.map(chapter => ({
        ...chapter,
        pages: paginateChapter(chapter.chapterId, chapter.paragraphs),
    }))
    nextTick(() => updateVisiblePage())
}

function handleResize() {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        if (loadedChapters.value.length === 0) return
        syncMeasureStyles()
        repaginateAllChapters()
    }, 300)
}

watch(
    () => props.chapterId,
    (newId) => {
        const isLoaded = loadedChapters.value.some(
            c => c.chapterId === newId
        )
        if (isLoaded) return
        loadCurrentChapter(newId)
    }
)

watch(
    () => [
        readSettings.fontSize,
        readSettings.fontFamily,
        readSettings.customFont,
        readSettings.lineHeight,
        readSettings.letterSpacing,
        readSettings.paragraphSpacing,
        readSettings.paddingTop,
        readSettings.paddingRight,
        readSettings.paddingBottom,
        readSettings.paddingLeft,
    ],
    () => {
        if (loadedChapters.value.length === 0) return
        repaginateAllChapters()
    }
)

onMounted(() => {
    window.addEventListener('resize', handleResize)
    loadCurrentChapter(props.chapterId, props.initialPageIndex)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    if (scrollThrottleTimer) {
        clearTimeout(scrollThrottleTimer)
        scrollThrottleTimer = null
    }
})

watch([activeChapterId, currentPageIndex], () => {
    emit('page-change', currentPageIndex.value)
})

defineExpose({
    pages: exposedPages,
    currentPageIndex,
    activeChapterId,
})
</script>

<template>
    <div
        ref="containerRef"
        class="scroll-reader"
        @click="handleTap"
        @scroll.passive="handleScroll"
    >
        <div
            v-for="chapter in loadedChapters"
            :key="chapter.chapterId"
            class="scroll-reader__chapter"
        >
            <div
                v-for="(page, pageIdx) in chapter.pages"
                :key="pageIdx"
                :data-chapter-id="chapter.chapterId"
                :data-page-index="pageIdx"
                class="scroll-reader__page"
            >
                <p
                    v-for="(slice, idx) in page.paragraphs"
                    :key="`${slice.paragraphIndex}-${slice.charStart}-${idx}`"
                    :class="{
                        ...getSliceClass(slice),
                        'm-partial-end': isPageLastPartialEnd(
                            chapter,
                            page,
                            idx
                        ),
                    }"
                >
                    {{ slice.text }}
                </p>
            </div>
        </div>

        <div
            v-if="chapterLoading"
            class="scroll-reader__status"
        >
            加载中...
        </div>

        <div
            v-if="chapterError"
            class="scroll-reader__status"
        >
            <span>{{ chapterError }}</span>
            <button
                class="scroll-reader__retry-btn"
                @click="retryLoadChapter"
            >
                点击重试
            </button>
        </div>

        <div
            v-if="bottomLoading"
            class="scroll-reader__status"
        >
            加载中...
        </div>

        <div
            v-if="reachedEnd && !bottomLoading && !chapterLoading"
            class="scroll-reader__status scroll-reader__end"
        >
            已读完全部章节
        </div>
    </div>
</template>

<style scoped lang="scss">
.scroll-reader {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        display: none;
    }
    background-color: var(--read-content-bg, #f1f1f1);
    color: var(--read-text-color, #000);

    &__chapter {
        padding: var(--read-padding-top, 15px) var(--read-padding-right, 15px)
            var(--read-padding-bottom, 15px) var(--read-padding-left, 15px);
        font-size: var(--read-font-size, 17px);
        font-family: var(--read-font-family, sans-serif);
        line-height: var(--read-line-height, 1.9);
        letter-spacing: var(--read-letter-spacing, 0);

        p {
            text-indent: 2em;
            margin: 0 0 var(--read-paragraph-spacing, 1em);
            padding: 0;
        }

        .m-title {
            font-weight: 500;
            text-indent: 0;
        }

        .m-partial {
            text-indent: 0;
        }

        .m-partial-end {
            margin-bottom: 0;
        }
    }

    &__status {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2em 0;
        gap: 12px;
        font-size: 14px;
        color: var(--read-text-color, #999);
    }

    &__retry-btn {
        padding: 6px 16px;
        border: 1px solid var(--border-default, #e5e7eb);
        border-radius: 4px;
        background: transparent;
        color: var(--read-text-color, #666);
        font-size: 14px;
        cursor: pointer;

        &:active {
            opacity: 0.7;
        }
    }

    &__end {
        padding-bottom: 3em;
        color: var(--read-text-color, #bbb);
    }
}
</style>
