<script setup lang="ts">
import { ref } from 'vue'
import { READ_THEMES } from '../config/read-theme'
import {
    readSettings,
    FONT_OPTIONS,
    SETTING_LIMITS,
    adjustSetting,
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
                            :style="{ color: theme.textColor }"
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
                        size="small"
                    />
                    <el-button
                        size="small"
                        @click="saveCustomFont"
                    >
                        保存
                    </el-button>
                </div>
            </div>

            <!-- 字体大小 -->
            <div class="settings-row">
                <span class="settings-label">字体大小</span>
                <div class="stepper">
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.fontSize <= SETTING_LIMITS.fontSize.min
                        "
                        @click="adjustSetting('fontSize', -1)"
                    >
                        A-
                    </button>
                    <span class="stepper-value">{{
                        readSettings.fontSize
                    }}</span>
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.fontSize >= SETTING_LIMITS.fontSize.max
                        "
                        @click="adjustSetting('fontSize', 1)"
                    >
                        A+
                    </button>
                </div>
            </div>

            <!-- 字距 -->
            <div class="settings-row">
                <span class="settings-label">字距</span>
                <div class="stepper">
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.letterSpacing <=
                            SETTING_LIMITS.letterSpacing.min
                        "
                        @click="adjustSetting('letterSpacing', -1)"
                    >
                        A-
                    </button>
                    <span class="stepper-value">{{
                        readSettings.letterSpacing.toFixed(2)
                    }}</span>
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.letterSpacing >=
                            SETTING_LIMITS.letterSpacing.max
                        "
                        @click="adjustSetting('letterSpacing', 1)"
                    >
                        A+
                    </button>
                </div>
            </div>

            <!-- 行距 -->
            <div class="settings-row">
                <span class="settings-label">行距</span>
                <div class="stepper">
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.lineHeight <=
                            SETTING_LIMITS.lineHeight.min
                        "
                        @click="adjustSetting('lineHeight', -1)"
                    >
                        A-
                    </button>
                    <span class="stepper-value">{{
                        readSettings.lineHeight.toFixed(1)
                    }}</span>
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.lineHeight >=
                            SETTING_LIMITS.lineHeight.max
                        "
                        @click="adjustSetting('lineHeight', 1)"
                    >
                        A+
                    </button>
                </div>
            </div>

            <!-- 段距 -->
            <div class="settings-row">
                <span class="settings-label">段距</span>
                <div class="stepper">
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.paragraphSpacing <=
                            SETTING_LIMITS.paragraphSpacing.min
                        "
                        @click="adjustSetting('paragraphSpacing', -1)"
                    >
                        A-
                    </button>
                    <span class="stepper-value">{{
                        readSettings.paragraphSpacing.toFixed(1)
                    }}</span>
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.paragraphSpacing >=
                            SETTING_LIMITS.paragraphSpacing.max
                        "
                        @click="adjustSetting('paragraphSpacing', 1)"
                    >
                        A+
                    </button>
                </div>
            </div>

            <!-- 页面宽度 -->
            <div class="settings-row">
                <span class="settings-label">页面宽度</span>
                <div class="stepper">
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.pageWidth <=
                            SETTING_LIMITS.pageWidth.min
                        "
                        @click="adjustSetting('pageWidth', -1)"
                    >
                        -
                    </button>
                    <span class="stepper-value">{{
                        readSettings.pageWidth
                    }}</span>
                    <button
                        class="stepper-btn"
                        :disabled="
                            readSettings.pageWidth >=
                            SETTING_LIMITS.pageWidth.max
                        "
                        @click="adjustSetting('pageWidth', 1)"
                    >
                        +
                    </button>
                </div>
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
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;

    &.active {
        border-color: #409eff;
    }

    &:hover {
        border-color: #a0cfff;
    }
}

.theme-check {
    font-size: 16px;
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
        border-color: #409eff;
        color: #409eff;
        background: #ecf5ff;
    }

    &:hover:not(.active) {
        border-color: #c6e2ff;
    }
}

.custom-font-row {
    display: flex;
    gap: 8px;
    flex: 1;
}

.stepper {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
}

.stepper-btn {
    width: 40px;
    height: 32px;
    border: none;
    background: #f5f7fa;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    transition: background 0.2s;

    &:hover:not(:disabled) {
        background: #e6e8eb;
    }

    &:disabled {
        color: #c0c4cc;
        cursor: not-allowed;
    }
}

.stepper-value {
    width: 60px;
    text-align: center;
    font-size: 13px;
    color: #303133;
    border-left: 1px solid #dcdfe6;
    border-right: 1px solid #dcdfe6;
    line-height: 32px;
}
</style>
