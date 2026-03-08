import type { BookSourceAdapter, BookSearchItem } from './types'
import { SourceNotFoundException } from '../exception/app-exception'

export interface SearchStreamCallbacks {
    onResult(sourceId: string, sourceName: string, items: BookSearchItem[]): void
    onError?(sourceId: string, sourceName: string, message: string): void
}

/**
 * 适配器管理器
 */
class AdapterManager {
    private adapters = new Map<string, BookSourceAdapter>()

    register(adapter: BookSourceAdapter) {
        this.adapters.set(adapter.sourceId, adapter)
    }

    get(sourceId: string): BookSourceAdapter {
        const adapter = this.adapters.get(sourceId)
        if (!adapter) {
            throw new SourceNotFoundException(sourceId)
        }
        return adapter
    }

    /** 获取所有已注册书源的基本信息 */
    listSources() {
        return [...this.adapters.values()].map(a => ({
            sourceId: a.sourceId,
            sourceName: a.sourceName,
        }))
    }

    /** 流式聚合搜索：每个书源完成后立即通过回调推送结果 */
    async searchAllStream(keyword: string, callbacks: SearchStreamCallbacks): Promise<void> {
        const tasks = [...this.adapters.values()].map(async adapter => {
            try {
                const items = await adapter.search(keyword)
                callbacks.onResult(adapter.sourceId, adapter.sourceName, items)
            } catch (error) {
                const message = error instanceof Error ? error.message : '书源请求失败'
                callbacks.onError?.(adapter.sourceId, adapter.sourceName, message)
            }
        })
        await Promise.all(tasks)
    }
}

export const adapterManager = new AdapterManager()
