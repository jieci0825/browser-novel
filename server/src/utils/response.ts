import type { Context } from 'koa'

export interface ApiResponse<T> {
    errorCode: number
    message: string
    traceId: string
    data: T | null
}

export function getTraceId(ctx: Context): string {
    return ctx.state.traceId || ''
}

export function successResponse<T>(ctx: Context, data: T, message = 'ok'): ApiResponse<T> {
    return {
        errorCode: 0,
        message,
        traceId: getTraceId(ctx),
        data,
    }
}

export function failureResponse(
    ctx: Context,
    errorCode: number,
    message: string
): ApiResponse<null> {
    return {
        errorCode,
        message,
        traceId: getTraceId(ctx),
        data: null,
    }
}
