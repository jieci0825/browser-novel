<script setup lang="ts">
defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    'update:visible': [value: boolean]
}>()

function close() {
    emit('update:visible', false)
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="visible" class="help-modal" @click.self="close">
                <div class="help-modal__panel">
                    <div class="help-modal__header">
                        <h3>使用说明</h3>
                        <button class="help-modal__close" @click="close">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>
                    <div class="help-modal__body">
                        <section>
                            <h4>关于书源</h4>
                            <p>本站书源均来自公开网络资源，覆盖范围有限。若搜索不到你想看的书籍，可能是当前书源暂不收录，欢迎联系作者反馈。</p>
                        </section>
                        <section>
                            <h4>书籍无法阅读</h4>
                            <p>如果之前加入书架的书籍突然无法正常阅读，通常是对应书源已失效。这属于正常情况，可联系作者跟进处理。</p>
                        </section>
                        <section>
                            <h4>数据存储说明</h4>
                            <p>所有书架数据、阅读进度均保存在本地浏览器中，不会上传至云端，因此也无法在多设备间同步。如有同步需求，欢迎联系作者，后续可考虑支持。</p>
                        </section>
                        <section>
                            <h4>联系作者</h4>
                            <p>有任何问题或建议，欢迎通过以下方式联系：</p>
                            <ul>
                                <li>邮箱：<a href="mailto:coderjc@qq.com">coderjc@qq.com</a></li>
                                <li>QQ：2740954762</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped lang="scss">
.help-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background-color: rgba(0, 0, 0, 0.5);

    &__panel {
        width: 100%;
        max-width: 400px;
        max-height: 80vh;
        background-color: var(--color-bg);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 12px;
        border-bottom: 1px solid var(--border-default);

        h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 600;
            color: var(--text-primary);
        }
    }

    &__close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;

        &:active {
            background-color: var(--border-default);
        }
    }

    &__body {
        padding: 16px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: column;
        gap: 16px;
        font-size: 14px;
        line-height: 1.7;
        color: var(--text-secondary);

        section {
            h4 {
                margin: 0 0 4px;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }

            p {
                margin: 0;
            }

            ul {
                margin: 4px 0 0;
                padding-left: 18px;
            }

            a {
                color: var(--color-primary);
                text-decoration: none;
            }
        }
    }
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.25s ease;

    .help-modal__panel {
        transition: transform 0.25s ease;
    }
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;

    .help-modal__panel {
        transform: scale(0.95);
    }
}
</style>
