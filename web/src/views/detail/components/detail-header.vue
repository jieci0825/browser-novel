<script setup lang="ts">
import type { BookDetail } from '@/api/types/book.type'

defineProps<{
    detail: BookDetail | null
    loading: boolean
    error: string
}>()

const emit = defineEmits<{
    retry: []
}>()
</script>

<template>
    <div class="detail-header">
        <template v-if="loading">
            <el-skeleton
                class="detail-skeleton"
                animated
            >
                <template #template>
                    <div class="skeleton-header">
                        <el-skeleton-item variant="image" style="width: 100px; height: 136px; border-radius: 8px;" />
                        <div class="skeleton-info">
                            <el-skeleton-item variant="h3" style="width: 60%;" />
                            <el-skeleton-item variant="text" style="width: 40%;" />
                            <el-skeleton-item variant="text" style="width: 80%;" />
                            <el-skeleton-item variant="text" style="width: 80%;" />
                        </div>
                    </div>
                </template>
            </el-skeleton>
        </template>

        <template v-else-if="error">
            <el-result icon="error" :title="error">
                <template #extra>
                    <el-button @click="emit('retry')">重试</el-button>
                </template>
            </el-result>
        </template>

        <template v-else-if="detail">
            <div class="book-cover">
                <img v-if="detail.cover" :src="detail.cover" :alt="detail.name" />
                <div v-else class="cover-placeholder">
                    <span>暂无封面</span>
                </div>
            </div>
            <div class="book-info">
                <h1 class="book-title">{{ detail.name }}</h1>
                <div class="book-meta">
                    <el-tag size="small" type="info">{{ detail.author }}</el-tag>
                    <el-tag v-if="detail.category" size="small">{{ detail.category }}</el-tag>
                    <el-tag
                        size="small"
                        :type="detail.status === '已完结' ? 'success' : 'warning'"
                    >{{ detail.status || '连载中' }}</el-tag>
                    <el-tag v-if="detail.wordCount" size="small" type="info">{{ detail.wordCount }}</el-tag>
                </div>
                <p v-if="detail.latestChapter" class="latest-chapter">
                    最新：{{ detail.latestChapter }}
                </p>
                <p class="book-intro">{{ detail.intro || '暂无简介' }}</p>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.detail-header {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 20px 20px 16px;
    display: flex;
    gap: 16px;

    .skeleton-header {
        display: flex;
        gap: 16px;
        width: 100%;

        .skeleton-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
    }

    .book-cover {
        flex-shrink: 0;
        width: 100px;
        height: 136px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .cover-placeholder {
            width: 100%;
            height: 100%;
            background-color: var(--el-fill-color);
            display: flex;
            align-items: center;
            justify-content: center;

            span {
                font-size: 12px;
                color: var(--el-text-color-placeholder);
                writing-mode: vertical-rl;
                letter-spacing: 2px;
            }
        }
    }

    .book-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .book-title {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            line-height: 1.4;
        }

        .book-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .latest-chapter {
            margin: 0;
            font-size: 12px;
            color: var(--el-text-color-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .book-intro {
            margin: 0;
            font-size: 13px;
            color: var(--el-text-color-secondary);
            line-height: 1.7;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }
}
</style>
