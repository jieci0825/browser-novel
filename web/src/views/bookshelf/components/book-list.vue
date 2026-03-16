<script setup lang="ts">
import type { Book } from '../book'
import BookCard from './book-card.vue'

defineProps<{
    books: Book[]
}>()
</script>

<template>
    <div class="book-container">
        <BookCard
            v-for="book in books"
            :key="book.id"
            :book="book"
        />
    </div>
</template>

<style scoped lang="scss">
.book-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 24px;
}
</style>
