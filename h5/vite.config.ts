import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [
        vue(),
        command === 'build' && {
            name: 'inject-device-redirect',
            transformIndexHtml() {
                return [
                    {
                        tag: 'script',
                        children: `;(function(){var ua=navigator.userAgent;if(!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)){window.location.href='http://novel.coderjc.cn'}})()`,
                        injectTo: 'head',
                    },
                ]
            },
        },
    ],
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
}))
