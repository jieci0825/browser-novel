import type { PageAnimation, FlipDirection } from '../types/reader'

const TRANSITION_DURATION = 300
const SHADOW = '0 0 16px rgba(0, 0, 0, 0.3)'

/**
 * 覆盖动画 —— 向后翻时新页面从右侧滑入覆盖旧页面，
 * 向前翻时当前页向右滑出露出下方页面
 */
export function createCoverAnimation(): PageAnimation {
    let direction: FlipDirection | null = null
    let prevEl: HTMLElement | null = null
    let currentEl: HTMLElement | null = null
    let nextEl: HTMLElement | null = null
    /** 位于上层做滑动的元素 */
    let movingEl: HTMLElement | null = null
    /** 位于下层保持不动的元素 */
    let staticEl: HTMLElement | null = null
    let pageWidth = 0

    function applyTransform(el: HTMLElement, x: number) {
        el.style.transform = `translateX(${x}px)`
    }

    function setTransition(el: HTMLElement, enabled: boolean) {
        el.style.transition = enabled
            ? `transform ${TRANSITION_DURATION}ms ease-out`
            : ''
    }

    function showElement(el: HTMLElement) {
        el.style.visibility = 'visible'
        el.style.pointerEvents = ''
    }

    function hideElement(el: HTMLElement) {
        el.style.visibility = 'hidden'
        el.style.pointerEvents = 'none'
    }

    function clearStyles(el: HTMLElement) {
        el.style.transform = ''
        el.style.transition = ''
        el.style.zIndex = ''
        el.style.boxShadow = ''
    }

    function waitTransitionEnd(el: HTMLElement): Promise<void> {
        return new Promise(resolve => {
            let settled = false

            const fallbackTimer = setTimeout(() => {
                if (settled) return
                settled = true
                el.removeEventListener('transitionend', onEnd)
                resolve()
            }, TRANSITION_DURATION + 50)

            function onEnd(e: TransitionEvent) {
                if (e.target !== el || e.propertyName !== 'transform') return
                if (settled) return
                settled = true
                clearTimeout(fallbackTimer)
                el.removeEventListener('transitionend', onEnd)
                resolve()
            }

            el.addEventListener('transitionend', onEnd)
        })
    }

    return {
        start(dir, prev, current, next) {
            direction = dir
            prevEl = prev
            currentEl = current
            nextEl = next
            pageWidth = current.offsetWidth

            if (direction === 'next') {
                movingEl = nextEl
                staticEl = currentEl

                if (movingEl) {
                    setTransition(movingEl, false)
                    applyTransform(movingEl, pageWidth)
                    movingEl.style.zIndex = '2'
                    movingEl.style.boxShadow = SHADOW
                    showElement(movingEl)
                }
            } else {
                movingEl = currentEl
                staticEl = prevEl

                if (staticEl) {
                    setTransition(staticEl, false)
                    applyTransform(staticEl, 0)
                    staticEl.style.zIndex = '1'
                    showElement(staticEl)
                }

                if (movingEl) {
                    setTransition(movingEl, false)
                    applyTransform(movingEl, 0)
                    movingEl.style.zIndex = '2'
                    movingEl.style.boxShadow = SHADOW
                }
            }
        },

        update(offsetX) {
            if (!movingEl) return

            if (direction === 'next') {
                const x = Math.max(pageWidth + offsetX, 0)
                applyTransform(movingEl, x)
            } else {
                const x = Math.max(offsetX, 0)
                applyTransform(movingEl, x)
            }
        },

        async finish(completed) {
            if (!movingEl) {
                direction = null
                prevEl = null
                currentEl = null
                nextEl = null
                movingEl = null
                staticEl = null
                return
            }

            setTransition(movingEl, true)

            if (completed) {
                if (direction === 'next') {
                    applyTransform(movingEl, 0)
                } else {
                    applyTransform(movingEl, pageWidth)
                }
            } else {
                if (direction === 'next') {
                    applyTransform(movingEl, pageWidth)
                } else {
                    applyTransform(movingEl, 0)
                }
            }

            await waitTransitionEnd(movingEl)

            if (completed) {
                if (direction === 'next') {
                    if (currentEl) hideElement(currentEl)
                } else {
                    if (currentEl) hideElement(currentEl)
                }
            } else {
                if (direction === 'next') {
                    if (nextEl) hideElement(nextEl)
                } else {
                    if (prevEl) hideElement(prevEl)
                }
            }

            if (prevEl) clearStyles(prevEl)
            if (currentEl) clearStyles(currentEl)
            if (nextEl) clearStyles(nextEl)

            direction = null
            prevEl = null
            currentEl = null
            nextEl = null
            movingEl = null
            staticEl = null
        },

        destroy() {
            if (prevEl) clearStyles(prevEl)
            if (currentEl) clearStyles(currentEl)
            if (nextEl) clearStyles(nextEl)
            if (movingEl) hideElement(movingEl)

            direction = null
            prevEl = null
            currentEl = null
            nextEl = null
            movingEl = null
            staticEl = null
        },
    }
}
