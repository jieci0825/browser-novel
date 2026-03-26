<script setup lang="ts">
import type { ChapterContent } from '@/api/types/book.type'
import AppButton from '@/components/app-button/index.vue'

defineProps<{
    content: ChapterContent | null
    loading: boolean
    error: string
}>()

defineEmits<{
    retry: []
    click: []
}>()

const _c = [
    '第2章 猎龙旗，掠夺者城市',
    '"仓库还有多少食物？"姜知序问道。',
    '戚鸿朗原本就是管后勤的，对库存数据了如指掌，立刻回答："只够三百人，吃一个月。"',
    '姜知序深吸一口气。',
    '怪不得旧城主想饿死一批人，原来食物储备已经见底了！',
    '"简直是蠢货！"',
    '废土之上，食物难得，很多普通幸存者为了食物对亲人倒戈相向。',
    '但对于移动城市来说，食物完全不会、也不应该成为限制移动城市人口的桎梏，人口才是最宝贵的资源！',
    '因为只要有农田，投入资源就能稳定产出食物，完全足够将城市人口拉满。',
    '"那个老混蛋，本身就病得快死了。"戚鸿朗在旁边讲出内情，"所以他才彻底放弃了城市发展，只想刮干净所有油水，享受最后的快乐日子。"',
    '"嗯，我知道了。"姜知序点了点头，"你先下去，把城内秩序稳住。另外，让会开城的兄弟去接管驾驶室，我们在这里停得太久了。"',
    '"是！"',
    '戚鸿朗转身快步离去。',
    '姜知序看了他一眼，开始思考今天的暴击机会应该用在什么地方。',
    '食物是亟待解决的问题，但他尝试过，暴击天赋无法作用于"单位"，只能选择单个物品，即使打包也不行。',
    '看来，只能想办法把所有粮食重新加工成一个巨大的单体……',
    '是麻烦了点，但至少能解燃眉之急！',
    '正当他思索的时候，城主房间的门被急促敲响，门外传来刚离开不久的戚鸿朗焦急的声音：',
    '"城主，城主，有急事！！"',
    '姜知序抬头看向门口，朗声道："进。"',
    '戚鸿朗几乎是撞了进来，他气喘吁吁，急忙说道："城主，了望塔汇报，五公里外有一座移动城市正高速朝我们冲过来！"',
    '姜知序一愣，下意识站了起来："路过的？"',
    '"不是！"戚鸿朗用力摇头，"他们挂着猎龙旗，目标明确，就是我们！"',
    '姜知序的心头猛地一沉。',
    '猎龙旗，掠夺者移动城市的专属旗帜，悬挂期间能提供5%的资源缴获量。',
    '挂上这面旗的，无一例外，全都是以猎杀其他移动城市为生的鬣狗！',
    '"别慌，我们去看看！"',
    '姜知序面色沉着地说。',
    '其实他也有点慌，但毕竟现在是城主，必须稳住手下的信心。',
    '戚鸿朗看到他镇定的样子，果然像是找到了主心骨，焦急的情绪平复不少。',
    '"我给您带路！"他立刻走在前面。',
    '一路上，姜知序遇到不少起义的同志，他们身上还带着伤，他都用冷静的微笑点头示意。',
    '另一部分眼神忐忑的普通居民，因为不清楚新城主的脾性，不敢靠近。',
    '不过姜知序还是跟他们打了招呼，迅速安抚了几句。',
    '来到了望塔，这里值岗的人已经换成了跟随姜知序起义的兄弟。',
    '青年见到姜知序，兴奋地喊道："姜哥！"',
    '戚鸿朗连忙纠正他，"工作期间称植物！"',
    '青年听话地改口："城主！"',
    '随即他想起什么，脸色一白，"城主，几公里外——"',
    '"我已经知道了，别怕，不会有事的。"',
    '姜知序走到望远镜前，望向远方。',
    '天边尽头，烟尘弥漫。',
    '一个庞大的黑影在尘土中若隐若现，仿佛一头即将冲破天际的凶兽。',
    '某一瞬间，它的轮廓清晰了一刹那，最顶端那面血红色的猎龙旗，正对着他们的方向张狂飘扬。',
    '青年紧张地在旁边讲解，"对方也是一级城市，但是，但是有六个炮口，其中一个炮口还闪着白光，肯定是装备了一级大炮！"',
    '相比之下，「深蓝号」只有四台普通大炮，战力根本不是一个级别。',
    '"我知道了！"',
    '戚鸿朗忽然出声。',
    '见姜知序看过来，他恶狠狠地说："是陈亮那个老东西，他临死前把深蓝号的位置广播出去了！"',
    '陈亮就是深蓝号的前任城主。',
    '姜知序对此没有任何意外，换作是他，临死前肯定也要拖个垫背的。',
    '这时，又一个坏消息从旁边青年嘴里说了出来："城主，刚刚有兄弟去检查了弹药舱，我们只剩下两发炮弹了！"',
    '陈亮死前醉生梦死，根本没想过寻找资源，整个深蓝号就是一个烂摊子。',
    '戚鸿朗脸色难看："恐怕只能跑了。"',
    '他说着看向姜知序，等待他的指示。',
    '姜知序沉吟两秒，问戚鸿朗，"我们有没有熟练级炮手？"',
    '戚鸿朗立刻回答："有一个，另一个只是见习，按他的天赋，想升到熟练级至少还得打五六十发炮弹。"',
    '他下意识以为姜知序是想靠着剩下的两发炮弹打退敌人。',
    '如果两发炮弹全部命中，确实可能打退对方。',
    '但问题在于，即使两人都是熟练炮手，也很难在双方都以四十公里时速移动的前提下命中敌人的城市！',
    '开炮的火光非常显眼，敌方操舵手只要提前进行战术规避，两发炮弹击中的可能性极低！',
    '姜知序看着望远镜中的城市，眼睛一眯，放下望远镜说道：',
    '"两个炮手应该够了，说不定可以跟他们耍耍。',
    '"带我去弹药舱！"',
]
</script>

<template>
    <div
        class="read-content"
        id="read-content"
        @click="$emit('click')"
    >
        <div
            v-if="loading"
            class="read-content__loading"
        >
            <div class="skeleton-title skeleton-block" />
            <div
                v-for="i in 12"
                :key="i"
                class="skeleton-line skeleton-block"
                :style="{ width: i % 3 === 0 ? '60%' : '100%' }"
            />
        </div>

        <div
            v-else-if="error"
            class="read-content__error"
            @click.stop
        >
            <svg
                viewBox="0 0 24 24"
                width="48"
                height="48"
                fill="currentColor"
            >
                <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
            </svg>
            <p>{{ error }}</p>
            <AppButton
                type="plain"
                shape="round"
                @click="$emit('retry')"
            >
                重新加载
            </AppButton>
        </div>

        <article
            v-else-if="content"
            class="read-content__body"
        >
            <!-- <h1 class="read-content__title">{{ content.title }}</h1> -->
            <div class="read-content__text">
                <p
                    v-for="(paragraph, index) in _c.filter(Boolean)"
                    :key="index"
                    :class="{ 'm-title': index === 0 }"
                >
                    {{ paragraph }}
                </p>
            </div>
        </article>
    </div>
</template>

<style scoped lang="scss">
.read-content {
    width: 100%;
    height: 100%;
    position: relative;
    background-color: var(--read-content-bg, #f1f1f1);
    overflow: hidden;

    &__loading {
        padding: 20px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .skeleton-block {
            background: linear-gradient(
                90deg,
                rgba(0, 0, 0, 0.04) 25%,
                rgba(0, 0, 0, 0.08) 50%,
                rgba(0, 0, 0, 0.04) 75%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
        }

        .skeleton-title {
            height: 24px;
            width: 50%;
            margin: 0 auto 8px;
        }

        .skeleton-line {
            height: 16px;
        }
    }

    &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 120px;
        color: var(--text-placeholder);

        p {
            margin: 12px 0 20px;
            font-size: 14px;
        }
    }

    &__body {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;

        // 隐藏滚动条
        scrollbar-width: none;
        -ms-overflow-style: none;
        &::-webkit-scrollbar {
            display: none;
        }
    }

    &__text {
        font-size: var(--read-font-size, 17px);
        font-family: var(--read-font-family, sans-serif);
        line-height: var(--read-line-height, 1.9);
        letter-spacing: var(--read-letter-spacing, 0);
        color: var(--read-text-color, #000);

        .m-title {
            font-weight: 500 !important;
            text-indent: 0 !important;
        }

        p {
            text-indent: 2em;
            margin-bottom: var(--read-paragraph-spacing, 1em);
        }
    }
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
