<script setup lang="ts"></script>

<template>
    <div class="empty-state">
        <icon-mdi-bookshelf class="empty-icon" />
        <p>暂无相关书籍</p>
    </div>
</template>

<style scoped lang="scss">
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120px 0;
    color: var(--el-text-color-placeholder);

    .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
    }

    p {
        font-size: 14px;
        margin: 0;
    }
}
</style>
