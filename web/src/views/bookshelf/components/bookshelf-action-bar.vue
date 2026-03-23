<script setup lang="ts">
defineProps<{
    isManaging: boolean
    selectedCount: number
}>()

defineEmits<{
    remove: []
}>()
</script>

<template>
    <Transition name="slide-up">
        <div v-if="isManaging" class="action-bar">
            <div class="action-bar-inner">
                <el-button
                    type="danger"
                    :disabled="selectedCount === 0"
                    @click="$emit('remove')"
                >
                    <icon-mdi-delete-outline />
                    <span>删除{{ selectedCount > 0 ? ` (${selectedCount})` : '' }}</span>
                </el-button>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background-color: var(--color-bg-navbar, #fff);
    border-top: 1px solid var(--color-border-light);
    backdrop-filter: blur(8px);

    .action-bar-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: var(--content-max-width);
        margin: 0 auto;
        padding: 12px 20px;
    }

    &.slide-up-enter-active,
    &.slide-up-leave-active {
        transition: transform 0.3s ease, opacity 0.3s ease;
    }

    &.slide-up-enter-from,
    &.slide-up-leave-to {
        transform: translateY(100%);
        opacity: 0;
    }
}
</style>
