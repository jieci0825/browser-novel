<script setup lang="ts">
const emit = defineEmits<{
    catalog: []
    settings: []
    bookshelf: []
    scrollTop: []
    scrollBottom: []
}>()
</script>

<template>
    <div class="read-sidebar">
        <button
            class="sidebar-btn"
            @click="emit('catalog')"
        >
            <icon-mdi-format-list-bulleted />
            <span>目录</span>
        </button>
        <button
            class="sidebar-btn"
            @click="emit('settings')"
        >
            <icon-mdi-cog-outline />
            <span>设置</span>
        </button>
        <button
            class="sidebar-btn"
            @click="emit('bookshelf')"
        >
            <icon-mdi-bookshelf />
            <span>书架</span>
        </button>
        <button
            class="sidebar-btn"
            @click="emit('scrollTop')"
        >
            <icon-mdi-chevron-up />
            <span>顶部</span>
        </button>
        <button
            class="sidebar-btn"
            @click="emit('scrollBottom')"
        >
            <icon-mdi-chevron-down />
            <span>底部</span>
        </button>
    </div>
</template>

<style scoped lang="scss">
.read-sidebar {
    position: fixed;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 10;
}

.sidebar-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: 1px solid var(--color-border-light);
    border-radius: 6px;
    background-color: var(--color-bg-navbar);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background-color 0.2s;
    padding: 4px 0;

    &:hover {
        background-color: #f0f0f0;
    }

    svg {
        font-size: 18px;
    }

    span {
        font-size: 10px;
        margin-top: 2px;
    }
}
</style>
