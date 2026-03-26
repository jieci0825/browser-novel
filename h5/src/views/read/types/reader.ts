import type { ChapterContent } from '@/api/types/book.type'

/** 阅读模式 */
export type ReadMode = 'paginated' | 'scroll'

/** 翻页动画类型（仅左右分页模式） */
export type AnimationType = 'slide' | 'cover' | 'simulation' | 'none'

/** 段落分片 —— 一个段落在某一页中的文本片段 */
export interface ParagraphSlice {
    /** 原始段落索引 */
    paragraphIndex: number
    /** 该分片的文本内容 */
    text: string
    /** 是否为段落的部分内容（段内被分页截断） */
    isPartial: boolean
    /** 是否为章节标题 */
    isTitle?: boolean
    /** 该分片在原始段落中的起始字符索引 */
    charStart: number
    /** 该分片在原始段落中的结束字符索引（不含） */
    charEnd: number
}

/** 单页 —— 由若干段落分片组成 */
export interface Page {
    paragraphs: ParagraphSlice[]
}

/** 分页结果 */
export interface PaginationResult {
    pages: Page[]
    /** 原始段落总数 */
    totalParagraphs: number
    /** 总页数 */
    totalPages: number
}

/** 章节缓存 */
export interface ChapterCache {
    content: ChapterContent
    pages?: Page[]
}

/** 阅读位置 —— 用于分页参数变化时的位置保持 */
export interface ReadingPosition {
    paragraphIndex: number
    charOffset: number
}

/** 分页模式下的阅读进度 */
export interface PaginatedProgress {
    mode: 'paginated'
    chapterId: string
    pageIndex: number
    paragraphIndex: number
    charOffset: number
}

/** 滚动模式下的阅读进度 */
export interface ScrollProgress {
    mode: 'scroll'
    chapterId: string
    paragraphIndex: number
    paragraphOffsetRatio: number
}

/** 阅读进度（联合类型） */
export type ReadProgress = PaginatedProgress | ScrollProgress
