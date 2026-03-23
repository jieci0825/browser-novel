<script setup lang="ts">
import AppButton from '@/components/app-button/index.vue'

defineProps<{
    inBookshelf: boolean
    hasChapters: boolean
}>()

const emit = defineEmits<{
    'toggle-bookshelf': []
    'start-reading': []
}>()
</script>

<template>
    <footer class="detail-footer">
        <AppButton
            type="plain"
            class="detail-footer__btn"
            @click="emit('toggle-bookshelf')"
        >
            {{ inBookshelf ? '移除书架' : '加入书架' }}
        </AppButton>
        <AppButton
            class="detail-footer__btn"
            :class="{ 'detail-footer__btn--disabled': !hasChapters }"
            @click="emit('start-reading')"
        >
            开始阅读
        </AppButton>
    </footer>
</template>

<style scoped lang="scss">
.detail-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    gap: 12px;
    padding: 10px 16px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
    background-color: var(--color-bg);
    border-top: 1px solid var(--border-default);

    &__btn {
        flex: 1;
        height: 42px;
        font-size: 15px;
    }

    &__btn--disabled {
        opacity: 0.4;
        pointer-events: none;
    }
}
</style>
