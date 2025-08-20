#!/bin/bash

# VideoPick Platform - 모든 서버 초기 설정 스크립트
# Phase 2: 1,000명 동접 서버 구성

set -e

echo "🚀 VideoPick Platform 서버 설정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Terraform 출력에서 IP 주소 가져오기
cd ../terraform
APP_SERVER_IP=$(terraform output -raw app_server_ip 2>/dev/null || echo "")
STREAMING_SERVER_IP=$(terraform output -raw streaming_server_ip 2>/dev/null || echo "")
STORAGE_SERVER_IP=$(terraform output -raw storage_server_ip 2>/dev/null || echo "")
BACKUP_SERVER_IP=$(terraform output -raw backup_server_ip 2>/dev/null || echo "")
cd ../scripts

if [ -z "$APP_SERVER_IP" ] || [ -z "$STREAMING_SERVER_IP" ] || [ -z "$STORAGE_SERVER_IP" ] || [ -z "$BACKUP_SERVER_IP" ]; then
    echo -e "${RED}❌ 서버 IP를 찾을 수 없습니다. Terraform apply를 먼저 실행하세요.${NC}"
    exit 1
fi

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

# 모든 서버 연결 대기
wait_for_server $APP_SERVER_IP "앱"
wait_for_server $STREAMING_SERVER_IP "스트리밍"
wait_for_server $STORAGE_SERVER_IP "스토리지"
wait_for_server $BACKUP_SERVER_IP "백업"

echo ""
echo "🔧 서버 초기 설정 시작..."

# 1. 앱 서버 설정
echo ""
echo "1️⃣ 앱 서버 설정 (Next.js + PostgreSQL + Redis + Centrifugo)"
ssh -o StrictHostKeyChecking=no root@$APP_SERVER_IP << 'EOF'
# 시스템 업데이트
apt-get update && apt-get upgrade -y

# 필수 패키지 설치
apt-get install -y \
    docker.io \
    docker-compose \
    nginx \
    postgresql-client \
    redis-tools \
    git \
    curl \
    wget \
    htop \
    ufw

# Docker 시작
systemctl start docker
systemctl enable docker

# 작업 디렉토리 생성
mkdir -p /opt/videopick/{app,data,logs,config}

# PostgreSQL 설정
docker run -d \
    --name postgres \
    --restart always \
    -e POSTGRES_DB=videopick \
    -e POSTGRES_USER=videopick \
    -e POSTGRES_PASSWORD=secure_password_here \
    -p 5432:5432 \
    -v /opt/videopick/data/postgres:/var/lib/postgresql/data \
    postgres:14-alpine

# Redis 설정
docker run -d \
    --name redis \
    --restart always \
    -p 6379:6379 \
    -v /opt/videopick/data/redis:/data \
    redis:7-alpine redis-server --appendonly yes

# Centrifugo 채팅 서버 설정
cat > /opt/videopick/config/centrifugo.json << 'CONFIG'
{
  "token_hmac_secret_key": "your-secret-key-here",
  "admin_password": "admin-password-here",
  "admin_secret": "admin-secret-here",
  "api_key": "api-key-here",
  "allowed_origins": ["*"],
  "presence": true,
  "join_leave": true,
  "force_recovery": true,
  "allow_publish_for_client": true,
  "allow_subscribe_for_client": true,
  "engine": "redis",
  "redis_address": "localhost:6379",
  "client_max_message_size": 65536,
  "channel_max_length": 255
}
CONFIG

docker run -d \
    --name centrifugo \
    --restart always \
    -p 8000:8000 \
    -v /opt/videopick/config/centrifugo.json:/centrifugo/config.json \
    --network host \
    centrifugo/centrifugo:v4 centrifugo -c /centrifugo/config.json

echo "✅ 앱 서버 설정 완료"
EOF

# 2. 스트리밍 서버 설정
echo ""
echo "2️⃣ 스트리밍 서버 설정 (MediaMTX + FFmpeg)"
ssh -o StrictHostKeyChecking=no root@$STREAMING_SERVER_IP << 'EOF'
# 시스템 업데이트
apt-get update && apt-get upgrade -y

# 필수 패키지 설치
apt-get install -y \
    docker.io \
    docker-compose \
    ffmpeg \
    nginx \
    git \
    curl \
    wget \
    htop \
    ufw

# Docker 시작
systemctl start docker
systemctl enable docker

# 작업 디렉토리 생성
mkdir -p /opt/videopick/{streams,recordings,config,logs}

# MediaMTX 설정 파일 생성
cat > /opt/videopick/config/mediamtx.yml << 'CONFIG'
logLevel: info
logDestinations: [stdout, file]
logFile: /logs/mediamtx.log

metrics: yes
metricsAddress: :9998

pprof: no
pprofAddress: :9999

# RTMP 설정
rtmp: yes
rtmpAddress: :1935
rtmpEncryption: no
rtspAddress: :8554
rtpAddress: :8000
rtcpAddress: :8001
multicastIPRange: 224.1.0.0/16
multicastRTPPort: 8002
multicastRTCPPort: 8003

# HLS 설정
hls: yes
hlsAddress: :8888
hlsAlwaysRemux: no
hlsSegmentCount: 7
hlsSegmentDuration: 2s
hlsPartDuration: 500ms
hlsSegmentMaxSize: 50M
hlsAllowOrigin: '*'

# WebRTC 설정
webrtc: yes
webrtcAddress: :8889
webrtcEncryption: no
webrtcServerKey: ""
webrtcServerCert: ""
webrtcAllowOrigin: '*'
webrtcTrustedProxies: []
webrtcICEServers: []

# 스트림 경로 설정
paths:
  all:
    source: publisher
    record: yes
    recordPath: /recordings/%path/%Y-%m-%d_%H-%M-%S.mp4
    recordFormat: mp4
    recordPartDuration: 1s
    recordSegmentDuration: 1h
    recordDeleteAfter: 720h
CONFIG

# MediaMTX 실행
docker run -d \
    --name mediamtx \
    --restart always \
    -p 1935:1935 \
    -p 8554:8554 \
    -p 8888:8888 \
    -p 8889:8889 \
    -p 9998:9998 \
    -v /opt/videopick/config/mediamtx.yml:/mediamtx.yml \
    -v /opt/videopick/streams:/streams \
    -v /opt/videopick/recordings:/recordings \
    -v /opt/videopick/logs:/logs \
    bluenviron/mediamtx:latest

# 썸네일 생성 서비스
cat > /opt/videopick/thumbnail-generator.sh << 'SCRIPT'
#!/bin/bash
while true; do
    for stream in /opt/videopick/streams/*; do
        if [ -f "$stream" ]; then
            filename=$(basename "$stream")
            ffmpeg -i "$stream" -vf "select='eq(pict_type,I)'" -vframes 1 \
                   "/opt/videopick/thumbnails/${filename%.*}.jpg" -y
        fi
    done
    sleep 10
done
SCRIPT

chmod +x /opt/videopick/thumbnail-generator.sh
nohup /opt/videopick/thumbnail-generator.sh &

echo "✅ 스트리밍 서버 설정 완료"
EOF

# 3. 스토리지 서버 설정
echo ""
echo "3️⃣ 스토리지 서버 설정 (TUS + MinIO)"
ssh -o StrictHostKeyChecking=no root@$STORAGE_SERVER_IP << 'EOF'
# 시스템 업데이트
apt-get update && apt-get upgrade -y

# 필수 패키지 설치
apt-get install -y \
    docker.io \
    docker-compose \
    nginx \
    git \
    curl \
    wget \
    htop \
    ufw

# Docker 시작
systemctl start docker
systemctl enable docker

# 작업 디렉토리 생성
mkdir -p /opt/videopick/{uploads,temp,config,logs}
mkdir -p /data/minio

# MinIO 객체 스토리지 설정
docker run -d \
    --name minio \
    --restart always \
    -p 9000:9000 \
    -p 9001:9001 \
    -e MINIO_ROOT_USER=admin \
    -e MINIO_ROOT_PASSWORD=secure_password_here \
    -v /data/minio:/data \
    minio/minio server /data --console-address ":9001"

# TUS 업로드 서버 설정
docker run -d \
    --name tusd \
    --restart always \
    -p 1080:1080 \
    -v /opt/videopick/uploads:/srv/tusd-data/data \
    tusproject/tusd:latest \
    -hooks-dir /srv/tusd-hooks \
    -behind-proxy \
    -max-size 5368709120

# Nginx 리버스 프록시 설정
cat > /etc/nginx/sites-available/storage << 'NGINX'
server {
    listen 80;
    client_max_body_size 5G;
    proxy_request_buffering off;
    proxy_buffering off;
    
    location /files/ {
        proxy_pass http://localhost:1080/files/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # TUS 헤더
        proxy_set_header Tus-Resumable 1.0.0;
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Tus-Resumable, Upload-Length, Upload-Offset, Upload-Metadata';
        add_header 'Access-Control-Expose-Headers' 'Upload-Offset, Location, Tus-Resumable, Tus-Version, Tus-Extension, Tus-Max-Size';
        add_header 'Access-Control-Allow-Methods' 'POST, GET, HEAD, PATCH, DELETE, OPTIONS';
    }
    
    location /minio/ {
        proxy_pass http://localhost:9001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

ln -s /etc/nginx/sites-available/storage /etc/nginx/sites-enabled/
systemctl restart nginx

echo "✅ 스토리지 서버 설정 완료"
EOF

# 4. 백업 서버 설정
echo ""
echo "4️⃣ 백업 서버 설정 (데이터 백업 및 재해 복구)"
ssh -o StrictHostKeyChecking=no root@$BACKUP_SERVER_IP << 'EOF'
# 시스템 업데이트
apt-get update && apt-get upgrade -y

# 필수 패키지 설치
apt-get install -y \
    docker.io \
    docker-compose \
    rsync \
    postgresql-client \
    redis-tools \
    rclone \
    restic \
    git \
    curl \
    wget \
    htop \
    ufw

# Docker 시작
systemctl start docker
systemctl enable docker

# 작업 디렉토리 생성
mkdir -p /opt/videopick/{backups,scripts,logs,temp}
mkdir -p /backup/{database,media,config,snapshots}

# 백업 스크립트 생성
cat > /opt/videopick/scripts/backup-all.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"

# 데이터베이스 백업
echo "📦 PostgreSQL 백업 시작..."
PGPASSWORD=secure_password_here pg_dump \
    -h APP_SERVER_IP \
    -U videopick \
    -d videopick \
    > $BACKUP_DIR/database/videopick_$BACKUP_DATE.sql

# Redis 백업
echo "📦 Redis 백업 시작..."
redis-cli -h APP_SERVER_IP --rdb $BACKUP_DIR/database/redis_$BACKUP_DATE.rdb

# 미디어 파일 백업
echo "📦 미디어 파일 백업 시작..."
rsync -avz --progress \
    root@STORAGE_SERVER_IP:/opt/videopick/uploads/ \
    $BACKUP_DIR/media/uploads_$BACKUP_DATE/

# 스트리밍 녹화 파일 백업
echo "📦 스트리밍 녹화 백업 시작..."
rsync -avz --progress \
    root@STREAMING_SERVER_IP:/opt/videopick/recordings/ \
    $BACKUP_DIR/media/recordings_$BACKUP_DATE/

# 설정 파일 백업
echo "📦 설정 파일 백업 시작..."
rsync -avz --progress \
    root@APP_SERVER_IP:/opt/videopick/config/ \
    $BACKUP_DIR/config/app_$BACKUP_DATE/

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "✅ 백업 완료: $BACKUP_DATE"
SCRIPT

chmod +x /opt/videopick/scripts/backup-all.sh

# IP 주소 교체
sed -i "s/APP_SERVER_IP/$APP_SERVER_IP/g" /opt/videopick/scripts/backup-all.sh
sed -i "s/STORAGE_SERVER_IP/$STORAGE_SERVER_IP/g" /opt/videopick/scripts/backup-all.sh
sed -i "s/STREAMING_SERVER_IP/$STREAMING_SERVER_IP/g" /opt/videopick/scripts/backup-all.sh

# Crontab 설정 (매일 새벽 3시 백업)
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/videopick/scripts/backup-all.sh >> /opt/videopick/logs/backup.log 2>&1") | crontab -

# Restic 초기화 (증분 백업용)
restic init --repo /backup/restic

echo "✅ 백업 서버 설정 완료"
EOF

echo ""
echo "🔐 방화벽 설정..."

# 앱 서버 방화벽
ssh root@$APP_SERVER_IP "ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 3000/tcp && ufw allow 8000/tcp && ufw allow 5432/tcp && ufw allow 6379/tcp && echo 'y' | ufw enable"

# 스트리밍 서버 방화벽
ssh root@$STREAMING_SERVER_IP "ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 1935/tcp && ufw allow 8554/tcp && ufw allow 8888/tcp && ufw allow 8889/tcp && echo 'y' | ufw enable"

# 스토리지 서버 방화벽
ssh root@$STORAGE_SERVER_IP "ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 1080/tcp && ufw allow 9000/tcp && ufw allow 9001/tcp && echo 'y' | ufw enable"

# 백업 서버 방화벽
ssh root@$BACKUP_SERVER_IP "ufw allow 22/tcp && ufw allow 873/tcp && echo 'y' | ufw enable"

echo ""
echo "✅ 모든 서버 설정 완료!"
echo ""
echo "📊 서비스 접속 정보:"
echo "  - Next.js 앱: http://$APP_SERVER_IP:3000"
echo "  - Centrifugo 채팅: http://$APP_SERVER_IP:8000"
echo "  - MediaMTX HLS: http://$STREAMING_SERVER_IP:8888"
echo "  - MediaMTX WebRTC: http://$STREAMING_SERVER_IP:8889"
echo "  - MinIO 콘솔: http://$STORAGE_SERVER_IP:9001"
echo "  - TUS 업로드: http://$STORAGE_SERVER_IP:1080"
echo ""
echo "📚 다음 단계:"
echo "  1. 도메인 DNS를 서버 IP로 설정"
echo "  2. SSL 인증서 설치 (./setup-ssl.sh)"
echo "  3. 애플리케이션 배포"
echo "  4. 모니터링 대시보드 설정"