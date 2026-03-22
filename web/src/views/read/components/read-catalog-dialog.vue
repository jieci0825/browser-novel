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
        <el-input
            v-model="keyword"
            placeholder="搜索章节名称"
            clearable
            class="catalog-search"
        >
            <template #prefix>
                <icon-mdi-magnify />
            </template>
        </el-input>

        <div
            ref="listRef"
            class="catalog-list"
        >
            <button
                v-for="chapter in filteredChapters"
                :key="chapter.chapterId"
                class="catalog-item"
                :class="{ active: chapter.chapterId === currentChapterId }"
                @click="handleSelect(chapter)"
            >
                <span class="catalog-title">{{ chapter.title }}</span>
            </button>
            <el-empty
                v-if="filteredChapters.length === 0"
                description="无匹配章节"
                :image-size="80"
            />
        </div>
    </el-dialog>
</template>

<style scoped lang="scss">
.catalog-search {
    margin-bottom: 12px;
}

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
