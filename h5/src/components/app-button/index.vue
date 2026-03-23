<script setup lang="ts">
withDefaults(
    defineProps<{
        type?: 'default' | 'plain'
        shape?: 'normal' | 'round' | 'circle'
    }>(),
    {
        type: 'default',
        shape: 'normal',
    },
)
</script>

<template>
    <button
        class="app-button"
        :class="[`app-button--${type}`, `app-button--${shape}`]"
    >
        <slot />
    </button>
</template>

<style scoped lang="scss">
.app-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    font-size: 14px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.15s;
    padding: 8px 20px;
    line-height: 1.2;

    &:active {
        opacity: 0.8;
    }

    &--default {
        background-color: var(--color-fg);
        color: var(--color-bg);
    }

    &--plain {
        background-color: var(--color-bg);
        color: var(--color-fg);
        border: 1px solid var(--color-fg);
    }

    &--normal {
        border-radius: 4px;
    }

    &--round {
        border-radius: 999px;
    }

    &--circle {
        border-radius: 50%;
        padding: 8px;
    }
}
</style>
