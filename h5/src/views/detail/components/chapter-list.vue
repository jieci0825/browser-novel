<script setup lang="ts">
import type { Chapter } from '@/api/types/book.type'

defineProps<{
    chapters: Chapter[]
}>()

const emit = defineEmits<{
    select: [chapter: Chapter]
}>()
</script>

<template>
    <div class="chapter-list">
        <h3 class="chapter-list__title">章节目录</h3>
        <ul class="chapter-list__body">
            <li
                v-for="chapter in chapters"
                :key="chapter.chapterId"
                class="chapter-list__item"
                @click="emit('select', chapter)"
            >
                <span class="chapter-list__text">{{ chapter.title }}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="chapter-list__arrow">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                </svg>
            </li>
        </ul>
    </div>
</template>

<style scoped lang="scss">
.chapter-list {
    padding: 0 16px;

    &__title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        padding-bottom: 8px;
    }

    &__body {
        list-style: none;
    }

    &__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 13px 0;
        border-bottom: 1px solid var(--border-default);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:active {
            opacity: 0.7;
        }

        &:last-child {
            border-bottom: none;
        }
    }

    &__text {
        flex: 1;
        min-width: 0;
        font-size: 14px;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__arrow {
        flex-shrink: 0;
        color: var(--text-placeholder);
        margin-left: 8px;
    }
}
</style>
