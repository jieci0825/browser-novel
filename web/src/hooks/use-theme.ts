import { ref } from 'vue'
import { STORAGE_KEY } from '@/constants/storage-key'
import { getStorage, setStorage } from '@/utils/storeage'

export type Theme = 'light' | 'dark'

const DARK_CLASS = 'dark'
const currentTheme = ref<Theme>('light')

function applyTheme(theme: Theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add(DARK_CLASS)
        return
    }
    document.documentElement.classList.remove(DARK_CLASS)
}

function getStoredTheme(): Theme {
    return getStorage<Theme>(STORAGE_KEY.theme) === 'dark' ? 'dark' : 'light'
}

export function initTheme() {
    const initialTheme = getStoredTheme()
    currentTheme.value = initialTheme
    applyTheme(initialTheme)
}

export function setTheme(theme: Theme) {
    currentTheme.value = theme
    applyTheme(theme)
    setStorage(STORAGE_KEY.theme, theme)
}

export function useTheme() {
    const toggleTheme = () => {
        const nextTheme: Theme =
            currentTheme.value === 'dark' ? 'light' : 'dark'
        setTheme(nextTheme)
    }

    return {
        currentTheme,
        toggleTheme,
        setTheme,
    }
}
