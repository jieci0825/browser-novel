<script setup lang="ts">
import type { Chapter } from '@/api/types/book.type'

defineProps<{
    sourceId: string
    bookId: string
    chapterId: string
    chapters: Chapter[]
}>()

defineEmits<{
    'toggle-toolbar': []
    'chapter-change': [chapterId: string]
}>()
</script>

<template>
    <div class="scroll-reader">
        <div class="scroll-reader__placeholder">
            上下滚动模式开发中...
        </div>
    </div>
</template>

<style scoped lang="scss">
.scroll-reader {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    &__placeholder {
        font-size: 14px;
        color: var(--read-text-color, #999);
    }
}
</style>
