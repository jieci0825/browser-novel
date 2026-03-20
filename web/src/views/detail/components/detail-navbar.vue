<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
    <div class="detail-navbar">
        <el-button
            text
            @click="router.back()"
        >
            <icon-mdi-arrow-left style="margin-right: 4px;" />返回
        </el-button>
    </div>
</template>

<style scoped lang="scss">
.detail-navbar {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 8px 16px;
    background-color: var(--color-bg-navbar);
    border-bottom: 1px solid var(--color-border-light);
}
</style>
