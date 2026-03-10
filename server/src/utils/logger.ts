import log4js from 'log4js'
import path from 'node:path'

const LOG_DIR = path.resolve(__dirname, '../../logs')
const LOG_RETAIN_DAYS = 90

log4js.configure({
    appenders: {
        console: {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%c]%] %m',
            },
        },
        appFile: {
            type: 'dateFile',
            filename: path.join(LOG_DIR, 'app.log'),
            pattern: 'yyyy-MM-dd',
            keepFileExt: true,
            numBackups: LOG_RETAIN_DAYS,
        },
        accessFile: {
            type: 'dateFile',
            filename: path.join(LOG_DIR, 'access.log'),
            pattern: 'yyyy-MM-dd',
            keepFileExt: true,
            numBackups: LOG_RETAIN_DAYS,
        },
        errorFile: {
            type: 'dateFile',
            filename: path.join(LOG_DIR, 'error.log'),
            pattern: 'yyyy-MM-dd',
            keepFileExt: true,
            numBackups: LOG_RETAIN_DAYS,
            layout: {
                type: 'pattern',
                pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%c] %m',
            },
        },
        errorFilter: {
            type: 'logLevelFilter',
            appender: 'errorFile',
            level: 'warn',
        },
    },
    categories: {
        default: {
            appenders: ['console', 'appFile', 'errorFilter'],
            level: 'info',
        },
        access: {
            appenders: ['console', 'accessFile'],
            level: 'info',
        },
        exception: {
            appenders: ['console', 'appFile', 'errorFilter'],
            level: 'info',
        },
    },
})

export const logger = log4js.getLogger()
export const accessLogger = log4js.getLogger('access')
export const exceptionLogger = log4js.getLogger('exception')

/**
 * 关闭日志服务记录器
 */
export function shutdownLogger(): Promise<void> {
    return new Promise(resolve => log4js.shutdown(resolve as any))
}
