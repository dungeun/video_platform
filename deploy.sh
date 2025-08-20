#!/bin/bash

# 서버 배포 스크립트
echo "VideoPick 플랫폼 배포 시작..."

# 1. GitHub에서 최신 코드 가져오기
echo "최신 코드 가져오는 중..."
git pull origin main

# 2. 의존성 설치
echo "의존성 설치 중..."
npm ci

# 3. Prisma 스키마 업데이트
echo "데이터베이스 스키마 업데이트 중..."
npx prisma generate
npx prisma db push --accept-data-loss

# 4. Next.js 빌드
echo "애플리케이션 빌드 중..."
npm run build

# 5. PM2로 서버 재시작
echo "서버 재시작 중..."
pm2 restart videopick-web || pm2 start npm --name videopick-web -- start

# 6. 상태 확인
echo "서버 상태 확인..."
pm2 status

echo "배포 완료!"