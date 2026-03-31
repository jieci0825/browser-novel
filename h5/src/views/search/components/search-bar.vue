<script setup lang="ts">
const keyword = defineModel<string>('keyword', { required: true })

const emit = defineEmits<{
    search: []
    back: []
}>()

function handleSubmit() {
    emit('search')
}
</script>

<template>
    <header class="search-bar">
        <button class="search-bar__back" @click="emit('back')">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path
                    d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                />
            </svg>
        </button>

        <form class="search-bar__form" @submit.prevent="handleSubmit">
            <input
                v-model="keyword"
                class="search-bar__input"
                type="search"
                placeholder="搜索书名或作者"
                enterkeyhint="search"
                autocomplete="off"
            />
            <button
                v-if="keyword"
                class="search-bar__clear"
                type="button"
                @click="keyword = ''"
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path
                        d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
                    />
                </svg>
            </button>
            <button class="search-bar__submit" type="submit">
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                >
                    <path
                        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    />
                </svg>
            </button>
        </form>
    </header>
</template>

<style scoped lang="scss">
.search-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 8px;
    height: calc(var(--navbar-height) + var(--safe-area-top));
    padding: var(--safe-area-top) 12px 0;
    background-color: var(--color-bg);
    border-bottom: 1px solid var(--border-default);

    &__back {
        flex-shrink: 0;
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

    &__form {
        flex: 1;
        display: flex;
        align-items: center;
        height: 34px;
        border-radius: 4px;
        background-color: #f5f5f5;
        overflow: hidden;
    }

    &__input {
        flex: 1;
        min-width: 0;
        height: 100%;
        padding: 0 14px;
        border: none;
        background: transparent;
        font-size: 14px;
        color: var(--text-primary);
        outline: none;

        &::placeholder {
            color: var(--text-placeholder);
        }

        &::-webkit-search-cancel-button {
            display: none;
        }
    }

    &__clear {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 100%;
        border: none;
        background: transparent;
        color: var(--text-placeholder);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:active {
            color: var(--text-secondary);
        }
    }

    &__submit {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 100%;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:active {
            color: var(--text-primary);
        }
    }
}
</style>
