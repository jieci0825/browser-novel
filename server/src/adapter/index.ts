import { adapterManager } from './manager'
import { QQReaderAdapter } from './qq-reader'
import { RuleBasedAdapter } from './rule-based/adapter'
import { withAdapterExceptionAspect } from './aspect'
import { withAdapterCacheAspect } from './cache-aspect'
import { cacheService } from '../cache/cache-service'
import { douyinxsRule } from './sources/douyinxs'
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
