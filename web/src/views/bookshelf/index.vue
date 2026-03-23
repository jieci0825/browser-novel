<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Book } from './book'
import { getBookshelfWithProgress } from '@/database/services/bookshelf-service'
import { useBookshelfManage } from './hooks/use-bookshelf-manage'
import BookshelfNavbar from './components/bookshelf-navbar.vue'
import BookshelfEmptyState from './components/bookshelf-empty-state.vue'
import BookList from './components/book-list.vue'
import BookshelfActionBar from './components/bookshelf-action-bar.vue'

const books = ref<Book[]>([])

const {
    isManaging,
    selectedKeys,
    selectedCount,
    isAllSelected,
    startManage,
    cancelManage,
    toggleSelect,
    toggleSelectAll,
    removeSelected,
    removeSingle,
} = useBookshelfManage(books)

onMounted(async () => {
    books.value = await getBookshelfWithProgress()
})
</script>

<template>
    <div class="bookshelf">
        <BookshelfNavbar
            :is-managing="isManaging"
            :selected-count="selectedCount"
            :is-all-selected="isAllSelected"
            :has-books="books.length > 0"
            @start-manage="startManage"
            @cancel-manage="cancelManage"
            @toggle-select-all="toggleSelectAll"
        />

        <main class="content" :class="{ 'has-action-bar': isManaging }">
            <BookshelfEmptyState v-if="books.length === 0" />
            <BookList
                v-else
                :books="books"
                :is-managing="isManaging"
                :selected-keys="selectedKeys"
                @select="toggleSelect"
                @remove="removeSingle"
            />
        </main>

        <BookshelfActionBar
            :is-managing="isManaging"
            :selected-count="selectedCount"
            @remove="removeSelected"
        />
    </div>
</template>

<style scoped lang="scss">
.bookshelf {
    min-height: 100vh;

    .content {
        max-width: var(--content-max-width);
        margin: 0 auto;
        padding: 24px 20px;
        transition: padding-bottom 0.3s ease;

        &.has-action-bar {
            padding-bottom: 80px;
        }
    }
}
</style>
