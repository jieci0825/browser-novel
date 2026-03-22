<script setup lang="ts">
defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    catalog: []
    settings: []
    bookshelf: []
    scrollTop: []
    scrollBottom: []
}>()
</script>

<template>
    <Transition name="sidebar-fade">
        <div
            v-show="visible"
            class="read-sidebar"
        >
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
    </Transition>
</template>

<style scoped lang="scss">
.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
    opacity: 0;
    transform: translateX(-8px);
}

.read-sidebar {
    position: fixed;
    top: 0;
    left: max(
        0px,
        calc(50vw - var(--content-max-width) / 2 - var(--sidebar-width))
    );
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
