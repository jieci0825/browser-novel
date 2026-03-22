<script setup lang="ts">
import type { ChapterContent } from '@/api/types/book.type'

defineProps<{
    content: ChapterContent | null
    loading: boolean
    error: string
}>()

defineEmits<{
    retry: []
}>()
</script>

<template>
    <div class="read-content">
        <!-- 加载状态 -->
        <div
            v-if="loading"
            class="read-content__loading"
        >
            <el-skeleton
                :rows="12"
                animated
            />
        </div>

        <!-- 错误状态 -->
        <div
            v-else-if="error"
            class="read-content__error"
        >
            <el-empty :description="error">
                <el-button
                    type="primary"
                    @click="$emit('retry')"
                >
                    重新加载
                </el-button>
            </el-empty>
        </div>

        <!-- 正文内容 -->
        <article
            v-else-if="content"
            class="read-content__body"
        >
            <h1 class="read-content__title">{{ content.title }}</h1>
            <div class="read-content__text">
                <p
                    v-for="(paragraph, index) in content.content
                        .split('\n')
                        .filter(Boolean)"
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
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 32px 24px 60px;
    min-height: 80vh;
    background-color: var(--read-content-bg);
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.05);
    cursor: pointer;

    &__loading {
        padding: 40px 0;
    }

    &__error {
        padding: 80px 0;
    }

    &__title {
        font-size: 22px;
        font-weight: 600;
        color: var(--read-text-color);
        margin-bottom: 32px;
        text-align: center;
    }

    &__text {
        font-size: 17px;
        line-height: 1.9;
        color: var(--read-text-color);

        p {
            text-indent: 2em;
            margin-bottom: 16px;
        }
    }
}
</style>
