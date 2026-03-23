import type { BookSearchItem } from '@/api/types/book.type'

/**
 * 计算单个字段与关键词的匹配分数
 */
function calcFieldScore(field: string, keyword: string): number {
    if (!field || !keyword) return 0

    if (field === keyword) return 100
    if (field.startsWith(keyword)) return 80
    if (field.includes(keyword)) return 60
    if (keyword.includes(field)) return 50

    return 0
}

/**
 * 计算书籍与搜索关键词的相关度分数
 * 支持纯书名、纯作者名、书名+作者名组合搜索
 */
export function calcRelevance(book: BookSearchItem, keyword: string): number {
    const kw = keyword.trim().toLowerCase()
    const name = (book.name || '').toLowerCase()
    const author = (book.author || '').toLowerCase()

    const nameScore = calcFieldScore(name, kw)
    const authorScore = calcFieldScore(author, kw)

    // 取较高分作为基础分，书名和作者地位平等
    let score = Math.max(nameScore, authorScore)

    // 书名和作者都有匹配度，额外加分
    if (nameScore > 0 && authorScore > 0) {
        score += 20
    }

    // 尝试拆分关键词（空格分隔），处理组合搜索场景
    const parts = kw.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
        for (let i = 1; i < parts.length; i++) {
            const left = parts.slice(0, i).join('')
            const right = parts.slice(i).join('')

            const combo1 =
                calcFieldScore(name, left) + calcFieldScore(author, right)
            const combo2 =
                calcFieldScore(name, right) + calcFieldScore(author, left)

            const comboMax = Math.max(combo1, combo2)
            if (comboMax > score) {
                score = comboMax + 10
            }
        }
    }

    return score
}

/**
 * 按相关度对搜索结果排序（降序）
 */
export function sortByRelevance(
    list: BookSearchItem[],
    keyword: string
): void {
    list.sort((a, b) => calcRelevance(b, keyword) - calcRelevance(a, keyword))
}
