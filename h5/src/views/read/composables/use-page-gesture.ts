import { watch, onUnmounted, type Ref } from 'vue'

export type GestureDirection = 'prev' | 'next'

export type TapZone = 'prev' | 'next' | 'toggle-toolbar'

export interface PageGestureCallbacks {
    /** 点击区域回调 */
    onTap?: (zone: TapZone) => void
    /** 滑动翻页回调（水平距离超过阈值时触发） */
    onSwipe?: (direction: GestureDirection) => void
    /** 拖拽开始回调（首次锁定为水平方向时触发） */
    onDragStart?: (direction: GestureDirection) => void
    /** 拖拽中的实时水平位移回调（供动画跟手使用） */
    onDragging?: (offsetX: number) => void
    /** 拖拽结束回调，携带最终位移、速度和方向（供动画判定完成或回弹） */
    onDragEnd?: (info: {
        offsetX: number
        velocity: number
        direction: GestureDirection
    }) => void
}

const SWIPE_THRESHOLD = 30
const DIRECTION_LOCK_THRESHOLD = 10

/** 识别翻页手势和点击区域，输出翻页意图，不直接操作 DOM 或动画 */
export function usePageGesture(
    container: Ref<HTMLElement | null>,
    callbacks: PageGestureCallbacks = {}
) {
    let startX = 0
    let startY = 0
    let startTime = 0
    let isDragging = false
    let isDirectionLocked = false

    function handleTouchStart(e: TouchEvent) {
        const touch = e.touches[0]!
        startX = touch.clientX
        startY = touch.clientY
        startTime = Date.now()
        isDragging = false
        isDirectionLocked = false
    }

    function handleTouchMove(e: TouchEvent) {
        const touch = e.touches[0]!
        const deltaX = touch.clientX - startX
        const deltaY = touch.clientY - startY
        const absDeltaX = Math.abs(deltaX)
        const absDeltaY = Math.abs(deltaY)

        if (!isDirectionLocked) {
            if (
                absDeltaX < DIRECTION_LOCK_THRESHOLD &&
                absDeltaY < DIRECTION_LOCK_THRESHOLD
            ) {
                return
            }
            isDirectionLocked = true
            isDragging = absDeltaX > absDeltaY

            if (isDragging) {
                const direction: GestureDirection =
                    deltaX > 0 ? 'prev' : 'next'
                callbacks.onDragStart?.(direction)
            }
        }

        if (!isDragging) return

        e.preventDefault()
        callbacks.onDragging?.(deltaX)
    }

    function handleTouchEnd(e: TouchEvent) {
        const touch = e.changedTouches[0]!
        const deltaX = touch.clientX - startX
        const deltaY = touch.clientY - startY
        const absDeltaX = Math.abs(deltaX)
        const absDeltaY = Math.abs(deltaY)
        const elapsed = Date.now() - startTime

        if (isDragging) {
            const velocity = absDeltaX / Math.max(elapsed, 1)
            const direction: GestureDirection = deltaX > 0 ? 'prev' : 'next'

            callbacks.onDragEnd?.({ offsetX: deltaX, velocity, direction })

            if (absDeltaX > SWIPE_THRESHOLD && absDeltaX > absDeltaY) {
                callbacks.onSwipe?.(direction)
            }
        } else if (absDeltaX < SWIPE_THRESHOLD && absDeltaY < SWIPE_THRESHOLD) {
            determineTapZone(touch)
        }

        isDragging = false
        isDirectionLocked = false
    }

    function handleTouchCancel() {
        isDragging = false
        isDirectionLocked = false
    }

    function determineTapZone(touch: Touch) {
        const el = container.value
        if (!el) return

        const rect = el.getBoundingClientRect()
        const tapX = touch.clientX - rect.left
        const third = rect.width / 3

        let zone: TapZone
        if (tapX < third) {
            zone = 'prev'
        } else if (tapX > third * 2) {
            zone = 'next'
        } else {
            zone = 'toggle-toolbar'
        }

        callbacks.onTap?.(zone)
    }

    function bindEvents(el: HTMLElement) {
        el.addEventListener('touchstart', handleTouchStart, { passive: true })
        el.addEventListener('touchmove', handleTouchMove, { passive: false })
        el.addEventListener('touchend', handleTouchEnd, { passive: true })
        el.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    }

    function unbindEvents(el: HTMLElement) {
        el.removeEventListener('touchstart', handleTouchStart)
        el.removeEventListener('touchmove', handleTouchMove)
        el.removeEventListener('touchend', handleTouchEnd)
        el.removeEventListener('touchcancel', handleTouchCancel)
    }

    let boundEl: HTMLElement | null = null

    watch(
        container,
        (newEl, oldEl) => {
            if (oldEl) unbindEvents(oldEl)
            if (newEl) bindEvents(newEl)
            boundEl = newEl
        },
        { immediate: true }
    )

    onUnmounted(() => {
        if (boundEl) unbindEvents(boundEl)
        boundEl = null
    })
}
