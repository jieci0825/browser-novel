<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { ChapterContent } from '@/api/types/book.type'
import type { Page, ParagraphSlice, FlipDirection } from '../types/reader'
import { readSettings } from '../config/read-settings'
import {
    usePagination,
    locatePositionBeforePaginate,
    resolvePageAfterPaginate,
} from '../composables/use-pagination'
import { usePageGesture } from '../composables/use-page-gesture'
import { usePageAnimation } from '../composables/use-page-animation'

const props = withDefaults(
    defineProps<{
        sourceId: string
        bookId: string
        chapterId: string
        content: ChapterContent | null
        startPage?: 'first' | 'last'
    }>(),
    { startPage: 'first' }
)

const emit = defineEmits<{
    'toggle-toolbar': []
    'boundary': [direction: 'prev' | 'next']
}>()

const containerRef = ref<HTMLElement | null>(null)
const prevPageRef = ref<HTMLElement | null>(null)
const currentPageRef = ref<HTMLElement | null>(null)
const nextPageRef = ref<HTMLElement | null>(null)

const {
    paginateWithCache,
    getPageHeight,
    syncMeasureStyles,
} = usePagination(containerRef)

const { isAnimating, startAnimation, updateAnimation, finishAnimation } =
    usePageAnimation()

const pages = ref<Page[]>([])
const currentPageIndex = ref(0)

const paragraphs = computed(() => {
    if (!props.content) return []
    const lines = props.content.content.split('\n').filter(Boolean)
    return [props.content.title, ...lines]
})

const prevPage = computed<Page | null>(() => {
    if (currentPageIndex.value <= 0) return null
    return pages.value[currentPageIndex.value - 1] ?? null
})

const currentPage = computed<Page | null>(() => {
    return pages.value[currentPageIndex.value] ?? null
})

const nextPage = computed<Page | null>(() => {
    if (currentPageIndex.value >= pages.value.length - 1) return null
    return pages.value[currentPageIndex.value + 1] ?? null
})

function executePagination() {
    if (paragraphs.value.length === 0) {
        return { pages: [] as Page[], totalParagraphs: 0, totalPages: 0 }
    }
    return paginateWithCache(
        props.sourceId,
        props.bookId,
        props.chapterId,
        paragraphs.value,
        getPageHeight(),
        0
    )
}

/** 重新分页并保持阅读位置不变 */
function repaginateWithPositionKeep() {
    if (pages.value.length === 0) return
    const pos = locatePositionBeforePaginate(currentPageIndex.value, pages.value)
    const result = executePagination()
    pages.value = result.pages
    currentPageIndex.value = resolvePageAfterPaginate(pos, result.pages)
}

watch(
    () => props.content,
    () => {
        if (!props.content) {
            pages.value = []
            currentPageIndex.value = 0
            return
        }
        const result = executePagination()
        pages.value = result.pages
        currentPageIndex.value =
            props.startPage === 'last' ? Math.max(result.pages.length - 1, 0) : 0
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
    ],
    () => {
        if (pages.value.length === 0) return
        repaginateWithPositionKeep()
    }
)

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
    if (props.content && paragraphs.value.length > 0) {
        const result = executePagination()
        pages.value = result.pages
        currentPageIndex.value =
            props.startPage === 'last' ? Math.max(result.pages.length - 1, 0) : 0
    }
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
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
    return direction === 'next'
        ? currentPageIndex.value < pages.value.length - 1
        : currentPageIndex.value > 0
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

/** 尝试启动翻页动画，边界情况发出事件，返回是否成功启动 */
function tryStartFlip(direction: FlipDirection): boolean {
    if (!canFlip(direction)) {
        emit('boundary', direction)
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

/** 结束动画，根据结果更新页码并恢复槽位样式 */
async function completeFlip(completed: boolean) {
    if (!activeFlipDirection) return
    const direction = activeFlipDirection
    const didComplete = await finishAnimation(completed)
    if (didComplete) {
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
        padding: var(--read-padding-top, 15px)
            var(--read-padding-right, 15px)
            var(--read-padding-bottom, 15px)
            var(--read-padding-left, 15px);
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
}
</style>
