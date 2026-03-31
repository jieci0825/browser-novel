<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/app-button/index.vue'

const router = useRouter()

function goHome() {
    router.replace({ name: 'bookshelf' })
}
</script>

<template>
    <div class="not-found">
        <div class="content">
            <span class="code">404</span>
            <p class="message">抱歉，你访问的页面不存在</p>
            <AppButton class="back-btn" @click="goHome">返回首页</AppButton>
        </div>
    </div>
</template>

<style scoped lang="scss">
.not-found {
    height: 100vh;
    height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);

    @media all and (display-mode: standalone) {
        height: 100lvh;
    }

    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 32px;
    }

    .code {
        font-size: 72px;
        font-weight: 700;
        line-height: 1;
        color: var(--color-fg);
        opacity: 0.12;
    }

    .message {
        margin-top: 12px;
        font-size: 15px;
        color: var(--text-secondary);
    }

    .back-btn {
        margin-top: 32px;
        padding: 10px 32px;
        font-size: 15px;
    }
}
</style>
