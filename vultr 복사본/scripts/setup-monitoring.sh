#!/bin/bash

# Prometheus + Grafana 모니터링 시스템 설정

set -e

echo "📊 모니터링 시스템 설정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 서버 정보
APP_SERVER_IP="158.247.203.55"
STREAMING_SERVER_IP="141.164.42.213"
STORAGE_SERVER_IP="64.176.226.119"
BACKUP_SERVER_IP="141.164.37.63"

echo -e "${YELLOW}📊 앱 서버에 Prometheus 및 Grafana 설치...${NC}"
ssh -o StrictHostKeyChecking=no root@$APP_SERVER_IP << 'EOF'
# Prometheus와 Grafana용 디렉토리 생성
mkdir -p /opt/monitoring/{prometheus,grafana,node_exporter}
cd /opt/monitoring

# Docker Compose 파일 생성
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: monitoring-prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    restart: always

  grafana:
    image: grafana/grafana:latest
    container_name: monitoring-grafana
    volumes:
      - ./grafana/data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=videopick_admin
      - GF_INSTALL_PLUGINS=redis-datasource,redis-app
    ports:
      - "3001:3000"
    restart: always

  node-exporter:
    image: prom/node-exporter:latest
    container_name: monitoring-node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    restart: always

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: monitoring-postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://videopick:secure_password_here@localhost:5432/videopick?sslmode=disable"
    ports:
      - "9187:9187"
    restart: always

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: monitoring-redis-exporter
    environment:
      REDIS_ADDR: "redis://localhost:6379"
    ports:
      - "9121:9121"
    restart: always

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: monitoring-cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    devices:
      - /dev/kmsg:/dev/kmsg
    ports:
      - "8080:8080"
    restart: always
    privileged: true
COMPOSE

# Prometheus 설정 파일
cat > prometheus/prometheus.yml << 'PROMETHEUS'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files:
  # - "first_rules.yml"

scrape_configs:
  # 앱 서버 메트릭
  - job_name: 'node-app'
    static_configs:
      - targets: ['158.247.203.55:9100']
        labels:
          instance: 'app-server'

  # 스트리밍 서버 메트릭
  - job_name: 'node-streaming'
    static_configs:
      - targets: ['141.164.42.213:9100']
        labels:
          instance: 'streaming-server'

  # 스토리지 서버 메트릭
  - job_name: 'node-storage'
    static_configs:
      - targets: ['64.176.226.119:9100']
        labels:
          instance: 'storage-server'

  # 백업 서버 메트릭
  - job_name: 'node-backup'
    static_configs:
      - targets: ['141.164.37.63:9100']
        labels:
          instance: 'backup-server'

  # PostgreSQL 메트릭
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  # Redis 메트릭
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  # Docker 컨테이너 메트릭
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['localhost:8080']

  # MediaMTX 메트릭
  - job_name: 'mediamtx'
    static_configs:
      - targets: ['141.164.42.213:9998']
        labels:
          instance: 'mediamtx'

  # Centrifugo 메트릭
  - job_name: 'centrifugo'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:8000']
PROMETHEUS

# Grafana 데이터소스 설정
mkdir -p grafana/provisioning/datasources
cat > grafana/provisioning/datasources/prometheus.yml << 'DATASOURCE'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
DATASOURCE

# Grafana 대시보드 프로비저닝
mkdir -p grafana/provisioning/dashboards
cat > grafana/provisioning/dashboards/dashboard.yml << 'DASHBOARD'
apiVersion: 1

providers:
  - name: 'VideoPick'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /etc/grafana/provisioning/dashboards
DASHBOARD

# 권한 설정
chmod -R 755 /opt/monitoring
chown -R 472:472 /opt/monitoring/grafana

# 방화벽 규칙 추가
ufw allow 9090/tcp  # Prometheus
ufw allow 3001/tcp  # Grafana
ufw allow 9100/tcp  # Node Exporter
ufw reload

# Docker 컨테이너 시작
cd /opt/monitoring
docker-compose up -d

echo "✅ 모니터링 시스템 설치 완료"
EOF

# 다른 서버에 Node Exporter 설치
for SERVER_IP in $STREAMING_SERVER_IP $STORAGE_SERVER_IP $BACKUP_SERVER_IP; do
    echo -e "\n${YELLOW}📊 $SERVER_IP 서버에 Node Exporter 설치...${NC}"
    ssh -o StrictHostKeyChecking=no root@$SERVER_IP << 'EOF'
    # Node Exporter 컨테이너 실행
    docker run -d \
      --name node-exporter \
      --restart always \
      -p 9100:9100 \
      -v "/proc:/host/proc:ro" \
      -v "/sys:/host/sys:ro" \
      -v "/:/rootfs:ro" \
      prom/node-exporter:latest \
      --path.procfs=/host/proc \
      --path.rootfs=/rootfs \
      --path.sysfs=/host/sys \
      --collector.filesystem.mount-points-exclude='^/(sys|proc|dev|host|etc)($$|/)'
    
    # 방화벽 규칙 추가
    ufw allow 9100/tcp
    ufw reload
    
    echo "✅ Node Exporter 설치 완료"
EOF
done

echo -e "\n${GREEN}🎉 모니터링 시스템 설정이 완료되었습니다!${NC}"
echo ""
echo "📊 모니터링 대시보드 접속 정보:"
echo "  - Prometheus: http://$APP_SERVER_IP:9090"
echo "  - Grafana: http://$APP_SERVER_IP:3001"
echo "    • 사용자명: admin"
echo "    • 비밀번호: videopick_admin"
echo ""
echo "📈 모니터링 항목:"
echo "  ✅ 서버 리소스 (CPU, 메모리, 디스크, 네트워크)"
echo "  ✅ Docker 컨테이너 상태"
echo "  ✅ PostgreSQL 데이터베이스"
echo "  ✅ Redis 캐시"
echo "  ✅ MediaMTX 스트리밍"
echo "  ✅ Centrifugo WebSocket"
echo ""
echo "💡 Grafana 대시보드 추가 방법:"
echo "  1. Grafana 접속 후 'Import Dashboard' 클릭"
echo "  2. Dashboard ID 입력:"
echo "     - Node Exporter: 1860"
echo "     - Docker: 893"
echo "     - PostgreSQL: 9628"
echo "     - Redis: 11835"