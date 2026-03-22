<script setup lang="ts">
import { useRouter } from 'vue-router'
import { bookApi } from '@/api'
import { ElMessage } from 'element-plus'
import type { Book } from '../book'
import BookCard from './book-card.vue'

defineProps<{
    books: Book[]
}>()

const router = useRouter()

async function handleBookClick(book: Book) {
    if (book.lastReadChapterId) {
        router.push({
            name: 'read',
            params: {
                sourceId: book.sourceId,
                bookId: book.bookId,
                chapterId: book.lastReadChapterId,
            },
        })
        return
    }

    try {
        const chapters = await bookApi.getChapters(book.sourceId, book.bookId)
        if (!chapters.length) {
            ElMessage.warning('暂无章节')
            return
        }
        router.push({
            name: 'read',
            params: {
                sourceId: book.sourceId,
                bookId: book.bookId,
                chapterId: chapters[0]!.chapterId,
            },
        })
    } catch {
        ElMessage.error('获取章节失败，请重试')
    }
}
</script>

<template>
    <div class="book-container">
        <BookCard
            v-for="book in books"
            :key="`${book.sourceId}-${book.bookId}`"
            :book="book"
            @click="handleBookClick(book)"
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
