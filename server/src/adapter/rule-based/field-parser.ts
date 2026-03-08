import type * as cheerio from 'cheerio'
import type { FieldRule } from './types'

interface PipeOp {
    type: 'regex' | 'replace'
    pattern: string
    replacement: string
}

interface ParsedBranch {
    selector: string
    /** 提取方式: 'text' | 'html' | 属性名 */
    extract: string
    pipes: PipeOp[]
}

/**
 * 解析 DSL 中的“选择器片段”，例如 ".title@text" 或 "a@href"
 * @param raw 原始字符串
 * @returns 解析后的选择器和提取方式
 */
function parseSelectorPart(raw: string): {
    selector: string
    extract: string
} {
    // 空规则兜底：没有输入时，返回空选择器 + 默认 text 提取
    if (!raw) return { selector: '', extract: 'text' }
    // 尝试匹配 "选择器@提取方式" 结构：
    // - 第 1 组 (.*?) 捕获 @ 前的选择器（允许为空）
    // - 第 2 组 (\w+) 捕获 @ 后的提取标记（字母/数字/下划线）
    const match = raw.match(/^(.*?)@(\w+)$/)
    // 匹配成功：按 "selector@extract" 拆分并返回
    if (match) {
        // selector 做 trim 去掉首尾空白；extract 直接取匹配结果
        return { selector: match[1].trim(), extract: match[2] }
    }
    // 未匹配到 @extract：把整个字符串当作 selector，并使用默认 text 提取
    return { selector: raw.trim(), extract: 'text' }
}

function parsePipe(raw: string): PipeOp {
    const trimmed = raw.trim()
    // 如果是 regex: 开头，则表示正则提取
    if (trimmed.startsWith('regex:')) {
        return { type: 'regex', pattern: trimmed.slice(6), replacement: '' }
    }
    // 如果是 replace: 开头，则表示正则替换
    if (trimmed.startsWith('replace:')) {
        const rest = trimmed.slice(8)
        const commaIdx = rest.indexOf(',')
        if (commaIdx === -1) {
            return { type: 'replace', pattern: rest, replacement: '' }
        }
        return {
            type: 'replace',
            pattern: rest.slice(0, commaIdx),
            replacement: rest.slice(commaIdx + 1),
        }
    }
    throw new Error(`Unknown pipe operation: ${trimmed}`)
}

function parseBranch(raw: string): ParsedBranch {
    // "|" 表示管道，依次处理每个管道。
    const parts = raw.split(' | ')
    // 得到选择器和提取方式(@text, @src, #href...)
    //  - 只有第一个管道任务会出现选择器，后面的管道任务都是对第一个管道任务的输出进行处理
    const { selector, extract } = parseSelectorPart(parts[0])
    // 为后面的管道任务创建一个 PipeOp 对象
    const pipes = parts.slice(1).map(parsePipe)
    return { selector, extract, pipes }
}

function applyPipes(value: string, pipes: PipeOp[]): string {
    let result = value
    for (const pipe of pipes) {
        if (pipe.type === 'regex') {
            const m = result.match(new RegExp(pipe.pattern))
            result = m?.[1] ?? m?.[0] ?? ''
        } else {
            result = result.replace(new RegExp(pipe.pattern), pipe.replacement)
        }
    }
    return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractValue(el: cheerio.Cheerio<any>, extract: string): string {
    if (!el?.length) return ''
    switch (extract) {
        case 'text':
            return el.text().trim()
        case 'html':
            return el.html() ?? ''
        default:
            return el.attr(extract) ?? ''
    }
}

/**
 * 从 HTML 中提取字段值
 * @param $ cheerio 实例
 * @param context 上下文元素 — 列表遍历时为当前项，页面级别时为 $.root()
 * @param rule 字段提取规则 DSL 字符串
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractHtmlField(
    $: cheerio.CheerioAPI,
    context: cheerio.Cheerio<any>,
    rule: FieldRule
): string {
    if (!rule) return ''

    // "||" 表示回退，依次尝试每个分支，返回第一个非空结果。
    const branches = rule.split(' || ')

    for (const branchRaw of branches) {
        const branch = parseBranch(branchRaw.trim())

        const target = branch.selector
            ? context.find(branch.selector).first()
            : context

        // 查看具体拿到的是那个 dom
        //  - 例如：<a href="/bqg/1303656/" target="_blank">时停起手，邪神也得给我跪下！</a>
        // console.log('[debug] target outerHTML =', $.html(target))

        // 根据提取方式，从 dom 中提取值
        const raw = extractValue(target, branch.extract)

        // 对提取到的值进行管道处理
        const value = applyPipes(raw, branch.pipes)

        if (value) return value
    }

    return ''
}

/**
 * 通过路径从 JSON 对象中取值
 *
 * 支持简易 JSONPath: `$.data.list[0].name`
 */
export function getByPath(obj: unknown, path: string): unknown {
    const normalized = path.replace(/^\$\.?/, '')
    if (!normalized) return obj

    let current: any = obj
    for (const part of normalized.split('.')) {
        if (current == null) return undefined
        const arrMatch = part.match(/^(\w+)\[(\d+)]$/)
        if (arrMatch) {
            current = current[arrMatch[1]]?.[Number(arrMatch[2])]
        } else {
            current = current[part]
        }
    }
    return current
}

/**
 * 从 JSON 数据中提取字段值
 */
export function extractJsonField(data: unknown, rule: FieldRule): string {
    if (!rule) return ''

    const branches = rule.split(' || ')

    for (const branchRaw of branches) {
        const parts = branchRaw.trim().split(' | ')
        const path = parts[0].trim()
        const pipes = parts.slice(1).map(parsePipe)

        const raw = getByPath(data, path)
        if (raw == null) continue

        const value = applyPipes(String(raw), pipes)
        if (value) return value
    }

    return ''
}
