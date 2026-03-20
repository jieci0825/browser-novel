<script setup lang="ts">
import type { Chapter } from '@/api/types/book.type'

defineProps<{
    chapters: Chapter[]
    loading: boolean
    error: string
}>()

const emit = defineEmits<{
    retry: []
}>()
</script>

<template>
    <div class="chapter-section">
        <div class="section-title">
            <span>目录</span>
            <span v-if="chapters.length" class="chapter-count">共 {{ chapters.length }} 章</span>
        </div>

        <template v-if="loading">
            <el-skeleton :rows="8" animated style="padding: 16px;" />
        </template>

        <template v-else-if="error">
            <el-result icon="warning" :title="error">
                <template #extra>
                    <el-button @click="emit('retry')">重试</el-button>
                </template>
            </el-result>
        </template>

        <template v-else-if="chapters.length">
            <div class="chapter-list">
                <div
                    v-for="chapter in chapters"
                    :key="chapter.chapterId"
                    class="chapter-item"
                >
                    <span class="chapter-title">{{ chapter.title }}</span>
                </div>
            </div>
        </template>

        <el-empty v-else description="暂无章节" />
    </div>
</template>

<style scoped lang="scss">
.chapter-section {
    max-width: var(--content-max-width);
    margin: 0 auto;

    .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        border-top: 1px solid var(--color-border-light);
        border-bottom: 1px solid var(--color-border-light);
        background-color: var(--color-bg-navbar);

        .chapter-count {
            font-size: 13px;
            font-weight: 400;
            color: var(--el-text-color-secondary);
        }
    }

    .chapter-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);

        .chapter-item {
            padding: 12px 20px;
            border-bottom: 1px solid var(--color-border-light);
            cursor: pointer;
            transition: background-color 0.15s;

            &:hover {
                background-color: var(--el-fill-color-light);
            }

            .chapter-title {
                font-size: 13px;
                color: var(--el-text-color-regular);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: block;
            }
        }
    }
}
</style>
