# ============ 构建阶段 ============
FROM node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build

# ============ 运行阶段 ============
FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources \
    && sed -i 's|security.debian.org/debian-security|mirrors.aliyun.com/debian-security|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-wqy-zenhei \
    fonts-freefont-ttf \
    libxss1 \
    dbus \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data /app/logs

ENV NODE_ENV=production
ENV PORT=5100
ENV DATA_DIR=/app/data
ENV LOG_DIR=/app/logs

EXPOSE 5100

CMD ["node", "dist/app.js"]
