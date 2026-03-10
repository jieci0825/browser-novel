import { adapterManager } from './manager'
import { QQReaderAdapter } from './qq-reader'
import { RuleBasedAdapter } from './rule-based/adapter'
import { withAdapterExceptionAspect } from './aspect'
import { withAdapterCacheAspect } from './cache-aspect'
import { cacheService } from '../cache/cache-service'
import { douyinxsRule } from './sources/douyinxs'

const adapters = [
    withAdapterExceptionAspect(
        withAdapterCacheAspect(new QQReaderAdapter(), cacheService)
    ),
    withAdapterExceptionAspect(
        withAdapterCacheAspect(new RuleBasedAdapter(douyinxsRule), cacheService)
    ),
]

for (const adapter of adapters) {
    adapterManager.register(adapter)
}

export { adapterManager }
export type { SearchStreamCallbacks } from './manager'
export type {
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
} from './types'
