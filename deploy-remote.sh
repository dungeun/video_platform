#!/bin/bash

# 원격 서버 배포 스크립트
SERVER_IP="158.247.203.55"
SERVER_USER="root"
APP_DIR="/home/videopick/video_platform"

echo "========================================"
echo "VideoPick 플랫폼 원격 배포"
echo "서버: $SERVER_IP"
echo "========================================"

# SSH 명령어로 원격 서버에서 배포 실행
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
    echo "원격 서버에 접속했습니다."
    
    # 프로젝트 디렉토리로 이동
    cd /home/videopick/video_platform || exit 1
    
    # Git 최신 코드 가져오기
    echo "최신 코드를 가져오는 중..."
    git pull origin main
    
    # 의존성 설치
    echo "의존성을 설치하는 중..."
    npm ci
    
    # Prisma 설정
    echo "데이터베이스 설정 중..."
    npx prisma generate
    npx prisma db push --accept-data-loss
    
    # 빌드
    echo "애플리케이션을 빌드하는 중..."
    npm run build
    
    # PM2로 애플리케이션 재시작
    echo "애플리케이션을 재시작하는 중..."
    pm2 restart videopick-web || pm2 start npm --name videopick-web -- start
    
    # 상태 확인
    pm2 status
    
    echo "배포가 완료되었습니다!"
ENDSSH

echo "========================================"
echo "배포 프로세스 완료"
echo "========================================"