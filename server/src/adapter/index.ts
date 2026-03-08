import { adapterManager } from './manager'
import { QQReaderAdapter } from './qq-reader'
import { HuanxiangAdapter } from './huanxiang'

const adapters = [new QQReaderAdapter(), new HuanxiangAdapter()]

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
