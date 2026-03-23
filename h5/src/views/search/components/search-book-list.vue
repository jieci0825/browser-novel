<script setup lang="ts">
import type { BookSearchItem } from '@/api/types/book.type'

defineProps<{
    books: BookSearchItem[]
    searching: boolean
}>()

const emit = defineEmits<{
    detail: [book: BookSearchItem]
}>()
</script>

<template>
    <ul class="book-list">
        <li
            v-for="book in books"
            :key="`${book.sourceId}-${book.bookId}`"
            class="book-list__item"
            @click="emit('detail', book)"
        >
            <div class="book-list__cover">
                <img
                    v-if="book.cover"
                    :src="book.cover"
                    :alt="book.name"
                    loading="lazy"
                />
                <div v-else class="book-list__placeholder">
                    {{ book.name }}
                </div>
            </div>

            <div class="book-list__content">
                <h3 class="book-list__name">{{ book.name }}</h3>

                <p class="book-list__meta">
                    <span>{{ book.author }}</span>
                    <span v-if="book.status" class="book-list__divider"
                        >·</span
                    >
                    <span v-if="book.status">{{ book.status }}</span>
                </p>

                <p v-if="book.intro" class="book-list__intro">
                    {{ book.intro }}
                </p>
            </div>
        </li>

        <li v-if="searching" class="book-list__loading">
            <span class="spinner"></span>
            <span>搜索中…</span>
        </li>
    </ul>
</template>

<style scoped lang="scss">
.book-list {
    list-style: none;

    &__item {
        display: flex;
        padding: 14px 0;
        border-bottom: 1px solid var(--border-default);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:active {
            opacity: 0.7;
        }
    }

    &__cover {
        flex-shrink: 0;
        width: 64px;

        img,
        .book-list__placeholder {
            width: 64px;
            height: 85px;
            border-radius: 4px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }

        img {
            object-fit: cover;
            display: block;
        }
    }

    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f0f0f0;
        color: var(--text-secondary);
        font-size: 11px;
        writing-mode: vertical-rl;
        letter-spacing: 2px;
        padding: 6px;
        overflow: hidden;
    }

    &__content {
        flex: 1;
        min-width: 0;
        margin-left: 12px;
        display: flex;
        flex-direction: column;
    }

    &__name {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__meta {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--text-secondary);

        .book-list__divider {
            margin: 0 4px;
        }
    }

    &__intro {
        margin: 6px 0 0;
        font-size: 12px;
        line-height: 1.5;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    &__loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 20px 0;
        font-size: 13px;
        color: var(--text-secondary);
    }
}

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-default);
    border-top-color: var(--text-secondary);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
