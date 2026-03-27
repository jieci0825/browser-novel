<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    chapterName: string
    currentPage: number
    totalPages: number
    currentChapterIndex: number
    totalChapters: number
}>()

const progressText = computed(() => {
    if (props.totalChapters === 0) return '0%'
    const percent = ((props.currentChapterIndex + 1) / props.totalChapters) * 100
    const formatted = percent % 1 === 0
        ? percent.toFixed(0)
        : percent.toFixed(2).replace(/0+$/, '')
    return `${formatted}%`
})
</script>

<template>
    <div class="read-status-bar">
        <span class="read-status-bar__chapter">{{ chapterName }}</span>
        <div class="read-status-bar__right">
            <span class="read-status-bar__page">{{ currentPage }}/{{ totalPages }}</span>
            <span class="read-status-bar__progress">{{ progressText }}</span>
        </div>
    </div>
</template>

<style scoped lang="scss">
.read-status-bar {
    width: 100%;
    height: 35px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    box-sizing: border-box;
    font-size: 12px;
    color: var(--read-text-color, #999);
    background-color: var(--read-content-bg, #f1f1f1);
    border-top: 1px solid color-mix(in srgb, var(--read-text-color, #999) 20%, transparent);

    &__chapter {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__right {
        flex-shrink: 0;
        display: flex;
        gap: 12px;
        margin-left: 12px;
    }
}
</style>
