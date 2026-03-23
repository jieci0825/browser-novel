<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
    <div class="empty-state">
        <svg class="empty-state__icon" viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
        </svg>
        <p class="empty-state__text">书架空空如也</p>
        <button class="empty-state__btn" @click="router.push('/search')">
            去搜索
        </button>
    </div>
</template>

<style scoped lang="scss">
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120px 0;

    &__icon {
        color: var(--text-placeholder);
        margin-bottom: 16px;
    }

    &__text {
        font-size: 14px;
        color: var(--text-placeholder);
        margin: 0 0 24px;
    }

    &__btn {
        padding: 8px 32px;
        border: 1px solid var(--color-fg);
        border-radius: 20px;
        background: transparent;
        color: var(--color-fg);
        font-size: 14px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:active {
            background-color: var(--color-fg);
            color: var(--color-bg);
        }
    }
}
</style>
