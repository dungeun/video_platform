# 🚀 Vultr 1,000명 동접 서버 구성 (Phase 2)

## 📊 서버 스펙 및 비용

### 최적화된 구성 (RAM 증가, 월 $220)
```
┌─────────────────────────────────────────────────────────────┐
│                     서버 구성 요약                            │
├─────────────────────────────────────────────────────────────┤
│ • 앱 서버: 2 vCPU, 8GB RAM, 160GB SSD - $48/월            │
│ • 스트리밍 서버: 4 vCPU, 16GB RAM, 320GB SSD - $96/월     │
│ • DB/Redis/Chat: 2 vCPU, 8GB RAM, 160GB SSD - $48/월      │
│ • Block Storage: 500GB - $50/월                             │
│ • 예상 트래픽: $30/월                                       │
├─────────────────────────────────────────────────────────────┤
│ 총 비용: $272/월 (약 35만원)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Vultr API 설정

```bash
# API 키 설정
export VULTR_API_KEY="XZD6MCORJSZHPILSOWOIZ3R356CXOWSMBAFQ"

# Vultr CLI 설치
curl -sSL https://github.com/vultr/vultr-cli/releases/download/v2.0.0/vultr-cli_2.0.0_linux_64.tar.gz | tar xz
sudo mv vultr-cli /usr/local/bin/

# API 키 확인
vultr-cli account info
```

---

## 🖥️ 서버 생성 스크립트

### 1. Terraform 설정
```hcl
# terraform/main.tf
terraform {
  required_providers {
    vultr = {
      source = "vultr/vultr"
      version = "~> 2.0"
    }
  }
}

provider "vultr" {
  api_key = var.vultr_api_key
  rate_limit = 100
  retry_limit = 3
}

variable "vultr_api_key" {
  default = "XZD6MCORJSZHPILSOWOIZ3R356CXOWSMBAFQ"
  sensitive = true
}

# SSH 키 생성
resource "vultr_ssh_key" "main" {
  name = "videopick-key"
  ssh_key = file("~/.ssh/id_rsa.pub")
}

# 1. 앱 서버 (Next.js + Go API Gateway)
resource "vultr_instance" "app_server" {
  plan = "vc2-2c-8gb"  # 2 vCPU, 8GB RAM, 160GB SSD
  region = "nrt"       # Tokyo (한국에서 가장 가까움)
  os_id = 1743        # Ubuntu 22.04 LTS
  label = "videopick-app"
  hostname = "app.videopick.com"
  enable_ipv6 = true
  backups = "enabled"
  ddos_protection = false
  activation_email = false
  ssh_key_ids = [vultr_ssh_key.main.id]
  
  user_data = base64encode(templatefile("${path.module}/scripts/app-init.sh", {
    api_url = vultr_instance.streaming_server.main_ip
    db_host = vultr_instance.database_server.main_ip
  }))
  
  tags = ["production", "app", "videopick"]
}

# 2. 스트리밍 서버 (MediaMTX + FFmpeg)
resource "vultr_instance" "streaming_server" {
  plan = "vc2-4c-16gb"  # 4 vCPU, 16GB RAM, 320GB SSD
  region = "nrt"
  os_id = 1743
  label = "videopick-streaming"
  hostname = "stream.videopick.com"
  enable_ipv6 = true
  backups = "enabled"
  ssh_key_ids = [vultr_ssh_key.main.id]
  
  user_data = base64encode(file("${path.module}/scripts/streaming-init.sh"))
  
  tags = ["production", "streaming", "videopick"]
}

# 3. 데이터베이스 서버 (PostgreSQL + Redis + Centrifugo)
resource "vultr_instance" "database_server" {
  plan = "vc2-2c-8gb"  # 2 vCPU, 8GB RAM, 160GB SSD
  region = "nrt"
  os_id = 1743
  label = "videopick-database"
  hostname = "db.videopick.com"
  enable_ipv6 = true
  backups = "enabled"
  ssh_key_ids = [vultr_ssh_key.main.id]
  
  user_data = base64encode(file("${path.module}/scripts/database-init.sh"))
  
  tags = ["production", "database", "videopick"]
}

# 4. Block Storage (비디오 저장)
resource "vultr_block_storage" "video_storage" {
  size_gb = 500
  region = "nrt"
  label = "videopick-storage"
  
  attached_to_instance = vultr_instance.streaming_server.id
}

# 5. Private Network (내부 통신)
resource "vultr_private_network" "internal" {
  description = "VideoPick Internal Network"
  region = "nrt"
  v4_subnet = "10.0.0.0"
  v4_subnet_mask = 24
}

# 서버를 Private Network에 연결
resource "vultr_instance_ipv4" "app_private" {
  instance_id = vultr_instance.app_server.id
  reboot = false
}

resource "vultr_instance_ipv4" "streaming_private" {
  instance_id = vultr_instance.streaming_server.id
  reboot = false
}

resource "vultr_instance_ipv4" "database_private" {
  instance_id = vultr_instance.database_server.id
  reboot = false
}

# Firewall 규칙
resource "vultr_firewall_group" "main" {
  description = "VideoPick Firewall Rules"
}

# Firewall 규칙들
resource "vultr_firewall_rule" "ssh" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol = "tcp"
  ip_type = "v4"
  subnet = "0.0.0.0"
  subnet_size = 0
  port = "22"
  notes = "SSH"
}

resource "vultr_firewall_rule" "http" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol = "tcp"
  ip_type = "v4"
  subnet = "0.0.0.0"
  subnet_size = 0
  port = "80"
  notes = "HTTP"
}

resource "vultr_firewall_rule" "https" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol = "tcp"
  ip_type = "v4"
  subnet = "0.0.0.0"
  subnet_size = 0
  port = "443"
  notes = "HTTPS"
}

resource "vultr_firewall_rule" "rtmp" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol = "tcp"
  ip_type = "v4"
  subnet = "0.0.0.0"
  subnet_size = 0
  port = "1935"
  notes = "RTMP"
}

resource "vultr_firewall_rule" "hls" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol = "tcp"
  ip_type = "v4"
  subnet = "0.0.0.0"
  subnet_size = 0
  port = "8888"
  notes = "HLS"
}

resource "vultr_firewall_rule" "chat" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol = "tcp"
  ip_type = "v4"
  subnet = "0.0.0.0"
  subnet_size = 0
  port = "8000"
  notes = "Chat WebSocket"
}

# 출력 값
output "app_server_ip" {
  value = vultr_instance.app_server.main_ip
}

output "streaming_server_ip" {
  value = vultr_instance.streaming_server.main_ip
}

output "database_server_ip" {
  value = vultr_instance.database_server.main_ip
}

output "storage_id" {
  value = vultr_block_storage.video_storage.id
}

output "private_network_id" {
  value = vultr_private_network.internal.id
}
```

---

## 📜 서버 초기화 스크립트

### 앱 서버 초기화
```bash
#!/bin/bash
# scripts/app-init.sh

# 시스템 업데이트
apt-get update && apt-get upgrade -y

# Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Go 1.21 설치
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile

# PM2 설치
npm install -g pm2

# Nginx 설치
apt-get install -y nginx certbot python3-certbot-nginx

# 프로젝트 클론
cd /opt
git clone https://github.com/your-repo/videopick.git
cd videopick

# 환경변수 설정
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@${db_host}:5432/videopick
REDIS_URL=redis://${db_host}:6379
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_API_URL=http://${api_url}:8080
NEXT_PUBLIC_CHAT_URL=ws://${db_host}:8000
NEXT_PUBLIC_HLS_URL=http://${api_url}:8888
EOF

# Next.js 빌드
cd frontend
npm install
npm run build

# Go 서비스 빌드
cd ../backend
go mod download
go build -o bin/api cmd/api/main.go

# PM2로 서비스 시작
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Nginx 설정
cat > /etc/nginx/sites-available/videopick << 'NGINX'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/v2 {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

ln -s /etc/nginx/sites-available/videopick /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

### 스트리밍 서버 초기화
```bash
#!/bin/bash
# scripts/streaming-init.sh

apt-get update && apt-get upgrade -y

# FFmpeg 설치
apt-get install -y ffmpeg

# Go 설치
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
source /etc/profile

# MediaMTX 설치
wget https://github.com/bluenviron/mediamtx/releases/download/v1.0.0/mediamtx_v1.0.0_linux_amd64.tar.gz
tar -xzf mediamtx_v1.0.0_linux_amd64.tar.gz
mv mediamtx /usr/local/bin/
chmod +x /usr/local/bin/mediamtx

# MediaMTX 설정
cat > /etc/mediamtx.yml << 'CONFIG'
logLevel: info
logDestinations: [stdout, file]
logFile: /var/log/mediamtx.log

api:
  address: :9997

metrics:
  address: :9998

rtmp:
  address: :1935

hls:
  address: :8888
  allowOrigin: '*'
  trustedProxies: []

webrtc:
  address: :8889
  allowOrigin: '*'

paths:
  all:
    source: publisher
    sourceProtocol: automatic
    publishUser: stream
    publishPass: ${STREAM_PASSWORD}
    readUser:
    readPass:
    
    # 녹화 설정
    record: yes
    recordPath: /recordings/%path/%Y-%m-%d_%H-%M-%S.mp4
    recordFormat: mp4
    recordPartDuration: 1h
    recordSegmentDuration: 1h
    recordDeleteAfter: 720h
CONFIG

# Block Storage 마운트
mkdir -p /recordings
echo '/dev/vdb /recordings ext4 defaults,nofail,discard 0 0' >> /etc/fstab
mkfs.ext4 /dev/vdb
mount -a

# SystemD 서비스 생성
cat > /etc/systemd/system/mediamtx.service << 'SERVICE'
[Unit]
Description=MediaMTX
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/mediamtx /etc/mediamtx.yml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable mediamtx
systemctl start mediamtx
```

### 데이터베이스 서버 초기화
```bash
#!/bin/bash
# scripts/database-init.sh

apt-get update && apt-get upgrade -y

# PostgreSQL 15 설치
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get -y install postgresql-15 postgresql-client-15

# PostgreSQL 설정
sudo -u postgres psql << SQL
CREATE USER videopick WITH PASSWORD 'your-secure-password';
CREATE DATABASE videopick OWNER videopick;
GRANT ALL PRIVILEGES ON DATABASE videopick TO videopick;
SQL

# 외부 접속 허용
echo "host all all 10.0.0.0/24 md5" >> /etc/postgresql/15/main/pg_hba.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/15/main/postgresql.conf
systemctl restart postgresql

# Redis 설치
apt-get install -y redis-server
sed -i "s/bind 127.0.0.1/bind 0.0.0.0/" /etc/redis/redis.conf
sed -i "s/# requirepass foobared/requirepass your-redis-password/" /etc/redis/redis.conf
systemctl restart redis

# Centrifugo 설치 (채팅 서버)
wget https://github.com/centrifugal/centrifugo/releases/download/v5.0.0/centrifugo_5.0.0_linux_amd64.tar.gz
tar -xzf centrifugo_5.0.0_linux_amd64.tar.gz
mv centrifugo /usr/local/bin/
chmod +x /usr/local/bin/centrifugo

# Centrifugo 설정
cat > /etc/centrifugo.json << 'CONFIG'
{
  "token_hmac_secret_key": "your-secret-key",
  "admin": true,
  "admin_password": "admin-password",
  "admin_secret": "admin-secret",
  "api_key": "api-key",
  "allowed_origins": ["*"],
  "namespaces": [{
    "name": "chat",
    "presence": true,
    "join_leave": true,
    "force_push_join_leave": true,
    "history_size": 100,
    "history_ttl": "300s",
    "force_recovery": true
  }]
}
CONFIG

# Centrifugo 서비스 생성
cat > /etc/systemd/system/centrifugo.service << 'SERVICE'
[Unit]
Description=Centrifugo
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/centrifugo -c /etc/centrifugo.json
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable centrifugo
systemctl start centrifugo

# 백업 스크립트
cat > /usr/local/bin/backup.sh << 'BACKUP'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# PostgreSQL 백업
pg_dump -U postgres videopick | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Redis 백업
redis-cli --rdb $BACKUP_DIR/redis_$DATE.rdb

# 30일 이상 오래된 백업 삭제
find $BACKUP_DIR -type f -mtime +30 -delete
BACKUP

chmod +x /usr/local/bin/backup.sh
echo "0 3 * * * /usr/local/bin/backup.sh" | crontab -
```

---

## 🚀 배포 명령어

```bash
# 1. Terraform 초기화
cd terraform
terraform init

# 2. 계획 확인
terraform plan

# 3. 서버 생성 (약 5분 소요)
terraform apply -auto-approve

# 4. 서버 IP 확인
terraform output

# 5. SSH 접속
ssh root@$(terraform output -raw app_server_ip)
ssh root@$(terraform output -raw streaming_server_ip)
ssh root@$(terraform output -raw database_server_ip)

# 6. 상태 확인
curl http://$(terraform output -raw app_server_ip)
curl http://$(terraform output -raw streaming_server_ip):8888/status
```

---

## 📊 모니터링 설정

```bash
# Grafana + Prometheus 설치 (앱 서버)
docker run -d \
  --name=grafana \
  -p 3001:3000 \
  grafana/grafana

docker run -d \
  --name=prometheus \
  -p 9090:9090 \
  -v /etc/prometheus:/etc/prometheus \
  prom/prometheus

# MediaMTX 메트릭 수집
# http://streaming-server:9998/metrics
```

---

## 🔐 보안 설정

```bash
# SSL 인증서 설정 (앱 서버에서)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# UFW 방화벽 설정
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1935/tcp
ufw allow 8888/tcp
ufw allow 8000/tcp
ufw --force enable

# fail2ban 설치
apt-get install -y fail2ban
```

---

## ✅ 성능 벤치마크

### 예상 성능 (1,000명 동접)
| 컴포넌트 | CPU 사용률 | 메모리 | 네트워크 |
|---------|-----------|--------|----------|
| 앱 서버 | 40% | 3GB/8GB | 100Mbps |
| 스트리밍 서버 | 60% | 8GB/16GB | 500Mbps |
| DB 서버 | 30% | 4GB/8GB | 50Mbps |
| **시스템 전체** | **적정** | **충분** | **650Mbps** |

---

## 🎯 다음 단계

1. **도메인 연결**: Vultr DNS 또는 Cloudflare 설정
2. **SSL 인증서**: Let's Encrypt 설정
3. **모니터링**: Grafana 대시보드 구성
4. **백업**: 자동 백업 설정 확인
5. **CDN**: 필요시 Cloudflare 추가

---

*이 구성은 1,000명 동시 접속을 안정적으로 처리할 수 있습니다.*
*필요시 각 서버를 독립적으로 스케일업 가능합니다.*