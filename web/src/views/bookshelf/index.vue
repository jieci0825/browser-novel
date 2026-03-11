<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/hooks/use-theme'

const { currentTheme, toggleTheme } = useTheme()

const themeLabel = computed(() =>
    currentTheme.value === 'dark' ? '深色' : '浅色'
)
</script>

<template>
    <main class="app">
        <section class="card">
            <h1 class="title">书架</h1>
            <p class="desc">当前主题：{{ themeLabel }}</p>
            <button
                class="theme-btn"
                type="button"
                @click="toggleTheme"
            >
                切换到{{ currentTheme === 'dark' ? '浅色' : '深色' }}主题
            </button>
        </section>
    </main>
</template>

<style scoped lang="scss">
.app {
    min-height: 100vh;
    padding: 24px;
    background: var(--color-bg-page);
    color: var(--color-text-primary);
}

.card {
    max-width: 420px;
    margin: 40px auto;
    padding: 20px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-bg-surface);
}

.title {
    margin: 0 0 8px;
}

.desc {
    margin: 0 0 16px;
    color: var(--color-text-secondary);
}

.theme-btn {
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 14px;
    background: var(--color-primary);
    color: #fff;
    cursor: pointer;
}

.theme-btn:hover {
    background: var(--color-primary-hover);
}

.theme-btn:active {
    background: var(--color-primary-active);
}
</style>
