import type { Middleware } from 'koa'
import { getClientIp } from '../utils/client-ip'
import { accessLogger } from '../utils/logger'

export const loggerMiddleware: Middleware = async (ctx, next) => {
    const start = performance.now()

    await next()

    const duration = Math.round(performance.now() - start)
    const ip = getClientIp(ctx)
    const { method, url, status } = ctx
    const traceId = ctx.state.traceId ?? '-'
    const contentLength = ctx.response.length ?? 0

    accessLogger.info(
        `${ip} ${method} ${url} ${status} ${contentLength}b ${duration}ms | traceId=${traceId}`
    )
}
