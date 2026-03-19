# 书源分组链式 Fallback 方案

## 背景

项目中 `douyinxs` 书源存在 120 秒搜索冷却限制，容易导致搜索失败。同时我们有多个备用书源，搜索结果与 `douyinxs` 基本一致。需要一种机制：将这些同类书源组成一个组，搜索时按优先级链式尝试，前一个失败或无结果时自动切换到下一个。

## 现有架构

```
AdapterManager
  ├── QQReaderAdapter        （独立书源）
  └── RuleBasedAdapter(douyinxs)  （独立书源，有 120s cooldown）
```

- `AdapterManager.searchAllStream()` 并行调用所有已注册书源
- 每个 adapter 通过 `createAdapter()` 包装异常切面（超时）和缓存切面
- 所有书源实现统一的 `BookSourceAdapter` 接口

## 方案概述

新增 `ChainedAdapter` 类，实现 `BookSourceAdapter` 接口，内部持有一组子书源。对外表现为单个书源，对内链式 fallback。

```
AdapterManager
  ├── QQReaderAdapter                    （独立书源）
  └── ChainedAdapter('novel-group')      （分组书源，对外是一个）
        ├── RuleBasedAdapter(douyinxs)     优先级 1
        ├── RuleBasedAdapter(backupA)      优先级 2
        └── RuleBasedAdapter(backupB)      优先级 3
```

## 核心设计

### 1. 链式搜索

`search()` 按优先级依次调用子书源，第一个返回非空结果的胜出；如果抛异常（包括 cooldown 错误），自动跳到下一个。

```typescript
async search(keyword, page?, pageSize?): Promise<BookSearchItem[]> {
  for (const adapter of this.adapters) {
    try {
      const results = await adapter.search(keyword, page, pageSize)
      if (results.length > 0) {
        return results.map(item => ({
          ...item,
          sourceId: this.sourceId,
          bookId: this.encodeBookId(adapter.sourceId, item.bookId),
        }))
      }
    } catch {
      continue  // 当前书源失败，尝试下一个
    }
  }
  return []
}
```

### 2. bookId 路由问题

不同书源对同一本书的 `bookId` 不同：

| 书源 | bookId 示例 |
|------|------------|
| douyinxs | `/bqg/12345/` |
| 备用源A | `novel-6789` |
| 备用源B | `98765` |

搜索时如果 fallback 到了备用源A，返回的 `bookId = "novel-6789"`，后续 `getDetail()` 必须路由到备用源A 才能正确处理。

### 3. bookId 编码方案：长度前缀法

采用长度前缀编码，将子书源 sourceId 和原始 bookId 打包为一个字符串，解码时按长度截取，不依赖任何分隔符，零冲突风险。

格式：`{sourceId长度}:{sourceId}{bookId}`

```
编码示例：
  sourceId = "douyinxs", bookId = "12345"
  → "8:douyinxs12345"

  sourceId = "backup-a", bookId = "novel::6789"  (bookId 含特殊字符也没问题)
  → "8:backup-anovel::6789"
```

```typescript
private encodeBookId(childSourceId: string, rawBookId: string): string {
  return `${childSourceId.length}:${childSourceId}${rawBookId}`
}

private decodeBookId(encoded: string): { childSourceId: string; bookId: string } {
  const colonIdx = encoded.indexOf(':')
  const len = parseInt(encoded.slice(0, colonIdx), 10)
  const childSourceId = encoded.slice(colonIdx + 1, colonIdx + 1 + len)
  const bookId = encoded.slice(colonIdx + 1 + len)
  return { childSourceId, bookId }
}
```

解码后通过内部 `adapterMap` 精准路由到对应的子 adapter：

```typescript
async getDetail(bookId: string): Promise<BookDetail> {
  const { childSourceId, bookId: realId } = this.decodeBookId(bookId)
  const adapter = this.adapterMap.get(childSourceId)
  if (!adapter) throw new Error(`未知的子书源: ${childSourceId}`)
  return adapter.getDetail(realId)
}
```

### 4. 切面包装策略

子书源独立包装异常切面和缓存切面，ChainedAdapter 本身不包装。

```typescript
// 每个子书源独立超时、独立缓存
const novelGroup = new ChainedAdapter('novel-group', '小说聚合', [
  createAdapter(new RuleBasedAdapter(douyinxsRule)),
  createAdapter(new RuleBasedAdapter(backupARule)),
  createAdapter(new RuleBasedAdapter(backupBRule)),
])

// ChainedAdapter 直接注册，不再 createAdapter 包装
adapterManager.register(novelGroup)
```

这样当 douyinxs 触发 cooldown 抛异常时，ChainedAdapter 的 catch 捕获后立即尝试下一个子书源，不会被外层超时切面干扰。

## 完整类结构

```typescript
// server/src/adapter/chained-adapter.ts

export class ChainedAdapter implements BookSourceAdapter {
  readonly sourceId: string
  readonly sourceName: string

  private adapters: BookSourceAdapter[]
  private adapterMap: Map<string, BookSourceAdapter>

  constructor(groupId: string, groupName: string, adapters: BookSourceAdapter[])

  // 链式 fallback 搜索
  search(keyword: string, page?: number, pageSize?: number): Promise<BookSearchItem[]>

  // 精准路由（通过 decodeBookId）
  getDetail(bookId: string): Promise<BookDetail>
  getChapters(bookId: string): Promise<Chapter[]>
  getContent(bookId: string, chapterId: string): Promise<ChapterContent>

  // 内部编解码
  private encodeBookId(childSourceId: string, rawBookId: string): string
  private decodeBookId(encoded: string): { childSourceId: string; bookId: string }
}
```

## 注册示例

```typescript
// server/src/adapter/index.ts

import { ChainedAdapter } from './chained-adapter'

function registerAdapters() {
  // 独立书源
  adapterManager.register(createAdapter(new QQReaderAdapter()))

  // 分组书源 —— 链式 fallback
  const novelGroup = new ChainedAdapter('novel-group', '小说聚合', [
    createAdapter(new RuleBasedAdapter(douyinxsRule)),   // 优先
    createAdapter(new RuleBasedAdapter(backupARule)),     // 备用 1
    createAdapter(new RuleBasedAdapter(backupBRule)),     // 备用 2
  ])
  adapterManager.register(novelGroup)
}
```

## 影响范围

| 模块 | 是否需要改动 | 说明 |
|------|:----------:|------|
| `BookSourceAdapter` 接口 | ❌ | 不变 |
| `AdapterManager` | ❌ | 不变，ChainedAdapter 对它来说就是普通 adapter |
| `RuleBasedAdapter` | ❌ | 不变 |
| 异常切面 / 缓存切面 | ❌ | 不变，包在子书源上 |
| 前端 | ❌ | 不变，bookId 只是透传 |
| `adapter/index.ts` | ✅ | 调整注册逻辑 |
| 新增文件 | ✅ | `chained-adapter.ts` |
| 新增书源规则 | ✅ | 备用书源的 rule 文件 |
