<script setup lang="ts">
import type { ChapterContent } from '@/api/types/book.type'
import AppButton from '@/components/app-button/index.vue'

defineProps<{
    content: ChapterContent | null
    loading: boolean
    error: string
}>()

defineEmits<{
    retry: []
    click: []
}>()
</script>

<template>
    <div class="read-content" @click="$emit('click')">
        <div v-if="loading" class="read-content__loading">
            <div class="skeleton-title skeleton-block" />
            <div v-for="i in 12" :key="i" class="skeleton-line skeleton-block" :style="{ width: i % 3 === 0 ? '60%' : '100%' }" />
        </div>

        <div v-else-if="error" class="read-content__error" @click.stop>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p>{{ error }}</p>
            <AppButton type="plain" shape="round" @click="$emit('retry')">
                重新加载
            </AppButton>
        </div>

        <article v-else-if="content" class="read-content__body">
            <h1 class="read-content__title">{{ content.title }}</h1>
            <div class="read-content__text">
                <p
                    v-for="(paragraph, index) in content.content.split('\n').filter(Boolean)"
                    :key="index"
                >
                    {{ paragraph }}
                </p>
            </div>
        </article>
    </div>
</template>

<style scoped lang="scss">
.read-content {
    min-height: 100vh;
    min-height: 100dvh;
    padding: 16px 16px 80px;
    background-color: var(--read-content-bg, #f1f1f1);

    &__loading {
        padding: 20px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .skeleton-block {
            background: linear-gradient(90deg, rgba(0, 0, 0, 0.04) 25%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.04) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
        }

        .skeleton-title {
            height: 24px;
            width: 50%;
            margin: 0 auto 8px;
        }

        .skeleton-line {
            height: 16px;
        }
    }

    &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 120px;
        color: var(--text-placeholder);

        p {
            margin: 12px 0 20px;
            font-size: 14px;
        }
    }

    &__title {
        font-size: 20px;
        font-weight: 600;
        color: var(--read-text-color, #000);
        font-family: var(--read-font-family, sans-serif);
        margin-bottom: 24px;
        text-align: center;
        line-height: 1.4;
    }

    &__text {
        font-size: var(--read-font-size, 17px);
        font-family: var(--read-font-family, sans-serif);
        line-height: var(--read-line-height, 1.9);
        letter-spacing: var(--read-letter-spacing, 0);
        color: var(--read-text-color, #000);

        p {
            text-indent: 2em;
            margin-bottom: var(--read-paragraph-spacing, 1em);
        }
    }
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
</style>
