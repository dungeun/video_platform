# Coolify MCP 통합 가이드

## 1. Coolify 서버 접속 및 관리

### 1.1 SSH 접속
```bash
# Coolify 서버 접속
ssh root@coolify.one-q.xyz

# 서버 상태 확인
systemctl status coolify
docker ps
```

### 1.2 Coolify 서비스 관리
```bash
# Coolify 서비스 상태 확인
docker-compose -f /data/coolify/docker-compose.yml ps

# Coolify 재시작
docker-compose -f /data/coolify/docker-compose.yml restart

# 로그 확인
docker-compose -f /data/coolify/docker-compose.yml logs -f coolify
```

## 2. MCP를 통한 Coolify 관리

### 2.1 Coolify CLI 설치 (서버에서)
```bash
# Coolify CLI 설치
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# 또는 Docker를 통한 CLI 사용
alias coolify='docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/coollabsio/coolify:latest'
```

### 2.2 API 토큰 생성
1. Coolify 웹 대시보드 접속
2. Settings → API Tokens
3. "Generate New Token" 클릭
4. 토큰 복사 후 안전하게 저장

### 2.3 환경 변수 설정
```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export COOLIFY_URL="https://coolify.one-q.xyz"
export COOLIFY_TOKEN="your-api-token-here"
```

## 3. PostgreSQL 데이터베이스 생성

### 3.1 Coolify 대시보드에서 생성
```bash
# SSH로 서버 접속 후 Coolify 명령어 실행
coolify database create \
  --name revu-platform-db \
  --type postgresql \
  --version 15 \
  --database revu_platform \
  --username revu_user \
  --password "$(openssl rand -base64 32)"
```

### 3.2 수동 PostgreSQL 설정
```bash
# PostgreSQL 컨테이너 실행
docker run -d \
  --name revu-platform-postgres \
  --network coolify \
  -e POSTGRES_DB=revu_platform \
  -e POSTGRES_USER=revu_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine

# 데이터베이스 연결 테스트
docker exec -it revu-platform-postgres psql -U revu_user -d revu_platform
```

## 4. Redis 캐시 설정

### 4.1 Redis 컨테이너 실행
```bash
# Redis 컨테이너 실행
docker run -d \
  --name revu-platform-redis \
  --network coolify \
  -v redis-data:/data \
  redis:7-alpine redis-server --appendonly yes

# Redis 연결 테스트
docker exec -it revu-platform-redis redis-cli ping
```

## 5. 프로젝트 생성 및 설정

### 5.1 새 프로젝트 생성
```bash
# 프로젝트 생성
coolify project create \
  --name "revu-platform" \
  --description "인플루언서 마케팅 레뷰 플랫폼"

# 환경 생성
coolify environment create \
  --project revu-platform \
  --name production
```

### 5.2 GitHub Repository 연결
```bash
# Git 저장소 연결
coolify application create \
  --project revu-platform \
  --environment production \
  --name "revu-platform-app" \
  --git-repository "https://github.com/your-username/revu-platform.git" \
  --git-branch main \
  --build-pack nixpacks \
  --port 3000
```

## 6. 환경 변수 설정

### 6.1 환경 변수 파일 생성
```bash
# 환경 변수 템플릿 생성
cat > /tmp/revu-platform.env << 'EOF'
# 데이터베이스
DATABASE_URL=postgresql://revu_user:your_secure_password@revu-platform-postgres:5432/revu_platform

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-domain.com

# Redis
REDIS_URL=redis://revu-platform-redis:6379

# 이메일
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 파일 업로드
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 결제
TOSS_CLIENT_KEY=test_ck_your-key
TOSS_SECRET_KEY=test_sk_your-key
EOF

# 환경 변수 적용
coolify environment variables set \
  --project revu-platform \
  --environment production \
  --file /tmp/revu-platform.env
```

## 7. 도메인 및 SSL 설정

### 7.1 도메인 설정
```bash
# 도메인 추가
coolify domain add \
  --application revu-platform-app \
  --domain "revu-platform.your-domain.com" \
  --ssl-enabled true
```

### 7.2 SSL 인증서 생성
```bash
# Let's Encrypt 인증서 생성
coolify ssl generate \
  --domain "revu-platform.your-domain.com" \
  --email your-email@example.com
```

## 8. 배포 스크립트

### 8.1 자동 배포 스크립트
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

PROJECT_NAME="revu-platform"
APP_NAME="revu-platform-app"

echo "🚀 Starting deployment to Coolify..."

# 1. 코드 푸시
echo "📦 Pushing code to repository..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

# 2. 배포 트리거
echo "🔧 Triggering deployment..."
coolify deployment trigger \
  --project $PROJECT_NAME \
  --application $APP_NAME

# 3. 배포 상태 모니터링
echo "👀 Monitoring deployment..."
coolify deployment logs \
  --project $PROJECT_NAME \
  --application $APP_NAME \
  --follow

echo "✅ Deployment completed!"
```

## 9. 모니터링 및 로그

### 9.1 애플리케이션 로그
```bash
# 실시간 로그 확인
coolify application logs \
  --project revu-platform \
  --application revu-platform-app \
  --follow

# 데이터베이스 로그
docker logs -f revu-platform-postgres

# Redis 로그
docker logs -f revu-platform-redis
```

### 9.2 리소스 모니터링
```bash
# 컨테이너 상태 확인
docker stats

# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h
```

## 10. 백업 및 복원

### 10.1 데이터베이스 백업
```bash
# 데이터베이스 백업
docker exec revu-platform-postgres pg_dump \
  -U revu_user \
  -d revu_platform \
  -f /tmp/revu_platform_backup.sql

# 백업 파일 다운로드
docker cp revu-platform-postgres:/tmp/revu_platform_backup.sql ./
```

### 10.2 Redis 백업
```bash
# Redis 데이터 백업
docker exec revu-platform-redis redis-cli SAVE
docker cp revu-platform-redis:/data/dump.rdb ./redis_backup.rdb
```

## 11. 문제 해결

### 11.1 일반적인 문제
```bash
# 컨테이너 재시작
docker restart revu-platform-postgres revu-platform-redis

# 네트워크 확인
docker network ls
docker network inspect coolify

# 볼륨 확인
docker volume ls
docker volume inspect postgres-data redis-data
```

### 11.2 성능 최적화
```bash
# PostgreSQL 설정 최적화
docker exec -it revu-platform-postgres psql -U revu_user -d revu_platform -c "
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
"

# Redis 설정 최적화
docker exec -it revu-platform-redis redis-cli CONFIG SET maxmemory 512mb
docker exec -it revu-platform-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 12. MCP TaskMaster 통합

### 12.1 작업 자동화
```bash
# TaskMaster로 배포 작업 생성
echo "TaskMaster: Deploy revu-platform to Coolify" | taskmaster-ai add-task \
  --project revu-platform \
  --phase deployment \
  --complexity medium \
  --dependencies "database-setup, environment-config"
```

이제 실제 서버에 접속해서 설정을 시작하겠습니다.