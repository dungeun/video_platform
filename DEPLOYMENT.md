# VideoPick 플랫폼 배포 문서

## 📋 프로젝트 개요

VideoPick은 비디오 콘텐츠 스트리밍 및 인플루언서 마케팅 플랫폼입니다.

- **배포일**: 2025-08-20
- **버전**: v1.0.0
- **기술스택**: Next.js 14, React 18, Prisma, PostgreSQL, Docker
- **인프라**: Vultr Cloud (4서버 구성)

## 🏗️ 인프라 아키텍처

### 서버 구성
```
📦 Vultr 4-Server Architecture ($300/월)
├── App Server (158.247.203.55) - 8vCPU, 16GB RAM, 320GB SSD
├── Streaming Server (141.164.42.213) - 4vCPU, 8GB RAM, 160GB SSD
├── Storage Server (64.176.226.119) - 4vCPU, 8GB RAM, 160GB SSD
└── Backup Server (141.164.37.63) - 2vCPU, 4GB RAM, 80GB SSD
```

### 도메인 구조
```
one-q.xyz (DNS: 141.164.60.51)
├── main.one-q.xyz → 158.247.203.55 (메인 애플리케이션)
├── stream.one-q.xyz → 141.164.42.213 (스트리밍)
├── storage.one-q.xyz → 64.176.226.119 (파일 저장소)
└── monitor.one-q.xyz → 158.247.203.55 (모니터링)
```

## 🚀 배포된 서비스

### 1. 메인 애플리케이션
- **URL**: https://main.one-q.xyz
- **포트**: 3000 (PM2 관리)
- **프레임워크**: Next.js 14 Production Build
- **프로세스 관리**: PM2

### 2. 데이터베이스
- **PostgreSQL**: 158.247.203.55:5432
- **데이터베이스**: videopick
- **ORM**: Prisma v5.22.0
- **스키마**: 46개 테이블 (인플루언서 마케팅 + 스트리밍)

### 3. Docker 서비스
각 서버에서 실행 중인 컨테이너:

**App Server (158.247.203.55)**:
```bash
postgres:15-alpine    # PostgreSQL 데이터베이스
redis:7-alpine        # Redis 캐시
node-exporter         # 시스템 메트릭
prometheus            # 메트릭 수집
grafana/grafana       # 모니터링 대시보드
nginx:alpine          # 리버스 프록시
```

**Streaming Server (141.164.42.213)**:
```bash
bluenviron/mediamtx   # RTMP/HLS 스트리밍
centrifugo/centrifugo # 실시간 채팅
nginx:alpine          # 리버스 프록시
```

**Storage Server (64.176.226.119)**:
```bash
minio/minio          # 객체 스토리지
tusd/tusd            # 파일 업로드
nginx:alpine         # 리버스 프록시
```

**Backup Server (141.164.37.63)**:
```bash
postgres:15-alpine   # 백업 데이터베이스
nginx:alpine         # 리버스 프록시
```

### 4. SSL 인증서
- **발급기관**: Let's Encrypt
- **도메인**: main.one-q.xyz
- **자동갱신**: Nginx 설정됨

## 📂 프로젝트 구조

```
/opt/videopick/app/
├── src/
│   ├── app/                 # Next.js 13+ App Router
│   │   ├── api/            # API Routes
│   │   ├── admin/          # 관리자 페이지
│   │   ├── dashboard/      # 대시보드
│   │   └── ...
│   ├── components/         # React 컴포넌트
│   ├── lib/               # 유틸리티 라이브러리
│   └── styles/            # CSS 스타일
├── prisma/
│   └── schema.prisma      # 데이터베이스 스키마
├── public/                # 정적 파일
├── .env.local            # 환경 변수
└── package.json          # 프로젝트 설정
```

## ⚙️ 환경 변수

### 프로덕션 환경 (.env.local)
```bash
# 데이터베이스
DATABASE_URL="postgresql://videopick:secure_password_here@158.247.203.55:5432/videopick?schema=public"

# JWT 인증
JWT_SECRET="VideoPick2024!SuperSecretJWTKey#VideoPickProduction$"

# Redis
REDIS_URL="redis://158.247.203.55:6379"

# 스트리밍 서버
NEXT_PUBLIC_RTMP_URL="rtmp://stream.one-q.xyz/live"
NEXT_PUBLIC_HLS_URL="http://stream.one-q.xyz"

# 채팅 서버
NEXT_PUBLIC_CENTRIFUGO_URL="http://158.247.203.55:8000"

# 애플리케이션
NODE_ENV=production
NEXTAUTH_URL="https://main.one-q.xyz"
```

## 🔧 배포 절차

### 1. 로컬 개발 환경 준비
```bash
# 프로젝트 복사
cd /Users/admin/new_project/video_platform/

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 2. 프로덕션 배포
```bash
# 서버 접속
ssh root@158.247.203.55

# 프로젝트 디렉토리
cd /opt/videopick/app

# 프로덕션 빌드
npm run build

# PM2로 프로세스 시작
pm2 start npm --name videopick -- run start

# 상태 확인
pm2 status
```

### 3. 데이터베이스 마이그레이션
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 적용
npx prisma db push

# (선택) 마이그레이션 파일 생성
npx prisma migrate dev --name init
```

## 📊 모니터링 및 로그

### Grafana 대시보드
- **URL**: http://monitor.one-q.xyz
- **계정**: admin / admin (첫 로그인 후 변경 필요)

### 시스템 로그
```bash
# PM2 로그 확인
pm2 logs videopick

# Nginx 로그
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Docker 컨테이너 로그
docker logs postgres
docker logs redis
```

### 성능 지표
- **CPU 사용률**: Node Exporter → Prometheus → Grafana
- **메모리 사용량**: 시스템 메트릭 수집
- **디스크 I/O**: 실시간 모니터링
- **네트워크 트래픽**: 대역폭 모니터링

## 🚨 문제 해결

### 자주 발생하는 문제

**1. Next.js 빌드 오류**
```bash
# 노드 모듈 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 오류 확인
npx tsc --noEmit
```

**2. 데이터베이스 연결 오류**
```bash
# PostgreSQL 상태 확인
docker exec postgres pg_isready

# 연결 테스트
npx prisma db pull
```

**3. PM2 프로세스 문제**
```bash
# 프로세스 재시작
pm2 restart videopick

# 프로세스 삭제 후 재생성
pm2 delete videopick
pm2 start npm --name videopick -- run start
```

### 성능 최적화

**메모리 사용량 최적화**:
```bash
# PM2 메모리 모니터링
pm2 monit

# Node.js 메모리 제한 설정
pm2 start npm --name videopick --max-memory-restart 1G -- run start
```

## 🔄 업데이트 절차

### 1. 안전한 업데이트
```bash
# 1. 백업 생성
pg_dump -h 158.247.203.55 -U videopick videopick > backup_$(date +%Y%m%d).sql

# 2. 코드 업데이트
git pull origin main

# 3. 의존성 업데이트
npm install

# 4. 빌드 및 배포
npm run build
pm2 restart videopick
```

### 2. 롤백 절차
```bash
# 이전 버전으로 롤백
git checkout HEAD~1
npm install
npm run build
pm2 restart videopick
```

## 🔐 보안 설정

### SSL/TLS 설정
- Let's Encrypt 인증서 자동 갱신
- HTTPS 리다이렉트 설정
- HSTS 헤더 적용

### 방화벽 규칙
```bash
# 필요한 포트만 개방
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 데이터베이스 보안
- 강력한 비밀번호 사용
- 외부 접근 제한
- 정기적인 백업 수행

## 📞 지원 및 연락처

### 기술 지원
- **배포 담당**: Claude Code Assistant
- **인프라**: Vultr Cloud Platform
- **DNS 관리**: one-q.xyz (141.164.60.51)

### 응급 연락처
- **서버 장애**: Vultr Support
- **도메인 문제**: DNS 관리자
- **애플리케이션 오류**: 로그 분석 필요

---

**📝 마지막 업데이트**: 2025-08-20  
**📋 문서 버전**: v1.0.0  
**✨ 상태**: 프로덕션 운영 중