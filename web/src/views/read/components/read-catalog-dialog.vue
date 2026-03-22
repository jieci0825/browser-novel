<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { type Chapter } from '@/api/types/book.type'

const visible = defineModel<boolean>({ required: true })

const props = defineProps<{
    chapters: Chapter[]
    currentChapterId: string
}>()

const emit = defineEmits<{
    select: [chapterId: string]
}>()

const listRef = ref<HTMLElement>()

const currentIndex = computed(() =>
    props.chapters.findIndex(c => c.chapterId === props.currentChapterId)
)

watch(visible, async val => {
    if (!val) return
    await nextTick()
    const el = listRef.value?.querySelector('.catalog-item.active')
    el?.scrollIntoView({ block: 'center' })
})

function handleSelect(chapter: Chapter) {
    emit('select', chapter.chapterId)
    visible.value = false
}
</script>

<template>
    <el-dialog
        v-model="visible"
        title="章节目录"
        width="520px"
        append-to-body
        :close-on-click-modal="true"
    >
        <div
            ref="listRef"
            class="catalog-list"
        >
            <button
                v-for="(chapter, idx) in chapters"
                :key="chapter.chapterId"
                class="catalog-item"
                :class="{ active: idx === currentIndex }"
                @click="handleSelect(chapter)"
            >
                <span class="catalog-title">{{ chapter.title }}</span>
            </button>
        </div>
    </el-dialog>
</template>

<style scoped lang="scss">
.catalog-list {
    max-height: 60vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.catalog-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-size: 14px;
    color: var(--el-text-color-regular);
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        background-color: var(--el-fill-color-light);
    }

    &.active {
        color: var(--el-color-primary);
        font-weight: 600;
        background-color: var(--el-color-primary-light-9);
    }
}

.catalog-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
