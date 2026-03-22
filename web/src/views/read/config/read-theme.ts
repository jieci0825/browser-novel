export interface ReadTheme {
    name: string
    contentBg: string
    pageBg: string
    textColor: string
}

export const READ_THEMES: ReadTheme[] = [
    {
        name: '默认',
        contentBg: '#f1f1f1',
        pageBg: '#e9e9e9',
        textColor: '#000000e6',
    },
    {
        name: '羊皮纸',
        contentBg: '#f5f0e7',
        pageBg: '#e6e2d6',
        textColor: '#000000e6',
    },
    {
        name: '护眼黄',
        contentBg: '#eee2bf',
        pageBg: '#e2cfa1',
        textColor: '#000000e6',
    },
    {
        name: '护眼绿',
        contentBg: '#ddebde',
        pageBg: '#c7ddc8',
        textColor: '#000000e6',
    },
    {
        name: '暗黑',
        contentBg: '#23272f',
        pageBg: '#16181d',
        textColor: '#f6f7f9',
    },
]

const STORAGE_KEY = 'read-theme-index'

export function getSavedThemeIndex(): number {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
        const idx = Number(saved)
        if (idx >= 0 && idx < READ_THEMES.length) return idx
    }
    return 0
}

export function saveThemeIndex(index: number) {
    localStorage.setItem(STORAGE_KEY, String(index))
}

export function applyTheme(index: number) {
    const theme = READ_THEMES[index]
    if (!theme) return
    const root = document.documentElement
    root.style.setProperty('--read-bg', theme.pageBg)
    root.style.setProperty('--read-content-bg', theme.contentBg)
    root.style.setProperty('--read-text-color', theme.textColor)
    saveThemeIndex(index)
}
