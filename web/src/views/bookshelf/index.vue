<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Book } from './book'
import { getBookshelfWithProgress } from '@/database/services/bookshelf-service'
import BookshelfNavbar from './components/bookshelf-navbar.vue'
import BookshelfEmptyState from './components/bookshelf-empty-state.vue'
import BookList from './components/book-list.vue'

const books = ref<Book[]>([])

onMounted(async () => {
    books.value = await getBookshelfWithProgress()
})
</script>

<template>
    <div class="bookshelf">
        <BookshelfNavbar />

        <main class="content">
            <BookshelfEmptyState v-if="books.length === 0" />
            <BookList v-else :books="books" />
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
