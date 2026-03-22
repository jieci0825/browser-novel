<script setup lang="ts">
defineProps<{
    hasPrev: boolean
    hasNext: boolean
}>()

const emit = defineEmits<{
    prev: []
    next: []
}>()
</script>

<template>
    <div class="read-pagination">
        <button
            class="pagination-btn"
            :disabled="!hasPrev"
            @click="emit('prev')"
        >
            <icon-mdi-chevron-left />
        </button>
        <button
            class="pagination-btn"
            :disabled="!hasNext"
            @click="emit('next')"
        >
            <icon-mdi-chevron-right />
        </button>
    </div>
</template>

<style scoped lang="scss">
.read-pagination {
    position: fixed;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 10;
}

.pagination-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border-light);
    border-radius: 6px;
    background-color: var(--color-bg-navbar);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background-color: #f0f0f0;
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    svg {
        font-size: 18px;
    }
}
</style>
