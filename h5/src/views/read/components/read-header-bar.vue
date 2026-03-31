<script setup lang="ts">
const props = defineProps<{
    visible: boolean
    bookName: string
    authorName: string
    chapterName: string
}>()

const emit = defineEmits<{
    back: []
}>()
</script>

<template>
    <Transition name="header-slide">
        <div v-show="visible" class="read-header-bar" @click.stop>
            <button class="read-header-bar__back" @click="emit('back')">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
            </button>
            <div class="read-header-bar__info">
                <div class="read-header-bar__title">
                    <span class="read-header-bar__book-name">{{ bookName }}</span>
                    <span v-if="authorName" class="read-header-bar__author">{{ authorName }}</span>
                </div>
                <span class="read-header-bar__chapter">{{ chapterName }}</span>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.read-header-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background-color: var(--read-content-bg, #f1f1f1);
    border-bottom: 1px solid color-mix(in srgb, var(--read-text-color, #999) 30%, transparent);
    padding-top: env(safe-area-inset-top);
    display: flex;
    align-items: center;
    gap: 4px;
    height: 48px;
    box-sizing: content-box;

    &__back {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border: none;
        background: transparent;
        color: var(--read-text-color, #000);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;

        &:active {
            opacity: 0.6;
        }
    }

    &__info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-right: 16px;
    }

    &__title {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    &__book-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--read-text-color, #000);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 1;
        min-width: 0;
    }

    &__author {
        font-size: 12px;
        color: var(--read-text-color, #999);
        opacity: 0.7;
        white-space: nowrap;
        flex-shrink: 0;
    }

    &__chapter {
        font-size: 12px;
        color: var(--read-text-color, #999);
        opacity: 0.7;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.header-slide-enter-active,
.header-slide-leave-active {
    transition: transform 0.25s ease;
}

.header-slide-enter-from,
.header-slide-leave-to {
    transform: translateY(-100%);
}
</style>
