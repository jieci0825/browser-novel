# 分页算法设计：基于 Range API 的行级精确分页

## 旧方案的问题

旧方案以**整段落**为粒度进行分页：将所有段落一次性放入测量容器，测量每个 `<p>` 的 `offsetTop` 和 `offsetHeight`，然后按页面高度边界将段落分配到不同页面。

核心缺陷：

1. **无法段内截断** —— 一个段落要么整体放入当前页，要么整体推到下一页。当段落在页面边界处只有部分行能显示时，要么溢出（半行可见），要么底部留白。
2. **超高段落未拆分** —— 高度超过一页的段落被强行塞入单页，实际渲染必然溢出。
3. **字号变化后不一致** —— 粒度太粗，字号调整导致行数变化时，分页结果与视觉显示不匹配。

## 新方案：逐段填充 + Range API 二分截断

### 整体流程

```
遍历每个段落:
  ├── 计算当前页剩余高度 (扣除已用高度和段间距)
  ├── 在测量容器中渲染当前段落文本，得到内容高度
  ├── 如果放得下 → 整段加入当前页
  └── 如果放不下 → Range API 二分查找截断点
       ├── 截断前的文本留在当前页 (isPartial = true)
       ├── 翻页
       └── 截断后的剩余文本在新页重复上述流程
```

### 关键技术：Range API 二分查找

`Range` 是浏览器提供的 DOM 接口，可以精确选中文本节点中任意字符区间，并获取该区间的实际渲染矩形。

#### 原理

将段落文本放入 `<p>` 元素后，获取其 `Text` 节点。通过 `Range` 选中 `[0, mid)` 个字符，调用 `getBoundingClientRect()` 获取渲染高度。由于文本是逐行排列的，高度是**阶梯函数**——在同一行内高度不变，换行时突然跳变：

```
字符数:  1  2  3 ... 15 | 16 17 ... 30 | 31 32 ...
height: 32 32 32 ... 32 | 65 65 ... 65 | 97 97 ...
         ─── 第1行 ───   ─── 第2行 ───   ─── 第3行 ───
```

二分查找在这个阶梯函数上寻找**最后一个使 `height ≤ availableHeight` 的字符位置**，即换行跳变的边界。由于阶梯函数的性质，结果必然落在某一行的最后一个字符上，天然对齐行边界。

#### 实现

```typescript
function findSplitPoint(textNode: Text, availableHeight: number): number {
    const range = document.createRange()
    let lo = 1, hi = textNode.length

    while (lo < hi) {
        const mid = (lo + hi + 1) >>> 1
        range.setStart(textNode, 0)
        range.setEnd(textNode, mid)
        if (range.getBoundingClientRect().height <= availableHeight) {
            lo = mid      // 放得下，尝试更多字符
        } else {
            hi = mid - 1  // 放不下，减少字符
        }
    }

    // 验证 lo 确实放得下
    range.setStart(textNode, 0)
    range.setEnd(textNode, lo)
    if (range.getBoundingClientRect().height > availableHeight) {
        return 0  // 一个字符都放不下
    }
    return lo
}
```

复杂度：`O(log n)`，对于 200 字的段落约 8 次 DOM 测量。

### 为什么不用数学计算

用 `Math.floor(remainingHeight / (fontSize * lineHeight))` 计算行数再定位字符的方案存在以下精度问题：

| 因素 | 影响 |
|---|---|
| CSS half-leading | 行盒的 leading 分布在不同浏览器中有亚像素差异 |
| `text-indent: 2em` | 首行缩进改变首行可容纳字符数，影响换行位置 |
| 中英文混排 | 不同字符宽度不同，无法精确预测每行字符数 |
| `letter-spacing` | 需要逐字符累加，容易产生累积误差 |
| 标点避头尾规则 | 浏览器可能做标点挤压/悬挂，无法预测 |
| 亚像素累积 | 多行的 round 方向不一致，数学累积值与渲染值偏差 |

Range API 不是"预测"排版结果，而是直接"询问"浏览器实际排版结果，因此精确度与实际渲染完全一致。

## 段间距处理

段间距 (`paragraphSpacing`) 以 `em` 为单位，实际像素值 = `paragraphSpacing × fontSize`。

在分页时手动计算段间距，不依赖 CSS `margin-bottom`：

- 当前页**第一个**段落前没有间距
- 后续段落前扣减 `spacingPx`
- 测量容器中的 `<p>` 不设置 `margin-bottom`，`offsetHeight` 纯粹反映文本内容高度

## 类型定义

`ParagraphSlice` 新增 `charStart` 和 `charEnd` 字段，记录该分片在原始段落中的字符范围：

```typescript
interface ParagraphSlice {
    paragraphIndex: number  // 原始段落索引
    text: string            // 分片文本
    isPartial: boolean      // 是否为截断产生的片段
    isTitle?: boolean       // 是否为章节标题
    charStart: number       // 原始段落中的起始字符索引
    charEnd: number         // 原始段落中的结束字符索引（不含）
}
```

### `isPartial` 语义

- `false`：该段落未被拆分，完整显示在一页中
- `true`：该段落被分页截断，当前分片只是原始段落的一部分

### 渲染时的判断依据

- `charStart === 0`：段落起始，保留 `text-indent`
- `charStart > 0`：续接片段，不应有 `text-indent`（添加 `.m-partial` 类）
- `charEnd < 原始段落长度`：段落在此页未结束，可酌情省略 `margin-bottom`

## 测量容器 CSS

```css
#__pagination-measure p {
    text-indent: 2em;
    margin: 0;
    padding: 0;
}
#__pagination-measure .m-title {
    text-indent: 0;
    font-weight: 600;
}
#__pagination-measure .m-partial {
    text-indent: 0;
}
```

续接片段使用 `.m-partial` 移除 `text-indent`，确保测量时的排版与实际渲染一致。
