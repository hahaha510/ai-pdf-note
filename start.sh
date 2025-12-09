#!/bin/bash

# 启动 WebSocket 服务器（后台运行）
echo "🚀 启动 WebSocket 服务器..."
npm run websocket &

# 等待 WebSocket 服务器启动
sleep 3

# 启动 Next.js 应用
echo "🚀 启动 Next.js 应用..."
npm start
