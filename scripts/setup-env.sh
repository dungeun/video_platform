#!/bin/bash
# VideoPick 환경 변수 설정 스크립트

echo "🎬 VideoPick 환경 설정 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 환경 선택
echo "어떤 환경을 설정하시겠습니까?"
echo "1) 로컬 개발 (localhost)"
echo "2) Coolify 프로덕션"
echo "3) Coolify 스테이징"
read -p "선택 (1-3): " ENV_CHOICE

case $ENV_CHOICE in
  1)
    echo -e "${GREEN}로컬 개발 환경 설정${NC}"
    cp .env.local.example .env
    echo "✅ .env 파일이 로컬 개발용으로 생성되었습니다."
    echo "필요에 따라 .env 파일을 수정하세요."
    ;;
  2)
    echo -e "${GREEN}Coolify 프로덕션 환경 설정${NC}"
    
    # 필수 정보 입력
    echo -e "${YELLOW}Appwrite 정보를 입력하세요:${NC}"
    read -p "Appwrite API Key: " APPWRITE_KEY
    
    # .env 파일 생성
    cat > .env <<EOF
# VideoPick Production Environment
# Generated: $(date)

# ===== DATABASE =====
DATABASE_URL="postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"
POSTGRES_URL="postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"
POSTGRES_PRISMA_URL="postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"
POSTGRES_URL_NON_POOLING="postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"

# ===== REDIS =====
REDIS_URL="redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0"
KV_URL="redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0"
DISABLE_REDIS="false"

# ===== AUTHENTICATION =====
JWT_SECRET="VideoPick2024!SuperSecretJWTKey#VideoplatformProduction$"

# ===== APPWRITE =====
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://appwrite.coolify.one-q.xyz/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="videopick"
APPWRITE_API_KEY="$APPWRITE_KEY"

# ===== APPLICATION =====
NEXT_PUBLIC_API_URL="http://wcs0go00wsocssgwk0o8848c.141.164.60.51.sslip.io"
NEXT_PUBLIC_APP_URL="http://wcs0go00wsocssgwk0o8848c.141.164.60.51.sslip.io"
NODE_ENV="production"

# ===== PAYMENT =====
TOSS_SECRET_KEY="test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R"
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"

# ===== FEATURE FLAGS =====
ENABLE_VIDEO_TAB="true"
ENABLE_LEGACY_ROUTES="true"
MIGRATION_MODE="prepare"
EOF
    
    echo "✅ .env 파일이 프로덕션용으로 생성되었습니다."
    ;;
  3)
    echo -e "${RED}스테이징 환경은 아직 준비 중입니다.${NC}"
    exit 1
    ;;
  *)
    echo -e "${RED}잘못된 선택입니다.${NC}"
    exit 1
    ;;
esac

# Prisma 설정
echo ""
echo "Prisma 설정을 진행하시겠습니까? (y/n)"
read -p "선택: " PRISMA_CHOICE

if [ "$PRISMA_CHOICE" = "y" ]; then
  echo "Prisma 클라이언트 생성 중..."
  npx prisma generate
  
  echo "데이터베이스 마이그레이션을 실행하시겠습니까? (y/n)"
  read -p "선택: " MIGRATE_CHOICE
  
  if [ "$MIGRATE_CHOICE" = "y" ]; then
    npx prisma migrate dev
  fi
fi

echo ""
echo -e "${GREEN}환경 설정 완료!${NC}"
echo ""
echo "다음 단계:"
echo "1. .env 파일 확인 및 수정"
echo "2. npm install (의존성 설치)"
echo "3. npm run dev (개발 서버 시작)"
echo ""

# 환경 변수 검증
echo "환경 변수 검증 중..."
if [ -f ".env" ]; then
  if grep -q "APPWRITE_API_KEY=\"\"" .env || grep -q "APPWRITE_API_KEY=$" .env; then
    echo -e "${YELLOW}⚠️  Appwrite API Key가 설정되지 않았습니다.${NC}"
    echo "   Appwrite 콘솔에서 API Key를 생성하고 .env 파일에 추가하세요."
  fi
  
  if grep -q "DATABASE_URL" .env; then
    echo "✅ 데이터베이스 연결 설정됨"
  else
    echo -e "${RED}❌ 데이터베이스 연결이 설정되지 않았습니다.${NC}"
  fi
  
  if grep -q "REDIS_URL" .env; then
    echo "✅ Redis 연결 설정됨"
  else
    echo -e "${YELLOW}⚠️  Redis 연결이 설정되지 않았습니다.${NC}"
  fi
fi

echo ""
echo "설정 완료!"