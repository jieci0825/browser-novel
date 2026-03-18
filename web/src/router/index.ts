import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'bookshelf',
            component: () => import('@/views/bookshelf/index.vue'),
        },
        {
            path: '/search',
            name: 'search',
            component: () => import('@/views/search/index.vue'),
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('@/views/not-found/index.vue'),
        },
    ],
})

export default router
