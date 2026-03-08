import { randomUUID } from 'node:crypto'
import type { Middleware } from 'koa'

const TRACE_ID_HEADER = 'x-trace-id'

export const requestContextMiddleware: Middleware = async (ctx, next) => {
    const incomingTraceId = ctx.get(TRACE_ID_HEADER).trim()
    const traceId = incomingTraceId || randomUUID()

    ctx.state.traceId = traceId
    ctx.set(TRACE_ID_HEADER, traceId)

    await next()
}
