# Browser Novel 项目文档

> 一个基于浏览器的在线小说聚合阅读器，支持多书源搜索、书架管理、阅读进度记录及个性化阅读设置。

---

## 一、项目架构概览

### 1.1 整体架构

项目采用**前后端分离**架构，分为 `web`（前端）和 `server`（后端）两个独立工程。

```
browser-novel/
├── web/          # 前端 — Vue3 单页应用
└── server/       # 后端 — Koa2 API 服务（小说数据爬取与聚合）
```

**核心技术栈一览：**

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | Vue 3.5 + TypeScript |
| 构建工具 | Vite 7 |
| 路由 | Vue Router 4（History 模式） |
| UI 组件库 | Element Plus（SCSS 主题定制） |
| 图标方案 | unplugin-icons + Iconify（MDI 图标集 + 自定义 SVG） |
| 本地数据库 | Dexie（IndexedDB 封装） |
| HTTP 请求 | Axios（前端）/ 原生 fetch（流式搜索） |
| 状态管理 | 无全局状态库，页面级 `ref`/`reactive` + composables |
| 持久化 | IndexedDB（书架/阅读记录）+ localStorage（设置项） |
| 后端框架 | Koa 2 + koa-router |
| 数据爬取 | Axios + Cheerio（HTML 解析）+ Puppeteer（动态页面） |
| 服务端缓存 | SQLite（node:sqlite 内置模块） |
| 日志系统 | log4js（分类日志：应用/访问/异常） |

---

### 1.2 前端架构

```
web/src/
├── main.ts                    # 应用入口
├── App.vue                    # 根组件（KeepAlive 包裹搜索页）
├── api/                       # API 请求层
│   ├── index.ts               # 统一导出
│   ├── modules/book.ts        # 书籍相关接口
│   └── types/book.type.ts     # 接口类型定义
├── database/                  # IndexedDB 本地数据库层
│   ├── index.ts               # Dexie 数据库初始化
│   ├── types.ts               # 数据表类型定义
│   └── services/              # 数据操作服务
│       ├── bookshelf-service.ts
│       └── read-history-service.ts
├── router/                    # 路由配置
│   └── index.ts
├── utils/                     # 工具函数
│   ├── request.ts             # Axios 封装（统一拦截、错误处理）
│   ├── check-type.ts          # 类型判断工具
│   ├── storeage.ts            # localStorage 封装
│   └── search-relevance.ts    # 搜索结果相关度排序算法
├── constants/                 # 常量
│   └── storage-key.ts
├── styles/                    # 全局样式
│   ├── index.scss             # 入口样式（重置 + 滚动条）
│   ├── variables.scss         # CSS 变量（颜色、布局）
│   └── element/               # Element Plus 主题覆盖
│       ├── var.scss
│       └── index.scss
└── views/                     # 页面模块
    ├── bookshelf/             # 书架页
    ├── search/                # 搜索页
    ├── detail/                # 书籍详情页
    ├── read/                  # 阅读页
    └── not-found/             # 404 页
```

**架构特点：**

- **无全局状态管理**：未使用 Pinia/Vuex，状态完全由各页面自行管理，通过 `ref`/`reactive` 维护
- **数据持久化双通道**：
  - IndexedDB（通过 Dexie）：存储书架数据、阅读历史、章节缓存等结构化数据
  - localStorage：存储阅读设置（字体、主题、行距等轻量配置）
- **组件就近组织**：每个页面拥有独立的 `components/`、`config/`、`composables/` 子目录，不存在全局共享组件
- **KeepAlive 缓存**：仅对搜索页（`SearchPage`）启用 KeepAlive，在详情页返回时保留搜索状态和滚动位置

---

### 1.3 后端架构

```
server/src/
├── app.ts                     # 应用入口（Koa 实例、中间件注册、优雅关闭）
├── routes/                    # 路由层
│   └── book.ts                # /api/books/* 所有接口
├── adapter/                   # 书源适配器核心（重点模块）
│   ├── index.ts               # 适配器注册与初始化
│   ├── types.ts               # 接口与类型定义
│   ├── manager.ts             # 适配器管理器（注册、查找、聚合搜索）
│   ├── aspect.ts              # 异常处理 & 超时切面（Proxy 实现 AOP）
│   ├── cache-aspect.ts        # 缓存切面（Proxy 实现 AOP）
│   ├── chained-adapter.ts     # 链式 Fallback 适配器（多书源聚合为一）
│   ├── rule-based/            # 规则驱动适配器
│   │   ├── types.ts           # 规则 DSL 类型定义
│   │   ├── field-parser.ts    # 字段提取引擎（HTML DSL / JSON Path）
│   │   └── adapter.ts         # 通用规则解析适配器
│   └── sources/               # 具体书源规则/实现
│       ├── index.ts
│       ├── qq-reader.ts       # QQ 阅读（纯 API 调用）
│       ├── aixiadianzishu.ts  # 爱下电子书（规则驱动 + 自定义抓取）
│       └── dy/                # 抖音小说系列
│           ├── douyinxs.ts    # 抖音小说（规则驱动）
│           └── douxsw.ts      # 抖音小说 2（规则驱动）
├── browser/                   # 浏览器实例池
│   └── pool.ts                # Puppeteer 页面池（并发限制 3）
├── cache/                     # 服务端缓存
│   └── cache-service.ts       # SQLite 持久化缓存
├── middleware/                 # Koa 中间件
│   ├── request-context.ts     # 请求上下文（traceId、forceRefresh）
│   ├── logger.ts              # 访问日志
│   ├── rate-limit.ts          # 令牌桶限流
│   ├── response.ts            # 统一响应格式
│   └── exception.ts           # 全局异常捕获
├── exception/                 # 异常体系
│   ├── error-code.ts          # 错误码枚举
│   └── app-exception.ts       # 业务异常类（分层继承）
├── types/                     # 类型扩展
│   └── koa-context.d.ts       # Koa Context 类型增强
└── utils/                     # 工具函数
    ├── response.ts            # 响应构建
    ├── client-ip.ts           # 客户端 IP 提取
    ├── logger.ts              # log4js 配置
    ├── check-type.ts          # 类型判断
    └── with-handler.ts        # 路由处理器包装
```

**架构特点：**

- **适配器模式**：每个书源实现 `BookSourceAdapter` 接口，对外提供统一的 `search`/`getDetail`/`getChapters`/`getContent` 方法
- **规则驱动引擎**：大部分书源通过声明式 DSL 规则配置（CSS 选择器 + 管道操作符），无需编写代码即可接入新书源
- **AOP 切面设计**：通过 `Proxy` 实现适配器增强（缓存、异常处理、超时控制），切面可组合叠加
- **链式 Fallback**：多个同类书源可组成一个 `ChainedAdapter`，搜索时按优先级逐个尝试，对外表现为单一书源
- **NDJSON 流式推送**：聚合搜索不等待所有书源返回，每个书源完成后立即推送结果到前端

---

### 1.4 前后端通信

| 通信方式 | 场景 | 说明 |
|---------|------|------|
| REST API (JSON) | 指定书源搜索、书籍详情、章节目录、章节正文 | Axios 封装，统一响应格式 `{ errorCode, message, traceId, data }` |
| NDJSON 流式响应 | 聚合搜索（多书源并行） | 前端 `fetch` + `ReadableStream` 逐行读取，每解析出一条即回调通知 UI |

**开发代理配置：**
- 前端 Vite 开发服务器端口：`9527`
- 后端 Koa 服务端口：`5100`
- 代理规则：前端 `/api/*` → 后端 `http://localhost:5100`

---

### 1.5 统一响应格式

所有 REST API 均遵循以下响应结构：

```typescript
interface ApiResponse<T> {
    errorCode: number   // 0 表示成功，非 0 为错误码
    message: string     // 提示信息
    traceId: string     // 请求追踪 ID
    data: T | null      // 业务数据
}
```

**错误码体系：**

| 范围 | 含义 | 示例 |
|------|------|------|
| 1xxx | 参数与请求错误 | 1001 - 参数校验失败 |
| 2xxx | 书源相关错误 | 2001 - 书源不存在，2002 - 书源不可用，2003 - 书源超时 |
| 4xxx | 访问限制 | 4001 - 请求频率过高 |
| 5xxx | 系统内部错误 | 5000 - 服务器内部异常 |

---

## 二、模块详解

### 2.1 前端模块

#### 2.1.1 API 模块 (`api/`)

统一管理前端与后端的通信。

**请求封装（`utils/request.ts`）：**
- 基于 Axios 创建实例，baseURL 为 `/api`，超时 15 秒
- 响应拦截器：自动判断 `errorCode !== 0` 时 reject
- 导出的 `request<T>()` 函数自动解包 `data.data`，调用方直接获得业务数据

**接口列表：**

| 方法 | 路径 | 说明 |
|------|------|------|
| `getSources()` | GET `/books/sources` | 获取可用书源列表 |
| `searchAll(keyword, onEvent, signal?)` | GET `/books/search?keyword=xxx` | 聚合搜索（NDJSON 流式） |
| `search(sourceId, keyword, page?, pageSize?)` | GET `/books/search/:sourceId` | 指定书源搜索 |
| `getDetail(sourceId, bookId)` | GET `/books/:sourceId/detail` | 获取书籍详情 |
| `getChapters(sourceId, bookId)` | GET `/books/:sourceId/chapters` | 获取章节目录 |
| `getContent(sourceId, bookId, chapterId)` | GET `/books/:sourceId/content` | 获取章节正文 |

**API 类型定义：**

```typescript
// 书源信息
interface BookSource { sourceId: string; sourceName: string }

// 搜索结果
interface BookSearchItem {
    sourceId: string; bookId: string; sourceName?: string
    name: string; author: string; cover?: string; intro?: string
    latestChapter?: string; wordCount?: string; status?: string
}

// 书籍详情
interface BookDetail {
    sourceId: string; bookId: string
    name: string; author: string; cover?: string; intro?: string
    latestChapter?: string; wordCount?: string; status?: string; category?: string
}

// 章节列表项
interface Chapter { chapterId: string; title: string; index: number }

// 章节正文
interface ChapterContent { title: string; content: string }

// 聚合搜索流式事件
type SearchStreamEvent =
    | { type: 'result'; sourceId: string; sourceName: string; items: BookSearchItem[] }
    | { type: 'error'; sourceId: string; sourceName: string; message: string }
    | { type: 'done' }
```

---

#### 2.1.2 本地数据库模块 (`database/`)

使用 Dexie（IndexedDB 封装库）在浏览器端维护三张数据表。

**数据库名称：** `browser-novel`

**数据表结构：**

##### 表 1：`bookshelf`（书架）

| 字段 | 类型 | 说明 |
|------|------|------|
| sourceId | string | 书源 ID（联合主键） |
| bookId | string | 书籍 ID（联合主键） |
| sourceName | string | 书源名称 |
| name | string | 书名 |
| author | string | 作者 |
| cover | string | 封面 URL |
| intro | string | 简介 |
| latestChapter | string | 最新章节 |
| status | string | 状态（连载中/已完结） |
| addedAt | number | 加入时间戳 |
| lastReadAt | number | 最后阅读时间戳 |

索引：`[sourceId+bookId]`（联合主键），`addedAt`，`lastReadAt`

##### 表 2：`readHistory`（阅读历史/阅读进度）

| 字段 | 类型 | 说明 |
|------|------|------|
| sourceId | string | 书源 ID（联合主键） |
| bookId | string | 书籍 ID（联合主键） |
| name | string | 书名 |
| author | string | 作者 |
| cover | string | 封面 URL |
| lastReadChapterId | string | 最后阅读的章节 ID |
| lastReadChapterTitle | string | 最后阅读的章节标题 |
| lastReadChapterIndex | number | 最后阅读的章节索引 |
| totalChapters | number | 总章节数 |
| readProgress | number | 阅读进度百分比（0-100） |
| scrollPosition | number | 页面滚动位置 |
| lastReadAt | number | 最后阅读时间戳 |

索引：`[sourceId+bookId]`（联合主键），`lastReadAt`

##### 表 3：`chapterCache`（章节缓存）

| 字段 | 类型 | 说明 |
|------|------|------|
| sourceId | string | 书源 ID |
| bookId | string | 书籍 ID |
| chapterId | string | 章节 ID |
| title | string | 章节标题 |
| content | string | 章节内容 |
| chapterIndex | number | 章节索引 |
| cachedAt | number | 缓存时间 |
| lastAccessedAt | number | 最后访问时间 |

索引：`[sourceId+bookId+chapterId]`（三元联合主键），`[sourceId+bookId]`，`lastAccessedAt`

**服务层方法：**

| 服务 | 方法 | 说明 |
|------|------|------|
| bookshelf-service | `addToBookshelf(book)` | 加入书架（upsert） |
| bookshelf-service | `removeFromBookshelf(sourceId, bookId)` | 移出书架 |
| bookshelf-service | `getBookshelfList()` | 获取书架列表（按加入时间倒序） |
| bookshelf-service | `isInBookshelf(sourceId, bookId)` | 判断是否已在书架 |
| bookshelf-service | `updateBookshelfLastReadAt(...)` | 更新最后阅读时间 |
| bookshelf-service | `getBookshelfWithProgress()` | 获取书架 + 关联阅读进度（按最后阅读时间倒序） |
| read-history-service | `updateReadProgress(record)` | 更新阅读进度（upsert） |
| read-history-service | `getReadProgress(sourceId, bookId)` | 获取某本书的阅读进度 |
| read-history-service | `getReadHistoryList(limit?)` | 获取浏览历史（按时间倒序） |
| read-history-service | `removeReadHistory(sourceId, bookId)` | 删除阅读记录 |
| read-history-service | `cleanupOldHistory(maxCount)` | 清理超出上限的旧记录（默认保留 200 条） |

---

#### 2.1.3 路由模块 (`router/`)

**路由表：**

| 路径 | 名称 | 页面 | 说明 |
|------|------|------|------|
| `/` | bookshelf | 书架页 | 首页，展示已收藏书籍 |
| `/search` | search | 搜索页 | 聚合搜索书籍（KeepAlive） |
| `/detail/:sourceId/:bookId` | detail | 书籍详情页 | 展示书籍信息和章节目录 |
| `/read/:sourceId/:bookId/:chapterId` | read | 阅读页 | 章节正文阅读 |
| `/:pathMatch(.*)*` | not-found | 404 页 | 未匹配路由兜底 |

**路由特点：**
- 使用 `createWebHistory`（HTML5 History 模式）
- 全部采用路由懒加载（`() => import(...)`)
- 搜索页通过 `KeepAlive` 缓存，其他页面不缓存

---

#### 2.1.4 样式体系 (`styles/`)

**CSS 变量（全局）：**

```scss
:root {
    --color-bg-page: #f5f7fa;        // 页面背景
    --color-text-primary: #303133;    // 主文字色
    --color-bg-navbar: #ffffff;       // 导航栏背景
    --color-border-light: #e4e7ed;    // 浅色边框
    --content-max-width: 762px;       // 内容最大宽度
    --sidebar-width: 48px;            // 侧边栏宽度

    // 阅读页专用（可被主题覆盖）
    --read-bg: #e9e9e9;
    --read-content-bg: #f1f1f1;
    --read-text-color: #000000e6;
}
```

**Element Plus 主题定制：**

| 色系 | 颜色 |
|------|------|
| primary | `#171717`（近黑色） |
| success | `#22c55f` |
| warning | `#ffab00` |
| danger/error | `#e7000b` |
| info | `#06b8d9` |

---

#### 2.1.5 工具函数 (`utils/`)

| 文件 | 功能 |
|------|------|
| `request.ts` | Axios 实例封装，统一请求/响应拦截、错误处理、泛型数据解包 |
| `check-type.ts` | 类型判断工具（isString、isNumber、isObject 等） |
| `storeage.ts` | localStorage 的 JSON 序列化读写封装 |
| `search-relevance.ts` | 搜索相关度评分算法，支持书名、作者名、组合搜索的多维度打分排序 |

**搜索相关度算法说明：**
- 精确匹配 100 分，前缀匹配 80 分，包含匹配 60 分，反向包含 50 分
- 书名和作者都有匹配时额外加 20 分
- 支持空格拆分关键词进行组合搜索（如 "书名 作者名"），取最佳组合分数 +10 分
- 搜索结果按分数降序排列

---

### 2.2 后端模块

#### 2.2.1 路由层 (`routes/book.ts`)

所有 API 挂载在 `/api/books` 前缀下。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/sources` | 返回所有已注册的书源列表 `[{ sourceId, sourceName }]` |
| GET | `/search?keyword=xxx` | 聚合搜索，NDJSON 流式返回（`Content-Type: application/x-ndjson`） |
| GET | `/search/:sourceId?keyword=xxx&page=0&pageSize=20` | 指定书源搜索 |
| GET | `/:sourceId/detail?bookId=xxx` | 获取书籍详情 |
| GET | `/:sourceId/chapters?bookId=xxx` | 获取章节目录 |
| GET | `/:sourceId/content?bookId=xxx&chapterId=xxx` | 获取章节正文 |

**特殊请求参数：**
- `?refresh=true`：强制刷新缓存，跳过服务端缓存直接请求书源

---

#### 2.2.2 适配器核心 (`adapter/`)

这是整个后端最核心的模块，采用**适配器模式 + AOP 切面 + 规则引擎**的设计。

##### 适配器接口

```typescript
interface BookSourceAdapter {
    readonly sourceId: string
    readonly sourceName: string
    search(keyword: string, page?: number, pageSize?: number): Promise<BookSearchItem[]>
    getDetail(bookId: string): Promise<BookDetail>
    getChapters(bookId: string): Promise<Chapter[]>
    getContent(bookId: string, chapterId: string): Promise<ChapterContent>
}
```

##### 适配器管理器 (`manager.ts`)

- `register(adapter)` — 注册书源适配器
- `get(sourceId)` — 按 ID 获取适配器，不存在则抛出 `SourceNotFoundException`
- `listSources()` — 列出所有已注册书源
- `searchAllStream(keyword, callbacks)` — 流式聚合搜索，所有书源并行请求，每个完成后立即通过回调推送结果

##### AOP 切面体系

通过 ES6 `Proxy` 拦截适配器方法调用，实现横切关注点。

**异常处理切面 (`aspect.ts`)：**
- 为 `search`/`getDetail`/`getChapters`/`getContent` 方法添加超时保护（默认 20 秒）
- 将未知异常统一映射为 `SourceUnavailableException`
- 超时抛出 `SourceTimeoutException`

**缓存切面 (`cache-aspect.ts`)：**
- 仅缓存 `getDetail`/`getChapters`/`getContent`，搜索不缓存
- 缓存 key 格式：`{method}:{sourceId}:{bookId}[:chapterId]`
- 支持 `?refresh=true` 跳过缓存读取
- 缓存存储使用 SQLite

**切面叠加顺序：** 缓存 → 异常（由内向外，先检查缓存，再做异常保护）

##### 规则驱动适配器 (`rule-based/`)

大部分书源无需编写代码，只需声明式配置规则即可接入。

**规则结构 (`BookSourceRule`)：**

```typescript
interface BookSourceRule {
    sourceId: string      // 书源标识
    sourceName: string    // 书源名称
    sourceUrl: string     // 书源根 URL
    sourceType?: 'html' | 'json'  // 数据格式（默认 html）
    http?: HttpConfig     // HTTP 配置（UA、Headers、超时、编码）
    search: SearchRule    // 搜索规则
    detail: DetailRule    // 详情规则
    chapters: ChaptersRule  // 章节列表规则
    content: ContentRule  // 正文规则
}
```

**字段提取 DSL 语法：**

| 语法 | 说明 | 示例 |
|------|------|------|
| `selector` | CSS 选择器取 text | `.title` |
| `selector@attr` | CSS 选择器取属性 | `a@href`、`img@src`、`div@html` |
| `selector \| replace:pattern,replacement` | 正则替换 | `p \| replace:^作者：,` |
| `selector \| regex:pattern` | 正则提取（取第一个捕获组） | `a@href \| regex:(\d+)\.html$` |
| `selectorA \|\| selectorB` | 回退：依次尝试，返回第一个非空值 | `.title \|\| h1` |
| `@text` / `@href` | 列表上下文中引用当前元素自身 | `@text`、`@href` |
| 函数 `(ctx) => string` | 当 DSL 不够灵活时编写提取逻辑 | 接收 `{ $, el, data, sourceUrl }` |

**支持的章节/正文获取模式：**
- **标准模式**：通过 `url` + `list` + `fields` 规则自动抓取
- **自定义模式**：通过 `fetchChapters` / `fetchContent` 函数完全自定义抓取逻辑
- **分页支持**：章节列表支持翻页（`pagination.nextSelector`），正文支持多页拼接（`nextContentUrl`）

**正文清洗选项 (`ContentPurifyOptions`)：**
- `brToNewline` — `<br>` 转换为 `\n`（默认开启）
- `stripNbsp` — `&nbsp;` 替换为空格（默认开启）
- `removeSelectors` — 移除指定 CSS 选择器的 DOM 元素（广告等）
- `trimLines` — 去除每行首尾空白（默认开启）
- `filterEmpty` — 过滤空行（默认开启）
- `customPurify` — 自定义清洗函数，完全替代内置逻辑

##### 链式 Fallback 适配器 (`chained-adapter.ts`)

将多个同类书源聚合为一个对外表现的"虚拟书源"。

**核心机制：**
- **搜索**：按优先级依次尝试子书源，第一个返回非空结果的胜出
- **详情/章节/正文**：通过 `bookId` 编码精准路由到对应子书源
- **bookId 编码方案**：长度前缀编码 `{sourceId长度}:{sourceId}{bookId}`
  - 例：`sourceId="douyinxs", bookId="12345"` → `"8:douyinxs12345"`

##### 已注册书源一览

| 书源 ID | 名称 | 类型 | 实现方式 |
|---------|------|------|---------|
| `aixiadianzishu` | 爱下电子书 | 独立书源 | 规则驱动 + 自定义章节/正文抓取 |
| `qq-reader` | QQ 阅读 | 独立书源 | 纯 API 调用（手写适配器） |
| `dy-group` | 小说聚合 | 链式分组 | 包含 douxsw + douyinxs |
| └ `douxsw` | 抖音小说2 | 子书源 | 规则驱动 |
| └ `douyinxs` | 抖音小说 | 子书源 | 规则驱动 |

---

#### 2.2.3 中间件 (`middleware/`)

Koa 中间件注册顺序（从外到内）：

```
cors → compress → requestContext → logger → rateLimit → response → exception → 路由
```

| 中间件 | 功能 |
|--------|------|
| `cors` | 跨域支持 |
| `compress` | Gzip 压缩（阈值 1KB） |
| `requestContext` | 生成 traceId（UUID），解析 `?refresh=true`，通过 `AsyncLocalStorage` 传递请求上下文 |
| `logger` | 记录访问日志（IP、方法、URL、状态码、耗时） |
| `rateLimit` | 基于令牌桶的 IP 限流（60秒/120次），超限返回 429 |
| `response` | 在 `ctx` 上挂载 `success()`/`failure()` 辅助方法 |
| `exception` | 全局异常捕获，区分 `AppException`（已知业务异常）和未知异常 |

---

#### 2.2.4 缓存服务 (`cache/cache-service.ts`)

使用 Node.js 内置 `node:sqlite` 模块实现持久化缓存。

- 数据库文件：`./data/cache.db`
- 表结构：`key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER`
- 提供 `get<T>(key)` / `set(key, value)` / `delete(key)` / `close()` 方法
- 通过预编译语句（`prepare`）提升性能

---

#### 2.2.5 浏览器池 (`browser/pool.ts`)

基于 Puppeteer 的浏览器实例池，为需要执行 JavaScript 的书源提供动态页面抓取能力。

- 最大并发页面数：3
- 超出并发时排队等待
- 模拟移动端 User-Agent（Android 设备）
- 视口：375×812（iPhone X 尺寸）
- 提供 `withPage(fn)` 便捷方法，自动获取和释放页面

---

#### 2.2.6 异常体系 (`exception/`)

```
AppException（基类）
├── ValidationException     — 参数校验失败 (400)
├── SourceNotFoundException — 书源不存在 (404)
├── SourceUnavailableException — 书源不可用 (502)
└── SourceTimeoutException  — 书源请求超时 (504)
```

每个异常携带 `errorCode`（业务错误码）、`httpStatus`（HTTP 状态码）、`details`（附加信息）。

---

#### 2.2.7 日志系统 (`utils/logger.ts`)

基于 log4js，分三类日志文件（保留 90 天）：

| 分类 | 文件 | 内容 |
|------|------|------|
| 应用日志 | `logs/app.log` | 通用信息日志 |
| 访问日志 | `logs/access.log` | 每次请求的 IP、方法、URL、状态码、耗时 |
| 错误日志 | `logs/error.log` | warn 及以上级别（异常详情） |

---

## 三、业务流程详解

### 3.1 书架模块

#### 页面结构
- 顶部导航栏：标题"书架" + 搜索入口 + 帮助弹窗
- 内容区：网格布局展示书架中的书籍卡片（或空态提示）
- 每张卡片展示：封面图、书名、作者名、阅读进度条

#### 业务流程

```
用户进入书架页（首页 /）
  │
  ├─ 调用 getBookshelfWithProgress()
  │    ├─ 从 IndexedDB bookshelf 表查询全部记录（按 lastReadAt 倒序）
  │    ├─ 从 IndexedDB readHistory 表查询全部记录
  │    └─ 将两者通过 sourceId+bookId 关联，合并为 Book 类型
  │
  ├─ 书架为空 → 展示空态组件
  │
  └─ 书架非空 → 展示 BookCard 网格
       │
       └─ 用户点击某本书
            ├─ 有 lastReadChapterId（之前读过）
            │    └─ 直接跳转 /read/:sourceId/:bookId/:lastReadChapterId
            │
            └─ 无 lastReadChapterId（从未阅读）
                 ├─ 调用 API getChapters() 获取章节列表
                 └─ 跳转第一章 /read/:sourceId/:bookId/:firstChapterId
```

---

### 3.2 搜索模块

#### 页面结构
- 顶部搜索栏：返回按钮 + 搜索输入框 + 搜索按钮
- 搜索结果列表：每项展示封面、书名、字数、作者、状态、简介
- 每项操作：「书籍详情」和「加入书架」按钮

#### 业务流程

```
用户进入搜索页（/search）
  │
  ├─ 输入关键词 → 点击搜索 / 回车
  │    │
  │    ├─ 取消上一次未完成的搜索（AbortController.abort()）
  │    │
  │    ├─ 调用 bookApi.searchAll()（NDJSON 流式请求）
  │    │    │
  │    │    ├─ 服务端并行请求所有已注册书源
  │    │    │    ├─ 每个书源完成 → 推送 { type: 'result', items: [...] }
  │    │    │    ├─ 某个书源失败 → 推送 { type: 'error', message: '...' }
  │    │    │    └─ 全部完成 → 推送 { type: 'done' }
  │    │    │
  │    │    └─ 前端每收到一个 result 事件：
  │    │         ├─ 将 items 追加到搜索结果列表
  │    │         └─ 调用 sortByRelevance() 按相关度重新排序
  │    │
  │    └─ 搜索完成 → loading 变为 false
  │
  ├─ 用户点击「书籍详情」
  │    ├─ 在 sessionStorage 标记 fromDetail = '1'
  │    └─ 跳转 /detail/:sourceId/:bookId
  │
  ├─ 用户点击「加入书架」
  │    ├─ 检查 IndexedDB 中是否已存在
  │    ├─ 已存在 → 提示"该书已在书架中"
  │    └─ 不存在 → 写入 bookshelf 表 → 提示"已加入书架"
  │
  └─ 用户从详情页返回搜索页（KeepAlive 激活）
       ├─ 检测 sessionStorage fromDetail 标记
       ├─ 有标记 → 恢复滚动位置，保留搜索结果
       └─ 无标记（正常进入） → 重置搜索状态
```

---

### 3.3 书籍详情模块

#### 页面结构
- 顶部导航栏：返回按钮
- 书籍信息区：封面图、书名、作者标签、分类标签、状态标签、字数标签、最新章节、简介
- 章节目录区：标题行（"目录" + 总章节数）+ 两列章节列表

#### 业务流程

```
用户进入详情页（/detail/:sourceId/:bookId）
  │
  ├─ 并行请求：
  │    ├─ bookApi.getDetail(sourceId, bookId) → 获取书籍详情
  │    └─ bookApi.getChapters(sourceId, bookId) → 获取章节目录
  │
  │   服务端处理：
  │    ├─ 从缓存切面检查缓存 → 命中则直接返回
  │    └─ 未命中 → 调用对应书源适配器
  │         ├─ 规则驱动适配器：根据规则构建 URL → 请求 → 解析 HTML/JSON → 提取字段
  │         └─ API 适配器（QQ阅读）：直接调用对应 API
  │
  ├─ 展示书籍详情（加载态 → 骨架屏，错误 → 重试按钮）
  ├─ 展示章节目录（加载态 → 骨架屏，错误 → 重试按钮）
  │
  └─ 用户点击某章节
       └─ 跳转 /read/:sourceId/:bookId/:chapterId
```

---

### 3.4 阅读模块

#### 页面结构
- 正文区域（`ReadContent`）：居中排版，点击可切换侧边栏显隐
- 左侧操作栏（`ReadSidebar`）：目录、设置、加入书架、返回书架、回到顶部、回到底部
- 右侧翻页按钮（`ReadPagination`）：上一章 / 下一章
- 章节目录弹窗（`ReadCatalogDialog`）：可搜索筛选、滚动到当前章节
- 阅读设置弹窗（`ReadSettingsDialog`）：主题、字体、字号、字距、行距、段距、页面宽度

#### 业务流程

```
用户进入阅读页（/read/:sourceId/:bookId/:chapterId）
  │
  ├─ 初始化阅读设置 initReadSettings()
  │    ├─ 从 localStorage 加载阅读设置（主题、字体、字号等）
  │    └─ 应用 CSS 变量到 document.documentElement
  │
  ├─ 初始化阅读进度 useReadProgress()
  │    ├─ 从 IndexedDB readHistory 查询该书的阅读记录
  │    ├─ 有记录 → 提取 bookInfo + initialRecord（用于还原滚动位置）
  │    └─ 无记录 → 调用 API getDetail() 获取 bookInfo
  │
  ├─ 检查书架状态 isInBookshelf()
  │
  ├─ 获取章节列表 bookApi.getChapters()
  │
  ├─ 获取章节正文 bookApi.getContent()
  │    │
  │    │   服务端处理：
  │    │    ├─ 缓存检查 → 命中直接返回
  │    │    └─ 未命中 → 适配器抓取正文
  │    │         ├─ 标准模式：构建 URL → 请求 → 提取内容 → 清洗纯化
  │    │         ├─ 自定义模式：调用 fetchContent() → 清洗纯化
  │    │         └─ 分页正文：循环请求下一页 → 拼接内容 → 清洗纯化
  │    │
  │    ├─ 等待 ready（bookInfo 加载完成）
  │    ├─ 计算初始滚动位置 consumeInitialScroll()
  │    │    ├─ 当前章节与记录中的最后阅读章节相同 → 还原 scrollPosition
  │    │    └─ 不同 → scrollTo(0)
  │    └─ 正文渲染完成后滚动到目标位置
  │
  ├─ 阅读进度自动保存（3 个触发时机）
  │    ├─ 切换章节时 → watch(currentChapterId) → saveProgress()
  │    ├─ 滚动时 → scroll 事件 + 500ms 防抖 → saveProgress()
  │    └─ 离开页面时 → onUnmounted → saveProgress()
  │    │
  │    └─ saveProgress() 做什么：
  │         ├─ 构建 ReadHistoryRecord（包含进度百分比、滚动位置等）
  │         ├─ 写入 IndexedDB readHistory 表
  │         └─ 若该书在书架中 → 同步更新 bookshelf 表的 lastReadAt
  │
  ├─ 键盘快捷键
  │    ├─ ← 左箭头 → 上一章
  │    └─ → 右箭头 → 下一章
  │
  ├─ 切换章节（上一章/下一章/目录选择）
  │    └─ router.replace() 更新 chapterId → 触发 watch → 重新获取正文
  │
  └─ 其他操作
       ├─ 加入书架 → 调用 API getDetail() 获取完整信息 → 写入 bookshelf 表
       ├─ 返回书架 → router.push({ name: 'bookshelf' })
       └─ 阅读设置 → 打开设置弹窗 → 修改 reactive 对象 → watch 自动持久化 + 应用
```

#### 阅读设置详情

**主题配置（5 种）：**

| 主题名 | 内容背景 | 页面背景 | 文字颜色 |
|--------|---------|---------|---------|
| 默认 | `#f1f1f1` | `#e9e9e9` | `#000000e6` |
| 羊皮纸 | `#f5f0e7` | `#e6e2d6` | `#000000e6` |
| 护眼黄 | `#eee2bf` | `#e2cfa1` | `#000000e6` |
| 护眼绿 | `#ddebde` | `#c7ddc8` | `#000000e6` |
| 暗黑 | `#23272f` | `#16181d` | `#f6f7f9` |

**排版设置：**

| 设置项 | 默认值 | 范围 | 步长 |
|--------|--------|------|------|
| 字体 | 雅黑 | 雅黑/宋体/楷书/自定义 | — |
| 字号 | 17px | 12–32px | 1 |
| 字距 | 0em | 0–0.5em | 0.01 |
| 行距 | 1.9 | 1.2–3 | 0.1 |
| 段距 | 1em | 0–3em | 0.1 |
| 页面宽度 | 762px | 420–1200px | 20 |

所有设置通过 CSS 变量实时生效，变更后自动持久化到 localStorage。

---

### 3.5 完整数据流总结

```
[用户操作]
    │
    ▼
[Vue 页面组件] ──────────────────── [IndexedDB / localStorage]
    │                                    书架、阅读进度、设置
    │ HTTP 请求
    ▼
[Axios / fetch] ── /api/* 代理 ──→ [Koa 后端]
                                      │
                                      ├─ requestContext（traceId）
                                      ├─ logger（访问日志）
                                      ├─ rateLimit（IP 限流）
                                      ├─ response（统一格式）
                                      ├─ exception（异常捕获）
                                      │
                                      ▼
                                 [路由 → 适配器管理器]
                                      │
                                      ▼
                                 [适配器切面链]
                                   exception 切面
                                      │
                                   cache 切面 ←→ [SQLite 缓存]
                                      │
                                      ▼
                                 [书源适配器]
                                   ├─ RuleBasedAdapter（规则驱动）
                                   │    └─ 解析 HTML/JSON → 提取字段
                                   ├─ QQReaderAdapter（API 调用）
                                   └─ ChainedAdapter（链式 Fallback）
                                        ├─ 子书源 A
                                        └─ 子书源 B
                                              │
                                              ▼
                                         [外部书源网站]
```

---

## 四、H5 移植要点

基于本文档进行 H5 网页开发时，以下要点需要关注：

### 4.1 可完全复用的部分

| 层级 | 说明 |
|------|------|
| 后端服务 | 所有 API 接口无需变动，直接复用 |
| API 层 | `api/` 目录的请求封装和类型定义可直接迁移 |
| 数据库层 | `database/` 的 Dexie 数据库定义和服务方法可直接复用 |
| 工具函数 | `utils/` 中的 request、storage、search-relevance 可直接复用 |
| 业务逻辑 | `composables/use-read-progress.ts` 阅读进度逻辑可直接复用 |
| 阅读配置 | `config/read-theme.ts` 和 `config/read-settings.ts` 可直接复用 |
| 类型定义 | 所有 TypeScript 类型定义可直接复用 |

### 4.2 需要替换的部分

| 层级 | 说明 |
|------|------|
| UI 组件库 | Element Plus → 替换为移动端 UI 库（如 Vant、NutUI 等） |
| 布局方式 | PC 端固定最大宽度居中 → H5 全屏自适应 |
| 交互方式 | 左侧固定侧边栏 → 底部弹出面板或抽屉；dialog 弹窗 → 移动端 popup/action-sheet |
| 阅读翻页 | 右侧固定按钮 → 底部切换栏或左右滑动手势 |
| 样式变量 | `--content-max-width` 等 PC 端限制 → 移除或改为 100% |
| 搜索页面 | KeepAlive + sessionStorage 滚动恢复逻辑保持不变 |

### 4.3 页面清单（5 页）

1. **书架页**（首页）— 网格展示收藏书籍 + 进度条
2. **搜索页** — 搜索栏 + 流式加载结果列表
3. **书籍详情页** — 书籍信息 + 章节目录
4. **阅读页** — 正文显示 + 设置面板 + 目录面板 + 翻页控制
5. **404 页** — 未找到页面提示

### 4.4 核心交互保持一致

- 聚合搜索的流式加载体验
- 搜索结果的相关度排序
- 阅读进度自动保存与恢复（章节 + 滚动位置）
- 书架与阅读进度关联
- 阅读设置实时预览与持久化
- 多主题切换
