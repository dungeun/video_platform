#!/bin/bash

# VideoPick 전체 플랫폼 배포 스크립트

set -e

echo "🚀 VideoPick 전체 플랫폼 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 서버 정보
APP_SERVER_IP="158.247.203.55"

echo -e "${YELLOW}📦 애플리케이션 파일 전송 중...${NC}"

# 앱 서버에 전체 애플리케이션 전송 및 설정
scp -r -o StrictHostKeyChecking=no /Users/admin/new_project/video_platform/ root@$APP_SERVER_IP:/opt/videopick/full_app/

ssh -o StrictHostKeyChecking=no root@$APP_SERVER_IP << 'EOF'
cd /opt/videopick

# 기존 앱 백업
if [ -d "app" ]; then
    mv app app_backup_$(date +%Y%m%d_%H%M%S)
    echo "✅ 기존 앱 백업 완료"
fi

# 새 앱으로 교체
mv full_app/video_platform app
cd app

echo "📦 Node.js 18 설치 확인..."
if ! command -v node >/dev/null 2>&1 || ! node --version | grep -q "v18"; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "📦 패키지 설치 중..."
npm install --production

echo "🗄️ Prisma 설정..."
npx prisma generate

echo "🔨 Next.js 빌드..."
npm run build

echo "🚀 PM2로 애플리케이션 재시작..."
pm2 delete videopick 2>/dev/null || true
pm2 start npm --name videopick -- run start
pm2 save

echo "✅ VideoPick 전체 플랫폼 배포 완료!"
echo ""
echo "🌐 접속 주소:"
echo "  - 메인 사이트: https://main.one-q.xyz"
echo "  - 관리자: https://main.one-q.xyz/admin"
echo ""
echo "🔧 데이터베이스 마이그레이션이 필요한 경우:"
echo "  npx prisma db push"
EOF

echo -e "\n${GREEN}🎉 VideoPick 전체 플랫폼 배포가 완료되었습니다!${NC}"
echo ""
echo "🌐 서비스 URL:"
echo "  - 메인 웹사이트: https://main.one-q.xyz"
echo "  - 관리자 패널: https://main.one-q.xyz/admin"
echo "  - API 문서: https://main.one-q.xyz/api-docs"
echo "  - 모니터링: http://monitor.one-q.xyz"
echo ""
echo "💡 다음 단계:"
echo "  1. 데이터베이스 마이그레이션 실행"
echo "  2. 관리자 계정 생성"
echo "  3. 초기 설정 및 테스트"