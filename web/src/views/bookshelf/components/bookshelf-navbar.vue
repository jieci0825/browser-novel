<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
    isManaging: boolean
    selectedCount: number
    isAllSelected: boolean
    hasBooks: boolean
}>()

defineEmits<{
    startManage: []
    cancelManage: []
    toggleSelectAll: []
}>()

const router = useRouter()
const showNotice = ref(false)

function goToSearch() {
    router.push('/search')
}
</script>

<template>
    <header class="navbar">
        <div class="navbar-inner">
            <div class="navbar-left">
                <span v-if="isManaging" class="selected-info">已选 {{ selectedCount }} 本</span>
                <h1 v-else class="navbar-title">书架</h1>
            </div>
            <div class="navbar-right">
                <template v-if="isManaging">
                    <button class="text-btn" @click="$emit('toggleSelectAll')">
                        {{ isAllSelected ? '取消全选' : '全选' }}
                    </button>
                    <button class="text-btn cancel-btn" @click="$emit('cancelManage')">
                        取消
                    </button>
                </template>
                <template v-else>
                    <el-tooltip content="搜索" placement="bottom">
                        <button class="icon-btn" @click="goToSearch">
                            <icon-mdi-magnify />
                        </button>
                    </el-tooltip>
                    <el-tooltip content="帮助" placement="bottom">
                        <button class="icon-btn" @click="showNotice = true">
                            <icon-mdi-help-circle-outline />
                        </button>
                    </el-tooltip>
                    <el-tooltip v-if="hasBooks" content="管理" placement="bottom">
                        <button class="icon-btn" @click="$emit('startManage')">
                            <icon-mdi-playlist-edit />
                        </button>
                    </el-tooltip>
                </template>
            </div>
        </div>
    </header>

    <el-dialog
        v-model="showNotice"
        title="使用说明"
        width="480px"
        :close-on-click-modal="true"
    >
        <div class="notice-content">
            <section>
                <h4>📚 关于书源</h4>
                <p>本站书源均来自公开网络资源，覆盖范围有限。若搜索不到你想看的书籍，可能是当前书源暂不收录，欢迎联系作者反馈。</p>
            </section>
            <section>
                <h4>⚠️ 书籍无法阅读</h4>
                <p>如果之前加入书架的书籍突然无法正常阅读，通常是对应书源已失效。这属于正常情况，可联系作者跟进处理。</p>
            </section>
            <section>
                <h4>💾 数据存储说明</h4>
                <p>所有书架数据、阅读进度均保存在本地浏览器中，不会上传至云端，因此也无法在多设备间同步。如有同步需求，欢迎联系作者，后续可考虑支持。</p>
            </section>
            <section>
                <h4>💬 联系作者</h4>
                <p>有任何问题或建议，欢迎通过以下方式联系：</p>
                <ul>
                    <li>邮箱：<a href="mailto:coderjc@qq.com">coderjc@qq.com</a></li>
                    <li>QQ：2740954762</li>
                </ul>
            </section>
        </div>
    </el-dialog>
</template>

<style scoped lang="scss">
.navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--color-bg-navbar);
    border-bottom: 1px solid var(--color-border-light);
    backdrop-filter: blur(8px);

    .navbar-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: var(--content-max-width);
        margin: 0 auto;
        padding: 0 20px;
        height: 56px;
    }

    .navbar-left {
        display: flex;
        align-items: center;
    }

    .navbar-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: var(--el-text-color-primary);
    }

    .selected-info {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
    }

    .navbar-right {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--el-text-color-regular);
        font-size: 20px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
        }
    }

    .text-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--el-text-color-regular);
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
        }

        &.cancel-btn {
            color: var(--el-color-primary);

            &:hover {
                background-color: var(--el-color-primary-light-9);
            }
        }
    }
}

.notice-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular);

    section {
        h4 {
            margin: 0 0 6px;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        p {
            margin: 0;
        }

        ul {
            margin: 6px 0 0;
            padding-left: 18px;

            li {
                margin-bottom: 2px;
            }
        }

        a {
            color: var(--el-color-primary);
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }
}
</style>
