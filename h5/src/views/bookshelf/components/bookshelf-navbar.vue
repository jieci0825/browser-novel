<script setup lang="ts">
import type { BookshelfLayout } from '../hooks/use-bookshelf'

defineProps<{
    layout: BookshelfLayout
    editMode: boolean
    selectedCount: number
    allSelected: boolean
    hasBooks: boolean
}>()

const emit = defineEmits<{
    search: []
    'toggle-layout': []
    'show-help': []
    'enter-edit': []
    'exit-edit': []
    'select-all': []
    delete: []
}>()
</script>

<template>
    <header class="navbar">
        <template v-if="!editMode">
            <h1 class="navbar__title">书架</h1>
            <div class="navbar__actions">
                <button class="navbar__btn" @click="emit('search')">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                </button>
                <button class="navbar__btn" @click="emit('toggle-layout')">
                    <!-- 显示当前布局状态的图标 -->
                    <svg v-if="layout === 'grid'" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z" />
                    </svg>
                </button>
                <button class="navbar__btn" @click="emit('show-help')">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
                    </svg>
                </button>
                <button
                    v-if="hasBooks"
                    class="navbar__text-btn"
                    @click="emit('enter-edit')"
                >
                    编辑
                </button>
            </div>
        </template>

        <template v-else>
            <div class="navbar__edit-left">
                <button class="navbar__check-all" @click="emit('select-all')">
                    <span
                        class="check-circle"
                        :class="{ 'check-circle--active': allSelected }"
                    >
                        <svg
                            v-if="allSelected"
                            viewBox="0 0 24 24"
                            width="12"
                            height="12"
                            fill="currentColor"
                        >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                    </span>
                    <span>全选</span>
                </button>
                <span v-if="selectedCount > 0" class="navbar__count">
                    已选 {{ selectedCount }} 本
                </span>
            </div>
            <div class="navbar__edit-right">
                <button
                    class="navbar__delete-btn"
                    :disabled="selectedCount === 0"
                    @click="emit('delete')"
                >
                    删除
                </button>
                <button
                    class="navbar__text-btn"
                    @click="emit('exit-edit')"
                >
                    取消
                </button>
            </div>
        </template>
    </header>
</template>

<style scoped lang="scss">
.navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: calc(var(--navbar-height) + var(--safe-area-top));
    padding: var(--safe-area-top) 16px 0;
    background-color: var(--color-bg);
    border-bottom: 1px solid var(--border-default);

    &__title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--text-primary);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:active {
            background-color: var(--border-default);
        }
    }

    &__text-btn {
        padding: 4px 12px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--text-primary);
        font-size: 14px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:active {
            background-color: var(--border-default);
        }
    }

    &__edit-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    &__check-all {
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: transparent;
        font-size: 14px;
        color: var(--text-primary);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        padding: 0;
    }

    &__count {
        font-size: 13px;
        color: var(--text-secondary);
    }

    &__edit-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__delete-btn {
        padding: 4px 14px;
        border: none;
        border-radius: 6px;
        background-color: var(--color-danger);
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        &:not(:disabled):active {
            opacity: 0.8;
        }
    }
}

.check-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid var(--text-placeholder);
    transition: all 0.15s;

    &--active {
        border-color: var(--color-primary);
        background-color: var(--color-primary);
        color: #fff;
    }
}
</style>
