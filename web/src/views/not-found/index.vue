<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
    router.back()
}

const goHome = () => {
    router.push('/')
}
</script>

<template>
    <div class="not-found-container">
        <div class="not-found-content">
            <h1 class="error-code">404</h1>
            <h2 class="error-title">Oops! Page Not Found!</h2>
            <p class="error-description">
                It seems like the page you're looking for<br />
                does not exist or might have been removed.
            </p>
            <div class="button-group">
                <el-button
                    class="go-back-btn"
                    size="large"
                    @click="goBack"
                >
                    Go Back
                </el-button>
                <el-button
                    class="home-btn"
                    type="primary"
                    size="large"
                    @click="goHome"
                >
                    Back to Home
                </el-button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.not-found-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f5f5f5;
}

.not-found-content {
    text-align: center;
    padding: 40px;
}

.error-code {
    font-size: 180px;
    font-weight: 900;
    line-height: 1;
    margin: 0;
    color: #1a1d29;
    letter-spacing: -8px;
}

.error-title {
    font-size: 32px;
    font-weight: 600;
    margin: 30px 0 20px;
    color: #1a1d29;
}

.error-description {
    font-size: 16px;
    line-height: 1.6;
    color: #6b7280;
    margin: 0 0 40px;
}

.button-group {
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
}

.go-back-btn {
    min-width: 140px;
    border-radius: 8px;
    font-weight: 500;
}

.home-btn {
    min-width: 140px;
    border-radius: 8px;
    font-weight: 500;
    background-color: #1a1d29;
    border-color: #1a1d29;

    &:hover {
        background-color: #2d3142;
        border-color: #2d3142;
    }
}
</style>
