import type * as cheerio from 'cheerio'

/**
 * 字段提取规则
 *
 * 支持两种形式：
 * 1. DSL 字符串 — 声明式提取
 *    selector                      → 取 text
 *    selector@attr                 → 取属性值 (href / html / text / ...)
 *    selector | replace:pattern,replacement  → 正则替换
 *    selector | regex:pattern      → 正则提取 (返回第一个捕获组)
 *    selectorA || selectorB        → 回退：依次尝试，返回第一个非空值
 *    列表上下文中：@text / @href / @html → 引用当前迭代元素自身
 *
 * 2. 脚本函数 — 当声明式不够灵活时，直接编写提取逻辑
 */
export type FieldRule = string | FieldRuleFn

export type FieldRuleFn = (context: FieldRuleContext) => string

/**
 * 列表定位规则
 *
 * 支持两种形式：
 * 1. string — CSS 选择器（HTML）或 JSON path，直接定位列表元素
 * 2. 函数 — 当选择器无法精确描述时，用代码返回列表元素数组
 */
export type ListRule = string | ListRuleFn

/** HTML 模式：接收 cheerio 实例，返回 cheerio 元素数组 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListRuleFnHtml = ($: cheerio.CheerioAPI) => cheerio.Cheerio<any>[]

/** JSON 模式：接收原始数据，返回数据项数组 */
export type ListRuleFnJson = (data: unknown) => unknown[]

export type ListRuleFn = ListRuleFnHtml | ListRuleFnJson

/** 脚本函数接收的上下文，根据 sourceType 不同，可用字段不同 */
export interface FieldRuleContext {
    /** HTML 模式：cheerio 实例，可用于任意 DOM 查询 */
    $?: cheerio.CheerioAPI
    /** HTML 模式：当前上下文元素（列表项 or 页面根节点） */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    el?: cheerio.Cheerio<any>
    /** JSON 模式：当前上下文数据（列表项 or 整个响应体） */
    data?: unknown
    /** 书源根 URL，方便拼接地址 */
    sourceUrl: string
}

/** 书源规则 */
export interface BookSourceRule {
    sourceId: string // 书源 ID
    sourceName: string // 书源名称
    sourceUrl: string // 书源 URL
    sourceType?: 'html' | 'json' // 书源类型

    http?: HttpConfig // HTTP 配置

    search: SearchRule
    detail: DetailRule
    chapters: ChaptersRule
    content: ContentRule
}

export interface HttpConfig {
    headers?: Record<string, string>
    userAgent?: string
    timeout?: number
    charset?: string
}

export interface SearchRule {
    url: string // 搜索 URL
    method?: 'GET' | 'POST' // 请求方法
    body?: string // 请求体
    contentType?: string // 内容类型

    list: ListRule
    /** 当提取到的 name 匹配此正则时跳过该项 */
    excludePattern?: string

    // 字段提取规则
    //  - 从搜索结果列表项中提取字段
    fields: {
        name: FieldRule
        bookId: FieldRule
        author?: FieldRule
        cover?: FieldRule
        intro?: FieldRule
        latestChapter?: FieldRule
        wordCount?: FieldRule
        status?: FieldRule
    }

    /** 搜索冷却时间 (ms) */
    cooldown?: number
}

export interface DetailRule {
    url: string
    method?: 'GET' | 'POST'

    fields: {
        name: FieldRule
        author: FieldRule
        cover?: FieldRule
        intro?: FieldRule
        latestChapter?: FieldRule
        wordCount?: FieldRule
        status?: FieldRule
        category?: FieldRule
    }
}

export interface ChaptersRule {
    url: string
    method?: 'GET' | 'POST'

    list: ListRule
    fields: {
        chapterId: FieldRule
        title: FieldRule
    }

    pagination?: {
        nextSelector: string
        maxPages?: number
    }
}

export interface ContentRule {
    url: string
    method?: 'GET' | 'POST'

    fields: {
        title: FieldRule
        content: FieldRule
    }

    /** 正文分页：下一页链接的提取规则，用于多页正文拼接 */
    nextContentUrl?: FieldRule

    purify?: ContentPurifyOptions
}

export interface ContentPurifyOptions {
    /**
     * 自定义清洗函数 — 当提供时，完全替代内置清洗逻辑。
     * 接收提取到的原始 HTML 字符串，返回清洗后的纯文本。
     */
    customPurify?: (rawHtml: string) => string
    /** 将 HTML 中的 <br> 标签转换为换行符 \n，默认 true */
    brToNewline?: boolean
    /** 将 &nbsp;（不换行空格）替换为普通空格，默认 true */
    stripNbsp?: boolean
    /** 在提取正文前，先移除匹配这些 CSS 选择器的 DOM 元素（如广告、推荐栏等） */
    removeSelectors?: string[]
    /** 去除每行首尾的空白字符，默认 true */
    trimLines?: boolean
    /** 过滤掉空行（trim 后为空字符串的行），默认 true */
    filterEmpty?: boolean
}
