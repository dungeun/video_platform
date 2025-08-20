# 🚀 Vultr 서버 자동 배포 계획

## 📋 자동화 전략 개요

### 목표
- **원클릭 배포**: 전체 인프라를 30분 내 구축
- **무중단 배포**: Blue-Green 배포 전략
- **자동 복구**: 장애 시 자동 복구 메커니즘
- **모니터링**: 실시간 상태 확인 및 알림

---

## 🛠️ 필요한 도구

### 1. Vultr API
```bash
# API 키 환경변수
VULTR_API_KEY="your-api-key-here"

# Vultr CLI 설치
brew install vultr-cli  # macOS
apt install vultr-cli   # Ubuntu
```

### 2. 자동화 도구
- **Terraform**: 인프라 프로비저닝
- **Ansible**: 서버 구성 관리
- **Docker**: 컨테이너화
- **GitHub Actions**: CI/CD

---

## 📦 Docker 컨테이너 구성

### docker-compose.yml 구조
```yaml
version: '3.8'

services:
  # Next.js 애플리케이션
  app:
    image: videopick/app:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=videopick

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  # 스트리밍 서버
  streaming:
    image: videopick/streaming:latest
    ports:
      - "1935:1935"  # RTMP
      - "8000:8000"  # HTTP-FLV
      - "8080:8080"  # HLS
    volumes:
      - streaming_data:/data

  # 채팅 서버
  chat:
    image: videopick/chat:latest
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=${REDIS_URL}

  # Nginx 리버스 프록시
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ssl_certs:/etc/letsencrypt

volumes:
  postgres_data:
  redis_data:
  streaming_data:
  ssl_certs:
```

---

## 🔧 Terraform 인프라 코드

### main.tf 구조
```hcl
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
}

# 변수 정의
variable "vultr_api_key" {
  description = "Vultr API Key"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Vultr Region"
  default     = "nrt"  # Seoul
}

# SSH 키
resource "vultr_ssh_key" "main" {
  name    = "videopick-key"
  ssh_key = file("~/.ssh/id_rsa.pub")
}

# 메인 서버 (Option 1: 통합 서버)
resource "vultr_instance" "main_server" {
  plan        = "vc2-6c-16gb"  # 6 vCPU, 16GB RAM
  region      = var.region
  os_id       = 1743  # Ubuntu 22.04
  label       = "videopick-main"
  hostname    = "videopick.com"
  ssh_key_ids = [vultr_ssh_key.main.id]
  
  user_data = base64encode(file("init-script.sh"))
  
  tags = ["production", "videopick"]
}

# Block Storage
resource "vultr_block_storage" "video_storage" {
  size_gb = 500
  region  = var.region
  label   = "videopick-storage"
  
  attached_to_instance = vultr_instance.main_server.id
}

# Firewall 규칙
resource "vultr_firewall_group" "main" {
  description = "VideoPick Firewall"
}

resource "vultr_firewall_rule" "ssh" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "22"
}

resource "vultr_firewall_rule" "http" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "80"
}

resource "vultr_firewall_rule" "https" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "443"
}

resource "vultr_firewall_rule" "rtmp" {
  firewall_group_id = vultr_firewall_group.main.id
  protocol          = "tcp"
  ip_type          = "v4"
  subnet           = "0.0.0.0"
  subnet_size      = 0
  port             = "1935"
}

# 출력
output "server_ip" {
  value = vultr_instance.main_server.main_ip
}

output "storage_id" {
  value = vultr_block_storage.video_storage.id
}
```

---

## 📜 초기화 스크립트

### init-script.sh
```bash
#!/bin/bash

# 시스템 업데이트
apt-get update && apt-get upgrade -y

# 필수 패키지 설치
apt-get install -y \
  docker.io \
  docker-compose \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  curl \
  htop \
  ufw

# Docker 설정
systemctl enable docker
systemctl start docker

# Firewall 설정
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1935/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw allow 8000/tcp
ufw allow 8080/tcp
ufw --force enable

# Block Storage 마운트
mkdir -p /mnt/storage
echo '/dev/vdb /mnt/storage ext4 defaults,nofail,discard 0 0' >> /etc/fstab
mkfs.ext4 /dev/vdb
mount -a

# 프로젝트 클론
cd /opt
git clone https://github.com/your-repo/videopick.git
cd videopick

# 환경 변수 설정
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/videopick
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
NODE_ENV=production
EOF

# Docker Compose 실행
docker-compose up -d

# SSL 인증서 설정 (도메인 연결 후)
# certbot --nginx -d videopick.com -d www.videopick.com

# 모니터링 설치
docker run -d \
  --name netdata \
  -p 19999:19999 \
  -v /etc/passwd:/host/etc/passwd:ro \
  -v /etc/group:/host/etc/group:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  --cap-add SYS_PTRACE \
  netdata/netdata

echo "서버 초기화 완료!"
```

---

## 🔄 CI/CD 파이프라인

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy to Vultr

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Build Docker Images
      run: |
        docker build -t videopick/app:latest -f Dockerfile.app .
        docker build -t videopick/streaming:latest -f Dockerfile.streaming .
        docker build -t videopick/chat:latest -f Dockerfile.chat .
    
    - name: Push to Registry
      env:
        DOCKER_TOKEN: ${{ secrets.DOCKER_TOKEN }}
      run: |
        echo $DOCKER_TOKEN | docker login -u ${{ secrets.DOCKER_USER }} --password-stdin
        docker push videopick/app:latest
        docker push videopick/streaming:latest
        docker push videopick/chat:latest
    
    - name: Deploy to Server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_IP }}
        username: root
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/videopick
          git pull origin main
          docker-compose pull
          docker-compose up -d --force-recreate
          docker system prune -f
```

---

## 📊 모니터링 설정

### 1. Prometheus + Grafana
```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3002:3000"

  node_exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  prometheus_data:
  grafana_data:
```

### 2. 알림 설정
```yaml
# alertmanager.yml
global:
  smtp_from: 'alerts@videopick.com'
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_auth_username: 'alerts@videopick.com'
  smtp_auth_password: 'password'

route:
  receiver: 'email-notifications'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'admin@videopick.com'
        send_resolved: true
```

---

## 🔐 보안 자동화

### 1. 자동 백업
```bash
#!/bin/bash
# backup.sh - 일일 백업 스크립트

DATE=$(date +%Y%m%d)
BACKUP_DIR="/mnt/storage/backups/$DATE"

# 디렉토리 생성
mkdir -p $BACKUP_DIR

# PostgreSQL 백업
docker exec postgres pg_dump -U postgres videopick > $BACKUP_DIR/postgres.sql

# Redis 백업
docker exec redis redis-cli BGSAVE
cp /var/lib/docker/volumes/redis_data/_data/dump.rdb $BACKUP_DIR/

# 파일 백업
tar -czf $BACKUP_DIR/uploads.tar.gz /mnt/storage/uploads

# 오래된 백업 삭제 (30일 이상)
find /mnt/storage/backups -type d -mtime +30 -exec rm -rf {} +

# S3 업로드 (선택사항)
# aws s3 sync $BACKUP_DIR s3://videopick-backups/$DATE/
```

### 2. 자동 업데이트
```bash
#!/bin/bash
# auto-update.sh

# 보안 업데이트 자동 설치
apt-get update
apt-get -y upgrade

# Docker 이미지 업데이트
docker-compose pull
docker-compose up -d

# 불필요한 이미지 정리
docker system prune -af
```

---

## 📈 스케일링 자동화

### 수평 스케일링 스크립트
```bash
#!/bin/bash
# scale-up.sh

CURRENT_LOAD=$(uptime | awk '{print $10}' | cut -d, -f1)
THRESHOLD=4.0

if (( $(echo "$CURRENT_LOAD > $THRESHOLD" | bc -l) )); then
  echo "High load detected. Scaling up..."
  
  # Vultr API로 새 서버 생성
  vultr-cli instance create \
    --plan vc2-2c-4gb \
    --region nrt \
    --os 1743 \
    --label "videopick-worker-$(date +%s)"
  
  # 로드 밸런서에 추가
  # ...
fi
```

---

## 🎯 배포 체크리스트

### 사전 준비
- [ ] Vultr 계정 생성
- [ ] API 키 발급
- [ ] 도메인 준비
- [ ] GitHub 저장소 설정
- [ ] Docker Hub 계정

### 인프라 구축
- [ ] Terraform 설치
- [ ] terraform init 실행
- [ ] terraform plan 검토
- [ ] terraform apply 실행
- [ ] 서버 IP 확인

### 애플리케이션 배포
- [ ] Docker 이미지 빌드
- [ ] Docker Registry 푸시
- [ ] docker-compose up
- [ ] 헬스체크 확인

### 보안 설정
- [ ] SSL 인증서 설치
- [ ] Firewall 규칙 확인
- [ ] SSH 키 설정
- [ ] 백업 스크립트 설정

### 모니터링
- [ ] Grafana 대시보드 설정
- [ ] 알림 규칙 설정
- [ ] 로그 수집 확인
- [ ] 성능 메트릭 확인

---

## 🚨 장애 대응 자동화

### 헬스체크 스크립트
```bash
#!/bin/bash
# healthcheck.sh

# 서비스 체크
services=("app:3000" "streaming:1935" "chat:3001")

for service in "${services[@]}"; do
  IFS=':' read -r name port <<< "$service"
  
  if ! nc -z localhost $port; then
    echo "$name is down. Restarting..."
    docker-compose restart $name
    
    # Slack 알림
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"Service $name restarted\"}" \
      $SLACK_WEBHOOK_URL
  fi
done
```

---

*이 문서는 Vultr 서버 자동 배포를 위한 완전한 가이드입니다.*
*실제 배포 시 API 키와 민감한 정보는 환경 변수로 관리하세요.*