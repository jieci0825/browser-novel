import 'koa'

declare module 'koa' {
    interface DefaultState {
        traceId?: string
        forceRefresh?: boolean
    }

    interface DefaultContext {
        success<T>(data: T, message?: string): void
        failure(errorCode: number, message: string): void
    }
}

export {}
