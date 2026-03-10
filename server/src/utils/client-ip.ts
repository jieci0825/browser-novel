import type { Context } from 'koa'

export function getClientIp(ctx: Context): string {
    const forwarded = ctx.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return ctx.ip || '-'
}
