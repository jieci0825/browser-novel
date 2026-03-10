# 部署方案

## 技术选型

| 组件 | 方案 | 说明 |
|------|------|------|
| 缓存 | `node:sqlite`（Node.js 内置） | 嵌入式 SQLite，持久化缓存，零额外依赖 |
| 部署 | Docker | 无需编译原生模块，单阶段构建即可 |
| 服务器 | OpenCloudOS 9.2 | 仅需安装 Docker，无需额外系统依赖 |
| Node.js | >= 22.5.0 | `node:sqlite` 最低版本要求 |

## 缓存策略

使用 Node.js 内置的 `node:sqlite` 模块将外部书源请求过的数据持久化到 SQLite 数据库，避免重复抓取。

### 缓存层级

```
浏览器请求 → Koa 服务 → 缓存切面 → (cache miss) → 外部书源
                            ↓
                      (cache hit) → 直接返回
```

### 设计原则

- **无 TTL，永久持久化**：缓存数据不会自动过期
- **用户驱动刷新**：前端提供刷新按钮，请求携带 `?refresh=true` 时跳过缓存、重新请求书源并更新缓存
- **搜索不缓存**：搜索结果始终实时请求，同时作为书源可用性的检测手段
- **刷新失败保留旧数据**：刷新请求如果书源异常，旧缓存不会被清除

### 各接口缓存策略

| 接口 | 缓存 Key 格式 | 缓存 | 说明 |
|------|--------------|------|------|
| 章节正文 | `content:{sourceId}:{bookId}:{chapterId}` | 持久化 | 内容几乎不变 |
| 章节目录 | `chapters:{sourceId}:{bookId}` | 持久化 | 用户按需刷新 |
| 书籍详情 | `detail:{sourceId}:{bookId}` | 持久化 | 用户按需刷新 |
| 搜索结果 | — | 不缓存 | 实时请求，兼做书源可用性检测 |

### 切面架构

```
异常切面 (超时 + 异常映射)
  └─ 缓存切面 (SQLite 持久化)
       └─ 适配器 (QQReader / RuleBased)
```

通过 `withAdapterCacheAspect` 以 Proxy 模式包裹适配器，与已有的 `withAdapterExceptionAspect` 组合使用，对路由层零侵入。

### 刷新信号传递

```
前端 ?refresh=true → requestContextMiddleware (AsyncLocalStorage)
                         → 缓存切面读取 forceRefresh 标记
                             → true:  跳过缓存读取，请求书源，更新缓存
                             → false: 查缓存，命中则直接返回
```

### 表结构

```sql
CREATE TABLE IF NOT EXISTS cache (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);
```

> `node:sqlite` 目前标记为 Experimental，运行时会输出警告，可通过 `NODE_NO_WARNINGS=1` 抑制。
> Node 22 是 LTS 版本（维护至 2027 年 4 月），API 大概率只会趋于稳定。

## Docker 部署

### Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

ENV NODE_NO_WARNINGS=1
EXPOSE 5100
CMD ["node", "dist/app.js"]
```

### 运行容器

```bash
docker build -t browser-novel .

docker run -d \
  --name browser-novel \
  -p 5100:5100 \
  -v /data/browser-novel:/app/data \
  browser-novel
```

- `-v /data/browser-novel:/app/data`：将 SQLite 数据库文件挂载到宿主机，容器重建后缓存数据不丢失
- 代码中数据库路径应指向 `/app/data/cache.db`

### 常用运维命令

```bash
# 查看日志
docker logs -f browser-novel

# 重启
docker restart browser-novel

# 更新部署
docker stop browser-novel && docker rm browser-novel
docker build -t browser-novel .
docker run -d --name browser-novel -p 5100:5100 -v /data/browser-novel:/app/data browser-novel
```
