import type { Middleware } from 'koa'
import { failureResponse, successResponse } from '../utils/response'

export const responseMiddleware: Middleware = async (ctx, next) => {
    ctx.success = <T>(data: T, message = 'ok') => {
        ctx.body = successResponse(ctx, data, message)
    }

    ctx.failure = (errorCode: number, message: string) => {
        ctx.body = failureResponse(ctx, errorCode, message)
    }

    await next()
}
