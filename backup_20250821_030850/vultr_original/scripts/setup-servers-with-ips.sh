#!/bin/bash

# VideoPick Platform - 서버 초기 설정 스크립트 (IP 하드코딩)
# Phase 2: 1,000명 동접 서버 구성

set -e

echo "🚀 VideoPick Platform 서버 설정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 서버 IP 주소 (Terraform 출력값)
APP_SERVER_IP="158.247.203.55"
STREAMING_SERVER_IP="141.164.42.213"
STORAGE_SERVER_IP="64.176.226.119"
BACKUP_SERVER_IP="141.164.37.63"

echo "📍 서버 IP 주소:"
echo "  - 앱 서버: $APP_SERVER_IP"
echo "  - 스트리밍 서버: $STREAMING_SERVER_IP"
echo "  - 스토리지 서버: $STORAGE_SERVER_IP"
echo "  - 백업 서버: $BACKUP_SERVER_IP"

# SSH 키 권한 설정
chmod 600 ~/.ssh/id_rsa 2>/dev/null || true

# 서버 연결 대기
wait_for_server() {
    local ip=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ $name 서버 연결 대기중...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$ip "echo 'Connected'" &>/dev/null; then
            echo -e "${GREEN}✅ $name 서버 연결 성공${NC}"
            return 0
        fi
        echo "  시도 $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}❌ $name 서버 연결 실패${NC}"
    return 1
}

# 모든 서버 연결 확인
echo "🔗 서버 연결 확인 중..."
wait_for_server "$APP_SERVER_IP" "앱" || exit 1
wait_for_server "$STREAMING_SERVER_IP" "스트리밍" || exit 1
wait_for_server "$STORAGE_SERVER_IP" "스토리지" || exit 1
wait_for_server "$BACKUP_SERVER_IP" "백업" || exit 1

# 기본 디렉토리 생성 스크립트
create_directories() {
    cat << 'EOF'
# 디렉토리 생성
mkdir -p /opt/videopick/{config,data,logs,scripts,backups}
mkdir -p /opt/videopick/data/{postgres,redis,minio,uploads,streams}
mkdir -p /opt/videopick/logs/{app,streaming,storage,nginx}

# 권한 설정
chmod -R 755 /opt/videopick
EOF
}

# 1. 앱 서버 설정
echo -e "\n${YELLOW}📱 앱 서버 설정 시작...${NC}"
ssh -o StrictHostKeyChecking=no root@$APP_SERVER_IP << EOF
$(create_directories)

# Docker Compose 파일 생성
cat > /opt/videopick/docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: videopick-postgres
    environment:
      POSTGRES_DB: videopick
      POSTGRES_USER: videopick
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - /opt/videopick/data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  redis:
    image: redis:7-alpine
    container_name: videopick-redis
    volumes:
      - /opt/videopick/data/redis:/data
    ports:
      - "6379:6379"
    restart: always

  centrifugo:
    image: centrifugo/centrifugo:v4
    container_name: videopick-centrifugo
    volumes:
      - /opt/videopick/config/centrifugo.json:/centrifugo/config.json
    ports:
      - "8000:8000"
    command: centrifugo -c config.json
    restart: always
COMPOSE

# Centrifugo 설정 파일
cat > /opt/videopick/config/centrifugo.json << 'CONFIG'
{
  "v3_use_offset": true,
  "token_hmac_secret_key": "your-secret-key-here",
  "admin_password": "admin-password-here",
  "admin_secret": "admin-secret-here",
  "api_key": "api-key-here",
  "allowed_origins": ["http://localhost:3000", "https://videopick.kr"],
  "presence": true,
  "join_leave": true,
  "force_push_join_leave": true,
  "history_size": 100,
  "history_ttl": "300s",
  "namespaces": [
    {
      "name": "chat",
      "presence": true,
      "join_leave": true,
      "history_size": 100,
      "history_ttl": "300s"
    },
    {
      "name": "stream",
      "presence": true,
      "join_leave": true
    }
  ]
}
CONFIG

# 방화벽 설정
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 8000/tcp
ufw allow 5432/tcp
ufw allow 6379/tcp
ufw --force enable

# Docker 컨테이너 시작
cd /opt/videopick
docker-compose up -d

echo "✅ 앱 서버 설정 완료"
EOF

# 2. 스트리밍 서버 설정
echo -e "\n${YELLOW}🎥 스트리밍 서버 설정 시작...${NC}"
ssh -o StrictHostKeyChecking=no root@$STREAMING_SERVER_IP << EOF
$(create_directories)

# MediaMTX 설정
cat > /opt/videopick/docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  mediamtx:
    image: bluenviron/mediamtx:latest
    container_name: videopick-mediamtx
    volumes:
      - /opt/videopick/config/mediamtx.yml:/mediamtx.yml
      - /opt/videopick/data/streams:/recordings
    ports:
      - "1935:1935"   # RTMP
      - "8888:8888"   # HLS
      - "8889:8889"   # WebRTC
      - "8554:8554"   # RTSP
    restart: always

  ffmpeg:
    image: linuxserver/ffmpeg:latest
    container_name: videopick-ffmpeg
    volumes:
      - /opt/videopick/data/streams:/streams
    restart: unless-stopped
COMPOSE

# MediaMTX 설정 파일
cat > /opt/videopick/config/mediamtx.yml << 'CONFIG'
###############################################
# General parameters

# Sets the verbosity of the program; available values are "error", "warn", "info", "debug".
logLevel: info
logDestinations: [stdout]
logFile: /var/log/mediamtx.log

# HTTP API
api: yes
apiAddress: :9997

# Metrics
metrics: yes
metricsAddress: :9998

# RTMP parameters
rtmp: yes
rtmpAddress: :1935
rtmpEncryption: no

# HLS parameters
hls: yes
hlsAddress: :8888
hlsAllowOrigin: '*'
hlsSegmentCount: 10
hlsSegmentDuration: 2s
hlsPartDuration: 200ms

# WebRTC parameters
webrtc: yes
webrtcAddress: :8889
webrtcAllowOrigin: '*'
webrtcICEServers: [stun:stun.l.google.com:19302]

# RTSP parameters
rtsp: yes
protocols: [tcp, udp]
rtspAddress: :8554

# Recording
record: yes
recordPath: /recordings/%path/%Y-%m-%d_%H-%M-%S.mp4
recordFormat: mp4
recordPartDuration: 10s
recordSegmentDuration: 1h
recordDeleteAfter: 720h

# Path defaults
pathDefaults:
  source: publisher
  sourceOnDemand: no
  maxReaders: 1000
  record: yes
CONFIG

# 방화벽 설정
ufw allow 22/tcp
ufw allow 1935/tcp
ufw allow 8888/tcp
ufw allow 8889/tcp
ufw allow 8554/tcp
ufw --force enable

# Docker 컨테이너 시작
cd /opt/videopick
docker-compose up -d

echo "✅ 스트리밍 서버 설정 완료"
EOF

# 3. 스토리지 서버 설정
echo -e "\n${YELLOW}💾 스토리지 서버 설정 시작...${NC}"
ssh -o StrictHostKeyChecking=no root@$STORAGE_SERVER_IP << EOF
$(create_directories)

# Docker Compose 파일 생성
cat > /opt/videopick/docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: videopick-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: videopick
      MINIO_ROOT_PASSWORD: secure_minio_password
    volumes:
      - /opt/videopick/data/minio:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    restart: always

  tusd:
    image: tusproject/tusd:latest
    container_name: videopick-tusd
    command: -dir /uploads -hooks-http http://APP_SERVER_IP:3000/api/upload/hooks
    volumes:
      - /opt/videopick/data/uploads:/uploads
    ports:
      - "1080:1080"
    restart: always
COMPOSE

# IP 주소 치환
sed -i "s/APP_SERVER_IP/$APP_SERVER_IP/g" /opt/videopick/docker-compose.yml

# MinIO 버킷 초기화 스크립트
cat > /opt/videopick/scripts/init-minio.sh << 'SCRIPT'
#!/bin/bash
sleep 10
docker exec videopick-minio mc alias set local http://localhost:9000 videopick secure_minio_password
docker exec videopick-minio mc mb local/videos --ignore-existing
docker exec videopick-minio mc mb local/thumbnails --ignore-existing
docker exec videopick-minio mc mb local/recordings --ignore-existing
docker exec videopick-minio mc mb local/uploads --ignore-existing
docker exec videopick-minio mc policy set public local/videos
docker exec videopick-minio mc policy set public local/thumbnails
docker exec videopick-minio mc policy set public local/recordings
echo "MinIO 버킷 초기화 완료"
SCRIPT

chmod +x /opt/videopick/scripts/init-minio.sh

# 방화벽 설정
ufw allow 22/tcp
ufw allow 1080/tcp
ufw allow 9000/tcp
ufw allow 9001/tcp
ufw --force enable

# Docker 컨테이너 시작
cd /opt/videopick
docker-compose up -d

# MinIO 초기화
sleep 10
/opt/videopick/scripts/init-minio.sh

echo "✅ 스토리지 서버 설정 완료"
EOF

# 4. 백업 서버 설정
echo -e "\n${YELLOW}💾 백업 서버 설정 시작...${NC}"
ssh -o StrictHostKeyChecking=no root@$BACKUP_SERVER_IP << EOF
$(create_directories)

# 백업 디렉토리 추가 생성
mkdir -p /opt/videopick/backups/{database,redis,media,config}

# Restic 설치 및 초기화
apt-get update && apt-get install -y restic
restic init --repo /opt/videopick/backups/restic --password-file <(echo "backup_password_here")

# 백업 스크립트 생성
cat > /opt/videopick/scripts/backup-all.sh << 'SCRIPT'
#!/bin/bash

BACKUP_DIR="/opt/videopick/backups"
BACKUP_DATE=\$(date +%Y%m%d_%H%M%S)
APP_SERVER_IP="$APP_SERVER_IP"
STORAGE_SERVER_IP="$STORAGE_SERVER_IP"
STREAMING_SERVER_IP="$STREAMING_SERVER_IP"

echo "🔄 백업 시작: \$BACKUP_DATE"

# 1. PostgreSQL 백업
echo "📊 PostgreSQL 백업 중..."
PGPASSWORD=secure_password_here pg_dump \
    -h \$APP_SERVER_IP -U videopick -d videopick \
    > \$BACKUP_DIR/database/videopick_\$BACKUP_DATE.sql

# 2. Redis 백업
echo "💾 Redis 백업 중..."
ssh root@\$APP_SERVER_IP "docker exec videopick-redis redis-cli BGSAVE"
sleep 5
rsync -avz root@\$APP_SERVER_IP:/opt/videopick/data/redis/dump.rdb \
    \$BACKUP_DIR/redis/dump_\$BACKUP_DATE.rdb

# 3. 미디어 파일 백업
echo "🎥 미디어 파일 백업 중..."
rsync -avz root@\$STORAGE_SERVER_IP:/opt/videopick/data/minio/ \
    \$BACKUP_DIR/media/minio_\$BACKUP_DATE/

rsync -avz root@\$STORAGE_SERVER_IP:/opt/videopick/data/uploads/ \
    \$BACKUP_DIR/media/uploads_\$BACKUP_DATE/

# 4. 설정 파일 백업
echo "⚙️ 설정 파일 백업 중..."
rsync -avz root@\$APP_SERVER_IP:/opt/videopick/config/ \
    \$BACKUP_DIR/config/app_\$BACKUP_DATE/

rsync -avz root@\$STREAMING_SERVER_IP:/opt/videopick/config/ \
    \$BACKUP_DIR/config/streaming_\$BACKUP_DATE/

# 5. Restic으로 증분 백업
echo "📦 Restic 증분 백업 중..."
export RESTIC_PASSWORD="backup_password_here"
restic backup /opt/videopick/backups --repo /opt/videopick/backups/restic

# 오래된 백업 정리 (30일 이상)
find \$BACKUP_DIR -type f -mtime +30 -delete
find \$BACKUP_DIR -type d -empty -delete

echo "✅ 백업 완료: \$BACKUP_DATE"
SCRIPT

chmod +x /opt/videopick/scripts/backup-all.sh

# Crontab 설정 (매일 새벽 3시 백업)
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/videopick/scripts/backup-all.sh >> /opt/videopick/logs/backup.log 2>&1") | crontab -

# 방화벽 설정
ufw allow 22/tcp
ufw allow 873/tcp  # rsync
ufw --force enable

echo "✅ 백업 서버 설정 완료"
EOF

echo -e "\n${GREEN}🎉 모든 서버 설정이 완료되었습니다!${NC}"
echo -e "\n📊 서버 상태:"
echo "  - 앱 서버: http://$APP_SERVER_IP:3000"
echo "  - 스트리밍 서버 (RTMP): rtmp://$STREAMING_SERVER_IP:1935/live"
echo "  - 스트리밍 서버 (HLS): http://$STREAMING_SERVER_IP:8888"
echo "  - 스토리지 서버 (MinIO): http://$STORAGE_SERVER_IP:9001"
echo "  - 스토리지 서버 (TUS): http://$STORAGE_SERVER_IP:1080"
echo -e "\n다음 단계:"
echo "1. Next.js 애플리케이션 배포"
echo "2. SSL 인증서 설정"
echo "3. 도메인 DNS 설정"
echo "4. 모니터링 시스템 구축"