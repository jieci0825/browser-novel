import type { PageAnimation, FlipDirection } from '../types/reader'

/** 无动画 —— 翻页时直接切换可见性，不做任何过渡 */
export function createNoneAnimation(): PageAnimation {
    let direction: FlipDirection | null = null
    let prevEl: HTMLElement | null = null
    let currentEl: HTMLElement | null = null
    let nextEl: HTMLElement | null = null

    function showElement(el: HTMLElement) {
        el.style.visibility = 'visible'
        el.style.pointerEvents = ''
    }

    function hideElement(el: HTMLElement) {
        el.style.visibility = 'hidden'
        el.style.pointerEvents = 'none'
    }

    return {
        start(dir, prev, current, next) {
            direction = dir
            prevEl = prev
            currentEl = current
            nextEl = next
        },

        update() {},

        finish(completed) {
            if (completed && currentEl) {
                const targetEl = direction === 'next' ? nextEl : prevEl
                if (targetEl) {
                    hideElement(currentEl)
                    showElement(targetEl)
                }
            }

            direction = null
            prevEl = null
            currentEl = null
            nextEl = null

            return Promise.resolve()
        },

        destroy() {
            direction = null
            prevEl = null
            currentEl = null
            nextEl = null
        },
    }
}
