import type { BookSourceAdapter, BookSearchItem } from './types'
import { SourceNotFoundException } from '../exception/app-exception'

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

    /** 聚合搜索所有书源 */
    async searchAll(keyword: string, page?: number): Promise<BookSearchItem[]> {
        const tasks = [...this.adapters.values()].map(adapter =>
            adapter.search(keyword, page).catch(() => [] as BookSearchItem[])
        )
        const results = await Promise.all(tasks)
        return results.flat()
    }
}

export const adapterManager = new AdapterManager()
