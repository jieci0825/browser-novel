<script setup lang="ts">
import { useSearch } from './hooks/use-search'
import SearchBar from './components/search-bar.vue'
import SearchBookList from './components/search-book-list.vue'

defineOptions({ name: 'SearchPage' })

const {
    keyword,
    results,
    searching,
    searchDone,
    doSearch,
    goToDetail,
    goBack,
} = useSearch()
</script>

<template>
    <div class="search">
        <SearchBar
            v-model:keyword="keyword"
            @search="doSearch"
            @back="goBack"
        />

        <main class="search__content">
            <SearchBookList
                v-if="results.length > 0 || searching"
                :books="results"
                :searching="searching"
                @detail="goToDetail"
            />

            <div
                v-else-if="searchDone && results.length === 0"
                class="search__empty"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="48"
                    height="48"
                    fill="currentColor"
                >
                    <path
                        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    />
                </svg>
                <p>未找到相关书籍</p>
            </div>

            <div v-else class="search__hint">
                <p>输入书名或作者名开始搜索</p>
            </div>
        </main>
    </div>
</template>

<style scoped lang="scss">
.search {
    min-height: 100vh;
    min-height: 100dvh;
    background-color: var(--color-bg);

    &__content {
        padding: 0 16px;
    }

    &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 120px;
        color: var(--text-placeholder);

        p {
            margin-top: 12px;
            font-size: 14px;
        }
    }

    &__hint {
        display: flex;
        justify-content: center;
        padding-top: 120px;
        color: var(--text-placeholder);
        font-size: 14px;
    }
}
</style>
