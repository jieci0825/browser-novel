import Koa from 'koa'
import cors from '@koa/cors'
import compress from 'koa-compress'
import bookRouter from './routes/book'
import { browserPool } from './browser/pool'
import { cacheService } from './cache/cache-service'
import { requestContextMiddleware } from './middleware/request-context'
import { loggerMiddleware } from './middleware/logger'
import { createRateLimitMiddleware } from './middleware/rate-limit'
import { responseMiddleware } from './middleware/response'
import { exceptionMiddleware } from './middleware/exception'
import { logger, shutdownLogger } from './utils/logger'

const app = new Koa()
const PORT = Number(process.env.PORT) || 5100

app.use(cors())
app.use(compress({ threshold: 1024 }))
app.use(requestContextMiddleware)
app.use(loggerMiddleware)
app.use(createRateLimitMiddleware({ windowMs: 60_000, max: 120 }))
app.use(responseMiddleware)
app.use(exceptionMiddleware)

app.use(bookRouter.routes())
app.use(bookRouter.allowedMethods())

const server = app.listen(PORT, () => {
    logger.info(`服务已启动: http://localhost:${PORT}`)
})

const shutdown = async () => {
    logger.info('正在关闭服务...')
    cacheService.close()
    await browserPool.close()
    server.close()
    await shutdownLogger()
    process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
