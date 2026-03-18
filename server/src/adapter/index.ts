import { adapterManager } from './manager'
import { QQReaderAdapter, douyinxsRule } from './sources'
import { RuleBasedAdapter } from './rule-based/adapter'
import { withAdapterExceptionAspect } from './aspect'
import { withAdapterCacheAspect } from './cache-aspect'
import { cacheService } from '../cache/cache-service'
import type { BookSourceAdapter } from './types'

function createAdapter(adapter: BookSourceAdapter): BookSourceAdapter {
    return withAdapterExceptionAspect(
        withAdapterCacheAspect(adapter, cacheService)
    )
}

function registerAdapters() {
    const rawAdapters: BookSourceAdapter[] = [
        new QQReaderAdapter(),
        new RuleBasedAdapter(douyinxsRule),
    ]
    for (const adapter of rawAdapters) {
        adapterManager.register(createAdapter(adapter))
    }
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
