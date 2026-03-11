import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import IconifyResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [
                ElementPlusResolver({
                    // 默认 ElementPlusResolver 自动导入 css 文件，所以需要指定使用 scss，这样自定义的 var.scss 才能生效
                    importStyle: 'sass',
                }),
                IconifyResolver({
                    // 启用的图标集合
                    //  - 如果自定义了图标集合，需要在这里添加
                    enabledCollections: ['mdi', 'carbon', 'custom'],
                    // 修改组件前缀
                    prefix: 'icon',
                }),
            ],
        }),
        Icons({
            // 编译器选项
            compiler: 'vue3',
            // 自动安装图标集
            autoInstall: true,
            // 默认样式
            defaultStyle: 'display: inline-block',
            // 默认类名
            defaultClass: 'svg-icon',
            // 支持 jsx
            jsx: 'react',
            // 自定义图标集合
            customCollections: {
                custom: FileSystemIconLoader('./src/assets/icons', svg => {
                    // 替换 svg 标签的 fill 属性为 currentColor
                    return svg.replace(/^<svg /, '<svg fill="currentColor" ')
                }),
            },
        }),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "@/styles/element/var.scss" as *;`,
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 9527,
        proxy: {
            '/api': {
                target: 'http://localhost:5100',
                changeOrigin: true,
            },
        },
    },
})
