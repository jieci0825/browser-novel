import type { Middleware } from 'koa'

/**
 * 统一包装路由处理器，方便未来在一个切面中增加埋点、耗时统计等能力
 */
export function withHandler(handler: Middleware): Middleware {
    return async (ctx, next) => {
        await handler(ctx, next)
    }
}
