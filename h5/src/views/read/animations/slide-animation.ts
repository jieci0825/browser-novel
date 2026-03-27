import type { PageAnimation, FlipDirection } from '../types/reader'

const TRANSITION_DURATION = 300

/** 平移动画 —— 当前页与目标页同步水平滑动 */
export function createSlideAnimation(): PageAnimation {
    let direction: FlipDirection | null = null
    let prevEl: HTMLElement | null = null
    let currentEl: HTMLElement | null = null
    let nextEl: HTMLElement | null = null
    let targetEl: HTMLElement | null = null
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
            targetEl = direction === 'next' ? nextEl : prevEl
            pageWidth = current.offsetWidth

            if (targetEl) {
                const initialX = direction === 'next' ? pageWidth : -pageWidth
                setTransition(targetEl, false)
                applyTransform(targetEl, initialX)
                showElement(targetEl)
            }

            if (currentEl) {
                setTransition(currentEl, false)
                applyTransform(currentEl, 0)
            }
        },

        update(offsetX) {
            if (!currentEl || !targetEl) return

            applyTransform(currentEl, offsetX)

            const targetBaseX = direction === 'next' ? pageWidth : -pageWidth
            applyTransform(targetEl, targetBaseX + offsetX)
        },

        async finish(completed) {
            if (!currentEl || !targetEl) {
                direction = null
                prevEl = null
                currentEl = null
                nextEl = null
                targetEl = null
                return
            }

            setTransition(currentEl, true)
            setTransition(targetEl, true)

            if (completed) {
                const currentEndX = direction === 'next' ? -pageWidth : pageWidth
                applyTransform(currentEl, currentEndX)
                applyTransform(targetEl, 0)
            } else {
                const targetBaseX = direction === 'next' ? pageWidth : -pageWidth
                applyTransform(currentEl, 0)
                applyTransform(targetEl, targetBaseX)
            }

            await waitTransitionEnd(currentEl)

            if (completed) {
                hideElement(currentEl)
                clearStyles(currentEl)
                clearStyles(targetEl)
            } else {
                hideElement(targetEl)
                clearStyles(currentEl)
                clearStyles(targetEl)
            }

            direction = null
            prevEl = null
            currentEl = null
            nextEl = null
            targetEl = null
        },

        destroy() {
            if (currentEl) clearStyles(currentEl)
            if (targetEl) {
                clearStyles(targetEl)
                hideElement(targetEl)
            }
            direction = null
            prevEl = null
            currentEl = null
            nextEl = null
            targetEl = null
        },
    }
}
