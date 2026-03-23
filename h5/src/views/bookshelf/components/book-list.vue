<script setup lang="ts">
import type { Book } from '../book'
import type { BookshelfLayout } from '../hooks/use-bookshelf'
import BookCard from './book-card.vue'

defineProps<{
    books: Book[]
    layout: BookshelfLayout
    editMode: boolean
    selectedKeys: Set<string>
}>()

const emit = defineEmits<{
    'book-click': [book: Book]
}>()

function getBookKey(book: Book) {
    return `${book.sourceId}-${book.bookId}`
}
</script>

<template>
    <div class="book-list" :class="`book-list--${layout}`">
        <BookCard
            v-for="book in books"
            :key="getBookKey(book)"
            :book="book"
            :layout="layout"
            :edit-mode="editMode"
            :selected="selectedKeys.has(getBookKey(book))"
            @click="emit('book-click', book)"
        />
    </div>
</template>

<style scoped lang="scss">
.book-list {
    &--grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px 12px;
    }

    &--list {
        display: flex;
        flex-direction: column;
    }
}
</style>
