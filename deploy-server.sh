#!/bin/bash
set -e

SERVER_USER="root"
SERVER_IP="111.229.150.139"
REMOTE_DIR="/opt/backend-project/novel"

echo ">>> 上传 server 项目到服务器..."
rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='data' \
    --exclude='logs' \
    --exclude='*.log' \
    server/ "${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/server/"

echo ">>> 上传 docker-compose.yml..."
rsync -avz --progress docker-compose.yml "${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/"

echo ">>> 构建并启动容器..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${REMOTE_DIR} && docker compose up -d --build"

echo ">>> 部署完成！"
