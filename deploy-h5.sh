#!/bin/bash
set -e

SERVER_USER="root"
SERVER_IP="111.229.150.139"
REMOTE_DIR="/opt/frontend-project/novel-h5"
LOCAL_DIST="h5/dist/"

echo ">>> 开始打包 h5 项目..."
pnpm --filter h5 run build

echo ">>> 清空远程目录 ${REMOTE_DIR}..."
ssh "${SERVER_USER}@${SERVER_IP}" "rm -rf ${REMOTE_DIR}/* ${REMOTE_DIR}/.[!.]*"

echo ">>> 上传构建产物到服务器..."
rsync -avz --progress "${LOCAL_DIST}" "${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/"

echo ">>> 部署完成！"
