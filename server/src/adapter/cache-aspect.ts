import type { BookSourceAdapter } from './types'
import type { CacheService } from '../cache/cache-service'
import { getRequestContext } from '../middleware/request-context'

const CACHED_METHODS = ['getDetail', 'getChapters', 'getContent']

const KEY_BUILDERS: Record<
    string,
    (sourceId: string, args: unknown[]) => string
> = {
    // args 可以固定索引取值，是因为这些函数的参数签名是固定的，来自 BookSourceAdapter 接口
    getDetail: (sid, args) => `detail:${sid}:${args[0]}`, // args[0] 就是 bookId
    getChapters: (sid, args) => `chapters:${sid}:${args[0]}`, // args[0] 就是 bookId
    getContent: (sid, args) => `content:${sid}:${args[0]}:${args[1]}`, // args[0] 就是 bookId，args[1] 就是 chapterId
}

/**
 * 为书源适配器添加持久化缓存
 *
 * 缓存行为：
 * - 仅缓存 getDetail / getChapters / getContent，搜索不缓存
 * - 请求携带 ?refresh=true 时跳过缓存读取，重新请求并更新缓存
 * - 刷新失败时旧缓存不会被清除
 */
export function withAdapterCacheAspect(
    adapter: BookSourceAdapter,
    cache: CacheService
): BookSourceAdapter {
    return new Proxy(adapter, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver)

            if (!CACHED_METHODS.includes(prop as string)) {
                return value
            }

            return async (...args: unknown[]) => {
                // 固定第一个参数为 sourceId，后面的 args 这些参数，在路由的调用中，会传入，这里直接全部接收传递下去
                const key = KEY_BUILDERS[prop as string](target.sourceId, args)
                const forceRefresh = getRequestContext()?.forceRefresh ?? false

                if (!forceRefresh) {
                    const cached = cache.get(key)
                    if (cached !== null) return cached
                }

                const result = await (value as Function).apply(target, args)
                cache.set(key, result)
                return result
            }
        },
    })
}
