<script setup lang="ts">
defineEmits<{
    back: []
}>()
</script>

<template>
    <header class="detail-navbar">
        <button class="detail-navbar__back" @click="$emit('back')">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
        </button>
        <h1 class="detail-navbar__title">书籍详情</h1>
        <span class="detail-navbar__placeholder" />
    </header>
</template>

<style scoped lang="scss">
.detail-navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
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

    &__title {
        font-size: 17px;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
    }

    &__placeholder {
        width: 36px;
        flex-shrink: 0;
    }
}
</style>
