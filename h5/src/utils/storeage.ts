import { isString } from './check-type'

/**
 * 本地存储工具
 */

/**
 * 获取本地存储
 */
export function getStorage<T>(key: string): T | null {
    const value = localStorage.getItem(key)
    if (!value) return null
    try {
        return JSON.parse(value) as T
    } catch {
        return value as T
    }
}

/**
 * 设置本地存储
 */
export function setStorage<T>(key: string, value: T): void {
    if (isString(value)) {
        localStorage.setItem(key, value)
        return
    }
    localStorage.setItem(key, JSON.stringify(value))
}

/**
 * 删除本地存储
 */
export function removeStorage(key: string): void {
    localStorage.removeItem(key)
}

/**
 * 清空本地存储
 */
export function clearStorage(): void {
    localStorage.clear()
}
