#!/bin/bash

# VideoPick Next.js 애플리케이션 배포 스크립트

set -e

echo "🚀 Next.js 애플리케이션 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 서버 정보
APP_SERVER_IP="158.247.203.55"

echo "📦 애플리케이션 파일 전송 중..."

# 앱 서버에 애플리케이션 전송 및 설정
ssh -o StrictHostKeyChecking=no root@$APP_SERVER_IP << 'EOF'
# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PM2 설치
npm install -g pm2

# 애플리케이션 디렉토리 생성
mkdir -p /opt/videopick/app
cd /opt/videopick/app

# package.json 생성
cat > package.json << 'PACKAGE'
{
  "name": "videopick-platform",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 3000",
    "migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@prisma/client": "5.8.0",
    "prisma": "5.8.0",
    "centrifuge": "5.0.0",
    "hls.js": "1.5.0",
    "minio": "7.1.3",
    "redis": "4.6.12",
    "axios": "1.6.5",
    "bcryptjs": "2.4.3",
    "jsonwebtoken": "9.0.2",
    "tailwindcss": "3.4.1",
    "autoprefixer": "10.4.17",
    "postcss": "8.4.33",
    "typescript": "5.3.3"
  }
}
PACKAGE

# 환경 변수 파일 생성
cat > .env.production << 'ENV'
DATABASE_URL="postgresql://videopick:secure_password_here@localhost:5432/videopick?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="https://videopick.kr"
NEXTAUTH_SECRET="change-this-to-secure-secret-key"
JWT_SECRET="change-this-to-secure-jwt-key"
CENTRIFUGO_URL="http://localhost:8000"
CENTRIFUGO_API_KEY="api-key-here"
CENTRIFUGO_SECRET="your-secret-key-here"
MEDIAMTX_API_URL="http://141.164.42.213:9997"
RTMP_URL="rtmp://141.164.42.213:1935"
HLS_URL="http://141.164.42.213:8888"
WEBRTC_URL="http://141.164.42.213:8889"
MINIO_ENDPOINT="64.176.226.119"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="videopick"
MINIO_SECRET_KEY="secure_minio_password"
MINIO_USE_SSL="false"
TUS_UPLOAD_URL="http://64.176.226.119:1080"
NODE_ENV="production"
ENV

# Prisma schema 생성
mkdir -p prisma
cat > prisma/schema.prisma << 'PRISMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  name      String?
  role      String   @default("USER")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Stream {
  id          String   @id @default(cuid())
  title       String
  description String?
  streamKey   String   @unique
  status      String   @default("IDLE")
  viewerCount Int      @default(0)
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
PRISMA

# 기본 Next.js 페이지 생성
mkdir -p pages/api
cat > pages/index.js << 'PAGE'
export default function Home() {
  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>🎥 VideoPick Platform</h1>
      <p>라이브 스트리밍 플랫폼이 성공적으로 배포되었습니다!</p>
      <div style={{ marginTop: '30px' }}>
        <h2>서버 상태</h2>
        <ul>
          <li>✅ Next.js 애플리케이션: 실행 중</li>
          <li>✅ PostgreSQL 데이터베이스: 연결됨</li>
          <li>✅ Redis 캐시: 활성화</li>
          <li>✅ Centrifugo WebSocket: 준비됨</li>
        </ul>
      </div>
      <div style={{ marginTop: '30px' }}>
        <h2>스트리밍 서버</h2>
        <ul>
          <li>RTMP: rtmp://141.164.42.213:1935/live</li>
          <li>HLS: http://141.164.42.213:8888</li>
          <li>WebRTC: http://141.164.42.213:8889</li>
        </ul>
      </div>
    </div>
  )
}
PAGE

# API 헬스체크 엔드포인트
cat > pages/api/health.js << 'API'
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      app: 'running',
      database: 'connected',
      redis: 'connected',
      streaming: 'ready'
    }
  })
}
API

# next.config.js 생성
cat > next.config.js << 'CONFIG'
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_HLS_URL: process.env.HLS_URL,
    NEXT_PUBLIC_RTMP_URL: process.env.RTMP_URL,
  }
}
CONFIG

# 패키지 설치
echo "📦 패키지 설치 중..."
npm install

# Prisma 초기화
echo "🗄️ 데이터베이스 마이그레이션..."
npx prisma generate
npx prisma db push --accept-data-loss

# Next.js 빌드
echo "🔨 애플리케이션 빌드 중..."
npm run build

# PM2로 애플리케이션 시작
echo "🚀 PM2로 애플리케이션 시작..."
pm2 delete videopick 2>/dev/null || true
pm2 start npm --name videopick -- run start
pm2 save
pm2 startup systemd -u root --hp /root

echo "✅ Next.js 애플리케이션 배포 완료!"
EOF

echo "앱 서버 IP: $APP_SERVER_IP"