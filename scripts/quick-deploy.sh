#!/bin/bash

# Quick Deploy Script for Video Platform
# 빠른 서버 배포 및 재시작 스크립트

echo "🚀 Starting quick deployment..."

# 서버 정보
SERVER_HOST="158.247.203.55"
SERVER_USER="root"
APP_PATH="/opt/videopick/app"

echo "📦 Building and deploying to server..."

# 서버에서 빌드 및 재시작 실행
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
cd /opt/videopick/app

echo "🔄 Pulling latest changes..."
git pull origin main

echo "📦 Building application..."
npm run build

echo "🔄 Restarting PM2 service..."
pm2 restart videopick

echo "📊 Checking service status..."
pm2 status

echo "📝 Latest logs..."
pm2 logs videopick --lines 5

echo "✅ Deployment completed!"
EOF

echo "🎉 Quick deployment finished!"
echo "🌐 Check your site: https://main.one-q.xyz"