import Router from 'koa-router'
import type { DefaultContext } from 'koa'
import { adapterManager } from '../adapter'
import { ValidationException } from '../exception/app-exception'

const router = new Router<any, DefaultContext>({ prefix: '/api/books' })

/** 获取可用书源列表 */
router.get('/sources', ctx => {
    ctx.success(adapterManager.listSources())
})

/** 搜索（聚合所有书源，NDJSON 流式返回） */
router.get('/search', async ctx => {
    const keyword = (ctx.query.keyword as string) || ''

    if (!keyword.trim()) {
        throw new ValidationException('请输入搜索关键词')
    }

    ctx.set({
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
    })

    ctx.status = 200
    // 表示不使用 Koa 的响应处理，而是自己手动处理响应
    ctx.respond = false

    const res = ctx.res
    res.flushHeaders()

    // 写入一行数据
    const writeLine = (data: unknown) => {
        if (!res.writableEnded) {
            res.write(JSON.stringify(data) + '\n')
        }
    }

    await adapterManager.searchAllStream(keyword, {
        onResult(sourceId, sourceName, items) {
            writeLine({ type: 'result', sourceId, sourceName, items })
        },
        onError(sourceId, sourceName, message) {
            writeLine({ type: 'error', sourceId, sourceName, message })
        },
    })

    writeLine({ type: 'done' })
    res.end()
})

/** 搜索指定书源 */
router.get('/search/:sourceId', async ctx => {
    const { sourceId } = ctx.params
    const keyword = (ctx.query.keyword as string) || ''
    const page = Number(ctx.query.page) || 0
    const pageSizeRaw = ctx.query.pageSize as string | undefined
    const pageSize =
        pageSizeRaw === undefined ? undefined : Number(pageSizeRaw)

    if (!keyword.trim()) {
        throw new ValidationException('请输入搜索关键词')
    }
    if (
        pageSizeRaw !== undefined &&
        (!Number.isInteger(pageSize) || (pageSize as number) <= 0)
    ) {
        throw new ValidationException('pageSize 必须是大于 0 的整数')
    }

    const adapter = adapterManager.get(sourceId)
    const data = await adapter.search(keyword, page, pageSize)
    ctx.success(data)
})

/** 书籍详情 */
router.get('/:sourceId/detail', async ctx => {
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
router.get('/:sourceId/chapters', async ctx => {
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
router.get('/:sourceId/content', async ctx => {
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
