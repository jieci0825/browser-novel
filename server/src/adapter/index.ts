import { adapterManager } from './manager'
import { QQReaderAdapter } from './qq-reader'
import { HuanxiangAdapter } from './huanxiang'
import { withAdapterExceptionAspect } from './aspect'

const adapters = [
    withAdapterExceptionAspect(new QQReaderAdapter()),
    withAdapterExceptionAspect(new HuanxiangAdapter()),
]

for (const adapter of adapters) {
    adapterManager.register(adapter)
}

export { adapterManager }
export type {
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
} from './types'
