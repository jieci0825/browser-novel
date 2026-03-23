<script setup lang="ts">
import type { Book } from '../book'

defineProps<{
    book: Book
}>()
</script>

<template>
    <div class="book-card">
        <div class="book-cover">
            <img
                v-if="book.cover"
                :src="book.cover"
                :alt="book.name"
            />
            <div
                v-else
                class="book-cover__placeholder"
            >
                暂无封面
            </div>
            <div
                v-if="book.readProgress != null"
                class="book-progress"
            >
                <el-progress
                    :percentage="book.readProgress"
                    :stroke-width="3"
                    :show-text="false"
                    :color="'var(--el-color-primary)'"
                />
            </div>
        </div>
        <div class="book-info">
            <h3 class="book-title">{{ book.name }}</h3>
            <p class="book-author">{{ book.author }}</p>
        </div>
    </div>
</template>

<style scoped lang="scss">
.book-card {
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
        transform: translateY(-2px);

        .book-cover img,
        .book-cover__placeholder {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
    }
}

.book-cover {
    position: relative;

    img,
    &__placeholder {
        width: 100%;
        aspect-ratio: 3 / 4;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s;
    }

    img {
        object-fit: cover;
    }

    &__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);
        font-size: 14px;
        writing-mode: vertical-rl;
        letter-spacing: 4px;
    }

    .book-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0 4px 4px;
    }
}

.book-info {
    padding-top: 8px;
    text-align: center;
}

.book-title {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.book-author {
    font-size: 12px;
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
