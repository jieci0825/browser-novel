<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    keyword: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'update:keyword', value: string): void
}>()

const keywordModel = computed({
    get: () => props.keyword,
    set: (value: string) => emit('update:keyword', value),
})
</script>

<template>
    <header class="navbar">
        <div class="navbar-inner">
            <div class="navbar-left">
                <h1 class="navbar-title">书架</h1>
            </div>
            <div class="navbar-right">
                <el-input
                    v-model="keywordModel"
                    class="search-input"
                    placeholder="搜索书名或作者"
                    clearable
                >
                    <template #prefix>
                        <icon-mdi-magnify />
                    </template>
                </el-input>
                <el-tooltip
                    content="帮助"
                    placement="bottom"
                >
                    <button class="icon-btn">
                        <icon-mdi-help-circle-outline />
                    </button>
                </el-tooltip>
            </div>
        </div>
    </header>
</template>

<style scoped lang="scss">
.navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--color-bg-navbar);
    border-bottom: 1px solid var(--color-border-light);
    backdrop-filter: blur(8px);

    .navbar-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: var(--content-max-width);
        margin: 0 auto;
        padding: 0 20px;
        height: 56px;
    }

    .navbar-left {
        display: flex;
        align-items: center;
    }

    .navbar-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: var(--el-text-color-primary);
    }

    .navbar-right {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .search-input {
        width: 200px;
        margin-right: 8px;
    }

    .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--el-text-color-regular);
        font-size: 20px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
        }
    }
}
</style>
