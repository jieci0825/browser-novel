<script setup lang="ts">
import { ref } from 'vue'
import { READ_THEMES } from '../config/read-theme'
import {
    readSettings,
    FONT_OPTIONS,
    SETTING_LIMITS,
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
</script>

<template>
    <el-dialog
        v-model="visible"
        title="阅读设置"
        width="520px"
        append-to-body
        :close-on-click-modal="true"
    >
        <div class="settings-panel">
            <!-- 阅读主题 -->
            <div class="settings-row">
                <span class="settings-label">阅读主题</span>
                <div class="theme-list">
                    <button
                        v-for="(theme, idx) in READ_THEMES"
                        :key="idx"
                        class="theme-dot"
                        :class="{ active: readSettings.themeIndex === idx }"
                        :style="{ backgroundColor: theme.contentBg }"
                        :title="theme.name"
                        @click="selectTheme(idx)"
                    >
                        <icon-mdi-check
                            v-if="readSettings.themeIndex === idx"
                            class="theme-check"
                            :style="{ color: 'var(--el-color-danger)' }"
                        />
                    </button>
                </div>
            </div>

            <!-- 正文字体 -->
            <div class="settings-row">
                <span class="settings-label">正文字体</span>
                <div class="font-list">
                    <button
                        v-for="opt in FONT_OPTIONS"
                        :key="opt.value"
                        class="font-btn"
                        :class="{
                            active:
                                !readSettings.customFont &&
                                readSettings.fontFamily === opt.value,
                        }"
                        @click="selectFont(opt.value)"
                    >
                        {{ opt.label }}
                    </button>
                </div>
            </div>

            <!-- 自定义字体 -->
            <div class="settings-row">
                <span class="settings-label">自定义字体</span>
                <div class="custom-font-row">
                    <el-input
                        v-model="customFontInput"
                        placeholder="输入字体名称"
                    />
                    <el-button @click="saveCustomFont"> 保存 </el-button>
                </div>
            </div>

            <!-- 字体大小 -->
            <div class="settings-row">
                <span class="settings-label">字体大小</span>
                <el-input-number
                    v-model="readSettings.fontSize"
                    :min="SETTING_LIMITS.fontSize.min"
                    :max="SETTING_LIMITS.fontSize.max"
                    :step="SETTING_LIMITS.fontSize.step"
                    :precision="0"
                />
            </div>

            <!-- 字距 -->
            <div class="settings-row">
                <span class="settings-label">字距</span>
                <el-input-number
                    v-model="readSettings.letterSpacing"
                    :min="SETTING_LIMITS.letterSpacing.min"
                    :max="SETTING_LIMITS.letterSpacing.max"
                    :step="SETTING_LIMITS.letterSpacing.step"
                    :precision="2"
                />
            </div>

            <!-- 行距 -->
            <div class="settings-row">
                <span class="settings-label">行距</span>
                <el-input-number
                    v-model="readSettings.lineHeight"
                    :min="SETTING_LIMITS.lineHeight.min"
                    :max="SETTING_LIMITS.lineHeight.max"
                    :step="SETTING_LIMITS.lineHeight.step"
                    :precision="1"
                />
            </div>

            <!-- 段距 -->
            <div class="settings-row">
                <span class="settings-label">段距</span>
                <el-input-number
                    v-model="readSettings.paragraphSpacing"
                    :min="SETTING_LIMITS.paragraphSpacing.min"
                    :max="SETTING_LIMITS.paragraphSpacing.max"
                    :step="SETTING_LIMITS.paragraphSpacing.step"
                    :precision="1"
                />
            </div>

            <!-- 页面宽度 -->
            <div class="settings-row">
                <span class="settings-label">页面宽度</span>
                <el-input-number
                    v-model="readSettings.pageWidth"
                    :min="SETTING_LIMITS.pageWidth.min"
                    :max="SETTING_LIMITS.pageWidth.max"
                    :step="SETTING_LIMITS.pageWidth.step"
                    :precision="0"
                />
            </div>
        </div>
    </el-dialog>
</template>

<style scoped lang="scss">
.settings-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.settings-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.settings-label {
    flex-shrink: 0;
    width: 70px;
    font-size: 14px;
    color: #606266;
    text-align: right;
}

.theme-list {
    display: flex;
    gap: 10px;
}

.theme-dot {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;

    &.active {
        border-color: var(--el-color-danger);
    }

    &:hover {
        border-color: var(--el-color-danger);
    }
}

.theme-check {
    font-size: 16px;
    color: var(--el-color-danger);
}

.font-list {
    display: flex;
    gap: 8px;
}

.font-btn {
    padding: 4px 16px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    color: #606266;
    transition: all 0.2s;

    &.active {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
    }

    &:hover:not(.active) {
        border-color: var(--el-color-danger);
    }
}

.custom-font-row {
    display: flex;
    gap: 8px;
    flex: 1;
}
</style>
