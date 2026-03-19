import type {
    BookSourceAdapter,
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
} from './types'

/**
 * 链式 Fallback 书源适配器
 *
 * 对外表现为单个书源，内部持有一组子书源，按优先级链式尝试：
 * - search: 依次尝试，第一个返回非空结果的胜出
 * - getDetail / getChapters / getContent: 通过 bookId 编码精准路由到对应子书源
 */
export class ChainedAdapter implements BookSourceAdapter {
    readonly sourceId: string
    readonly sourceName: string

    private adapters: BookSourceAdapter[]
    private adapterMap: Map<string, BookSourceAdapter>

    constructor(
        groupId: string,
        groupName: string,
        adapters: BookSourceAdapter[]
    ) {
        this.sourceId = groupId
        this.sourceName = groupName
        this.adapters = adapters
        this.adapterMap = new Map(adapters.map(a => [a.sourceId, a]))
    }

    async search(
        keyword: string,
        page?: number,
        pageSize?: number
    ): Promise<BookSearchItem[]> {
        for (const adapter of this.adapters) {
            try {
                const results = await adapter.search(keyword, page, pageSize)
                if (results.length > 0) {
                    return results.map(item => ({
                        ...item,
                        sourceId: this.sourceId,
                        bookId: this.encodeBookId(
                            adapter.sourceId,
                            item.bookId
                        ),
                    }))
                }
            } catch {
                // 当前书源失败，尝试下一个
                continue
            }
        }
        return []
    }

    async getDetail(bookId: string): Promise<BookDetail> {
        const { childSourceId, bookId: realId } = this.decodeBookId(bookId)
        const adapter = this.getChildAdapter(childSourceId)
        const detail = await adapter.getDetail(realId)
        return {
            ...detail,
            sourceId: this.sourceId,
            bookId,
        }
    }

    async getChapters(bookId: string): Promise<Chapter[]> {
        const { childSourceId, bookId: realId } = this.decodeBookId(bookId)
        const adapter = this.getChildAdapter(childSourceId)
        return adapter.getChapters(realId)
    }

    async getContent(
        bookId: string,
        chapterId: string
    ): Promise<ChapterContent> {
        const { childSourceId, bookId: realId } = this.decodeBookId(bookId)
        const adapter = this.getChildAdapter(childSourceId)
        return adapter.getContent(realId, chapterId)
    }

    // ── 内部编解码 ──────────────────────────────────────────────

    /**
     * 长度前缀编码：`{sourceId长度}:{sourceId}{bookId}`
     * 示例：
     *  - sourceId="douyinxs", bookId="12345" → "8:douyinxs12345"
     *  - sourceId="biquge5200", bookId="12345" → "10:biquge520012345"
     */
    private encodeBookId(childSourceId: string, rawBookId: string): string {
        return `${childSourceId.length}:${childSourceId}${rawBookId}`
    }

    private decodeBookId(encoded: string): {
        childSourceId: string
        bookId: string
    } {
        const colonIdx = encoded.indexOf(':')
        const len = parseInt(encoded.slice(0, colonIdx), 10)
        const childSourceId = encoded.slice(colonIdx + 1, colonIdx + 1 + len)
        const bookId = encoded.slice(colonIdx + 1 + len)
        return { childSourceId, bookId }
    }

    private getChildAdapter(childSourceId: string): BookSourceAdapter {
        const adapter = this.adapterMap.get(childSourceId)
        if (!adapter) {
            throw new Error(`ChainedAdapter: 未知的子书源 "${childSourceId}"`)
        }
        return adapter
    }
}
