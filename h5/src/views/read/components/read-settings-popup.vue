<script setup lang="ts">
import { ref } from 'vue'
import { READ_THEMES } from '../config/read-theme'
import {
    readSettings,
    FONT_OPTIONS,
    SETTING_LIMITS,
    READ_MODE_OPTIONS,
    PAGE_ANIMATION_OPTIONS,
    type ReadMode,
    type PageAnimation,
} from '../config/read-settings'

const visible = defineModel<boolean>({ required: true })

const customFontInput = ref(readSettings.customFont)

function selectTheme(index: number) {
    readSettings.themeIndex = index
}

function selectFont(value: string) {
    readSettings.fontFamily = value
    readSettings.customFont = ''
    customFontInput.value = ''
}

function saveCustomFont() {
    const name = customFontInput.value.trim()
    if (!name) return
    readSettings.customFont = name
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function adjustSetting(
    key: 'fontSize' | 'letterSpacing' | 'lineHeight' | 'paragraphSpacing',
    delta: number
) {
    const limit = SETTING_LIMITS[key]
    const raw = readSettings[key] + delta
    const precision = key === 'fontSize' ? 0 : key === 'letterSpacing' ? 2 : 1
    readSettings[key] = Number(clamp(raw, limit.min, limit.max).toFixed(precision))
}

function selectReadMode(mode: ReadMode) {
    readSettings.readMode = mode
}

function selectPageAnimation(anim: PageAnimation) {
    readSettings.pageAnimation = anim
}

function handleMaskClick() {
    visible.value = false
}
</script>

<template>
    <Transition name="popup">
        <div v-if="visible" class="settings-popup" @click="handleMaskClick">
            <div class="settings-popup__panel" @click.stop>
                <div class="settings-popup__header">
                    <span class="settings-popup__title">阅读设置</span>
                    <button class="settings-popup__close" @click="visible = false">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <div class="settings-popup__body">
                    <div class="setting-section">
                        <span class="setting-label">阅读主题</span>
                        <div class="theme-list">
                            <button
                                v-for="(theme, idx) in READ_THEMES"
                                :key="idx"
                                class="theme-dot"
                                :class="{ 'theme-dot--active': readSettings.themeIndex === idx }"
                                :style="{ backgroundColor: theme.contentBg }"
                                @click="selectTheme(idx)"
                            >
                                <svg v-if="readSettings.themeIndex === idx" viewBox="0 0 24 24" width="16" height="16" fill="var(--color-danger)">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="setting-section">
                        <span class="setting-label">正文字体</span>
                        <div class="font-list">
                            <button
                                v-for="opt in FONT_OPTIONS"
                                :key="opt.value"
                                class="font-btn"
                                :class="{ 'font-btn--active': !readSettings.customFont && readSettings.fontFamily === opt.value }"
                                @click="selectFont(opt.value)"
                            >
                                {{ opt.label }}
                            </button>
                        </div>
                    </div>

                    <div class="setting-section">
                        <span class="setting-label">自定义字体</span>
                        <div class="custom-font-row">
                            <input
                                v-model="customFontInput"
                                type="text"
                                placeholder="输入字体名称"
                                class="custom-font-input"
                            />
                            <button class="custom-font-save" @click="saveCustomFont">
                                保存
                            </button>
                        </div>
                    </div>

                    <div class="setting-section">
                        <span class="setting-label">字体大小</span>
                        <div class="stepper">
                            <button class="stepper__btn" :disabled="readSettings.fontSize <= SETTING_LIMITS.fontSize.min" @click="adjustSetting('fontSize', -SETTING_LIMITS.fontSize.step)">−</button>
                            <span class="stepper__value">{{ readSettings.fontSize }}px</span>
                            <button class="stepper__btn" :disabled="readSettings.fontSize >= SETTING_LIMITS.fontSize.max" @click="adjustSetting('fontSize', SETTING_LIMITS.fontSize.step)">+</button>
                        </div>
                    </div>

                    <div class="setting-section">
                        <span class="setting-label">字距</span>
                        <div class="stepper">
                            <button class="stepper__btn" :disabled="readSettings.letterSpacing <= SETTING_LIMITS.letterSpacing.min" @click="adjustSetting('letterSpacing', -SETTING_LIMITS.letterSpacing.step)">−</button>
                            <span class="stepper__value">{{ readSettings.letterSpacing.toFixed(2) }}em</span>
                            <button class="stepper__btn" :disabled="readSettings.letterSpacing >= SETTING_LIMITS.letterSpacing.max" @click="adjustSetting('letterSpacing', SETTING_LIMITS.letterSpacing.step)">+</button>
                        </div>
                    </div>

                    <div class="setting-section">
                        <span class="setting-label">行距</span>
                        <div class="stepper">
                            <button class="stepper__btn" :disabled="readSettings.lineHeight <= SETTING_LIMITS.lineHeight.min" @click="adjustSetting('lineHeight', -SETTING_LIMITS.lineHeight.step)">−</button>
                            <span class="stepper__value">{{ readSettings.lineHeight.toFixed(1) }}</span>
                            <button class="stepper__btn" :disabled="readSettings.lineHeight >= SETTING_LIMITS.lineHeight.max" @click="adjustSetting('lineHeight', SETTING_LIMITS.lineHeight.step)">+</button>
                        </div>
                    </div>

                    <div class="setting-section">
                        <span class="setting-label">段距</span>
                        <div class="stepper">
                            <button class="stepper__btn" :disabled="readSettings.paragraphSpacing <= SETTING_LIMITS.paragraphSpacing.min" @click="adjustSetting('paragraphSpacing', -SETTING_LIMITS.paragraphSpacing.step)">−</button>
                            <span class="stepper__value">{{ readSettings.paragraphSpacing.toFixed(1) }}em</span>
                            <button class="stepper__btn" :disabled="readSettings.paragraphSpacing >= SETTING_LIMITS.paragraphSpacing.max" @click="adjustSetting('paragraphSpacing', SETTING_LIMITS.paragraphSpacing.step)">+</button>
                        </div>
                    </div>

                    <div class="setting-section">
                        <span class="setting-label">阅读模式</span>
                        <div class="toggle-group">
                            <button
                                v-for="opt in READ_MODE_OPTIONS"
                                :key="opt.value"
                                class="toggle-btn"
                                :class="{ 'toggle-btn--active': readSettings.readMode === opt.value }"
                                @click="selectReadMode(opt.value)"
                            >
                                {{ opt.label }}
                            </button>
                        </div>
                    </div>

                    <div v-if="readSettings.readMode === 'paginated'" class="setting-section">
                        <span class="setting-label">翻页动画</span>
                        <div class="toggle-group">
                            <button
                                v-for="opt in PAGE_ANIMATION_OPTIONS"
                                :key="opt.value"
                                class="toggle-btn"
                                :class="{ 'toggle-btn--active': readSettings.pageAnimation === opt.value }"
                                @click="selectPageAnimation(opt.value)"
                            >
                                {{ opt.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.settings-popup {
    position: fixed;
    inset: 0;
    z-index: 200;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-end;

    &__panel {
        width: 100%;
        max-height: 80vh;
        background-color: var(--color-bg, #fff);
        border-radius: 12px 12px 0 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        flex-shrink: 0;
    }

    &__title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
    }

    &__close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        border-radius: 50%;

        &:active {
            background-color: rgba(0, 0, 0, 0.05);
        }
    }

    &__body {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 0 16px 16px;
        padding-bottom: calc(16px + env(safe-area-inset-bottom));
        display: flex;
        flex-direction: column;
        gap: 18px;
    }
}

.setting-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.setting-label {
    font-size: 13px;
    color: var(--text-secondary);
}

.theme-list {
    display: flex;
    gap: 12px;
}

.theme-dot {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    transition: border-color 0.2s;

    &--active {
        border-color: var(--color-danger);
    }
}

.font-list {
    display: flex;
    gap: 8px;
}

.font-btn {
    padding: 6px 16px;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-primary);
    -webkit-tap-highlight-color: transparent;
    transition: all 0.2s;

    &--active {
        border-color: var(--color-danger);
        color: var(--color-danger);
    }
}

.custom-font-row {
    display: flex;
    gap: 8px;
}

.custom-font-input {
    flex: 1;
    height: 36px;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    padding: 0 12px;
    font-size: 14px;
    outline: none;
    background: transparent;
    color: var(--text-primary);

    &::placeholder {
        color: var(--text-placeholder);
    }

    &:focus {
        border-color: var(--border-focus);
    }
}

.custom-font-save {
    padding: 0 14px;
    height: 36px;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    background: transparent;
    color: var(--text-primary);
    font-size: 13px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;

    &:active {
        background-color: rgba(0, 0, 0, 0.04);
    }
}

.stepper {
    display: flex;
    align-items: center;
    gap: 0;

    &__btn {
        width: 36px;
        height: 36px;
        border: 1px solid var(--border-default);
        background: transparent;
        color: var(--text-primary);
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-tap-highlight-color: transparent;

        &:first-child {
            border-radius: 6px 0 0 6px;
        }

        &:last-child {
            border-radius: 0 6px 6px 0;
        }

        &:active:not(:disabled) {
            background-color: rgba(0, 0, 0, 0.04);
        }

        &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
    }

    &__value {
        min-width: 72px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top: 1px solid var(--border-default);
        border-bottom: 1px solid var(--border-default);
        font-size: 14px;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
    }
}

.toggle-group {
    display: flex;
    gap: 8px;
}

.toggle-btn {
    flex: 1;
    padding: 8px 0;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-primary);
    -webkit-tap-highlight-color: transparent;
    transition: all 0.2s;

    &--active {
        border-color: var(--color-danger);
        color: var(--color-danger);
    }

    &:active:not(.toggle-btn--active) {
        background-color: rgba(0, 0, 0, 0.04);
    }
}

.popup-enter-active {
    transition: opacity 0.25s ease;

    .settings-popup__panel {
        transition: transform 0.25s ease;
    }
}

.popup-leave-active {
    transition: opacity 0.25s ease;

    .settings-popup__panel {
        transition: transform 0.2s ease;
    }
}

.popup-enter-from,
.popup-leave-to {
    opacity: 0;

    .settings-popup__panel {
        transform: translateY(100%);
    }
}
</style>
