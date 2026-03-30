#!/bin/bash
set -e

SERVER_USER="root"
SERVER_IP="111.229.150.139"
REMOTE_DIR="/opt/frontend-project/novel-web"
LOCAL_DIST="web/dist/"

echo ">>> 开始打包 web 项目..."
pnpm --filter web run build

echo ">>> 清空远程目录 ${REMOTE_DIR}..."
ssh "${SERVER_USER}@${SERVER_IP}" "rm -rf ${REMOTE_DIR}/* ${REMOTE_DIR}/.[!.]*"

echo ">>> 上传构建产物到服务器..."
rsync -avz --progress "${LOCAL_DIST}" "${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/"

echo ">>> 部署完成！"
