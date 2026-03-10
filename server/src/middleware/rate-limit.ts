import type { Middleware } from 'koa'
import { AppException } from '../exception/app-exception'
import { ErrorCode } from '../exception/error-code'
import { getClientIp } from '../utils/client-ip'

interface RateLimitOptions {
    /** 时间窗口（毫秒），默认 60_000（1 分钟） */
    windowMs?: number
    /** 窗口内允许的最大请求数，默认 60 */
    max?: number
}

interface TokenBucket {
    tokens: number
    lastRefill: number
}

/**
 * 基于令牌桶的请求限流中间件
 *
 * 每个 IP 独立维护一个令牌桶，按时间窗口匀速补充令牌。
 * 超出限制返回 429 并附带 Retry-After 头。
 */
export function createRateLimitMiddleware(
    options: RateLimitOptions = {}
): Middleware {
    const { windowMs = 60_000, max = 60 } = options
    const buckets = new Map<string, TokenBucket>()
    const refillRate = max / windowMs

    const CLEANUP_INTERVAL = windowMs * 5
    setInterval(() => {
        const now = Date.now()
        for (const [ip, bucket] of buckets) {
            if (now - bucket.lastRefill > windowMs * 2) {
                buckets.delete(ip)
            }
        }
    }, CLEANUP_INTERVAL).unref()

    return async (ctx, next) => {
        const ip = getClientIp(ctx)
        const now = Date.now()

        let bucket = buckets.get(ip)
        if (!bucket) {
            bucket = { tokens: max, lastRefill: now }
            buckets.set(ip, bucket)
        }

        const elapsed = now - bucket.lastRefill
        bucket.tokens = Math.min(max, bucket.tokens + elapsed * refillRate)
        bucket.lastRefill = now

        if (bucket.tokens < 1) {
            const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate / 1000)
            ctx.set('Retry-After', String(retryAfter))
            throw new AppException({
                errorCode: ErrorCode.RATE_LIMITED,
                message: '请求过于频繁，请稍后再试',
                httpStatus: 429,
            })
        }

        bucket.tokens -= 1
        ctx.set('X-RateLimit-Limit', String(max))
        ctx.set('X-RateLimit-Remaining', String(Math.floor(bucket.tokens)))

        await next()
    }
}
