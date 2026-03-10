import type { Middleware } from 'koa'

function getClientIp(ctx: Parameters<Middleware>[0]): string {
    const forwarded = ctx.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return ctx.ip || '-'
}

export const loggerMiddleware: Middleware = async (ctx, next) => {
    const start = performance.now()

    await next()

    const duration = Math.round(performance.now() - start)
    const ip = getClientIp(ctx)
    const { method, url, status } = ctx
    const traceId = ctx.state.traceId ?? '-'
    const contentLength = ctx.response.length ?? 0

    console.log(
        `[${new Date().toISOString()}] ${ip} ${method} ${url} ${status} ${contentLength}b ${duration}ms | traceId=${traceId}`
    )
}
