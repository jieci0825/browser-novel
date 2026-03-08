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

function parseSelectorPart(raw: string): {
    selector: string
    extract: string
} {
    if (!raw) return { selector: '', extract: 'text' }
    const match = raw.match(/^(.*?)@(\w+)$/)
    if (match) {
        return { selector: match[1].trim(), extract: match[2] }
    }
    return { selector: raw.trim(), extract: 'text' }
}

function parsePipe(raw: string): PipeOp {
    const trimmed = raw.trim()
    if (trimmed.startsWith('regex:')) {
        return { type: 'regex', pattern: trimmed.slice(6), replacement: '' }
    }
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
    const parts = raw.split(' | ')
    const { selector, extract } = parseSelectorPart(parts[0])
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
 *
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

    const branches = rule.split(' || ')

    for (const branchRaw of branches) {
        const branch = parseBranch(branchRaw.trim())
        const target = branch.selector
            ? context.find(branch.selector).first()
            : context

        const raw = extractValue(target, branch.extract)
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
