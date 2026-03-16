<script setup lang="ts">
import { ref, computed } from 'vue'

const searchKeyword = ref('')

interface Book {
    id: number
    title: string
    author: string
    cover: string
    lastRead: string
    progress: number
}

const books = ref<Book[]>([
    {
        id: 1,
        title: '斗破苍穹',
        author: '天蚕土豆',
        cover: 'https://picsum.photos/seed/book1/160/220',
        lastRead: '第1632章 大结局',
        progress: 100,
    },
    {
        id: 2,
        title: '凡人修仙传',
        author: '忘语',
        cover: 'https://picsum.photos/seed/book2/160/220',
        lastRead: '第856章 灵界之战',
        progress: 67,
    },
    {
        id: 3,
        title: '遮天',
        author: '辰东',
        cover: 'https://picsum.photos/seed/book3/160/220',
        lastRead: '第1245章 天帝归来',
        progress: 89,
    },
    {
        id: 4,
        title: '完美世界',
        author: '辰东',
        cover: 'https://picsum.photos/seed/book4/160/220',
        lastRead: '第723章 荒的征战',
        progress: 45,
    },
    {
        id: 5,
        title: '大奉打更人',
        author: '卖报小郎君',
        cover: 'https://picsum.photos/seed/book5/160/220',
        lastRead: '第389章 许七安的推理',
        progress: 32,
    },
    {
        id: 6,
        title: '诡秘之主',
        author: '爱潜水的乌贼',
        cover: 'https://picsum.photos/seed/book6/160/220',
        lastRead: '第1432章 序列之路',
        progress: 95,
    },
    {
        id: 7,
        title: '剑来',
        author: '烽火戏诸侯',
        cover: 'https://picsum.photos/seed/book7/160/220',
        lastRead: '第567章 剑气长城',
        progress: 38,
    },
    {
        id: 8,
        title: '牧神记',
        author: '宅猪',
        cover: 'https://picsum.photos/seed/book8/160/220',
        lastRead: '第234章 秦牧的道',
        progress: 18,
    },
])

const filteredBooks = computed(() => {
    if (!searchKeyword.value) return books.value
    return books.value.filter(
        book =>
            book.title.includes(searchKeyword.value) ||
            book.author.includes(searchKeyword.value)
    )
})
</script>

<template>
    <div class="bookshelf">
        <header class="navbar">
            <div class="navbar-inner">
                <div class="navbar-left">
                    <h1 class="navbar-title">书架</h1>
                </div>
                <div class="navbar-right">
                    <el-input
                        v-model="searchKeyword"
                        class="search-input"
                        placeholder="搜索书名或作者"
                        clearable
                    >
                        <template #prefix>
                            <icon-mdi-magnify />
                        </template>
                    </el-input>
                    <el-tooltip
                        content="帮助"
                        placement="bottom"
                    >
                        <button class="icon-btn">
                            <icon-mdi-help-circle-outline />
                        </button>
                    </el-tooltip>
                </div>
            </div>
        </header>

        <main class="content">
            <div
                v-if="filteredBooks.length === 0"
                class="empty-state"
            >
                <icon-mdi-bookshelf class="empty-icon" />
                <p>暂无相关书籍</p>
            </div>

            <div
                v-else
                class="book-container"
            >
                <div
                    v-for="book in filteredBooks"
                    :key="book.id"
                    class="book-card"
                >
                    <div class="book-cover">
                        <img
                            :src="book.cover"
                            :alt="book.title"
                        />
                        <div class="book-progress">
                            <el-progress
                                :percentage="book.progress"
                                :stroke-width="3"
                                :show-text="false"
                                :color="'var(--el-color-primary)'"
                            />
                        </div>
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">{{ book.title }}</h3>
                        <p class="book-author">{{ book.author }}</p>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped lang="scss">
.bookshelf {
    min-height: 100vh;

    .navbar {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: var(--color-bg-navbar);
        border-bottom: 1px solid var(--color-border-light);
        backdrop-filter: blur(8px);

        .navbar-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: var(--content-max-width);
            margin: 0 auto;
            padding: 0 20px;
            height: 56px;
        }

        .navbar-left {
            display: flex;
            align-items: center;
        }

        .navbar-title {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
            color: var(--el-text-color-primary);
        }

        .navbar-right {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .search-input {
            width: 200px;
            margin-right: 8px;
        }

        .icon-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 8px;
            background: transparent;
            color: var(--el-text-color-regular);
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background-color: var(--el-fill-color-light);
                color: var(--el-text-color-primary);
            }
        }
    }

    .content {
        max-width: var(--content-max-width);
        margin: 0 auto;
        padding: 24px 20px;

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 120px 0;
            color: var(--el-text-color-placeholder);

            .empty-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }

            p {
                font-size: 14px;
                margin: 0;
            }
        }

        .book-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 24px;
        }

        .book-card {
            display: flex;
            flex-direction: column;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;

            &:hover {
                transform: translateY(-2px);

                .book-cover img {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }
            }
        }

        .book-cover {
            position: relative;

            img {
                width: 100%;
                aspect-ratio: 3 / 4;
                object-fit: cover;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transition: box-shadow 0.2s;
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
    }
}
</style>
