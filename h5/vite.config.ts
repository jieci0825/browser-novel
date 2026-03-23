import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 9528,
        proxy: {
            '/api': {
                target: 'http://localhost:5100',
                changeOrigin: true,
            },
        },
    },
})
