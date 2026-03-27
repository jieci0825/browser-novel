# 阅读器重构 TODO

> 基于 `read-refactor-plan.md` 拆解的实施任务清单。
> 每个任务遵循**最小职责**原则，且标注了**验证方式**。
> 带 🔒 标记的任务表示存在前置依赖。

---

## 阶段一：类型定义与配置扩展

> 目标：为后续所有模块提供类型基础和配置入口，不涉及任何 UI 或逻辑变更。

### 1.1 创建 `types/reader.ts` — 核心类型定义

- [ ] 定义 `ReadMode` 类型（`'paginated' | 'scroll'`）
- [ ] 定义 `AnimationType` 类型（`'slide' | 'cover' | 'simulation' | 'none'`）
- [ ] 定义 `ParagraphSlice` 类型（`paragraphIndex` / `text` / `isPartial`）
- [ ] 定义 `Page` 类型（`paragraphs: ParagraphSlice[]`）
- [ ] 定义 `PaginationResult` 类型（`pages: Page[]` + 元信息）
- [ ] 定义 `ChapterCache` 类型（`content: ChapterContent` / `pages?: Page[]`）
- [ ] 定义 `ReadProgress` 类型（分页进度 + 滚动进度的联合类型）

**验证**：TypeScript 编译通过，无类型错误；其他文件可正常 import 这些类型。

---

### 1.2 扩展 `config/read-settings.ts` — 新增阅读模式与动画类型

- [ ] 在 `ReadSettings` 接口中新增 `readMode: ReadMode` 字段
- [ ] 在 `ReadSettings` 接口中新增 `animationType: AnimationType` 字段
- [ ] 在 `DEFAULT_SETTINGS` 中为两个新字段设定默认值（`readMode: 'paginated'`，`animationType: 'slide'`）
- [ ] 确保 `watch` 持久化逻辑覆盖新字段（已有的通用 watch 应自动覆盖，需确认）

**验证**：修改设置后刷新页面，从 localStorage 中能读回新字段值；`readSettings.readMode` 和 `readSettings.animationType` 在组件中可响应式访问。

---

## 阶段二：文本分页引擎

> 目标：实现纯逻辑层的文本分页能力，不依赖任何阅读器 UI 组件。

### 2.1 创建 `composables/use-pagination.ts` — 测量容器管理

- [ ] 实现 `createMeasureContainer()` 函数：创建隐藏 DOM 容器，样式与阅读区域一致（position: absolute / visibility: hidden / 对应宽度）
- [ ] 实现 `syncMeasureStyles()` 函数：根据当前 `readSettings`（字号/行高/字距/段距/字体）同步测量容器的 CSS 属性
- [ ] 实现 `destroyMeasureContainer()` 函数：清理 DOM
- [ ] 在 composable 生命周期内自动创建和销毁测量容器

**验证**：调用后 DOM 中出现隐藏测量容器；通过 DevTools 检查其 CSS 属性与阅读区域一致；组件卸载后容器被移除。

---

### 🔒 2.2 段落级分页 — 基础分页逻辑（依赖 2.1）

- [ ] 实现 `paginate(paragraphs: string[], pageHeight: number): PaginationResult`
- [ ] 将段落数组以 `<p>` 插入测量容器
- [ ] 批量读取每个 `<p>` 的 `offsetTop` / `offsetHeight`
- [ ] 按 `pageHeight` 累加切分：整段归页或整段移入下一页
- [ ] 对于高度 ≤ `pageHeight` 的段落，不进行段内拆分（此步骤仅处理整段）
- [ ] 对于高度 > `pageHeight` 的超长段落，暂时整段放入一页（标记待拆分），留给 2.3 处理

**验证**：传入一组普通段落（每段不超过一页高度），返回合理的分页结果；页数 = ceil(总内容高度 / pageHeight) ±1；每页的段落连续且不重叠。

---

### 🔒 2.3 段内按行切分 — 超长段落处理（依赖 2.2）

- [ ] 实现 `splitParagraphByLines(pElement: HTMLParagraphElement, remainingHeight: number, pageHeight: number): ParagraphSlice[]`
- [ ] 使用 Range + getClientRects 逐字符检测行边界
- [ ] 按行累加高度，确定段落内的分页切分点
- [ ] 生成 `ParagraphSlice`（标记 `isPartial: true`）
- [ ] 将此函数集成到 2.2 的 `paginate` 流程中，替换超长段落的占位逻辑

**验证**：传入一个超过 3 页高度的超长段落，分页结果中该段落被拆为多个 `ParagraphSlice`，每个 slice 的文本拼接后等于原段落文本，且每页高度不超过 `pageHeight`。

---

### 🔒 2.4 分页缓存机制（依赖 2.2）

- [ ] 实现缓存键生成函数：`buildCacheKey(sourceId, bookId, chapterId, settings, containerSize) → string`
- [ ] 实现分页结果缓存的存取（Map 结构，内存级）
- [ ] 实现缓存清理策略：仅保留当前章 ± 1 章的缓存
- [ ] 排版参数变化时清空全部缓存
- [ ] 将缓存层集成到 `paginate` 流程：先查缓存、命中则跳过测量

**验证**：相同参数二次调用 `paginate` 不触发 DOM 测量（可通过计数或日志确认）；改变字号后缓存失效，重新测量。

---

### 🔒 2.5 分页参数变化时的位置保持（依赖 2.2）

- [ ] 实现 `locatePositionBeforePaginate(currentPageIndex, pages): { paragraphIndex, charOffset }`：记录当前阅读位置
- [ ] 实现 `resolvePageAfterPaginate(position, newPages): number`：根据段落索引 + 字符偏移在新分页中找到对应页码
- [ ] 导出这两个工具函数供外部使用

**验证**：模拟"用户在第 5 页，改变字号后重新分页"的场景，新页码指向的内容与旧页码一致（同一段落同一位置）。

---

## 阶段三：左右分页阅读器 — 基础渲染

> 目标：实现可以静态展示分页内容的组件，不含翻页交互。

### 🔒 3.1 创建 `paged-reader.vue` — 三槽位 DOM 结构（依赖阶段二）

- [ ] 创建组件，接收 props：`pages: Page[]` / `currentPageIndex: number` / `chapterTitle: string`
- [ ] 实现三个 DOM 槽位：prevPage / currentPage / nextPage
- [ ] 根据 `currentPageIndex` 渲染 currentPage 的段落内容
- [ ] prevPage 和 nextPage 分别渲染前后页内容（不可见，供后续动画使用）
- [ ] 处理边界：首页无 prevPage、末页无 nextPage

**验证**：传入分页数据后，组件正确渲染当前页内容；通过 DevTools 确认三个槽位 DOM 存在且内容正确。

---

### 🔒 3.2 集成分页引擎到 `paged-reader.vue`（依赖 2.2 + 3.1）

- [ ] 在组件内调用 `usePagination` 对章节内容执行分页
- [ ] 监听 `readSettings` 变化，触发重新分页 + 位置保持（调用 2.5）
- [ ] 监听窗口 resize（debounce 300ms），触发重新分页 + 位置保持

**验证**：组件挂载后自动完成分页并显示第一页；改变字号后页面内容重新排版，阅读位置不丢失。

---

## 阶段四：翻页手势识别

> 目标：独立的手势识别模块，输出翻页意图，不直接操作 DOM 或动画。

### 4.1 创建 `composables/use-page-gesture.ts` — 手势与点击识别

- [ ] 实现 touch 事件监听：touchstart / touchmove / touchend
- [ ] 水平滑动判定：水平距离 > 30px 且水平距离 > 垂直距离 → 翻页手势
- [ ] 滑动方向判定：左滑 = 下一页，右滑 = 上一页
- [ ] 点击区域判定：左 1/3 = 上一页，右 1/3 = 下一页，中 1/3 = 工具栏切换
- [ ] 手势进行中的实时位移回调（供动画跟手使用）
- [ ] 导出事件：`onSwipe(direction)` / `onTap(zone)` / `onDragging(offsetX)`

**验证**：在空白页面绑定手势，通过 console.log 确认：左滑输出"next"、右滑输出"prev"、点击中间输出"toggle-toolbar"、点击左侧输出"prev"、点击右侧输出"next"。

---

### 🔒 4.2 将手势集成到 `paged-reader.vue`（依赖 3.1 + 4.1）

- [ ] 绑定 `usePageGesture` 到分页阅读器容器
- [ ] `onSwipe("next")` / `onTap("next")` → 切换到下一页（直接切换，暂无动画）
- [ ] `onSwipe("prev")` / `onTap("prev")` → 切换到上一页
- [ ] `onTap("toggle-toolbar")` → emit 事件给父组件
- [ ] 首页向前翻 / 末页向后翻时不响应（或 emit 章节边界事件）

**验证**：在分页阅读器中，左滑/右滑/点击可正确翻页；翻到章节首页继续向前翻无反应；翻到末页继续向后翻无反应。

---

## 阶段五：翻页动画

> 目标：逐个实现四种翻页动画，每种动画独立可测试。

### 5.1 定义动画接口 — `animations/` 模块约定

- [ ] 定义 `PageAnimation` 接口（或抽象类型），约定统一的方法签名：
  - `start(direction, prevEl, currentEl, nextEl)`
  - `update(offsetX)` — 跟手更新
  - `finish(completed: boolean)` — 完成翻页或回弹
  - `destroy()` — 清理
- [ ] 将接口定义写入 `types/reader.ts`

**验证**：类型定义无编译错误；四种动画文件可 implements 该接口。

---

### 🔒 5.2 实现 `none-animation.ts` — 无动画（依赖 5.1）

- [ ] 实现 `PageAnimation` 接口
- [ ] `finish(true)` 时直接切换可见性，无过渡
- [ ] `finish(false)` 时保持原状

**验证**：调用 start → finish(true)，目标页立即可见，原页隐藏；调用 finish(false)，原页不变。

---

### 🔒 5.3 实现 `slide-animation.ts` — 平移动画（依赖 5.1）

- [ ] `update(offsetX)` 时，currentPage 和 nextPage 同步 translateX
- [ ] `finish(true)` 时，CSS transition 过渡到终态
- [ ] `finish(false)` 时，CSS transition 回弹到起始位置
- [ ] transition 结束后清理 transform 和 transition 属性

**验证**：跟手拖动时两页同步移动；松手后根据偏移量平滑过渡到终态或回弹；无残留 CSS 属性。

---

### 🔒 5.4 实现 `cover-animation.ts` — 覆盖动画（依赖 5.1）

- [ ] 向后翻：nextPage 从右侧滑入覆盖 currentPage，附带阴影
- [ ] 向前翻：currentPage 向右滑出，nextPage 不动
- [ ] `update(offsetX)` 跟手
- [ ] `finish(true/false)` 过渡或回弹

**验证**：向后翻时新页面从右滑入并带阴影；向前翻时当前页右滑移出；回弹正常。

---

### 🔒 5.5 创建 `composables/use-page-animation.ts` — 动画调度器（依赖 5.2 ~ 5.4）

- [ ] 根据 `readSettings.animationType` 选择对应的动画实例
- [ ] 封装 `startAnimation` / `updateAnimation` / `finishAnimation` 方法
- [ ] 动画进行中锁定状态，阻止重复触发
- [ ] `animationType` 变更时切换动画实例

**验证**：切换动画类型后，下次翻页使用新的动画效果；动画进行中再次翻页不会产生错乱。

---

### 🔒 5.6 将动画集成到 `paged-reader.vue`（依赖 4.2 + 5.5）

- [ ] 替换 4.2 中的"直接切换"为动画驱动的翻页
- [ ] 手势 `onDragging` → `updateAnimation`（跟手）
- [ ] 手势结束 → 根据偏移量和速度判定完成/回弹 → `finishAnimation`
- [ ] 动画完成回调中执行页码更新和槽位轮转

**验证**：四种动画模式下翻页交互均流畅；跟手拖动 + 松手过渡 + 回弹均正常。

---

## 阶段六：章节预加载与跨章衔接

> 目标：实现章节数据缓存和无缝切章能力。

### 6.1 创建 `composables/use-chapter-preloader.ts` — 章节缓存管理

- [ ] 实现章节内容缓存池（`Map<chapterId, ChapterCache>`）
- [ ] 实现 `loadChapter(chapterId)` — 请求并缓存章节数据（支持 AbortController 取消）
- [ ] 实现 `preloadAdjacentChapters(currentChapterId, chapterList)` — 预加载前后各 1 章
- [ ] 实现缓存淘汰：超出当前章 ±1 范围的自动清理
- [ ] 暴露 `getChapter(chapterId)` 同步获取已缓存数据

**验证**：加载当前章后，前后章自动预加载；缓存池中始终 ≤3 章数据；跳转到远距离章节时旧缓存被清理。

---

### 🔒 6.2 分页模式下的跨章翻页（依赖 3.2 + 6.1）

- [ ] 末页继续向后翻 → 自动加载并切换到下一章第一页
- [ ] 首页继续向前翻 → 自动加载并切换到上一章最后一页
- [ ] 下一章数据未就绪时显示 loading 占位页
- [ ] 加载失败时显示错误页（带重试按钮）
- [ ] 边界处理：第一章向前 / 最后一章向后 → toast 提示

**验证**：翻到章节末尾继续翻页进入下一章第一页，过程无白屏；网络慢时出现 loading 态；第一章/最后一章边界有提示。

---

### 🔒 6.3 预加载触发时机优化（依赖 6.1 + 6.2）

- [ ] 分页模式：翻到当前章倒数第 3 页或正数第 3 页时触发预加载
- [ ] 分页模式下预加载完成后，利用 `requestIdleCallback` 执行分页计算并缓存

**验证**：翻到倒数第 3 页时 Network 面板出现下一章的请求；预加载完成后翻到下一章时无需等待分页计算。

---

## 阶段七：容器组件改造（index.vue）

> 目标：改造入口组件，支持模式切换和路由两种阅读器。

### 🔒 7.1 index.vue — 模式路由（依赖 3.2 + 阶段六）

- [ ] 根据 `readSettings.readMode` 条件渲染 `PagedReader` 或 `ScrollReader`（ScrollReader 此时可先用占位）
- [ ] 抽离章节数据加载逻辑到 `useChapterPreloader`，替代现有直接 API 调用
- [ ] 保留工具栏、目录弹窗、设置弹窗的集成逻辑
- [ ] 移除原有 `read-content.vue` 的引用（被新组件替代）

**验证**：`readMode = 'paginated'` 时显示分页阅读器；切换模式后显示对应组件；工具栏/目录/设置弹窗功能不受影响。

---

### 🔒 7.2 扩展 `read-settings-popup.vue` — 新增模式与动画选项（依赖 1.2）

- [ ] 新增"阅读模式"切换区域（分页 / 滚动）
- [ ] 新增"翻页动画"选择区域（仅在分页模式下显示：平移 / 覆盖 / 仿真 / 无）
- [ ] 切换时直接修改 `readSettings`，由响应式系统驱动视图更新

**验证**：设置弹窗中新增选项可正常切换；切换后 `readSettings` 值更新且持久化到 localStorage。

---

## 阶段八：上下滚动模式

> 目标：实现滚动阅读器，支持无缝章节加载。

### 🔒 8.1 创建 `scroll-reader.vue` — 基础滚动结构（依赖 6.1）

- [ ] 创建可滚动容器，使用原生 scroll
- [ ] 接收章节数据，按段落渲染当前章内容
- [ ] 每个章节容器标记 `data-chapter-id`
- [ ] 章节间显示标题分隔

**验证**：组件正常渲染章节内容，可手动滚动；DOM 结构中有 `data-chapter-id` 标记。

---

### 🔒 8.2 向下无缝加载（依赖 8.1 + 6.1）

- [ ] 监听 scroll 事件（throttle），距底部 < 500px 时加载下一章
- [ ] 下一章数据 append 到容器底部，滚动位置自然连续
- [ ] 加载中显示 loading 指示器
- [ ] 最后一章时不触发加载，显示"已读完全部章节"

**验证**：滚到底部附近自动加载下一章，内容无缝拼接；滚动位置无跳变。

---

### 🔒 8.3 向上无缝加载（依赖 8.1 + 6.1）

- [ ] 距顶部 < 阈值时加载上一章，prepend 到容器顶部
- [ ] prepend 后修正 `scrollTop`（+= 新插入高度），保持视觉位置不跳变
- [ ] 第一章时不触发加载

**验证**：滚到顶部附近自动加载上一章；加载前后视觉位置不发生跳动。

---

### 🔒 8.4 当前章节识别（依赖 8.2 + 8.3）

- [ ] 使用 IntersectionObserver 或 scroll 位置计算，判定视口中占比最大的章节
- [ ] 当前章节变化时 `router.replace` 更新路由参数
- [ ] 当前章节变化时触发预加载相邻章节

**验证**：滚动过程中，路由参数中的 `chapterId` 随当前可视章节实时变化。

---

### 🔒 8.5 滚动模式内存管理（依赖 8.2 + 8.3）

- [ ] 已加载章节数 > 5 时，移除距当前最远的章节 DOM
- [ ] 移除时修正 `scrollTop`，保持视觉位置不跳变

**验证**：连续滚过 6 章以上，DOM 中章节节点数量始终 ≤ 5；移除后滚动位置不跳动。

---

## 阶段九：阅读进度适配

> 目标：改造进度系统，适配两种模式的进度存储与恢复。

### 🔒 9.1 改造 `use-read-progress.ts` — 双模式进度（依赖阶段三 + 阶段八）

- [ ] 分页模式：进度记录 `chapterId` + `pageIndex` + `paragraphIndex` + `charOffset`（双保险）
- [ ] 滚动模式：进度记录 `chapterId` + `paragraphIndex` + `paragraphOffsetRatio`
- [ ] 分页模式恢复：根据 `pageIndex` 直接跳转（若失效则用 `paragraphIndex + charOffset` 重定位）
- [ ] 滚动模式恢复：滚动到对应段落位置

**验证**：分页模式下退出再进入，回到上次阅读页；滚动模式下退出再进入，回到上次阅读位置。

---

### 🔒 9.2 模式切换时的位置同步（依赖 9.1）

- [ ] 从分页切换到滚动：根据当前页码的首段落，计算滚动目标位置
- [ ] 从滚动切换到分页：根据当前 scrollTop 找到可见段落，定位到包含该段落的页码
- [ ] 切换时不重新请求章节数据

**验证**：在分页模式阅读到第 10 页，切换到滚动模式后定位到对应内容区域；反向切换同理。

---

## 阶段十：仿真翻页动画（独立低优先级）

> 目标：实现 Canvas 仿真翻页效果，因复杂度高单独一个阶段。

### 🔒 10.1 页面快照 — Canvas 绘制文本（依赖阶段二分页结果）

- [ ] 实现 `renderPageToCanvas(page: Page, settings): HTMLCanvasElement`
- [ ] 根据分页结果的段落和排版参数，用 `ctx.fillText` 逐行绘制文本
- [ ] 处理段首缩进、行高、字距等排版细节

**验证**：输出的 Canvas 显示内容与 DOM 渲染的分页内容视觉一致。

---

### 🔒 10.2 实现 `simulation-animation.ts` — 仿真翻页动画（依赖 5.1 + 10.1）

- [ ] 根据触摸点计算贝塞尔曲线控制点
- [ ] Canvas 绘制：底层下一页 + 卷曲区域当前页 + 阴影
- [ ] `update(offsetX)` 实时跟手，`requestAnimationFrame` 驱动
- [ ] `finish()` 过渡动画或回弹
- [ ] 性能保护：低端设备检测，自动降级为 cover 动画

**验证**：翻页时出现纸张卷曲效果，跟手流畅；低端设备自动降级。

---

## 阶段十一：边界处理与收尾

> 目标：处理各类边界场景，完善用户体验。

### 🔒 11.1 空章节与错误处理

- [ ] 空章节显示占位页"本章暂无内容"
- [ ] 章节加载失败显示错误页（带重试按钮）
- [ ] 快速连续翻页穿越多章时，取消旧请求（AbortController），只保留最新请求

**验证**：空章节不崩溃，显示占位；断网后显示错误页可重试。

---

### 🔒 11.2 目录跳转适配

- [ ] 目录选章后清空预加载缓存中与新位置无关的数据
- [ ] 加载目标章节，分页模式定位第一页 / 滚动模式定位顶部

**验证**：从目录跳转到任意章节，两种模式下均正确加载并定位到章节开头。

---

### 🔒 11.3 翻页手势防冲突

- [ ] 分页模式下阻止默认的垂直滚动
- [ ] 动画进行中忽略新手势，或快速完成当前动画后再响应
- [ ] 滑动距离不足时回弹（< 页宽 1/3 且速度 < 阈值）

**验证**：分页模式下无垂直滚动；快速连续翻页不产生动画错乱；短距离滑动正确回弹。

---

### 11.4 清理旧代码

- [ ] 移除不再使用的 `read-content.vue` 组件
- [ ] 清理 `index.vue` 中原有的滚动相关逻辑（已被 ScrollReader 接管）
- [ ] 清理 `use-read-progress.ts` 中已废弃的旧进度逻辑

**验证**：无死代码残留；项目编译通过，无 warning。

---

## 依赖关系总览

```
阶段一（类型 + 配置）
  │
  ├──→ 阶段二（分页引擎）
  │      │
  │      ├──→ 阶段三（分页阅读器基础渲染）
  │      │      │
  │      │      ├──→ 阶段四（手势识别 + 集成）
  │      │      │      │
  │      │      │      └──→ 阶段五（翻页动画）
  │      │      │             │
  │      │      │             └──→ 阶段十（仿真翻页，可延后）
  │      │      │
  │      │      └──→ 阶段六（章节预加载 + 跨章）
  │      │             │
  │      │             ├──→ 阶段七（容器组件改造）
  │      │             │
  │      │             └──→ 阶段八（滚动模式）
  │      │
  │      └──→ 阶段九（进度适配，依赖阶段三 + 阶段八）
  │
  └──→ 阶段七.2（设置弹窗扩展，仅依赖 1.2）

阶段十一（边界处理）← 依赖阶段三 ~ 阶段九 基本完成
```

---

## 推荐实施顺序

| 优先级 | 阶段 | 说明 |
|--------|------|------|
| P0 | 阶段一 | 基础设施，所有后续任务的前提 |
| P0 | 阶段二 | 核心引擎，分页模式的基石 |
| P0 | 阶段三 | 让分页内容可以展示出来 |
| P0 | 阶段四 | 让翻页可以交互 |
| P1 | 阶段五（5.1 ~ 5.4） | 动画效果，提升体验 |
| P1 | 阶段六 | 跨章无缝衔接 |
| P1 | 阶段七 | 入口组件改造，整合所有模块 |
| P1 | 阶段七.2 | 设置 UI 扩展（可与阶段七并行） |
| P2 | 阶段八 | 滚动模式（次要模式，可后做） |
| P2 | 阶段九 | 进度系统适配 |
| P3 | 阶段十 | 仿真翻页（复杂度最高，优先级最低） |
| P3 | 阶段十一 | 边界处理与收尾 |
