<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { bookApi } from '@/api'
import type { BookSearchItem } from '@/api/types/book.type'
import { sortByRelevance } from '@/utils/search-relevance'
import { addToBookshelf, isInBookshelf } from '@/database/services/bookshelf-service'
import { ElMessage } from 'element-plus'
import SearchBar from './components/search-bar.vue'
import SearchBookList from './components/search-book-list.vue'

const keyword = ref('')
const loading = ref(false)
const searchList = ref<BookSearchItem[]>([])
const hasSearched = ref(false)

let abortController: AbortController | null = null

async function handleSearch() {
    if (!keyword.value.trim()) return

    // 取消上一次未完成的请求
    abortController?.abort()
    abortController = new AbortController()

    loading.value = true
    hasSearched.value = true
    searchList.value = []

    try {
        await bookApi.searchAll(
            keyword.value.trim(),
            event => {
                if (event.type === 'result') {
                    const items = event.items.map(item => ({
                        ...item,
                        sourceName: event.sourceName,
                    }))
                    searchList.value.push(...items)
                    sortByRelevance(searchList.value, keyword.value)
                }
            },
            abortController.signal
        )
    } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
            console.error('搜索失败', err)
        }
    } finally {
        loading.value = false
    }
}

async function handleAddToBookshelf(book: BookSearchItem) {
    const already = await isInBookshelf(book.sourceId, book.bookId)
    if (already) {
        ElMessage.info('该书已在书架中')
        return
    }
    await addToBookshelf({
        sourceId: book.sourceId,
        bookId: book.bookId,
        sourceName: book.sourceName ?? '',
        name: book.name,
        author: book.author,
        cover: book.cover ?? '',
        intro: book.intro ?? '',
        latestChapter: book.latestChapter ?? '',
        status: book.status ?? '',
        addedAt: Date.now(),
        lastReadAt: 0,
    })
    ElMessage.success('已加入书架')
}

function handleGoDetail(book: BookSearchItem) {
    // TODO: 跳转书籍详情
    console.log('书籍详情', book)
}

onUnmounted(() => {
    abortController?.abort()
})
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
