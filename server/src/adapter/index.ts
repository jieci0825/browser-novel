import { adapterManager } from './manager'
import { QQReaderAdapter, douyinxsRule } from './sources'
import { RuleBasedAdapter } from './rule-based/adapter'
import { withAdapterExceptionAspect } from './aspect'
import { withAdapterCacheAspect } from './cache-aspect'
import { cacheService } from '../cache/cache-service'
import { ChainedAdapter } from './chained-adapter'
import type { BookSourceAdapter } from './types'

function createAdapter(adapter: BookSourceAdapter): BookSourceAdapter {
    return withAdapterExceptionAspect(
        withAdapterCacheAspect(adapter, cacheService)
    )
}

function registerAdapters() {
    // 独立书源
    adapterManager.register(createAdapter(new QQReaderAdapter()))

    // 分组书源 —— 链式 fallback，后续在此追加备用书源
    const novelGroup = new ChainedAdapter('novel-group', '小说聚合', [
        createAdapter(new RuleBasedAdapter(douyinxsRule)), // 优先
        // TODO: 在此追加备用书源
    ])
    adapterManager.register(novelGroup)
}
registerAdapters()

export { adapterManager }
export type { SearchStreamCallbacks } from './manager'
export type {
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
} from './types'
