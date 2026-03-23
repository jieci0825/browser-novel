<script setup lang="ts">
import { useRouter } from 'vue-router'
import { bookApi } from '@/api'
import { ElMessage } from 'element-plus'
import type { Book } from '../book'
import BookCard from './book-card.vue'

const props = defineProps<{
    books: Book[]
    isManaging: boolean
    selectedKeys: Set<string>
}>()

const emit = defineEmits<{
    select: [book: Book]
    remove: [book: Book]
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

function onCardClick(book: Book) {
    if (props.isManaging) {
        emit('select', book)
        return
    }
    handleBookClick(book)
}
</script>

<template>
    <div class="book-container">
        <BookCard
            v-for="book in books"
            :key="`${book.sourceId}-${book.bookId}`"
            :book="book"
            :is-managing="isManaging"
            :is-selected="selectedKeys.has(`${book.sourceId}-${book.bookId}`)"
            @click="onCardClick(book)"
            @remove="emit('remove', book)"
        />
    </div>
</template>

<style scoped lang="scss">
.book-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 16px;
}
</style>
