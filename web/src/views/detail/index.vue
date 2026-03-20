<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookApi } from '@/api'
import type { BookDetail, Chapter } from '@/api/types/book.type'

const route = useRoute()
const router = useRouter()

const sourceId = route.params.sourceId as string
const bookId = route.params.bookId as string

const detail = ref<BookDetail | null>(null)
const chapters = ref<Chapter[]>([])
const detailLoading = ref(true)
const chaptersLoading = ref(true)
const detailError = ref('')
const chaptersError = ref('')

onMounted(async () => {
    await Promise.allSettled([fetchDetail(), fetchChapters()])
})

async function fetchDetail() {
    try {
        detailLoading.value = true
        detailError.value = ''
        const res = await bookApi.getDetail(sourceId, bookId)
        detail.value = res
    } catch {
        detailError.value = '获取书籍详情失败'
    } finally {
        detailLoading.value = false
    }
}

async function fetchChapters() {
    try {
        chaptersLoading.value = true
        chaptersError.value = ''
        const res = await bookApi.getChapters(sourceId, bookId)
        chapters.value = res
    } catch {
        chaptersError.value = '获取章节列表失败'
    } finally {
        chaptersLoading.value = false
    }
}
</script>

<template>
    <div class="detail-page">
        <!-- 顶部导航 -->
        <div class="detail-navbar">
            <el-button
                text
                @click="router.back()"
            >
                <icon-mdi-arrow-left style="margin-right: 4px;" />返回
            </el-button>
        </div>

        <!-- 书籍基本信息 -->
        <div class="detail-header">
            <template v-if="detailLoading">
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

            <template v-else-if="detailError">
                <el-result icon="error" :title="detailError">
                    <template #extra>
                        <el-button @click="fetchDetail">重试</el-button>
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

        <!-- 章节目录 -->
        <div class="chapter-section">
            <div class="section-title">
                <span>目录</span>
                <span v-if="chapters.length" class="chapter-count">共 {{ chapters.length }} 章</span>
            </div>

            <template v-if="chaptersLoading">
                <el-skeleton :rows="8" animated style="padding: 16px;" />
            </template>

            <template v-else-if="chaptersError">
                <el-result icon="warning" :title="chaptersError">
                    <template #extra>
                        <el-button @click="fetchChapters">重试</el-button>
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
    </div>
</template>

<style scoped lang="scss">
.detail-page {
    min-height: 100vh;
    background-color: var(--color-bg-page);
    padding-bottom: 40px;
}

.detail-navbar {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 8px 16px;
    background-color: var(--color-bg-navbar);
    border-bottom: 1px solid var(--color-border-light);
}

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
