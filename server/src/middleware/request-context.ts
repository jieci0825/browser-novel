import { randomUUID } from 'node:crypto'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Middleware } from 'koa'

const TRACE_ID_HEADER = 'x-trace-id'

interface RequestContext {
    traceId: string
    forceRefresh: boolean
}

const requestStore = new AsyncLocalStorage<RequestContext>()

export function getRequestContext(): RequestContext | undefined {
    return requestStore.getStore()
}

export const requestContextMiddleware: Middleware = async (ctx, next) => {
    const incomingTraceId = ctx.get(TRACE_ID_HEADER).trim()
    const traceId = incomingTraceId || randomUUID()
    const forceRefresh = ctx.query.refresh === 'true'

    ctx.state.traceId = traceId
    ctx.state.forceRefresh = forceRefresh
    ctx.set(TRACE_ID_HEADER, traceId)

    await requestStore.run({ traceId, forceRefresh }, () => next())
}
