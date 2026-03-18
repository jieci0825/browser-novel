<script setup lang="ts">
defineProps<{
    loading: boolean
}>()

const keyword = defineModel<string>({ required: true })
const emit = defineEmits<{
    search: []
}>()

function handleSearch() {
    emit('search')
}
</script>

<template>
    <div class="search-bar-wrap">
        <div class="search-bar-inner">
            <div class="search-bar-row">
                <el-input
                    v-model="keyword"
                    placeholder="搜索书名、作者..."
                    size="large"
                    clearable
                    @keyup.enter="handleSearch"
                />
                <el-button
                    type="primary"
                    size="large"
                    :loading="loading"
                    @click="handleSearch"
                    >搜 索</el-button
                >
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.search-bar-wrap {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: var(--color-bg-navbar);
    border-bottom: 1px solid var(--color-border-light);
    padding: 12px 20px;

    .search-bar-inner {
        max-width: var(--content-max-width);
        margin: 0 auto;

        .search-bar-row {
            display: flex;
            gap: 8px;
        }
    }
}
</style>
