import { ref, watch, onUnmounted } from 'vue'
import { readSettings } from '../config/read-settings'
import type {
    PageAnimation,
    FlipDirection,
    AnimationType,
} from '../types/reader'
import { createSlideAnimation } from '../animations/slide-animation'
import { createCoverAnimation } from '../animations/cover-animation'
import { createNoneAnimation } from '../animations/none-animation'

function createAnimationByType(type: AnimationType): PageAnimation {
    switch (type) {
        case 'slide':
            return createSlideAnimation()
        case 'cover':
            return createCoverAnimation()
        case 'none':
            return createNoneAnimation()
    }
}

/** 动画调度器 —— 根据当前设置选择动画实例，统一管理动画生命周期与锁定状态 */
export function usePageAnimation() {
    let animation = createAnimationByType(readSettings.animationType)
    const isAnimating = ref(false)

    watch(
        () => readSettings.animationType,
        newType => {
            animation.destroy()
            isAnimating.value = false
            animation = createAnimationByType(newType)
        }
    )

    /** 开始动画，若当前有动画进行中则返回 false 表示被拒绝 */
    function startAnimation(
        direction: FlipDirection,
        prevEl: HTMLElement,
        currentEl: HTMLElement,
        nextEl: HTMLElement
    ): boolean {
        if (isAnimating.value) return false
        isAnimating.value = true
        animation.start(direction, prevEl, currentEl, nextEl)
        void currentEl.offsetHeight
        return true
    }

    /** 跟手更新动画位移 */
    function updateAnimation(offsetX: number) {
        if (!isAnimating.value) return
        animation.update(offsetX)
    }

    /** 完成或回弹动画，返回是否真正完成了翻页 */
    async function finishAnimation(completed: boolean): Promise<boolean> {
        if (!isAnimating.value) return false
        await animation.finish(completed)
        isAnimating.value = false
        return completed
    }

    onUnmounted(() => {
        animation.destroy()
    })

    return {
        isAnimating,
        startAnimation,
        updateAnimation,
        finishAnimation,
    }
}
