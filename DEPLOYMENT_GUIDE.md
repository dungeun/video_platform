# 📚 VideoPick 서버 배포 가이드

## 🚀 배포 프로세스

### 1. 서버 환경 준비

#### 시스템 요구사항
- Ubuntu 22.04 LTS 이상
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Nginx
- PM2
- Docker & Docker Compose

#### 필수 패키지 설치
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 15 설치
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get -y install postgresql-15

# Redis 설치
sudo apt install redis-server -y

# Nginx 설치
sudo apt install nginx -y

# PM2 설치
sudo npm install -g pm2

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2. GitHub에서 코드 가져오기

```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/video_platform
cd /var/www

# 저장소 클론
sudo git clone https://github.com/dungeun/video_platform.git
cd video_platform

# 권한 설정
sudo chown -R $USER:$USER /var/www/video_platform
```

### 3. 환경 변수 설정

```bash
# 서버용 환경 변수 복사
cp .env.server.example .env.production

# 환경 변수 편집
nano .env.production
```

주요 환경 변수 설정:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `REDIS_URL`: Redis 연결 정보
- `JWT_SECRET`: 보안 키 생성 (`openssl rand -hex 32`)
- `NEXTAUTH_SECRET`: NextAuth 시크릿 키
- MinIO/S3 스토리지 설정
- SMTP 이메일 설정

### 4. 데이터베이스 설정

```bash
# PostgreSQL 사용자 및 데이터베이스 생성
sudo -u postgres psql

CREATE USER videopick WITH PASSWORD 'your-secure-password';
CREATE DATABASE video_platform OWNER videopick;
GRANT ALL PRIVILEGES ON DATABASE video_platform TO videopick;
\q

# Prisma 마이그레이션
npx prisma generate
npx prisma db push --accept-data-loss

# 초기 데이터 시드 (선택사항)
npx prisma db seed
```

### 5. 애플리케이션 빌드 및 설치

```bash
# 의존성 설치
npm ci --production=false

# Next.js 빌드
npm run build

# PM2 설정
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6. Nginx 설정

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/video_platform
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 리다이렉트 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 인증서 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 프록시 설정
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 정적 파일
    location /_next/static {
        alias /var/www/video_platform/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # 업로드 제한
    client_max_body_size 100M;
}
```

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/video_platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 자동 갱신 설정
sudo systemctl enable certbot.timer
```

### 8. 스트리밍 서버 설정 (Docker Compose)

```bash
# docker-compose.yml 생성
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mediamtx:
    image: bluenviron/mediamtx:latest
    ports:
      - "1935:1935"
      - "8888:8888"
      - "9997:9997"
    volumes:
      - ./mediamtx.yml:/mediamtx.yml
    restart: unless-stopped

  centrifugo:
    image: centrifugo/centrifugo:v5
    ports:
      - "8000:8000"
    volumes:
      - ./centrifugo/config.json:/centrifugo/config.json
    command: centrifugo -c config.json
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    restart: unless-stopped

  tusd:
    image: tusproject/tusd:latest
    ports:
      - "1080:1080"
    volumes:
      - ./uploads:/srv/tusd-data/uploads
    command: -behind-proxy -max-size 5368709120
    restart: unless-stopped

volumes:
  minio_data:
EOF

# 서비스 시작
docker-compose up -d
```

### 9. 모니터링 설정

```bash
# PM2 모니터링
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# 시스템 모니터링 (선택사항)
docker run -d \
  --name=netdata \
  -p 19999:19999 \
  -v /etc/passwd:/host/etc/passwd:ro \
  -v /etc/group:/host/etc/group:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --cap-add SYS_PTRACE \
  --security-opt apparmor=unconfined \
  netdata/netdata
```

### 10. 백업 설정

```bash
# 백업 스크립트 생성
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/video_platform"
DATE=$(date +%Y%m%d_%H%M%S)

# 데이터베이스 백업
pg_dump -U videopick video_platform > $BACKUP_DIR/db_$DATE.sql

# 업로드 파일 백업
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/video_platform/uploads

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Cron 작업 추가
crontab -e
# 추가: 0 2 * * * /home/ubuntu/backup.sh
```

## 🔄 업데이트 프로세스

### GitHub에서 최신 코드 가져오기

```bash
cd /var/www/video_platform

# 최신 코드 풀
git pull origin main

# 의존성 업데이트
npm ci

# 빌드
npm run build

# PM2 재시작
pm2 reload ecosystem.config.js --env production
```

### 데이터베이스 마이그레이션

```bash
# Prisma 스키마 변경 시
npx prisma generate
npx prisma db push
```

## 🔍 문제 해결

### 로그 확인

```bash
# PM2 로그
pm2 logs

# Nginx 로그
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Docker 서비스 로그
docker-compose logs -f mediamtx
docker-compose logs -f centrifugo
```

### 서비스 상태 확인

```bash
# PM2 상태
pm2 status

# 시스템 서비스
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis

# Docker 서비스
docker-compose ps
```

### 포트 확인

```bash
# 사용 중인 포트 확인
sudo netstat -tlnp

# 필요한 포트:
# - 80, 443: Nginx
# - 3000: Next.js
# - 5432: PostgreSQL
# - 6379: Redis
# - 1935: RTMP
# - 8000: Centrifugo
# - 9000: MinIO
```

## 🔐 보안 설정

### 방화벽 설정

```bash
# UFW 설정
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1935/tcp
sudo ufw enable
```

### 보안 업데이트

```bash
# 자동 보안 업데이트
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## 📊 성능 최적화

### PM2 클러스터 모드

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'video-platform',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### Redis 최적화

```bash
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### PostgreSQL 튜닝

```bash
# /etc/postgresql/15/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

## 📞 지원

문제가 발생하면:
1. 로그 확인
2. GitHub Issues 확인
3. 관리자 연락

---

**마지막 업데이트**: 2024년 12월