import Koa from 'koa'
import cors from '@koa/cors'
import bookRouter from './routes/book'
import { browserPool } from './browser/pool'
import { requestContextMiddleware } from './middleware/request-context'
import { responseMiddleware } from './middleware/response'
import { exceptionMiddleware } from './middleware/exception'

const app = new Koa()
const PORT = Number(process.env.PORT) || 5100

app.use(cors())
app.use(requestContextMiddleware)
app.use(responseMiddleware)
app.use(exceptionMiddleware)

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
