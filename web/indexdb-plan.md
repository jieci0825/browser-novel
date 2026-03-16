# IndexedDB 本地数据管理 - 执行计划

> 由于服务端不保存用户阅读数据，使用 IndexedDB 在本地管理书架、阅读进度、浏览记录和章节缓存。
> 第三方库选型：**Dexie.js**

---

## 阶段一：基础设施搭建

> 目标：安装依赖，创建数据库定义文件，使 IndexedDB 可用。

### 步骤 1.1：安装 Dexie.js

```bash
cd web && npm install dexie
```

### 步骤 1.2：创建数据库类型定义

创建文件 `web/src/database/types.ts`，定义三张表的 TypeScript 类型：

```typescript
/** 书架记录 */
export interface BookshelfRecord {
  sourceId: string
  bookId: string
  sourceName: string
  name: string
  author: string
  cover: string
  intro: string
  latestChapter: string
  status: string
  addedAt: number
}

/** 阅读记录（浏览历史 + 阅读进度） */
export interface ReadHistoryRecord {
  sourceId: string
  bookId: string
  name: string
  author: string
  cover: string
  lastReadChapterId: string
  lastReadChapterTitle: string
  lastReadChapterIndex: number
  totalChapters: number
  readProgress: number
  scrollPosition: number
  lastReadAt: number
}

/** 章节缓存 */
export interface ChapterCacheRecord {
  sourceId: string
  bookId: string
  chapterId: string
  title: string
  content: string
  chapterIndex: number
  cachedAt: number
  lastAccessedAt: number
}
```

### 步骤 1.3：创建数据库实例

创建文件 `web/src/database/index.ts`，定义 Dexie 数据库类并导出实例：

```typescript
import Dexie, { type EntityTable } from 'dexie'
import type { BookshelfRecord, ReadHistoryRecord, ChapterCacheRecord } from './types'

class NovelDatabase extends Dexie {
  bookshelf!: EntityTable<BookshelfRecord, '[sourceId+bookId]'>
  readHistory!: EntityTable<ReadHistoryRecord, '[sourceId+bookId]'>
  chapterCache!: EntityTable<ChapterCacheRecord, '[sourceId+bookId+chapterId]'>

  constructor() {
    super('browser-novel')

    this.version(1).stores({
      bookshelf: '[sourceId+bookId], addedAt',
      readHistory: '[sourceId+bookId], lastReadAt',
      chapterCache: '[sourceId+bookId+chapterId], [sourceId+bookId], lastAccessedAt',
    })
  }
}

export const db = new NovelDatabase()
```

### 验证方式

在浏览器控制台中测试基本操作：

```javascript
// 写入测试
await db.bookshelf.put({ sourceId: 'test', bookId: '1', name: '测试书籍', ... })

// 读取测试
await db.bookshelf.toArray()
```

打开 DevTools → Application → IndexedDB，确认 `browser-novel` 数据库及三张表已创建。

---

## 阶段二：书架模块

> 目标：书架页面从 mock 数据切换为 IndexedDB 真实数据。

### 步骤 2.1：创建书架 service 层

创建文件 `web/src/database/services/bookshelf-service.ts`，封装书架常用操作：

- `addToBookshelf(book)` — 加入书架
- `removeFromBookshelf(sourceId, bookId)` — 移出书架
- `getBookshelfList()` — 获取书架列表（按加入时间倒序）
- `isInBookshelf(sourceId, bookId)` — 判断是否已在书架中
- `getBookshelfWithProgress()` — 获取书架列表并关联阅读进度

### 步骤 2.2：删除旧类型文件

删除文件 `web/src/views/bookshelf/book.ts`。

该文件中的 `Book` 接口存在以下问题：
- `id` 为数字类型，与 API 的 `sourceId + bookId`（string）不匹配
- `title` 应为 `name`，与 `BookDetail` 保持一致
- 缺少 `sourceId` 等多书源关键字段

新的类型由 `database/types.ts` 中的 `BookshelfRecord` 和 `ReadHistoryRecord` 组合替代。

### 步骤 2.3：改造书架页面

修改 `web/src/views/bookshelf/index.vue`：

- 移除硬编码的 mock 数据
- 使用 bookshelf service 从 IndexedDB 读取数据
- 适配新的类型结构（字段名变化：`title` → `name`，`lastRead` → `lastReadChapterTitle` 等）
- 同步修改子组件（`book-card.vue`、`book-list.vue`）的 props 类型

### 步骤 2.4：对接"加入书架"操作

在搜索结果页或书籍详情页中，调用 `addToBookshelf()` 将书籍加入书架。
（如对应页面尚未开发，可先跳过此步骤）

### 验证方式

1. 打开书架页面，确认数据从 IndexedDB 加载（初始为空）
2. 通过控制台手动插入数据，刷新页面后数据仍在
3. 搜索功能仍正常工作

---

## 阶段三：阅读记录与进度模块

> 目标：用户阅读时自动记录进度，支持浏览历史展示和进度恢复。

### 步骤 3.1：创建阅读记录 service 层

创建文件 `web/src/database/services/read-history-service.ts`，封装操作：

- `updateReadProgress(record)` — 更新阅读进度（upsert）
- `getReadProgress(sourceId, bookId)` — 获取某本书的阅读进度
- `getReadHistoryList(limit?)` — 获取浏览历史列表（按最近阅读时间倒序）
- `removeReadHistory(sourceId, bookId)` — 删除某条阅读记录
- `cleanupOldHistory(maxCount)` — 清理超出上限的旧记录（默认保留 200 条）

### 步骤 3.2：在阅读页面集成进度记录

在阅读页面中（读取章节正文的页面）：

- **进入阅读页时**：查询 `readHistory` 恢复上次阅读位置（章节 + scrollPosition）
- **切换章节时**：更新 `lastReadChapterId`、`lastReadChapterIndex`、`readProgress`
- **滚动阅读时**：节流更新 `scrollPosition`（建议 throttle 3~5 秒）
- **离开阅读页时**：最终保存一次进度

### 步骤 3.3：书架页面关联阅读进度

修改书架页面，使用 `getBookshelfWithProgress()` 展示：
- "读到第 X 章 · 章节标题"
- 进度百分比条

### 步骤 3.4：浏览历史页面

创建浏览历史页面，展示用户阅读过的所有书籍：
- 按最近阅读时间倒序排列
- 显示书名、作者、封面、上次读到的章节、进度
- 支持删除单条记录

### 验证方式

1. 打开一本书阅读，切换几个章节后退出
2. 重新打开同一本书，确认自动跳转到上次阅读位置
3. 书架页面显示正确的进度信息
4. 浏览历史页面按时间排列，数据正确

---

## 阶段四：章节缓存模块

> 目标：缓存已读章节正文，减少重复请求，支持缓存管理。

### 步骤 4.1：创建章节缓存 service 层

创建文件 `web/src/database/services/chapter-cache-service.ts`，封装操作：

- `cacheChapter(record)` — 缓存章节（写入 + 自动触发 LRU 清理）
- `getCachedChapter(sourceId, bookId, chapterId)` — 读取缓存（命中时更新 `lastAccessedAt`）
- `clearBookCache(sourceId, bookId)` — 清除某本书的所有章节缓存
- `clearAllCache()` — 清除全部章节缓存
- `getCacheStats()` — 获取缓存统计信息（总条数 / 按书统计）

### 步骤 4.2：实现 LRU 自动清理策略

在 `cacheChapter()` 内部实现：

```
总缓存上限：500 章（可配置）

写入新缓存后：
  1. 查询总条数
  2. 如果超出上限，按 lastAccessedAt 升序取出超出部分
  3. 批量删除这些最久未访问的记录
```

### 步骤 4.3：集成到阅读页面

修改章节正文的加载逻辑：

```
加载章节内容时：
  1. 先查 chapterCache
  2. 命中 → 直接使用缓存内容，更新 lastAccessedAt
  3. 未命中 → 调用 API 请求，拿到内容后写入缓存
```

### 步骤 4.4：联动清理提示

当用户从书架移除一本书时：

1. 检查该书是否有章节缓存
2. 如有，弹出提示："是否同时清除该书的章节缓存？"
3. 用户确认后调用 `clearBookCache()` 清除

### 步骤 4.5：缓存管理 UI（可选）

在设置页面中提供：
- 显示当前缓存总条数
- "清除所有章节缓存"按钮
- 按书展示缓存条数，支持单独清除

### 验证方式

1. 首次阅读章节，确认 IndexedDB 中写入了缓存
2. 再次打开同一章节，确认走了缓存（网络面板无请求）
3. 插入大量测试数据超过 500 条，确认自动清理了最旧的记录
4. 移除书架书籍时，弹出清理提示且功能正常

---

## 涉及文件总览

| 操作 | 文件路径 |
|------|----------|
| **新增** | `web/src/database/types.ts` |
| **新增** | `web/src/database/index.ts` |
| **新增** | `web/src/database/services/bookshelf-service.ts` |
| **新增** | `web/src/database/services/read-history-service.ts` |
| **新增** | `web/src/database/services/chapter-cache-service.ts` |
| **删除** | `web/src/views/bookshelf/book.ts` |
| **修改** | `web/src/views/bookshelf/index.vue` |
| **修改** | `web/src/views/bookshelf/components/book-card.vue` |
| **修改** | `web/src/views/bookshelf/components/book-list.vue` |
| **修改** | 阅读页面（加载章节、记录进度） |
| **新增** | 浏览历史页面 |

---

## 表结构速查

### bookshelf（书架）

```
主键: [sourceId+bookId]
索引: addedAt
字段: sourceId, bookId, sourceName, name, author, cover, intro, latestChapter, status, addedAt
```

### readHistory（阅读记录/进度）

```
主键: [sourceId+bookId]
索引: lastReadAt
字段: sourceId, bookId, name, author, cover, lastReadChapterId, lastReadChapterTitle,
      lastReadChapterIndex, totalChapters, readProgress, scrollPosition, lastReadAt
```

### chapterCache（章节缓存）

```
主键: [sourceId+bookId+chapterId]
索引: [sourceId+bookId], lastAccessedAt
字段: sourceId, bookId, chapterId, title, content, chapterIndex, cachedAt, lastAccessedAt
```
