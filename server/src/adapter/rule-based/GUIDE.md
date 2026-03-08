# 书源规则编写指南

本文档详细说明如何通过声明式规则配置一个新书源，无需编写任何逻辑代码。

---

## 目录

- [快速开始](#快速开始)
- [规则结构总览](#规则结构总览)
- [FieldRule 字段提取语法](#fieldrule-字段提取语法)
  - [基础选择器](#1-基础选择器)
  - [属性提取 @](#2-属性提取-)
  - [管道处理 |](#3-管道处理-)
  - [回退 ||](#4-回退-)
  - [列表上下文中的自引用](#5-列表上下文中的自引用)
  - [组合使用](#6-组合使用)
- [URL 模板变量](#url-模板变量)
- [规则各部分详解](#规则各部分详解)
  - [基础信息与 HTTP 配置](#基础信息与-http-配置)
  - [search 搜索规则](#search-搜索规则)
  - [detail 详情规则](#detail-详情规则)
  - [chapters 章节列表规则](#chapters-章节列表规则)
  - [content 正文规则](#content-正文规则)
- [JSON 书源](#json-书源)
- [完整示例](#完整示例)
- [注意事项与排错](#注意事项与排错)

---

## 快速开始

添加一个新书源只需两步：

**第一步**：在 `server/src/adapter/sources/` 下新建规则文件，导出一个 `BookSourceRule` 对象。

```typescript
import type { BookSourceRule } from '../rule-based/types'

export const myRule: BookSourceRule = {
    sourceId: 'my-source',
    sourceName: '我的书源',
    sourceUrl: 'https://www.example.com',
    search: { /* ... */ },
    detail: { /* ... */ },
    chapters: { /* ... */ },
    content: { /* ... */ },
}
```

**第二步**：在 `server/src/adapter/index.ts` 中注册。

```typescript
import { myRule } from './sources/my-source'

const adapters = [
    // ...已有书源
    withAdapterExceptionAspect(new RuleBasedAdapter(myRule)),
]
```

---

## 规则结构总览

```
BookSourceRule
├── sourceId          书源唯一标识
├── sourceName        书源显示名称
├── sourceUrl         站点根 URL
├── sourceType?       'html'(默认) | 'json'
├── http?             HTTP 默认配置
│   ├── headers?        自定义请求头
│   ├── userAgent?      User-Agent
│   ├── timeout?        超时时间(ms)，默认 15000
│   └── charset?        字符编码，默认 utf-8
├── search            搜索规则
├── detail            书籍详情规则
├── chapters          章节列表规则
└── content           正文内容规则
```

---

## FieldRule 字段提取语法

`FieldRule` 是一个字符串，用来声明"从页面中提取什么数据"。它是整套系统的核心。

完整语法结构：

```
分支A || 分支B || 分支C
```

每个分支的结构：

```
选择器@提取方式 | 管道操作1 | 管道操作2
```

下面逐一说明。

### 1. 基础选择器

直接写 CSS 选择器，默认提取匹配元素的 **文本内容**（自动 trim）。

```
#info h1              → <h1> 标签的文本
.s2 a                 → class="s2" 下第一个 <a> 的文本
.novelslist2 li .s4   → 列表项中 class="s4" 元素的文本
```

引擎内部行为：对选择器结果调用 `.first()`，因此始终只取第一个匹配元素。

支持所有标准 CSS 选择器，包括：

| 选择器 | 说明 |
|--------|------|
| `#id` | ID 选择器 |
| `.class` | 类选择器 |
| `div > p` | 直接子元素 |
| `div p` | 后代元素 |
| `a:first-of-type` | 同类型中第一个 |
| `p:nth-of-type(2)` | 同类型中第 N 个（1-based） |
| `a + span` | 相邻兄弟 |
| `[attr=value]` | 属性选择器 |

> **注意**：不支持 jQuery 扩展伪类 `:eq()`、`:first` 等。请使用标准 CSS 伪类。

### 2. 属性提取 @

在选择器末尾追加 `@属性名`，可以提取元素的属性值而非文本。

```
.s2 a@href            → 提取 <a> 标签的 href 属性
img.cover@src         → 提取 <img> 的 src 属性
meta[name=desc]@content → 提取 <meta> 的 content 属性
```

**特殊提取方式：**

| 语法 | 含义 |
|------|------|
| `selector` | 提取文本（默认），等同于 `selector@text` |
| `selector@text` | 显式提取文本内容 |
| `selector@html` | 提取元素的 **innerHTML**（含子标签） |
| `selector@href` | 提取 href 属性 |
| `selector@src` | 提取 src 属性 |
| `selector@任意属性名` | 提取对应属性值 |

**典型用途：**

- `@href`：获取链接地址作为 bookId / chapterId
- `@html`：获取正文 HTML，后续配合 purify 管道清洗

### 3. 管道处理 |

在选择器后追加 ` | 操作`（注意 `|` 前后各有一个空格），可以对提取到的值进行后处理。支持多个管道串联。

#### 3.1 regex — 正则提取

```
selector | regex:正则表达式
```

使用正则匹配提取值。**优先返回第一个捕获组**，若无捕获组则返回完整匹配。

```
#info p:nth-of-type(3) | regex:(\d+(?:\.\d+)?[万千]?)\s*字
```

上述规则的处理流程：

1. `#info p:nth-of-type(3)` → 取到文本 `"字数：52.3万字 连载中"`
2. `regex:(\d+(?:\.\d+)?[万千]?)\s*字` → 正则匹配，捕获组 1 = `"52.3万"`
3. 最终返回 `"52.3万"`

> 若正则完全不匹配，返回空字符串 `""`。

#### 3.2 replace — 正则替换

```
selector | replace:正则模式,替换文本
```

对提取值执行正则替换。以**第一个逗号**为分隔符，逗号之前是正则模式，逗号之后是替换文本。

```
#info p:nth-of-type(1) | replace:^作\s*者[：:]\s*,
```

处理流程：

1. `#info p:nth-of-type(1)` → 取到文本 `"作 者：张三"`
2. `replace:^作\s*者[：:]\s*,` → 匹配 `"作 者："` 替换为空字符串（逗号后为空）
3. 最终返回 `"张三"`

**替换为非空文本的示例：**

```
.status | replace:连载中,连载
```

处理流程：`"连载中"` → 将 `"连载中"` 替换为 `"连载"` → `"连载"`

#### 3.3 管道串联

多个管道可以串联执行，按从左到右的顺序依次处理：

```
selector | replace:前缀:, | regex:\d+ | replace:^0+,
```

> 第一个管道的输出作为第二个管道的输入，依此类推。

### 4. 回退 ||

使用 ` || `（前后各有一个空格）连接多个分支。引擎会**从左到右**依次尝试每个分支，返回第一个**非空**结果。

```
.bookname h1 || h1 || title
```

处理流程：

1. 尝试 `.bookname h1` → 若找到且有文本，返回
2. 否则尝试 `h1` → 若找到且有文本，返回
3. 否则尝试 `title` → 返回 `<title>` 的文本
4. 全部为空则返回 `""`

**每个分支都可以独立使用 `@` 和 `|`：**

```
#intro p:nth-of-type(2) || #intro | replace:^\s+,
```

解读：

1. 先尝试 `#intro p:nth-of-type(2)` 提取第二个 `<p>` 的文本
2. 若为空，回退到 `#intro | replace:^\s+,`（取整个 intro 区域的文本并去除前导空白）

### 5. 列表上下文中的自引用

在列表遍历场景（`search.list`、`chapters.list`）中，每个字段的提取上下文是**当前迭代的元素**。

当你需要直接引用当前元素本身而非其子元素时，使用 `@` 前缀语法（不写选择器）：

| 语法 | 含义 |
|------|------|
| `@text` | 当前元素自身的文本 |
| `@href` | 当前元素自身的 href 属性 |
| `@html` | 当前元素自身的 innerHTML |
| `@data-id` | 当前元素自身的 data-id 属性 |

**典型使用场景：** 章节列表

```typescript
chapters: {
    list: '#list dd a',      // 每个 <a> 标签是一章
    fields: {
        chapterId: '@href',  // 从 <a> 自身取 href
        title: '@text',      // 从 <a> 自身取文本
    },
}
```

**对比——取子元素 vs 取自身：**

假设 HTML 为 `<li><a href="/book/1">书名</a><span>作者</span></li>`，`list: "li"`：

```
fields: {
    name:   '.a',      // → 在 <li> 中找 <a> 子元素 → "书名"   ✗ 选择器错误
    name:   'a',       // → 在 <li> 中找 <a> 子元素 → "书名"   ✓
    bookId: 'a@href',  // → 在 <li> 中找 <a> 子元素 → "/book/1" ✓
    author: 'span',    // → 在 <li> 中找 <span>     → "作者"   ✓
}
```

如果 `list: "li a"`（列表选择器直接选到 `<a>`），则：

```
fields: {
    name:   '@text',   // → <a> 自身文本 → "书名"     ✓
    bookId: '@href',   // → <a> 自身 href → "/book/1"  ✓
}
```

### 6. 组合使用

所有语法可自由组合。以下是一些综合示例：

```
// 最简单：一个选择器取文本
#info h1

// 选择器 + 属性
.s2 a@href

// 选择器 + 管道
#info p:nth-of-type(3) | regex:(连载|完结)

// 选择器 + 属性 + 管道
a.cover@href | replace:^//,https://

// 回退 + 管道
.bookname h1 || h1 | replace:\s*-\s*.*,

// 自引用 + 管道
@href | regex:/book/(\d+)

// 完整组合：回退 + 属性 + 多级管道
meta[name=description]@content | replace:简介：, | regex:^(.{200}) || #intro
```

---

## URL 模板变量

规则中所有 `url` 和 `body` 字段都支持 `{{变量名}}` 模板语法。

| 变量 | 说明 | 可用位置 |
|------|------|----------|
| `{{baseUrl}}` | 书源的 `sourceUrl` 值 | 所有 `url` 字段 |
| `{{keyword}}` | 搜索关键词（已自动 `encodeURIComponent`） | `search.url`、`search.body` |
| `{{page}}` | 页码（从 0 开始） | `search.url`、`search.body` |
| `{{bookId}}` | 书籍标识符 | `detail.url`、`chapters.url`、`content.url` |
| `{{chapterId}}` | 章节标识符 | `content.url` |

**URL 自动补全规则：**

- 若模板插值结果以 `http://` 或 `https://` 开头，直接使用
- 否则，自动拼接 `sourceUrl` 作为前缀

```typescript
// 示例：sourceUrl = 'https://www.example.com'

url: '/search?q={{keyword}}'
// → https://www.example.com/search?q=xxx

url: '{{baseUrl}}{{bookId}}'
// → https://www.example.com/book/12345  (bookId = '/book/12345')

url: 'https://api.other.com/search?q={{keyword}}'
// → https://api.other.com/search?q=xxx  (绝对 URL 不拼接)
```

---

## 规则各部分详解

### 基础信息与 HTTP 配置

```typescript
{
    sourceId: 'my-source',        // 唯一标识，用于 API 路由
    sourceName: '我的书源',        // 显示名称
    sourceUrl: 'https://example.com',  // 站点根 URL
    sourceType: 'html',           // 可选，默认 'html'

    http: {                       // 可选，HTTP 默认配置
        userAgent: '...',         // 不填则使用内置移动端 UA
        headers: {                // 额外请求头
            Referer: 'https://example.com/',
        },
        timeout: 15000,           // 超时 (ms)
    },
}
```

### search 搜索规则

定义如何搜索书籍并解析搜索结果列表。

```typescript
search: {
    url: '/search/',                       // 搜索 URL
    method: 'POST',                        // 默认 'GET'
    body: 'searchkey={{keyword}}&Submit=',  // POST body 模板
    contentType: 'application/x-www-form-urlencoded',  // 默认值

    list: '.novelslist2 li',    // 结果列表的 CSS 选择器
    excludePattern: '^作品名称$', // 可选，匹配 name 时跳过该项（如表头）
    cooldown: 120000,            // 可选，搜索冷却 (ms)

    fields: {
        name: '.s2 a',           // [必填] 书名
        bookId: '.s2 a@href',    // [必填] 书籍 ID（传递给 detail/chapters）
        author: '.s4',           // [可选] 作者
        intro: '.intro',         // [可选] 简介
        latestChapter: '.s3 a',  // [可选] 最新章节
        wordCount: '.s5',        // [可选] 字数
        status: '.s7',           // [可选] 状态
    },
}
```

**关键说明：**

- `list` 选择器选中的是**每一个搜索结果条目**的容器元素
- `fields` 中的选择器是相对于每个条目元素的**子元素查找**
- `name` 和 `bookId` 为空的条目会被自动过滤
- `cooldown` 启用后，冷却期内相同关键词会返回缓存结果，不同关键词则抛出错误

### detail 详情规则

定义如何获取书籍详情页面的字段。

```typescript
detail: {
    url: '{{baseUrl}}{{bookId}}',  // 详情页 URL

    fields: {
        name: '#info h1',          // [必填] 书名
        author: '#info p:nth-of-type(1) | replace:^作\\s*者[：:]\\s*,',  // [必填]
        intro: '#intro p:nth-of-type(2) || #intro',  // [可选]
        latestChapter: '#list a',  // [可选]
        wordCount: '#info p:nth-of-type(3) | regex:(\\d+(?:\\.\\d+)?[万千]?)\\s*字',
        status: '#info p:nth-of-type(3) | regex:(连载|连载中|完结|已完结)',
        category: '.con_top a:nth-of-type(2)',  // [可选]
    },
}
```

**关键说明：**

- 详情页是**页面级别**提取，选择器作用于整个文档
- 同一个元素可以在不同字段中复用（如同一个 `<p>` 提取字数和状态）

### chapters 章节列表规则

定义如何获取章节目录。

```typescript
chapters: {
    url: '{{baseUrl}}{{bookId}}',
    list: '#list dd a',       // 每章对应的元素选择器

    fields: {
        chapterId: '@href',   // [必填] 章节 ID（传递给 content）
        title: '@text',       // [必填] 章节标题
    },

    // 可选：章节列表分页
    pagination: {
        nextSelector: '.next a',  // "下一页"链接的选择器（取其 href）
        maxPages: 50,             // 最大翻页数（防止死循环），默认 50
    },
}
```

**分页处理流程：**

1. 请求第一页，提取章节列表
2. 使用 `nextSelector` 查找"下一页"链接
3. 若找到 href，请求下一页并追加章节
4. 重复直到无下一页链接或达到 `maxPages` 上限

### content 正文规则

定义如何获取章节正文内容。

```typescript
content: {
    url: '{{baseUrl}}{{chapterId}}',

    fields: {
        title: '.bookname h1 || h1 || title',  // [必填] 章节标题
        content: '#content@html',               // [必填] 正文内容
    },

    // 可选：内容清洗管道
    purify: {
        brToNewline: true,      // <br> / <br/> 转为换行符 \n （默认 true）
        stripNbsp: true,        // &nbsp; 转为普通空格         （默认 true）
        removeSelectors: [      // 提取前移除的元素（广告/版权声明等）
            '.ad',
            'script',
            '.copyright',
        ],
        trimLines: true,        // 每行 trim                   （默认 true）
        filterEmpty: true,      // 过滤空行                    （默认 true）
    },
}
```

**正文清洗流程（当 purify 存在时）：**

```
原始 HTML 文档
  ↓ removeSelectors → 从 DOM 中移除广告/脚本等元素
  ↓ extractHtmlField → 通过 fields.content 规则提取（通常用 @html 取 innerHTML）
  ↓ brToNewline → <br> 标签转换为 \n
  ↓ stripNbsp → &nbsp; 转为空格
  ↓ 去除剩余 HTML 标签 → 得到纯文本
  ↓ trimLines → 每行 trim
  ↓ filterEmpty → 去掉空行
  ↓ 最终纯文本内容
```

> **提示**：`content` 字段通常使用 `@html` 提取 innerHTML，然后依赖 `purify` 管道清洗成纯文本。如果站点正文本身就是纯文本（无 HTML 标签），可以直接用 `@text` 并省略 `purify`。

---

## JSON 书源

对于返回 JSON 数据的 API 类书源，设置 `sourceType: 'json'`。

此时所有 `FieldRule` 中的"选择器"改为 **JSON 路径语法**，而非 CSS 选择器。

### JSON 路径语法

```
$                     → 根对象自身
$.name                → root.name
$.data.bookInfo.title → root.data.bookInfo.title
$.list[0].name        → root.list[0].name
```

- 以 `$.` 开头，用 `.` 分隔层级
- 支持数组下标 `[N]`
- 管道操作（`| regex:` / `| replace:`）和回退（`||`）同样适用

### JSON 书源的列表

- `list` 字段使用 JSON 路径指向数组：`$.data.booklist`
- `fields` 中的路径相对于数组中的**每个元素**：`$.title` 表示 `item.title`

### 示例

```typescript
const myJsonRule: BookSourceRule = {
    sourceId: 'my-api',
    sourceName: '某 API 书源',
    sourceUrl: 'https://api.example.com',
    sourceType: 'json',

    search: {
        url: '/search?keyword={{keyword}}&page={{page}}',
        list: '$.data.books',
        fields: {
            name: '$.title',
            bookId: '$.id',
            author: '$.author',
            status: '$.status | replace:1,连载 | replace:2,完结',
        },
    },

    detail: {
        url: '/book/{{bookId}}',
        fields: {
            name: '$.data.title',
            author: '$.data.author',
            intro: '$.data.summary',
        },
    },

    chapters: {
        url: '/book/{{bookId}}/chapters',
        list: '$.data.chapters',
        fields: {
            chapterId: '$.id',
            title: '$.title',
        },
    },

    content: {
        url: '/chapter/{{chapterId}}',
        fields: {
            title: '$.data.title',
            content: '$.data.content',
        },
    },
}
```

---

## 完整示例

以下是一个真实的 HTML 书源规则（抖音小说），展示了所有语法的实际运用：

```typescript
import type { BookSourceRule } from '../rule-based/types'

export const douyinxsRule: BookSourceRule = {
    sourceId: 'douyinxs',
    sourceName: '抖音小说',
    sourceUrl: 'https://www.douyinxs.com',

    http: {
        userAgent:
            'Mozilla/5.0 (Linux; Android 10; V1824A Build/QP1A.190711.020) ...',
        headers: {
            Referer: 'https://www.douyinxs.com/',
        },
    },

    search: {
        url: '/search/',
        method: 'POST',
        body: 'searchkey={{keyword}}&Submit=',
        contentType: 'application/x-www-form-urlencoded',
        list: '.novelslist2 li',
        excludePattern: '^作品名称$',
        cooldown: 120000,
        fields: {
            name: '.s2 a',
            bookId: '.s2 a@href',
            author: '.s4',
            latestChapter: '.s3 a',
            wordCount: '.s5',
            status: '.s7',
        },
    },

    detail: {
        url: '{{baseUrl}}{{bookId}}',
        fields: {
            name: '#info h1',
            author: '#info p:nth-of-type(1) | replace:^作\\s*者[：:]\\s*,',
            intro: '#intro p:nth-of-type(2) || #intro',
            latestChapter: '#list a',
            wordCount:
                '#info p:nth-of-type(3) | regex:(\\d+(?:\\.\\d+)?[万千]?)\\s*字',
            status:
                '#info p:nth-of-type(3) | regex:(连载|连载中|完结|已完结)',
            category: '.con_top a:nth-of-type(2)',
        },
    },

    chapters: {
        url: '{{baseUrl}}{{bookId}}',
        list: '#list dd a',
        fields: {
            chapterId: '@href',
            title: '@text',
        },
    },

    content: {
        url: '{{baseUrl}}{{chapterId}}',
        fields: {
            title: '.bookname h1 || h1 || title',
            content: '#content@html',
        },
        purify: {
            brToNewline: true,
            stripNbsp: true,
            trimLines: true,
            filterEmpty: true,
        },
    },
}
```

---

## 注意事项与排错

### TypeScript 字符串中的反斜杠

在 `.ts` 文件中编写正则时，需要**双重转义**：

```typescript
// TS 源码              → 实际传给 new RegExp() 的字符串
'\\d+'                  → \d+
'\\s*'                  → \s*
'[：:]'                 → [：:]   （无需转义）
'^作\\s*者[：:]\\s*,'   → ^作\s*者[：:]\s*,
```

如果将来改为 JSON 文件存储规则，JSON 同样需要双重转义：

```json
"author": "#info p | replace:^作\\s*者[：:]\\s*,"
```

### 常见排错清单

| 现象 | 可能原因 |
|------|----------|
| 字段始终为空 | 选择器不匹配，用浏览器 DevTools 确认 |
| 选择器匹配了错误元素 | 确认 `:nth-of-type` vs `:nth-child` 的区别 |
| 管道不生效 | 检查 ` \| ` 前后是否有空格（必须有） |
| 回退不生效 | 检查 ` \|\| ` 前后是否有空格（必须有） |
| 正则不匹配 | 确认 TS 中反斜杠已双重转义 |
| replace 结果不对 | 分隔符是**第一个逗号**，模式中不要出现逗号 |
| bookId/chapterId 为空 | 确认 `@href` 取到的值非空 |
| 详情页取不到内容 | `:nth-of-type` 是同类型计数，确认 HTML 结构 |

### `:nth-child` vs `:nth-of-type`

这是一个常见的坑：

```html
<div id="info">
  <h1>书名</h1>       <!-- 第1个子元素 -->
  <p>作者：张三</p>    <!-- 第2个子元素，第1个 <p> -->
  <p>更新：2024</p>    <!-- 第3个子元素，第2个 <p> -->
  <p>字数：50万</p>    <!-- 第4个子元素，第3个 <p> -->
</div>
```

- `#info p:nth-child(1)` → **不匹配**（第1个子元素是 `<h1>` 不是 `<p>`）
- `#info p:nth-of-type(1)` → `"作者：张三"` ✓ （第1个 `<p>` 类型的子元素）
- `#info p:nth-of-type(3)` → `"字数：50万"` ✓

**结论**：当父元素下有不同类型的子元素混合时，始终使用 `:nth-of-type`。

### 保留字符

| 字符序列 | 用途 | 在选择器中安全? |
|----------|------|----------------|
| ` \| ` | 管道分隔符 | 安全（CSS 中 `\|` 仅出现在 `\|=` 属性选择器内，不含空格） |
| ` \|\| ` | 回退分隔符 | 安全（CSS 选择器中不存在此序列） |
| `@` | 提取方式指示符 | 安全（CSS 选择器中不使用 `@`） |
| `{{` / `}}` | URL 模板变量 | 不在 FieldRule 中使用，仅在 url/body 中 |
