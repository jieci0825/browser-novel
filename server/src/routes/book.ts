import Router from 'koa-router'
import type { DefaultContext } from 'koa'
import { adapterManager } from '../adapter'
import { ValidationException } from '../exception/app-exception'

const router = new Router<any, DefaultContext>({ prefix: '/api' })

/** 获取可用书源列表 */
router.get('/sources', ctx => {
    ctx.success(adapterManager.listSources())
})

/** 搜索（聚合所有书源） */
router.get('/search', async ctx => {
    const keyword = (ctx.query.keyword as string) || ''
    const page = Number(ctx.query.page) || 0

    if (!keyword.trim()) {
        throw new ValidationException('请输入搜索关键词')
    }

    const data = await adapterManager.searchAll(keyword, page)
    ctx.success(data)
})

/** 搜索指定书源 */
router.get('/search/:sourceId', async ctx => {
    const { sourceId } = ctx.params
    const keyword = (ctx.query.keyword as string) || ''
    const page = Number(ctx.query.page) || 0

    if (!keyword.trim()) {
        throw new ValidationException('请输入搜索关键词')
    }

    const adapter = adapterManager.get(sourceId)
    const data = await adapter.search(keyword, page)
    ctx.success(data)
})

/** 书籍详情 */
router.get('/book/:sourceId', async ctx => {
    const { sourceId } = ctx.params
    const bookId = ctx.query.bookId as string

    if (!bookId) {
        throw new ValidationException('缺少 bookId 参数')
    }

    const adapter = adapterManager.get(sourceId)
    const data = await adapter.getDetail(bookId)
    ctx.success(data)
})

/** 章节目录 */
router.get('/chapters/:sourceId', async ctx => {
    const { sourceId } = ctx.params
    const bookId = ctx.query.bookId as string

    if (!bookId) {
        throw new ValidationException('缺少 bookId 参数')
    }

    const adapter = adapterManager.get(sourceId)
    const data = await adapter.getChapters(bookId)
    ctx.success(data)
})

/** 章节正文 */
router.get('/content/:sourceId', async ctx => {
    const { sourceId } = ctx.params
    const bookId = ctx.query.bookId as string
    const chapterId = ctx.query.chapterId as string

    if (!bookId || !chapterId) {
        throw new ValidationException('缺少 bookId 或 chapterId 参数')
    }

    const adapter = adapterManager.get(sourceId)
    const data = await adapter.getContent(bookId, chapterId)
    ctx.success(data)
})

export default router
