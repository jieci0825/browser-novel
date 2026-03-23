<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Chapter } from '@/api/types/book.type'

const visible = defineModel<boolean>({ required: true })

const props = defineProps<{
    chapters: Chapter[]
    currentChapterId: string
}>()

const emit = defineEmits<{
    select: [chapterId: string]
}>()

const listRef = ref<HTMLElement>()
const keyword = ref('')

const filteredChapters = computed(() => {
    const kw = keyword.value.trim()
    if (!kw) return props.chapters
    return props.chapters.filter(c => c.title.includes(kw))
})

watch(visible, async val => {
    if (!val) return
    keyword.value = ''
    await nextTick()
    const el = listRef.value?.querySelector('.catalog-item--active')
    el?.scrollIntoView({ block: 'center' })
})

function handleSelect(chapter: Chapter) {
    emit('select', chapter.chapterId)
    visible.value = false
}

function handleMaskClick() {
    visible.value = false
}
</script>

<template>
    <Transition name="popup">
        <div v-if="visible" class="catalog-popup" @click="handleMaskClick">
            <div class="catalog-popup__panel" @click.stop>
                <div class="catalog-popup__header">
                    <span class="catalog-popup__title">章节目录</span>
                    <button class="catalog-popup__close" @click="visible = false">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
                <div class="catalog-popup__search">
                    <input
                        v-model="keyword"
                        type="text"
                        placeholder="搜索章节名称"
                        class="catalog-popup__input"
                    />
                </div>
                <div ref="listRef" class="catalog-popup__list">
                    <button
                        v-for="chapter in filteredChapters"
                        :key="chapter.chapterId"
                        class="catalog-item"
                        :class="{ 'catalog-item--active': chapter.chapterId === currentChapterId }"
                        @click="handleSelect(chapter)"
                    >
                        {{ chapter.title }}
                    </button>
                    <div v-if="filteredChapters.length === 0" class="catalog-popup__empty">
                        无匹配章节
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.catalog-popup {
    position: fixed;
    inset: 0;
    z-index: 200;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-end;

    &__panel {
        width: 100%;
        max-height: 70vh;
        background-color: var(--color-bg, #fff);
        border-radius: 12px 12px 0 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        flex-shrink: 0;
    }

    &__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
    }

    &__close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        border-radius: 50%;

        &:active {
            background-color: rgba(0, 0, 0, 0.05);
        }
    }

    &__search {
        padding: 0 16px 12px;
        flex-shrink: 0;
    }

    &__input {
        width: 100%;
        height: 36px;
        border: 1px solid var(--border-default);
        border-radius: 6px;
        padding: 0 12px;
        font-size: 14px;
        outline: none;
        background-color: transparent;
        color: var(--text-primary);

        &::placeholder {
            color: var(--text-placeholder);
        }

        &:focus {
            border-color: var(--border-focus);
        }
    }

    &__list {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 0 8px 8px;
        padding-bottom: calc(8px + env(safe-area-inset-bottom));
    }

    &__empty {
        padding: 40px 0;
        text-align: center;
        font-size: 14px;
        color: var(--text-placeholder);
    }
}

.catalog-item {
    display: block;
    width: 100%;
    padding: 12px;
    border: none;
    background: transparent;
    text-align: left;
    font-size: 14px;
    color: var(--text-primary);
    border-radius: 6px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:active {
        background-color: rgba(0, 0, 0, 0.04);
    }

    &--active {
        color: var(--color-danger);
        font-weight: 600;
    }
}

.popup-enter-active {
    transition: opacity 0.25s ease;

    .catalog-popup__panel {
        transition: transform 0.25s ease;
    }
}

.popup-leave-active {
    transition: opacity 0.25s ease;

    .catalog-popup__panel {
        transition: transform 0.2s ease;
    }
}

.popup-enter-from,
.popup-leave-to {
    opacity: 0;

    .catalog-popup__panel {
        transform: translateY(100%);
    }
}
</style>
