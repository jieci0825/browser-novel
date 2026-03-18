<script setup lang="ts">
import { ref } from 'vue'
import type { SearchBook } from './types'
import SearchBar from './components/search-bar.vue'
import SearchBookList from './components/search-book-list.vue'

const keyword = ref('')
const loading = ref(false)
const searchList = ref<SearchBook[]>([])
const hasSearched = ref(false)

// mock 搜索，后续替换为真实 API
async function handleSearch() {
    if (!keyword.value.trim()) return
    loading.value = true
    hasSearched.value = true
    // TODO: 替换为真实搜索接口
    await new Promise(r => setTimeout(r, 600))
    searchList.value = [
        {
            sourceId: 's1',
            bookId: 'b1',
            name: '斗破苍穹',
            author: '天蚕土豆',
            status: '已完结',
            cover: '',
            intro: '这里是一片以斗气为尊的大陆，没有魔法，没有斗技，只有斗气。一个被称为天才的少年，因为一块神秘的石头，开始了他的传奇之路。',
            wordCount: '约 340 万字',
        },
        {
            sourceId: 's1',
            bookId: 'b2',
            name: '完美世界',
            author: '辰东',
            status: '已完结',
            cover: 'https://picsum.photos/seed/novel2/120/160',
            intro: '',
            wordCount: '约 420 万字',
        },
    ]
    loading.value = false
}

function handleAddToBookshelf(book: SearchBook) {
    // TODO: 加入书架逻辑
    console.log('加入书架', book)
}

function handleGoDetail(book: SearchBook) {
    // TODO: 跳转书籍详情
    console.log('书籍详情', book)
}
</script>

<template>
    <div class="search-page">
        <SearchBar
            v-model="keyword"
            :loading="loading"
            @search="handleSearch"
        />
        <SearchBookList
            :list="searchList"
            :loading="loading"
            :has-searched="hasSearched"
            @detail="handleGoDetail"
            @add-to-bookshelf="handleAddToBookshelf"
        />
    </div>
</template>

<style scoped lang="scss">
.search-page {
    min-height: 100vh;
    background-color: var(--color-bg-page);
}
</style>
