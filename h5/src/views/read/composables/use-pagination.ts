import { watch, onMounted, onUnmounted, type Ref } from 'vue'
import { readSettings, type ReadSettings } from '../config/read-settings'
import type { PaginationResult, Page, ReadingPosition } from '../types/reader'

const MEASURE_CONTAINER_ID = '__pagination-measure'

/** 根据书源、书籍、章节、排版参数和容器尺寸生成唯一的分页缓存键 */
export function buildCacheKey(
    sourceId: string,
    bookId: string,
    chapterId: string,
    settings: ReadSettings,
    containerSize: { width: number; height: number }
): string {
    const font = settings.customFont || settings.fontFamily
    return [
        sourceId,
        bookId,
        chapterId,
        settings.fontSize,
        settings.lineHeight,
        settings.letterSpacing,
        settings.paragraphSpacing,
        font,
        containerSize.width,
        containerSize.height,
    ].join('|')
}

/** 从当前页码和分页结果中提取阅读位置，用于重新分页前记录用户正在阅读的段落和字符偏移 */
export function locatePositionBeforePaginate(
    currentPageIndex: number,
    pages: Page[]
): ReadingPosition {
    if (pages.length === 0) {
        return { paragraphIndex: 0, charOffset: 0 }
    }

    const clampedIndex = Math.max(
        0,
        Math.min(currentPageIndex, pages.length - 1)
    )
    const page = pages[clampedIndex]!
    const firstSlice = page.paragraphs[0]

    if (!firstSlice) {
        return { paragraphIndex: 0, charOffset: 0 }
    }

    return {
        paragraphIndex: firstSlice.paragraphIndex,
        charOffset: firstSlice.charStart,
    }
}

/** 在新的分页结果中查找与给定阅读位置最匹配的页码，用于重新分页后恢复阅读位置 */
export function resolvePageAfterPaginate(
    position: ReadingPosition,
    newPages: Page[]
): number {
    if (newPages.length === 0) return 0

    for (let i = 0; i < newPages.length; i++) {
        const page = newPages[i]!
        for (const slice of page.paragraphs) {
            if (slice.paragraphIndex !== position.paragraphIndex) continue
            if (
                position.charOffset >= slice.charStart &&
                position.charOffset < slice.charEnd
            ) {
                return i
            }
        }
    }

    let bestPage = 0
    let bestDistance = Infinity

    for (let i = 0; i < newPages.length; i++) {
        const page = newPages[i]!
        for (const slice of page.paragraphs) {
            if (slice.paragraphIndex === position.paragraphIndex) {
                const dist = Math.abs(slice.charStart - position.charOffset)
                if (dist < bestDistance) {
                    bestDistance = dist
                    bestPage = i
                }
            }
        }
    }

    if (bestDistance < Infinity) return bestPage

    for (let i = 0; i < newPages.length; i++) {
        const page = newPages[i]!
        const lastSlice = page.paragraphs[page.paragraphs.length - 1]
        if (lastSlice && lastSlice.paragraphIndex >= position.paragraphIndex) {
            return i
        }
    }

    return newPages.length - 1
}

/** 接受容器元素引用或 CSS 选择器，测量容器将挂载到该元素下，宽高计算也基于该容器 */
export function usePagination(container: Ref<HTMLElement | null> | string) {
    let measureEl: HTMLDivElement | null = null
    let styleEl: HTMLStyleElement | null = null

    const paginationCache = new Map<string, PaginationResult>()
    const chapterKeyMap = new Map<string, string>()

    /** 解析容器：支持 Ref 或 CSS 选择器 */
    function resolveContainer(): HTMLElement | null {
        if (typeof container === 'string') {
            return document.querySelector(container)
        }
        return container.value
    }

    /** 计算阅读区域的内容宽度 */
    function getContentWidth(): number {
        return resolveContainer()?.clientWidth ?? window.innerWidth
    }

    /** 计算单页可用高度 */
    function getPageHeight(): number {
        return resolveContainer()?.clientHeight ?? window.innerHeight
    }

    /** 创建不可见的 DOM 测量容器，挂载到指定容器下，用于分页时测量段落尺寸 */
    function createMeasureContainer(): void {
        if (measureEl) return
        const el_container = resolveContainer()
        if (!el_container) return

        styleEl = document.createElement('style')
        styleEl.textContent = [
            `#${MEASURE_CONTAINER_ID} p {`,
            '  text-indent: 2em;',
            '  margin: 0;',
            '  padding: 0;',
            '}',
            `#${MEASURE_CONTAINER_ID} .m-title {`,
            '  text-indent: 0;',
            '  font-weight: 600;',
            '}',
            `#${MEASURE_CONTAINER_ID} .m-partial {`,
            '  text-indent: 0;',
            '}',
        ].join('\n')
        document.head.appendChild(styleEl)

        const el = document.createElement('div')
        el.id = MEASURE_CONTAINER_ID
        el.style.cssText = [
            'position: absolute',
            'visibility: hidden',
            'top: 0',
            'left: 0',
            'z-index: 9999',
            'background-color: red',
            'box-sizing: border-box',
            'pointer-events: none',
        ].join(';')
        el_container.appendChild(el)

        measureEl = el
        syncMeasureStyles()
    }

    /** 将测量容器的排版属性与当前阅读设置同步 */
    function syncMeasureStyles(): void {
        if (!measureEl) return

        const font = readSettings.customFont || readSettings.fontFamily
        measureEl.style.width = `${getContentWidth()}px`
        measureEl.style.fontFamily = font
        measureEl.style.fontSize = `${readSettings.fontSize}px`
        measureEl.style.lineHeight = `${readSettings.lineHeight}`
        measureEl.style.letterSpacing = `${readSettings.letterSpacing}em`
    }

    /** 从 DOM 中移除测量容器及其关联的样式元素 */
    function destroyMeasureContainer(): void {
        styleEl?.remove()
        styleEl = null
        measureEl?.remove()
        measureEl = null
    }

    /** 在测量容器中渲染段落文本，返回内容高度和文本节点引用 */
    function measureParagraph(
        text: string,
        isTitle: boolean,
        isContinuation: boolean
    ): { height: number; textNode: Text | null } {
        measureEl!.innerHTML = ''
        const p = document.createElement('p')
        p.textContent = text
        if (isTitle) p.classList.add('m-title')
        if (isContinuation) p.classList.add('m-partial')
        measureEl!.appendChild(p)
        return {
            height: p.offsetHeight,
            textNode: p.firstChild as Text | null,
        }
    }

    /** 使用 Range API 二分查找，找到在给定高度内能完整显示的最大字符索引 */
    function findSplitPoint(textNode: Text, availableHeight: number): number {
        const range = document.createRange()
        let lo = 1
        let hi = textNode.length

        while (lo < hi) {
            const mid = (lo + hi + 1) >>> 1
            range.setStart(textNode, 0)
            range.setEnd(textNode, mid)
            if (range.getBoundingClientRect().height <= availableHeight) {
                lo = mid
            } else {
                hi = mid - 1
            }
        }

        range.setStart(textNode, 0)
        range.setEnd(textNode, lo)
        if (range.getBoundingClientRect().height > availableHeight) {
            return 0
        }

        return lo
    }

    /** 将段落数组按页面高度精确分页，超高段落通过 Range API 行级截断 */
    function paginate(
        paragraphs: string[],
        pageHeight: number,
        titleIndex?: number
    ): PaginationResult {
        const empty: PaginationResult = {
            pages: [],
            totalParagraphs: paragraphs.length,
            totalPages: 0,
        }
        if (!measureEl || paragraphs.length === 0 || pageHeight <= 0)
            return empty

        // 段落间距
        const spacingPx = readSettings.paragraphSpacing * readSettings.fontSize
        // 分页结果
        const pages: Page[] = []
        // 当前页
        let currentPage: Page = { paragraphs: [] }
        // 已使用高度
        let usedHeight = 0

        let i = 0 // 当前段落索引
        while (i < paragraphs.length) {
            const fullText = paragraphs[i]! // 当前段落文本
            const isTitle = i === titleIndex // 是否为标题
            let remainingText = fullText // 剩余文本
            let charStart = 0 // 当前段落字符索引
            let isContinuation = false // 是否为续段

            // 剩余文本不为空时，继续分页
            while (remainingText.length > 0) {
                // 如果当前页有段落，则需要得到段落间距
                const spacing =
                    currentPage.paragraphs.length > 0 ? spacingPx : 0
                // 可用高度 = 页面高度 - 已使用高度 - 段落间距
                const availableHeight = pageHeight - usedHeight - spacing

                // 可用高度小于等于0时，说明当前页已经满了，需要新开一页
                if (availableHeight <= 0) {
                    pages.push(currentPage)
                    currentPage = { paragraphs: [] }
                    usedHeight = 0
                    continue
                }

                // 测量段落文本，返回内容高度和文本节点引用
                const { height, textNode } = measureParagraph(
                    remainingText,
                    // isTitle && !isContinuation,
                    isTitle,
                    isContinuation
                )

                if (height <= availableHeight) {
                    currentPage.paragraphs.push({
                        paragraphIndex: i,
                        text: remainingText,
                        isPartial: isContinuation,
                        isTitle: isTitle && !isContinuation,
                        charStart,
                        charEnd: fullText.length,
                    })
                    usedHeight += spacing + height
                    remainingText = ''
                    continue
                }

                if (!textNode) {
                    currentPage.paragraphs.push({
                        paragraphIndex: i,
                        text: remainingText,
                        isPartial: isContinuation,
                        isTitle: isTitle && !isContinuation,
                        charStart,
                        charEnd: fullText.length,
                    })
                    usedHeight += spacing + height
                    remainingText = ''
                    continue
                }

                const splitIndex = findSplitPoint(textNode, availableHeight)

                if (splitIndex <= 0) {
                    if (currentPage.paragraphs.length > 0) {
                        pages.push(currentPage)
                        currentPage = { paragraphs: [] }
                        usedHeight = 0
                        continue
                    }
                    currentPage.paragraphs.push({
                        paragraphIndex: i,
                        text: remainingText.slice(0, 1),
                        isPartial: true,
                        isTitle: isTitle && !isContinuation,
                        charStart,
                        charEnd: charStart + 1,
                    })
                    pages.push(currentPage)
                    currentPage = { paragraphs: [] }
                    usedHeight = 0
                    charStart += 1
                    remainingText = remainingText.slice(1)
                    isContinuation = true
                    continue
                }

                currentPage.paragraphs.push({
                    paragraphIndex: i,
                    text: remainingText.slice(0, splitIndex),
                    isPartial: true,
                    isTitle: isTitle && !isContinuation,
                    charStart,
                    charEnd: charStart + splitIndex,
                })
                pages.push(currentPage)
                currentPage = { paragraphs: [] }
                usedHeight = 0
                charStart += splitIndex
                remainingText = remainingText.slice(splitIndex)
                isContinuation = true
            }

            i++
        }

        if (currentPage.paragraphs.length > 0) {
            pages.push(currentPage)
        }

        measureEl.innerHTML = ''

        return {
            pages,
            totalParagraphs: paragraphs.length,
            totalPages: pages.length,
        }
    }

    /** 带缓存的分页：命中缓存时跳过 DOM 测量，直接返回缓存结果 */
    function paginateWithCache(
        sourceId: string,
        bookId: string,
        chapterId: string,
        paragraphs: string[],
        pageHeight: number,
        titleIndex?: number
    ): PaginationResult {
        const key = buildCacheKey(sourceId, bookId, chapterId, readSettings, {
            width: getContentWidth(),
            height: getPageHeight(),
        })

        const cached = paginationCache.get(key)
        if (cached) return cached

        const result = paginate(paragraphs, pageHeight, titleIndex)

        const oldKey = chapterKeyMap.get(chapterId)
        if (oldKey && oldKey !== key) {
            paginationCache.delete(oldKey)
        }

        paginationCache.set(key, result)
        chapterKeyMap.set(chapterId, key)

        return result
    }

    /** 清理不在保留列表中的章节缓存，用于控制内存占用 */
    function cleanupCache(retainChapterIds: string[]): void {
        const keepSet = new Set(retainChapterIds)
        for (const [chapterId, key] of chapterKeyMap) {
            if (!keepSet.has(chapterId)) {
                paginationCache.delete(key)
                chapterKeyMap.delete(chapterId)
            }
        }
    }

    /** 清空所有分页缓存 */
    function clearCache(): void {
        paginationCache.clear()
        chapterKeyMap.clear()
    }

    watch(
        () => [
            readSettings.fontSize,
            readSettings.fontFamily,
            readSettings.customFont,
            readSettings.lineHeight,
            readSettings.letterSpacing,
            readSettings.paragraphSpacing,
        ],
        () => {
            syncMeasureStyles()
            clearCache()
        }
    )

    onMounted(createMeasureContainer)
    onUnmounted(() => {
        clearCache()
        destroyMeasureContainer()
    })

    return {
        getMeasureContainer: () => measureEl,
        getContentWidth,
        getPageHeight,
        syncMeasureStyles,
        paginate,
        paginateWithCache,
        cleanupCache,
        clearCache,
    }
}
