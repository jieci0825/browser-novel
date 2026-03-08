import { ErrorCode } from './error-code'

export class AppException extends Error {
    readonly errorCode: ErrorCode | number
    readonly httpStatus: number
    readonly details?: unknown

    constructor(options: {
        errorCode: ErrorCode | number
        message: string
        httpStatus?: number
        details?: unknown
    }) {
        super(options.message)
        this.name = this.constructor.name
        this.errorCode = options.errorCode
        this.httpStatus = options.httpStatus ?? 500
        this.details = options.details
    }
}

export class ValidationException extends AppException {
    constructor(message: string, details?: unknown) {
        super({
            errorCode: ErrorCode.INVALID_PARAMS,
            message,
            httpStatus: 400,
            details,
        })
    }
}

export class SourceNotFoundException extends AppException {
    constructor(sourceId: string) {
        super({
            errorCode: ErrorCode.SOURCE_NOT_FOUND,
            message: `书源 "${sourceId}" 不存在`,
            httpStatus: 404,
            details: { sourceId },
        })
    }
}

export class SourceUnavailableException extends AppException {
    constructor(
        sourceId: string,
        message = '书源服务不可用',
        details?: unknown
    ) {
        super({
            errorCode: ErrorCode.SOURCE_UNAVAILABLE,
            message,
            httpStatus: 502,
            details: { sourceId, details },
        })
    }
}

export class SourceTimeoutException extends AppException {
    constructor(sourceId: string, timeoutMs: number, details?: unknown) {
        super({
            errorCode: ErrorCode.SOURCE_TIMEOUT,
            message: `书源 "${sourceId}" 请求超时`,
            httpStatus: 504,
            details: { sourceId, timeoutMs, details },
        })
    }
}
