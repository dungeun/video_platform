#!/bin/bash

# Quick Restart Script for Video Platform
# 빠른 서버 재시작 스크립트 (빌드 없이)

echo "⚡ Starting quick restart..."

# 서버 정보
SERVER_HOST="158.247.203.55"
SERVER_USER="root"

echo "🔄 Restarting server..."

# 서버에서 재시작만 실행
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
echo "🔄 Restarting PM2 service..."
pm2 restart videopick

echo "⏳ Waiting for service to start..."
sleep 3

echo "📊 Service status:"
pm2 status

echo "📝 Latest logs:"
pm2 logs videopick --lines 5

echo "✅ Restart completed!"
EOF

echo "🎉 Quick restart finished!"
echo "🌐 Check your site: https://main.one-q.xyz"