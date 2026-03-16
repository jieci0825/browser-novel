<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Book } from './book'
import BookshelfNavbar from './components/bookshelf-navbar.vue'
import BookshelfEmptyState from './components/bookshelf-empty-state.vue'
import BookList from './components/book-list.vue'

const searchKeyword = ref<string>('')

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

function handleKeywordChange(value: string) {
    searchKeyword.value = value
}
</script>

<template>
    <div class="bookshelf">
        <BookshelfNavbar
            :keyword="searchKeyword"
            @update:keyword="handleKeywordChange"
        />

        <main class="content">
            <BookshelfEmptyState
                v-if="filteredBooks.length === 0"
            />
            <BookList
                v-else
                :books="filteredBooks"
            />
        </main>
    </div>
</template>

<style scoped lang="scss">
.bookshelf {
    min-height: 100vh;
}

.content {
    max-width: var(--content-max-width);
    margin: 0 auto;
    padding: 24px 20px;
}
</style>
