import { adapterManager } from './manager'
import { QQReaderAdapter } from './qq-reader'
import { RuleBasedAdapter } from './rule-based/adapter'
import { withAdapterExceptionAspect } from './aspect'
import { douyinxsRule } from './sources/douyinxs'

const adapters = [
    withAdapterExceptionAspect(new QQReaderAdapter()),
    withAdapterExceptionAspect(new RuleBasedAdapter(douyinxsRule)),
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
