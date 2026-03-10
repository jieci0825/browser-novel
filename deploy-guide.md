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
浏览器请求 → Koa 服务 → SQLite 缓存层 → (cache miss) → 外部书源
                              ↓
                        (cache hit) → 直接返回
```

### 各接口缓存策略

| 接口 | 缓存 Key 格式 | TTL | 说明 |
|------|--------------|-----|------|
| 章节正文 | `content:{sourceId}:{bookId}:{chapterId}` | 长期（天级别） | 内容几乎不变 |
| 章节目录 | `chapters:{sourceId}:{bookId}` | 中等（10-30 分钟） | 仅新章节时变化 |
| 书籍详情 | `detail:{sourceId}:{bookId}` | 中等（30-60 分钟） | 变化频率低 |
| 搜索结果 | `search:{sourceId}:{keyword}:{page}` | 短（3-5 分钟） | 变化频率中等 |

### 表结构

```sql
CREATE TABLE IF NOT EXISTS cache (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    ttl        INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_ttl ON cache(ttl);
```

### 基本用法

```typescript
import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('/app/data/cache.db')
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
