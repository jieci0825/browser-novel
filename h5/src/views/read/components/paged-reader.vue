<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { Chapter, ChapterContent } from '@/api/types/book.type'
import type { Page, ParagraphSlice, FlipDirection } from '../types/reader'
import { readSettings } from '../config/read-settings'
import {
    usePagination,
    locatePositionBeforePaginate,
    resolvePageAfterPaginate,
} from '../composables/use-pagination'
import { useChapterPreloader } from '../composables/use-chapter-preloader'
import { usePageGesture } from '../composables/use-page-gesture'
import { usePageAnimation } from '../composables/use-page-animation'

const props = withDefaults(
    defineProps<{
        sourceId: string
        bookId: string
        chapterId: string
        chapters: Chapter[]
        startPage?: 'first' | 'last'
        initialPageIndex?: number
    }>(),
    { startPage: 'first', initialPageIndex: 0 }
)

const emit = defineEmits<{
    'toggle-toolbar': []
    'chapter-change': [chapterId: string]
    'page-change': [pageIndex: number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const prevPageRef = ref<HTMLElement | null>(null)
const currentPageRef = ref<HTMLElement | null>(null)
const nextPageRef = ref<HTMLElement | null>(null)

const { paginateWithCache, getPageHeight, syncMeasureStyles } =
    usePagination(containerRef)

const { isAnimating, startAnimation, updateAnimation, finishAnimation } =
    usePageAnimation()

const { loadChapter, preloadAdjacentChapters, getChapter } =
    useChapterPreloader(props.sourceId, props.bookId)

// ---- 章节状态 ----

const activeChapterId = ref(props.chapterId)
const activeContent = ref<ChapterContent | null>(null)
const chapterLoading = ref(false)
const chapterError = ref('')
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
let loadVersion = 0
let pendingLoadTarget = {
    chapterId: props.chapterId,
    startPage: props.startPage,
}

// ---- 分页状态 ----

const pages = ref<Page[]>([])
const currentPageIndex = ref(0)

// ---- 章节位置 ----

const chapterIndex = computed(() =>
    props.chapters.findIndex(c => c.chapterId === activeChapterId.value)
)

// ---- 段落解析 ----

const paragraphs = computed(() => {
    if (!activeContent.value) return []
    const lines = activeContent.value.content.split('\n').filter(Boolean)
    return [activeContent.value.title, ...lines]
})

// ---- 页面计算 ----

/** 同步获取相邻章节的边界页（下一章第一页 / 上一章最后一页），缓存未命中时返回 null */
function getAdjacentBoundaryPage(direction: 'prev' | 'next'): Page | null {
    const idx = chapterIndex.value + (direction === 'prev' ? -1 : 1)
    const chapter = props.chapters[idx]
    if (!chapter) return null

    const cached = getChapter(chapter.chapterId)
    if (!cached) return null

    const paras = [
        cached.content.title,
        ...cached.content.content.split('\n').filter(Boolean),
    ]
    const result = paginateWithCache(
        props.sourceId,
        props.bookId,
        chapter.chapterId,
        paras,
        getPageHeight(),
        0
    )
    if (result.pages.length === 0) return null

    return direction === 'next'
        ? result.pages[0]!
        : result.pages[result.pages.length - 1]!
}

const prevPage = computed<Page | null>(() => {
    if (currentPageIndex.value > 0) {
        return pages.value[currentPageIndex.value - 1] ?? null
    }
    return getAdjacentBoundaryPage('prev')
})

const currentPage = computed<Page | null>(() => {
    return pages.value[currentPageIndex.value] ?? null
})

const nextPage = computed<Page | null>(() => {
    if (currentPageIndex.value < pages.value.length - 1) {
        return pages.value[currentPageIndex.value + 1] ?? null
    }
    return getAdjacentBoundaryPage('next')
})

function executePagination() {
    if (paragraphs.value.length === 0) {
        return { pages: [] as Page[], totalParagraphs: 0, totalPages: 0 }
    }
    return paginateWithCache(
        props.sourceId,
        props.bookId,
        activeChapterId.value,
        paragraphs.value,
        getPageHeight(),
        0
    )
}

/** 重新分页并保持阅读位置不变 */
function repaginateWithPositionKeep() {
    if (pages.value.length === 0) return
    const pos = locatePositionBeforePaginate(
        currentPageIndex.value,
        pages.value
    )
    const result = executePagination()
    pages.value = result.pages
    currentPageIndex.value = resolvePageAfterPaginate(pos, result.pages)
}

// ---- Toast ----

function showToast(message: string, duration = 1500) {
    toastMessage.value = message
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
        toastMessage.value = ''
        toastTimer = null
    }, duration)
}

// ---- 章节加载 ----

/** 加载指定章节并执行分页，通过版本号丢弃过期请求的结果 */
async function loadAndApplyChapter(
    chapterId: string,
    startPage: 'first' | 'last',
    restorePageIndex?: number
): Promise<boolean> {
    const version = ++loadVersion
    pendingLoadTarget = { chapterId, startPage }
    chapterLoading.value = true
    chapterError.value = ''

    try {
        const content = await loadChapter(chapterId)
        if (version !== loadVersion) return false

        activeChapterId.value = chapterId
        activeContent.value = content

        const result = executePagination()
        pages.value = result.pages

        const lastPage = Math.max(result.pages.length - 1, 0)
        if (restorePageIndex != null && restorePageIndex > 0) {
            currentPageIndex.value = Math.min(restorePageIndex, lastPage)
        } else {
            currentPageIndex.value = startPage === 'last' ? lastPage : 0
        }

        preloadAdjacentChapters(chapterId, props.chapters)
        return true
    } catch {
        if (version !== loadVersion) return false
        chapterError.value = '章节加载失败'
        return false
    } finally {
        if (version === loadVersion) {
            chapterLoading.value = false
        }
    }
}

// ---- 跨章翻页 ----

/** 同步应用已缓存的章节数据（跨章动画完成后调用，避免异步间隙导致的遮罩闪烁） */
function applyCachedChapter(
    chapterId: string,
    startPage: 'first' | 'last'
): boolean {
    const cached = getChapter(chapterId)
    if (!cached) return false

    ++loadVersion
    activeChapterId.value = chapterId
    activeContent.value = cached.content

    const result = executePagination()
    pages.value = result.pages
    currentPageIndex.value =
        startPage === 'last' ? Math.max(result.pages.length - 1, 0) : 0

    preloadAdjacentChapters(chapterId, props.chapters)
    return true
}

/** 向前/向后切换到相邻章节，首尾章节边界显示 toast 提示 */
async function switchChapter(direction: 'prev' | 'next') {
    if (chapterLoading.value) return

    const idx = chapterIndex.value + (direction === 'prev' ? -1 : 1)
    const chapter = props.chapters[idx]

    if (!chapter) {
        showToast(direction === 'prev' ? '已经是第一章了' : '已经是最后一章了')
        return
    }

    const startPage = direction === 'next' ? 'first' : 'last'
    const success = await loadAndApplyChapter(chapter.chapterId, startPage)

    if (success) {
        emit('chapter-change', chapter.chapterId)
    }
}

/** 重试上一次失败的章节加载 */
async function retryLoadChapter() {
    const { chapterId, startPage } = pendingLoadTarget
    const success = await loadAndApplyChapter(chapterId, startPage)
    if (success && chapterId !== props.chapterId) {
        emit('chapter-change', chapterId)
    }
}

// ---- 外部章节变更（目录、工具栏切换）----

watch(
    () => props.chapterId,
    newId => {
        if (newId === activeChapterId.value) return
        loadAndApplyChapter(newId, props.startPage)
    }
)

// ---- 排版参数变更 ----

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
        if (pages.value.length === 0) return
        repaginateWithPositionKeep()
    }
)

// ---- 相邻章节预分页 ----

const PRELOAD_PAGE_THRESHOLD = 3
const prePaginatedChapters = new Set<string>()

function scheduleIdleWork(callback: () => void) {
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => callback())
    } else {
        setTimeout(callback, 1)
    }
}

/** 预加载相邻章节并在浏览器空闲时预先执行分页计算，避免跨章翻页时的分页延迟 */
function scheduleAdjacentPagination(direction: 'prev' | 'next') {
    const idx = chapterIndex.value + (direction === 'prev' ? -1 : 1)
    const chapter = props.chapters[idx]
    if (!chapter) return

    const chapterId = chapter.chapterId
    if (prePaginatedChapters.has(chapterId)) return
    prePaginatedChapters.add(chapterId)

    loadChapter(chapterId)
        .then(content => {
            const paras = [
                content.title,
                ...content.content.split('\n').filter(Boolean),
            ]
            scheduleIdleWork(() => {
                paginateWithCache(
                    props.sourceId,
                    props.bookId,
                    chapterId,
                    paras,
                    getPageHeight(),
                    0
                )
            })
        })
        .catch(() => {
            prePaginatedChapters.delete(chapterId)
        })
}

watch(currentPageIndex, pageIdx => {
    const total = pages.value.length
    if (total === 0) return

    if (pageIdx >= total - PRELOAD_PAGE_THRESHOLD) {
        scheduleAdjacentPagination('next')
    }

    if (pageIdx < PRELOAD_PAGE_THRESHOLD) {
        scheduleAdjacentPagination('prev')
    }
})

watch(activeChapterId, () => {
    prePaginatedChapters.clear()
})

let resizeTimer: ReturnType<typeof setTimeout> | null = null

function handleResize() {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        if (pages.value.length === 0) return
        syncMeasureStyles()
        repaginateWithPositionKeep()
    }, 300)
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    loadAndApplyChapter(
        props.chapterId,
        props.startPage,
        props.initialPageIndex > 0 ? props.initialPageIndex : undefined
    )
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    if (toastTimer) clearTimeout(toastTimer)
})

watch([activeChapterId, currentPageIndex], () => {
    emit('page-change', currentPageIndex.value)
})

function getSliceClass(slice: ParagraphSlice): Record<string, boolean> {
    return {
        'm-title': !!slice.isTitle,
        'm-partial': slice.charStart > 0 && !slice.isTitle,
    }
}

// ---- 动画驱动翻页 ----

const COMPLETE_RATIO = 1 / 3
const VELOCITY_THRESHOLD = 0.3

let activeFlipDirection: FlipDirection | null = null

function canFlip(direction: FlipDirection): boolean {
    if (direction === 'next') {
        return (
            currentPageIndex.value < pages.value.length - 1 ||
            nextPage.value !== null
        )
    }
    return currentPageIndex.value > 0 || prevPage.value !== null
}

function isCrossChapterFlip(direction: FlipDirection): boolean {
    return direction === 'next'
        ? currentPageIndex.value >= pages.value.length - 1
        : currentPageIndex.value <= 0
}

/** 清除三个槽位上残留的动画内联样式，让 CSS 类重新掌控可见性 */
function clearSlotInlineStyles() {
    const els = [prevPageRef.value, currentPageRef.value, nextPageRef.value]
    for (const el of els) {
        if (!el) continue
        el.style.visibility = ''
        el.style.pointerEvents = ''
        el.style.transform = ''
        el.style.transition = ''
        el.style.zIndex = ''
        el.style.boxShadow = ''
    }
}

/** 尝试启动翻页动画；若已到章节边界则触发跨章切换 */
function tryStartFlip(direction: FlipDirection): boolean {
    if (!canFlip(direction)) {
        switchChapter(direction)
        return false
    }
    const prev = prevPageRef.value!
    const current = currentPageRef.value
    const next = nextPageRef.value!
    if (!current) return false
    const started = startAnimation(direction, prev, current, next)
    if (started) activeFlipDirection = direction
    return started
}

/** 结束动画，根据结果更新页码（跨章时同步切换章节数据）并恢复槽位样式 */
async function completeFlip(completed: boolean) {
    if (!activeFlipDirection) return
    const direction = activeFlipDirection
    const crossChapter = isCrossChapterFlip(direction)

    const didComplete = await finishAnimation(completed)

    if (didComplete && crossChapter) {
        const idx = chapterIndex.value + (direction === 'prev' ? -1 : 1)
        const chapter = props.chapters[idx]
        if (chapter) {
            const startPage = direction === 'next' ? 'first' : 'last'
            applyCachedChapter(chapter.chapterId, startPage)
            emit('chapter-change', chapter.chapterId)
        }
    } else if (didComplete) {
        currentPageIndex.value += direction === 'next' ? 1 : -1
    }

    activeFlipDirection = null
    await nextTick()
    clearSlotInlineStyles()
}

usePageGesture(containerRef, {
    onDragStart(direction) {
        tryStartFlip(direction)
    },
    onDragging(offsetX) {
        updateAnimation(offsetX)
    },
    onDragEnd({ offsetX, velocity }) {
        if (!isAnimating.value || !activeFlipDirection) return
        const pageWidth = containerRef.value?.offsetWidth ?? 1
        const isCorrectDirection =
            (activeFlipDirection === 'next' && offsetX < 0) ||
            (activeFlipDirection === 'prev' && offsetX > 0)
        const completed =
            isCorrectDirection &&
            (Math.abs(offsetX) > pageWidth * COMPLETE_RATIO ||
                velocity > VELOCITY_THRESHOLD)
        completeFlip(completed)
    },
    onTap(zone) {
        if (zone === 'toggle-toolbar') {
            emit('toggle-toolbar')
            return
        }
        const direction: FlipDirection = zone
        if (!tryStartFlip(direction)) return
        completeFlip(true)
    },
})

defineExpose({
    pages,
    currentPageIndex,
    activeChapterId,
})
</script>

<template>
    <div
        ref="containerRef"
        class="paged-reader"
    >
        <div
            ref="prevPageRef"
            class="paged-reader__page paged-reader__page--prev"
        >
            <template v-if="prevPage">
                <p
                    v-for="(slice, idx) in prevPage.paragraphs"
                    :key="`prev-${slice.paragraphIndex}-${slice.charStart}-${idx}`"
                    :class="getSliceClass(slice)"
                >
                    {{ slice.text }}
                </p>
            </template>
        </div>

        <div
            ref="currentPageRef"
            class="paged-reader__page paged-reader__page--current"
        >
            <template v-if="currentPage">
                <p
                    v-for="(slice, idx) in currentPage.paragraphs"
                    :key="`cur-${slice.paragraphIndex}-${slice.charStart}-${idx}`"
                    :class="getSliceClass(slice)"
                >
                    {{ slice.text }}
                </p>
            </template>
        </div>

        <div
            ref="nextPageRef"
            class="paged-reader__page paged-reader__page--next"
        >
            <template v-if="nextPage">
                <p
                    v-for="(slice, idx) in nextPage.paragraphs"
                    :key="`next-${slice.paragraphIndex}-${slice.charStart}-${idx}`"
                    :class="getSliceClass(slice)"
                >
                    {{ slice.text }}
                </p>
            </template>
        </div>

        <div
            v-if="chapterLoading || chapterError"
            class="paged-reader__overlay"
        >
            <span v-if="chapterLoading">加载中...</span>
            <span
                v-else
                class="paged-reader__overlay-retry"
                @click="retryLoadChapter"
            >
                {{ chapterError }}，点击重试
            </span>
        </div>

        <div
            v-if="toastMessage"
            class="paged-reader__toast"
        >
            {{ toastMessage }}
        </div>
    </div>
</template>

<style scoped lang="scss">
.paged-reader {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: none;

    &__page {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: var(--read-padding-top, 15px) var(--read-padding-right, 15px)
            var(--read-padding-bottom, 15px) var(--read-padding-left, 15px);
        font-size: var(--read-font-size, 17px);
        font-family: var(--read-font-family, sans-serif);
        line-height: var(--read-line-height, 1.9);
        letter-spacing: var(--read-letter-spacing, 0);
        color: var(--read-text-color, #000);
        background-color: var(--read-content-bg, #f1f1f1);

        p {
            text-indent: 2em;
            margin: 0;
            padding: 0;
            margin-bottom: var(--read-paragraph-spacing, 1em);
        }

        .m-title {
            font-weight: 500;
            text-indent: 0;
        }

        .m-partial {
            text-indent: 0;
        }

        &--prev,
        &--next {
            visibility: hidden;
            pointer-events: none;
        }

        &--current {
            visibility: visible;
        }
    }

    &__overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        background-color: var(--read-content-bg, #f1f1f1);
        color: var(--read-text-color, #999);
        font-size: 14px;

        &-retry {
            cursor: pointer;
        }
    }

    &__toast {
        position: absolute;
        bottom: 40%;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: #fff;
        border-radius: 4px;
        font-size: 14px;
        z-index: 100;
        pointer-events: none;
        white-space: nowrap;
    }
}
</style>
