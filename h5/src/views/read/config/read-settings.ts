import { reactive, watch } from 'vue'
import { applyTheme, getSavedThemeIndex } from './read-theme'
import type { ReadMode, AnimationType } from '../types/reader'

export interface ReadSettings {
    themeIndex: number
    fontFamily: string
    customFont: string
    fontSize: number
    letterSpacing: number
    lineHeight: number
    paragraphSpacing: number
    readMode: ReadMode
    animationType: AnimationType
}

export const FONT_OPTIONS = [
    { label: '雅黑', value: 'Microsoft YaHei, sans-serif' },
    { label: '宋体', value: 'SimSun, serif' },
    { label: '楷书', value: 'KaiTi, STKaiti, serif' },
]

const STORAGE_KEY = 'read-settings'

const DEFAULT_SETTINGS: ReadSettings = {
    themeIndex: getSavedThemeIndex(),
    fontFamily: FONT_OPTIONS[0]!.value,
    customFont: '',
    fontSize: 17,
    letterSpacing: 0,
    lineHeight: 1.9,
    paragraphSpacing: 1,
    readMode: 'paginated',
    animationType: 'slide',
}

export const SETTING_LIMITS = {
    fontSize: { min: 12, max: 32, step: 1 },
    letterSpacing: { min: 0, max: 0.5, step: 0.01 },
    lineHeight: { min: 1.2, max: 3, step: 0.1 },
    paragraphSpacing: { min: 0, max: 3, step: 0.1 },
}

function loadSettings(): ReadSettings {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        }
    } catch {
        // ignore
    }
    return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings: ReadSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export const readSettings = reactive<ReadSettings>(loadSettings())

function applySettingsToDOM() {
    const root = document.documentElement
    const font = readSettings.customFont || readSettings.fontFamily
    root.style.setProperty('--read-font-family', font)
    root.style.setProperty('--read-font-size', `${readSettings.fontSize}px`)
    root.style.setProperty(
        '--read-letter-spacing',
        `${readSettings.letterSpacing}em`
    )
    root.style.setProperty('--read-line-height', `${readSettings.lineHeight}`)
    root.style.setProperty(
        '--read-paragraph-spacing',
        `${readSettings.paragraphSpacing}em`
    )
    applyTheme(readSettings.themeIndex)
}

export function initReadSettings() {
    applySettingsToDOM()
    watch(readSettings, () => {
        saveSettings(readSettings)
        applySettingsToDOM()
    })
}
