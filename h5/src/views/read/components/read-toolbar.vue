<script setup lang="ts">
defineProps<{
    visible: boolean
    hasPrev: boolean
    hasNext: boolean
    inBookshelf: boolean
}>()

const emit = defineEmits<{
    prev: []
    next: []
    catalog: []
    settings: []
    bookshelf: []
    addToBookshelf: []
}>()
</script>

<template>
    <Transition name="toolbar-slide">
        <div v-show="visible" class="read-toolbar" @click.stop>
            <div class="read-toolbar__row read-toolbar__row--chapter">
                <button class="toolbar-btn" :disabled="!hasPrev" @click="emit('prev')">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                    <span>上一章</span>
                </button>
                <button class="toolbar-btn" :disabled="!hasNext" @click="emit('next')">
                    <span>下一章</span>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                </button>
            </div>
            <div class="read-toolbar__row read-toolbar__row--actions">
                <button class="toolbar-action" @click="emit('catalog')">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                    </svg>
                    <span>目录</span>
                </button>
                <button class="toolbar-action" @click="emit('settings')">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.61 3.61 0 0112 15.6z" />
                    </svg>
                    <span>设置</span>
                </button>
                <button v-if="!inBookshelf" class="toolbar-action" @click="emit('addToBookshelf')">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    <span>加入书架</span>
                </button>
                <button class="toolbar-action" @click="emit('bookshelf')">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
                    </svg>
                    <span>书架</span>
                </button>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.read-toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background-color: var(--read-content-bg, #f1f1f1);
    border-top: 1px solid color-mix(in srgb, var(--read-text-color, #999) 30%, transparent);
    padding-bottom: env(safe-area-inset-bottom);

    &__row {
        display: flex;
        align-items: center;

        &--chapter {
            justify-content: space-between;
            padding: 0 8px;
            border-bottom: 1px solid color-mix(in srgb, var(--read-text-color, #999) 20%, transparent);
        }

        &--actions {
            justify-content: space-around;
            padding: 4px 0;
        }
    }
}

.toolbar-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    color: var(--read-text-color, #000);
    font-size: 14px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:active:not(:disabled) {
        opacity: 0.6;
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
}

.toolbar-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 8px;
    border: none;
    background: transparent;
    color: var(--read-text-color, #000);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    min-width: 48px;

    &:active {
        opacity: 0.6;
    }

    span {
        font-size: 10px;
    }
}

.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
    transition: transform 0.25s ease;
}

.toolbar-slide-enter-from,
.toolbar-slide-leave-to {
    transform: translateY(100%);
}
</style>
