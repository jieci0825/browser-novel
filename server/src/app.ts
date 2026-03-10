import Koa from 'koa'
import cors from '@koa/cors'
import bookRouter from './routes/book'
import { browserPool } from './browser/pool'
import { cacheService } from './cache/cache-service'
import { requestContextMiddleware } from './middleware/request-context'
import { responseMiddleware } from './middleware/response'
import { exceptionMiddleware } from './middleware/exception'
import { loggerMiddleware } from './middleware/logger'

const app = new Koa()
const PORT = Number(process.env.PORT) || 5100

app.use(cors())
app.use(requestContextMiddleware)
app.use(loggerMiddleware)
app.use(responseMiddleware)
app.use(exceptionMiddleware)

app.use(bookRouter.routes())
app.use(bookRouter.allowedMethods())

const server = app.listen(PORT, () => {
    console.log(`服务已启动: http://localhost:${PORT}`)
})

const shutdown = async () => {
    console.log('正在关闭服务...')
    cacheService.close()
    await browserPool.close()
    server.close()
    process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
