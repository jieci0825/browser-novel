<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Book } from './book'
import { getBookshelfBookList } from '@/database/bookshelf'
import BookshelfNavbar from './components/bookshelf-navbar.vue'
import BookshelfEmptyState from './components/bookshelf-empty-state.vue'
import BookList from './components/book-list.vue'

const searchKeyword = ref<string>('')
const books = ref<Book[]>([])

onMounted(async () => {
    books.value = await getBookshelfBookList()
})

const filteredBooks = computed(() => {
    if (!searchKeyword.value) return books.value
    return books.value.filter(
        book =>
            book.name.includes(searchKeyword.value) ||
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
