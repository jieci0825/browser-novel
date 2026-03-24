import { onMounted, onUnmounted, type Ref } from 'vue'

export type TapZone = 'left' | 'center' | 'right'
export type SwipeDirection = 'left' | 'right'

export interface SwipeMoveDetail {
    deltaX: number
    deltaY: number
    velocityX: number
}

export interface TouchGestureOptions {
    target: Ref<HTMLElement | undefined>
    tapThresholdTime?: number
    tapThresholdDistance?: number
    swipeThresholdDistance?: number
    leftZoneRatio?: number
    rightZoneRatio?: number
    onTap?: (zone: TapZone) => void
    onSwipe?: (direction: SwipeDirection) => void
    onSwipeStart?: (startX: number, startY: number) => void
    onSwipeMove?: (detail: SwipeMoveDetail) => void
    onSwipeEnd?: (direction: SwipeDirection | null, cancelled: boolean) => void
}

const DEFAULT_TAP_TIME = 300
const DEFAULT_TAP_DISTANCE = 10
const DEFAULT_SWIPE_DISTANCE = 50
const DEFAULT_LEFT_RATIO = 0.3
const DEFAULT_RIGHT_RATIO = 0.7
const VELOCITY_THRESHOLD = 0.3
const VELOCITY_STALE_MS = 100

export function useTouchGesture(options: TouchGestureOptions) {
    const {
        target,
        tapThresholdTime = DEFAULT_TAP_TIME,
        tapThresholdDistance = DEFAULT_TAP_DISTANCE,
        swipeThresholdDistance = DEFAULT_SWIPE_DISTANCE,
        leftZoneRatio = DEFAULT_LEFT_RATIO,
        rightZoneRatio = DEFAULT_RIGHT_RATIO,
        onTap,
        onSwipe,
        onSwipeStart,
        onSwipeMove,
        onSwipeEnd,
    } = options

    let startX = 0
    let startY = 0
    let startTime = 0
    let tracking = false
    let swiping = false
    let lastMoveTime = 0
    let lastMoveX = 0
    let lastVelocityX = 0

    function handleTouchStart(e: TouchEvent) {
        const touch = e.touches[0]!
        startX = touch.clientX
        startY = touch.clientY
        startTime = Date.now()
        tracking = true
        swiping = false
        lastMoveTime = startTime
        lastMoveX = startX
        lastVelocityX = 0
    }

    function handleTouchMove(e: TouchEvent) {
        if (!tracking) return

        const touch = e.touches[0]!
        const deltaX = touch.clientX - startX
        const deltaY = touch.clientY - startY

        if (!swiping) {
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                tracking = false
                return
            }
            if (Math.abs(deltaX) > tapThresholdDistance) {
                swiping = true
                onSwipeStart?.(startX, startY)
            }
        }

        if (swiping) {
            e.preventDefault()
            const now = Date.now()
            const dt = now - lastMoveTime || 1
            const velocityX = (touch.clientX - lastMoveX) / dt

            lastMoveTime = now
            lastMoveX = touch.clientX
            lastVelocityX = velocityX

            onSwipeMove?.({ deltaX, deltaY, velocityX })
        }
    }

    function handleTouchEnd(e: TouchEvent) {
        if (!tracking) return
        tracking = false

        const touch = e.changedTouches[0]!
        const deltaX = touch.clientX - startX
        const deltaY = touch.clientY - startY
        const elapsed = Date.now() - startTime
        const absDx = Math.abs(deltaX)
        const absDy = Math.abs(deltaY)

        if (swiping) {
            const timeSinceLastMove = Date.now() - lastMoveTime
            const recentVelocity =
                timeSinceLastMove < VELOCITY_STALE_MS ? lastVelocityX : 0

            const isDistanceSwipe = absDx >= swipeThresholdDistance
            const isVelocitySwipe =
                Math.abs(recentVelocity) > VELOCITY_THRESHOLD &&
                absDx > tapThresholdDistance

            if (isDistanceSwipe || isVelocitySwipe) {
                const direction: SwipeDirection =
                    deltaX < 0 ? 'left' : 'right'
                onSwipe?.(direction)
                onSwipeEnd?.(direction, false)
            } else {
                onSwipeEnd?.(null, true)
            }
            return
        }

        if (
            elapsed < tapThresholdTime &&
            absDx < tapThresholdDistance &&
            absDy < tapThresholdDistance
        ) {
            const x = touch.clientX
            const w = window.innerWidth
            let zone: TapZone
            if (x < w * leftZoneRatio) {
                zone = 'left'
            } else if (x > w * rightZoneRatio) {
                zone = 'right'
            } else {
                zone = 'center'
            }
            onTap?.(zone)
        }
    }

    function handleTouchCancel() {
        if (!tracking) return
        tracking = false
        if (swiping) {
            onSwipeEnd?.(null, true)
        }
    }

    onMounted(() => {
        const el = target.value
        if (!el) return
        el.addEventListener('touchstart', handleTouchStart, { passive: true })
        el.addEventListener('touchmove', handleTouchMove, { passive: false })
        el.addEventListener('touchend', handleTouchEnd, { passive: true })
        el.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    })

    onUnmounted(() => {
        const el = target.value
        if (!el) return
        el.removeEventListener('touchstart', handleTouchStart)
        el.removeEventListener('touchmove', handleTouchMove)
        el.removeEventListener('touchend', handleTouchEnd)
        el.removeEventListener('touchcancel', handleTouchCancel)
    })
}
