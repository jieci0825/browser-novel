import type { Middleware } from 'koa'
import { AppException } from '../exception/app-exception'
import { ErrorCode } from '../exception/error-code'
import { getTraceId } from '../utils/response'

export const exceptionMiddleware: Middleware = async (ctx, next) => {
    try {
        await next()
    } catch (error) {
        const traceId = getTraceId(ctx)
        const isKnownException = error instanceof AppException
        const appException = isKnownException
            ? error
            : new AppException({
                  errorCode: ErrorCode.INTERNAL_EXCEPTION,
                  message: '服务器内部错误',
                  httpStatus: 500,
                  details: error,
              })

        const logPayload = {
            traceId,
            method: ctx.method,
            path: ctx.path,
            status: appException.httpStatus,
            errorCode: appException.errorCode,
            message: appException.message,
            details: appException.details,
        }

        if (isKnownException) {
            console.warn('[EXCEPTION]', logPayload)
        } else {
            console.error('[EXCEPTION]', logPayload, error)
        }

        ctx.status = appException.httpStatus
        ctx.failure(appException.errorCode, appException.message)
    }
}
