import {
    AppException,
    SourceTimeoutException,
    SourceUnavailableException,
} from '../exception/app-exception'
import type { BookSourceAdapter } from './types'

type AdapterMethod = keyof Pick<
    BookSourceAdapter,
    'search' | 'getDetail' | 'getChapters' | 'getContent'
>

const DEFAULT_TIMEOUT_MS = 20000
const ADAPTER_METHODS: AdapterMethod[] = [
    'search',
    'getDetail',
    'getChapters',
    'getContent',
]

function withTimeout<T>(
    promise: Promise<T>,
    sourceId: string,
    timeoutMs: number
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new SourceTimeoutException(sourceId, timeoutMs))
        }, timeoutMs)

        promise
            .then(result => {
                clearTimeout(timer)
                resolve(result)
            })
            .catch(error => {
                clearTimeout(timer)
                reject(error)
            })
    })
}

function mapAdapterException(sourceId: string, error: unknown): AppException {
    if (error instanceof AppException) {
        return error
    }

    const message = error instanceof Error ? error.message : '书源请求失败'
    return new SourceUnavailableException(sourceId, message, error)
}

/**
 * 为书源适配器添加异常处理和超时处理
 */
export function withAdapterExceptionAspect(
    adapter: BookSourceAdapter,
    timeoutMs = DEFAULT_TIMEOUT_MS
): BookSourceAdapter {
    return new Proxy(adapter, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver)

            // 如果方法不是字符串或不是函数或不是适配器方法，则直接返回方法
            if (
                typeof prop !== 'string' ||
                typeof value !== 'function' ||
                !ADAPTER_METHODS.includes(prop as AdapterMethod)
            ) {
                return value
            }

            // 如果方法是通过反射获取的，则直接返回方法
            return async (...args: unknown[]) => {
                try {
                    const result = value.apply(target, args) as Promise<unknown>
                    return await withTimeout(result, target.sourceId, timeoutMs)
                } catch (error) {
                    throw mapAdapterException(target.sourceId, error)
                }
            }
        },
    })
}
