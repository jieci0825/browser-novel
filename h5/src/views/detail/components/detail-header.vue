<script setup lang="ts">
import type { BookDetail } from '@/api/types/book.type'

defineProps<{
    detail: BookDetail
}>()
</script>

<template>
    <div class="detail-header">
        <div class="detail-header__info">
            <div class="detail-header__cover">
                <img
                    v-if="detail.cover"
                    :src="detail.cover"
                    :alt="detail.name"
                    loading="lazy"
                />
                <div v-else class="detail-header__placeholder">
                    {{ detail.name }}
                </div>
            </div>

            <div class="detail-header__meta">
                <h2 class="detail-header__name">{{ detail.name }}</h2>
                <p class="detail-header__author">{{ detail.author }}</p>
                <p v-if="detail.wordCount" class="detail-header__item">
                    {{ detail.wordCount }}
                </p>
                <p v-if="detail.category" class="detail-header__item">
                    {{ detail.category }}
                </p>
            </div>
        </div>

        <div v-if="detail.intro" class="detail-header__intro">
            <p>{{ detail.intro }}</p>
        </div>
    </div>
</template>

<style scoped lang="scss">
.detail-header {
    padding: 16px;

    &__info {
        display: flex;
        gap: 14px;
    }

    &__cover {
        flex-shrink: 0;
        width: 96px;

        img,
        .detail-header__placeholder {
            width: 96px;
            height: 128px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
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
        font-size: 13px;
        writing-mode: vertical-rl;
        letter-spacing: 2px;
        padding: 8px;
        overflow: hidden;
    }

    &__meta {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: 2px;
    }

    &__name {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    &__author {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary);
    }

    &__item {
        margin: 0;
        font-size: 12px;
        color: var(--text-placeholder);
    }

    &__intro {
        margin-top: 16px;
        padding: 14px;
        background-color: #f9f9f9;
        border-radius: 8px;

        p {
            margin: 0;
            font-size: 13px;
            line-height: 1.8;
            color: var(--text-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 5;
            -webkit-box-orient: vertical;
        }
    }
}
</style>
