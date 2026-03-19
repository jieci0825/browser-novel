import { adapterManager } from './manager'
import { QQReaderAdapter, douyinxsRule, douxswRule } from './sources'
import { RuleBasedAdapter } from './rule-based/adapter'
import { withAdapterExceptionAspect } from './aspect'
import { withAdapterCacheAspect } from './cache-aspect'
import { cacheService } from '../cache/cache-service'
import { ChainedAdapter } from './chained-adapter'
import type {
    BookSourceAdapter,
    AdapterAspect,
    AdapterConfig,
    ChainedAdapterConfig,
} from './types'

// ── 预置切面 ──────────────────────────────────────────────────
const cacheAspect: AdapterAspect = adapter =>
    withAdapterCacheAspect(adapter, cacheService)

const exceptionAspect: AdapterAspect = adapter =>
    withAdapterExceptionAspect(adapter)

/** 默认切面：缓存 → 异常（由内向外） */
const defaultAspects: AdapterAspect[] = [cacheAspect, exceptionAspect]

// ── 书源注册配置 ──────────────────────────────────────────────
const adapterConfigs: (AdapterConfig | ChainedAdapterConfig)[] = [
    // 独立书源
    {
        enabled: true,
        adapter: new QQReaderAdapter(),
        aspects: defaultAspects,
    },

    // 分组书源 —— 链式 fallback
    {
        enabled: true,
        groupId: 'dy-group',
        groupName: '小说聚合',
        children: [
            {
                enabled: false,
                adapter: new RuleBasedAdapter(douyinxsRule),
                aspects: defaultAspects,
            },
            {
                enabled: true,
                adapter: new RuleBasedAdapter(douxswRule),
                aspects: [exceptionAspect],
            },
        ],
    },
]

// ── 注册引擎 ──────────────────────────────────────────────────
function applyAspects(
    adapter: BookSourceAdapter,
    aspects: AdapterAspect[] = []
): BookSourceAdapter {
    return aspects.reduce((acc, aspect) => aspect(acc), adapter)
}

function isChainedConfig(
    config: AdapterConfig | ChainedAdapterConfig
): config is ChainedAdapterConfig {
    return 'groupId' in config
}

function registerAdapters(configs: (AdapterConfig | ChainedAdapterConfig)[]) {
    for (const config of configs) {
        if (config.enabled === false) continue

        if (isChainedConfig(config)) {
            const children = config.children
                .filter(c => c.enabled !== false)
                .map(c => applyAspects(c.adapter, c.aspects))

            if (children.length === 0) continue

            adapterManager.register(
                new ChainedAdapter(config.groupId, config.groupName, children)
            )
        } else {
            adapterManager.register(
                applyAspects(config.adapter, config.aspects)
            )
        }
    }
}

registerAdapters(adapterConfigs)

export { adapterManager }
export type { SearchStreamCallbacks } from './manager'
export type {
    BookSearchItem,
    BookDetail,
    Chapter,
    ChapterContent,
} from './types'
