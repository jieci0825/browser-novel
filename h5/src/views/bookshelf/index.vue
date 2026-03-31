<script setup lang="ts">
import { ref } from 'vue'
import { useBookshelf } from './hooks/use-bookshelf'
import BookshelfNavbar from './components/bookshelf-navbar.vue'
import BookshelfEmptyState from './components/bookshelf-empty-state.vue'
import BookList from './components/book-list.vue'
import HelpModal from './components/help-modal.vue'

const {
    books,
    loading,
    layout,
    editMode,
    selectedKeys,
    selectedCount,
    allSelected,
    toggleLayout,
    enterEditMode,
    exitEditMode,
    toggleSelectAll,
    deleteSelected,
    handleBookClick,
    handleBookLongPress,
    goToSearch,
} = useBookshelf()

const showHelp = ref(false)
</script>

<template>
    <div class="bookshelf">
        <BookshelfNavbar
            :layout="layout"
            :edit-mode="editMode"
            :selected-count="selectedCount"
            :all-selected="allSelected"
            :has-books="books.length > 0"
            @search="goToSearch"
            @toggle-layout="toggleLayout"
            @show-help="showHelp = true"
            @enter-edit="enterEditMode"
            @exit-edit="exitEditMode"
            @select-all="toggleSelectAll"
            @delete="deleteSelected"
        />

        <main class="bookshelf__content">
            <BookshelfEmptyState v-if="!loading && books.length === 0" />
            <BookList
                v-else-if="books.length > 0"
                :books="books"
                :layout="layout"
                :edit-mode="editMode"
                :selected-keys="selectedKeys"
                @book-click="handleBookClick"
                @book-long-press="handleBookLongPress"
            />
        </main>

        <HelpModal v-model:visible="showHelp" />
    </div>
</template>

<style scoped lang="scss">
.bookshelf {
    height: 100vh;
    background-color: var(--color-bg);
    padding-bottom: var(--safe-area-inset-bottom);

    &__content {
        padding: 16px;
    }
}
</style>
