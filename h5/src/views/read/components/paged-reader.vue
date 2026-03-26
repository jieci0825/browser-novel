<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { ChapterContent } from '@/api/types/book.type'
import type { Page, ParagraphSlice } from '../types/reader'
import { readSettings } from '../config/read-settings'
import {
    usePagination,
    locatePositionBeforePaginate,
    resolvePageAfterPaginate,
} from '../composables/use-pagination'

const props = defineProps<{
    sourceId: string
    bookId: string
    chapterId: string
    content: ChapterContent | null
}>()

const containerRef = ref<HTMLElement | null>(null)

const {
    paginateWithCache,
    getPageHeight,
    syncMeasureStyles,
} = usePagination(containerRef)

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
        currentPageIndex.value = 0
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
        currentPageIndex.value = 0
    }
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
})

function getSliceClass(slice: ParagraphSlice): Record<string, boolean> {
    return {
        'm-title': !!slice.isTitle,
        'm-partial': slice.isPartial && !slice.isTitle,
    }
}

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
            v-if="prevPage"
            class="paged-reader__page paged-reader__page--prev"
        >
            <p
                v-for="(slice, idx) in prevPage.paragraphs"
                :key="`prev-${slice.paragraphIndex}-${slice.charStart}-${idx}`"
                :class="getSliceClass(slice)"
            >
                {{ slice.text }}
            </p>
        </div>

        <div
            v-if="currentPage"
            class="paged-reader__page paged-reader__page--current"
        >
            <p
                v-for="(slice, idx) in currentPage.paragraphs"
                :key="`cur-${slice.paragraphIndex}-${slice.charStart}-${idx}`"
                :class="getSliceClass(slice)"
            >
                {{ slice.text }}
            </p>
        </div>

        <div
            v-if="nextPage"
            class="paged-reader__page paged-reader__page--next"
        >
            <p
                v-for="(slice, idx) in nextPage.paragraphs"
                :key="`next-${slice.paragraphIndex}-${slice.charStart}-${idx}`"
                :class="getSliceClass(slice)"
            >
                {{ slice.text }}
            </p>
        </div>
    </div>
</template>

<style scoped lang="scss">
.paged-reader {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;

    &__page {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
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
