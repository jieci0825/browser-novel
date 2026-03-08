import Koa from 'koa'
import cors from '@koa/cors'
import bookRouter from './routes/book'
import { browserPool } from './browser/pool'

const app = new Koa()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())

/** 全局错误处理 */
app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err: any) {
        console.error(`[${ctx.method} ${ctx.url}]`, err.message)
        ctx.status = 200
        ctx.body = {
            code: 500,
            message: err.message || '服务器内部错误',
        }
    }
})

app.use(bookRouter.routes())
app.use(bookRouter.allowedMethods())

const server = app.listen(PORT, () => {
    console.log(`服务已启动: http://localhost:${PORT}`)
})

const shutdown = async () => {
    console.log('正在关闭服务...')
    await browserPool.close()
    server.close()
    process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
