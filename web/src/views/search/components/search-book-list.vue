<script setup lang="ts">
import type { BookSearchItem } from '@/api/types/book.type'

defineProps<{
    list: BookSearchItem[]
    loading: boolean
    hasSearched: boolean
}>()

const emit = defineEmits<{
    detail: [book: BookSearchItem]
    addToBookshelf: [book: BookSearchItem]
}>()
</script>

<template>
    <div class="search-content">
        <div
            v-if="loading"
            class="search-loading"
        >
            <el-skeleton
                :rows="3"
                animated
            />
        </div>

        <template v-else-if="list.length > 0">
            <div class="search-list">
                <div
                    v-for="book in list"
                    :key="`${book.sourceId}-${book.bookId}`"
                    class="search-item"
                >
                    <!-- 封面 -->
                    <div class="book-cover">
                        <img
                            v-if="book.cover"
                            :src="book.cover"
                            :alt="book.name"
                        />
                        <div
                            v-else
                            class="cover-placeholder"
                        >
                            <span>暂无封面</span>
                        </div>
                    </div>

                    <!-- 书籍信息 -->
                    <div class="book-info">
                        <div class="book-header">
                            <span class="book-title">{{ book.name }}</span>
                            <span class="book-word-count">{{
                                book.wordCount || '字数未知'
                            }}</span>
                        </div>
                        <div class="book-meta">
                            <el-tag
                                size="small"
                                type="info"
                                >作者：{{ book.author }}</el-tag
                            >
                            <el-tag
                                size="small"
                                :type="
                                    book.status === '已完结'
                                        ? 'success'
                                        : 'warning'
                                "
                                >{{ book.status || '连载中' }}</el-tag
                            >
                        </div>
                        <div class="book-bottom">
                            <p class="book-intro">
                                {{ book.intro || '暂无简介' }}
                            </p>
                            <div class="book-actions">
                                <el-button
                                    type="primary"
                                    @click="emit('detail', book)"
                                    >书籍详情</el-button
                                >
                                <el-button
                                    type="primary"
                                    plain
                                    @click="emit('addToBookshelf', book)"
                                    >加入书架</el-button
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <div
            v-else-if="hasSearched"
            class="search-empty"
        >
            <el-empty description="未找到相关书籍" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.search-content {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 16px 20px;

    .search-loading {
        padding: 16px 0;
    }

    .search-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .search-item {
            display: flex;
            gap: 14px;
            padding: 14px;
            background-color: var(--color-bg-navbar);
            border-radius: 10px;
            border: 1px solid var(--color-border-light);

            .book-cover {
                flex-shrink: 0;
                width: 80px;
                height: 108px;
                border-radius: 6px;
                overflow: hidden;

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
                    border-radius: 6px;

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
                gap: 6px;

                .book-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 8px;

                    .book-title {
                        font-size: 15px;
                        font-weight: 600;
                        color: var(--el-text-color-primary);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .book-word-count {
                        flex-shrink: 0;
                        font-size: 12px;
                        color: var(--el-text-color-secondary);
                        white-space: nowrap;
                    }
                }

                .book-meta {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .book-bottom {
                    display: flex;
                    align-items: flex-end;
                    gap: 10px;
                    flex: 1;

                    .book-intro {
                        flex: 1;
                        min-width: 0;
                        margin: 0;
                        font-size: 13px;
                        color: var(--el-text-color-secondary);
                        line-height: 1.6;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .book-actions {
                        flex-shrink: 0;
                        display: flex;
                        flex-direction: row;
                        gap: 6px;
                    }
                }
            }
        }
    }

    .search-empty {
        padding: 40px 0;
        text-align: center;
    }
}
</style>
