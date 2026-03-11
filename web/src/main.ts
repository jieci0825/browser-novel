import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTheme } from './hooks/use-theme'
import './styles/index.scss'

initTheme()

createApp(App).use(router).mount('#app')
