# 🤖 자동화 스크립트 모음

## 📋 개요

VideoPick 플랫폼의 운영을 자동화하기 위한 스크립트 모음입니다. 시스템 모니터링, 백업, 배포, 유지보수를 자동화하여 안정적인 서비스 운영을 지원합니다.

---

## 🚀 배포 자동화

### 📦 프로덕션 배포 스크립트
```bash
#!/bin/bash
# /opt/scripts/deploy-production.sh

set -e  # 에러 발생 시 즉시 종료

BACKUP_DIR="/opt/backups"
APP_DIR="/opt/videopick/app"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 프로덕션 배포 시작 - $DATE"

# 1. 백업 생성
echo "📦 백업 생성 중..."
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
docker exec -e PGPASSWORD=secure_password_here videopick-postgres \
  pg_dump -U videopick videopick > $BACKUP_DIR/db_backup_$DATE.sql

# 애플리케이션 코드 백업
cp -r $APP_DIR $BACKUP_DIR/app_backup_$DATE

echo "✅ 백업 완료: $BACKUP_DIR"

# 2. 헬스체크 (배포 전)
echo "🔍 배포 전 헬스체크..."
if ! curl -f -s http://localhost:3000/api/health > /dev/null; then
  echo "❌ 헬스체크 실패 - 배포 중단"
  exit 1
fi

# 3. Git 업데이트
echo "📥 소스코드 업데이트..."
cd $APP_DIR
git fetch origin
git checkout main
git pull origin main

# 4. 의존성 설치
echo "📦 의존성 설치..."
npm ci --production

# 5. 빌드
echo "🏗️ 애플리케이션 빌드..."
npm run build

# 6. 데이터베이스 마이그레이션
echo "🗄️ 데이터베이스 마이그레이션..."
npx prisma generate
npx prisma migrate deploy

# 7. 애플리케이션 재시작
echo "🔄 애플리케이션 재시작..."
pm2 reload videopick --update-env

# 8. 배포 후 헬스체크
echo "🔍 배포 후 헬스체크..."
sleep 10  # 재시작 대기

RETRY_COUNT=0
MAX_RETRIES=5

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ 헬스체크 성공"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ 헬스체크 재시도 ($RETRY_COUNT/$MAX_RETRIES)..."
  sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ 헬스체크 실패 - 롤백 시작"
  
  # 롤백 프로세스
  pm2 stop videopick
  rm -rf $APP_DIR
  cp -r $BACKUP_DIR/app_backup_$DATE $APP_DIR
  pm2 start videopick
  
  echo "🔙 롤백 완료"
  exit 1
fi

# 9. 슬랙/디스코드 알림 (선택사항)
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"🎉 VideoPick 배포 완료! 버전: '$DATE'"}' \
#   $SLACK_WEBHOOK_URL

echo "🎉 프로덕션 배포 성공 - $DATE"
```

### 🔄 스테이징 배포 스크립트
```bash
#!/bin/bash
# /opt/scripts/deploy-staging.sh

STAGING_SERVER="staging.one-q.xyz"
APP_DIR="/opt/videopick/staging"

echo "🧪 스테이징 배포 시작..."

ssh root@$STAGING_SERVER << 'EOF'
  cd /opt/videopick/staging
  git pull origin develop
  npm install
  npm run build
  pm2 reload videopick-staging
  
  # E2E 테스트 실행
  npm run test:e2e
  
  if [ $? -eq 0 ]; then
    echo "✅ 스테이징 배포 및 테스트 성공"
  else
    echo "❌ E2E 테스트 실패"
    exit 1
  fi
EOF

echo "🎯 스테이징 배포 완료"
```

---

## 📊 모니터링 자동화

### 🏥 헬스체크 스크립트
```bash
#!/bin/bash
# /opt/scripts/health-monitor.sh

LOG_FILE="/var/log/videopick-health.log"
ALERT_FILE="/var/log/videopick-alerts.log"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_message() {
  local level=$1
  local service=$2
  local message=$3
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  echo "[$timestamp] [$level] $service: $message" >> $LOG_FILE
  
  if [[ $level == "ERROR" ]]; then
    echo "[$timestamp] [$level] $service: $message" >> $ALERT_FILE
    send_alert "$service" "$message"
  fi
}

send_alert() {
  local service=$1
  local message=$2
  
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 $service 장애: $message\"}" \
    $SLACK_WEBHOOK 2>/dev/null || true
}

check_http_service() {
  local service_name=$1
  local url=$2
  local timeout=${3:-10}
  
  if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $service_name OK${NC}"
    log_message "INFO" "$service_name" "Service is healthy"
    return 0
  else
    echo -e "${RED}❌ $service_name FAIL${NC}"
    log_message "ERROR" "$service_name" "Service health check failed"
    return 1
  fi
}

check_docker_service() {
  local service_name=$1
  local container_name=$2
  
  if docker ps --format "table {{.Names}}" | grep -q "^$container_name$"; then
    echo -e "${GREEN}✅ $service_name Container OK${NC}"
    log_message "INFO" "$service_name" "Container is running"
    return 0
  else
    echo -e "${RED}❌ $service_name Container DOWN${NC}"
    log_message "ERROR" "$service_name" "Container is not running"
    return 1
  fi
}

check_database() {
  if docker exec videopick-postgres pg_isready -U videopick > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database OK${NC}"
    log_message "INFO" "Database" "PostgreSQL is ready"
    return 0
  else
    echo -e "${RED}❌ Database FAIL${NC}"
    log_message "ERROR" "Database" "PostgreSQL connection failed"
    return 1
  fi
}

check_system_resources() {
  # CPU 사용률 체크 (80% 이상 시 경고)
  CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
  if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo -e "${YELLOW}⚠️  High CPU Usage: ${CPU_USAGE}%${NC}"
    log_message "WARN" "System" "High CPU usage: ${CPU_USAGE}%"
  fi
  
  # 메모리 사용률 체크 (85% 이상 시 경고)
  MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
  if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo -e "${YELLOW}⚠️  High Memory Usage: ${MEMORY_USAGE}%${NC}"
    log_message "WARN" "System" "High memory usage: ${MEMORY_USAGE}%"
  fi
  
  # 디스크 사용률 체크 (90% 이상 시 경고)
  DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
  if [[ $DISK_USAGE -gt 90 ]]; then
    echo -e "${YELLOW}⚠️  High Disk Usage: ${DISK_USAGE}%${NC}"
    log_message "WARN" "System" "High disk usage: ${DISK_USAGE}%"
  fi
}

echo "🔍 $(date) - VideoPick Health Check 시작"

# HTTP 서비스 체크
check_http_service "Main App" "https://main.one-q.xyz"
check_http_service "API Health" "https://main.one-q.xyz/api/health"
check_http_service "Streaming" "http://stream.one-q.xyz"
check_http_service "Storage" "http://storage.one-q.xyz/minio/health/live"

# Docker 컨테이너 체크
check_docker_service "PostgreSQL" "videopick-postgres"
check_docker_service "Redis" "videopick-redis"
check_docker_service "MediaMTX" "mediamtx"
check_docker_service "Centrifugo" "centrifugo"

# 데이터베이스 연결 체크
check_database

# 시스템 리소스 체크
check_system_resources

# PM2 프로세스 체크
if pm2 describe videopick | grep -q "online"; then
  echo -e "${GREEN}✅ PM2 Process OK${NC}"
  log_message "INFO" "PM2" "VideoPick process is online"
else
  echo -e "${RED}❌ PM2 Process FAIL${NC}"
  log_message "ERROR" "PM2" "VideoPick process is not online"
  
  # 자동 복구 시도
  pm2 restart videopick
  log_message "INFO" "PM2" "Attempted automatic restart"
fi

echo "✅ Health Check 완료"
```

### 📈 성능 모니터링 스크립트
```bash
#!/bin/bash
# /opt/scripts/performance-monitor.sh

METRICS_FILE="/var/log/videopick-metrics.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 시스템 메트릭 수집
collect_system_metrics() {
  # CPU 사용률
  CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
  
  # 메모리 정보
  MEMORY_INFO=$(free -m | grep '^Mem:')
  MEMORY_TOTAL=$(echo $MEMORY_INFO | awk '{print $2}')
  MEMORY_USED=$(echo $MEMORY_INFO | awk '{print $3}')
  MEMORY_USAGE=$(echo "scale=1; $MEMORY_USED * 100 / $MEMORY_TOTAL" | bc)
  
  # 디스크 사용률
  DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
  
  # 네트워크 I/O
  NETWORK_RX=$(cat /proc/net/dev | grep eth0 | awk '{print $2}')
  NETWORK_TX=$(cat /proc/net/dev | grep eth0 | awk '{print $10}')
  
  echo "$TIMESTAMP,CPU,$CPU_USAGE" >> $METRICS_FILE
  echo "$TIMESTAMP,MEMORY,$MEMORY_USAGE" >> $METRICS_FILE
  echo "$TIMESTAMP,DISK,$DISK_USAGE" >> $METRICS_FILE
  echo "$TIMESTAMP,NETWORK_RX,$NETWORK_RX" >> $METRICS_FILE
  echo "$TIMESTAMP,NETWORK_TX,$NETWORK_TX" >> $METRICS_FILE
}

# 애플리케이션 메트릭 수집
collect_app_metrics() {
  # PM2 메트릭
  PM2_METRICS=$(pm2 jlist | jq -r '.[0] | "\(.pm2_env.pm_uptime),\(.monit.memory),\(.monit.cpu)"')
  IFS=',' read -r PM2_UPTIME PM2_MEMORY PM2_CPU <<< "$PM2_METRICS"
  
  echo "$TIMESTAMP,PM2_UPTIME,$PM2_UPTIME" >> $METRICS_FILE
  echo "$TIMESTAMP,PM2_MEMORY,$PM2_MEMORY" >> $METRICS_FILE
  echo "$TIMESTAMP,PM2_CPU,$PM2_CPU" >> $METRICS_FILE
  
  # 데이터베이스 메트릭
  DB_CONNECTIONS=$(docker exec videopick-postgres psql -U videopick -d videopick -t -c \
    "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
  
  echo "$TIMESTAMP,DB_CONNECTIONS,$DB_CONNECTIONS" >> $METRICS_FILE
}

# 비즈니스 메트릭 수집
collect_business_metrics() {
  # 활성 스트림 수
  ACTIVE_STREAMS=$(docker exec videopick-postgres psql -U videopick -d videopick -t -c \
    "SELECT count(*) FROM live_streams WHERE status = 'live';" | xargs)
  
  # 동시 접속자 수 (예시 - 실제 구현 필요)
  CONCURRENT_USERS=$(docker exec videopick-redis redis-cli eval \
    "return #redis.call('keys', 'session:*')" 0 2>/dev/null || echo "0")
  
  echo "$TIMESTAMP,ACTIVE_STREAMS,$ACTIVE_STREAMS" >> $METRICS_FILE
  echo "$TIMESTAMP,CONCURRENT_USERS,$CONCURRENT_USERS" >> $METRICS_FILE
}

# 메트릭 수집 실행
collect_system_metrics
collect_app_metrics
collect_business_metrics

echo "📊 Performance metrics collected at $TIMESTAMP"
```

---

## 💾 백업 자동화

### 🗄️ 데이터베이스 백업 스크립트
```bash
#!/bin/bash
# /opt/scripts/database-backup.sh

BACKUP_DIR="/opt/backups/database"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/videopick_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

echo "🗄️ 데이터베이스 백업 시작 - $DATE"

# PostgreSQL 백업
docker exec -e PGPASSWORD=secure_password_here videopick-postgres \
  pg_dump -U videopick videopick > $BACKUP_FILE

if [[ $? -eq 0 ]]; then
  echo "✅ 백업 완료: $BACKUP_FILE"
  
  # 압축
  gzip $BACKUP_FILE
  echo "🗜️  백업 파일 압축 완료"
  
  # 이전 백업 정리 (7일 이전)
  find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
  echo "🧹 오래된 백업 정리 완료"
  
  # S3 업로드 (선택사항)
  # aws s3 cp $BACKUP_FILE.gz s3://videopick-backups/database/
  
else
  echo "❌ 백업 실패"
  exit 1
fi
```

### 📁 파일 시스템 백업
```bash
#!/bin/bash
# /opt/scripts/files-backup.sh

SOURCE_DIRS=("/opt/videopick" "/etc/nginx" "/var/docker")
BACKUP_BASE="/opt/backups/files"
DATE=$(date +%Y%m%d)
BACKUP_DIR="$BACKUP_BASE/$DATE"

mkdir -p $BACKUP_DIR

echo "📁 파일 시스템 백업 시작 - $DATE"

for dir in "${SOURCE_DIRS[@]}"; do
  if [[ -d $dir ]]; then
    dir_name=$(basename $dir)
    echo "📦 백업 중: $dir"
    tar -czf "$BACKUP_DIR/${dir_name}.tar.gz" -C $(dirname $dir) $(basename $dir)
    echo "✅ 백업 완료: ${dir_name}.tar.gz"
  fi
done

# 백업 무결성 검사
echo "🔍 백업 무결성 검사..."
for backup_file in $BACKUP_DIR/*.tar.gz; do
  if tar -tzf $backup_file > /dev/null 2>&1; then
    echo "✅ $(basename $backup_file) - OK"
  else
    echo "❌ $(basename $backup_file) - 손상됨"
  fi
done

echo "🎉 파일 시스템 백업 완료"
```

---

## 🧹 시스템 유지보수

### 🗂️ 로그 로테이션 스크립트
```bash
#!/bin/bash
# /opt/scripts/log-rotation.sh

LOG_DIRS=("/var/log/nginx" "/var/log/videopick" "/opt/videopick/logs")
RETENTION_DAYS=30

echo "🗂️ 로그 로테이션 시작"

# PM2 로그 플러시
pm2 flush
echo "🔄 PM2 로그 플러시 완료"

# Nginx 로그 로테이션
if [[ -f /var/log/nginx/access.log ]]; then
  mv /var/log/nginx/access.log /var/log/nginx/access.log.$(date +%Y%m%d_%H%M%S)
  systemctl reload nginx
  echo "🔄 Nginx 로그 로테이션 완료"
fi

# 애플리케이션 로그 압축
for dir in "${LOG_DIRS[@]}"; do
  if [[ -d $dir ]]; then
    echo "📁 처리 중: $dir"
    
    # 1일 이전 로그 압축
    find $dir -name "*.log" -mtime +1 -exec gzip {} \;
    
    # 30일 이전 압축 로그 삭제
    find $dir -name "*.gz" -mtime +$RETENTION_DAYS -delete
    
    echo "✅ $dir 처리 완료"
  fi
done

# Docker 로그 정리
docker system prune -f --volumes
echo "🐳 Docker 로그 정리 완료"

echo "🎉 로그 로테이션 완료"
```

### 🔧 시스템 최적화 스크립트
```bash
#!/bin/bash
# /opt/scripts/system-optimize.sh

echo "🔧 시스템 최적화 시작"

# 1. 패키지 업데이트
echo "📦 패키지 업데이트..."
apt update && apt upgrade -y

# 2. 메모리 캐시 정리
echo "💾 메모리 캐시 정리..."
echo 1 > /proc/sys/vm/drop_caches
echo 2 > /proc/sys/vm/drop_caches
echo 3 > /proc/sys/vm/drop_caches

# 3. 임시 파일 정리
echo "🗑️  임시 파일 정리..."
rm -rf /tmp/*
rm -rf /var/tmp/*

# 4. 로그 파일 압축
echo "📚 로그 파일 압축..."
find /var/log -name "*.log" -size +50M -exec gzip {} \;

# 5. Docker 최적화
echo "🐳 Docker 최적화..."
docker system prune -af
docker volume prune -f

# 6. PostgreSQL 최적화
echo "🗄️ PostgreSQL 최적화..."
docker exec videopick-postgres psql -U videopick -d videopick -c "VACUUM ANALYZE;"

# 7. 시스템 상태 확인
echo "📊 시스템 상태 확인..."
df -h
free -h
docker stats --no-stream

echo "✅ 시스템 최적화 완료"
```

---

## ⏰ Cron 작업 설정

### 📅 정기 작업 스케줄
```bash
# crontab -e 에 추가할 내용

# 매 5분마다 헬스체크
*/5 * * * * /opt/scripts/health-monitor.sh

# 매 10분마다 성능 모니터링
*/10 * * * * /opt/scripts/performance-monitor.sh

# 매일 새벽 2시 데이터베이스 백업
0 2 * * * /opt/scripts/database-backup.sh

# 매일 새벽 3시 파일 시스템 백업
0 3 * * * /opt/scripts/files-backup.sh

# 매일 새벽 4시 로그 로테이션
0 4 * * * /opt/scripts/log-rotation.sh

# 매주 일요일 새벽 1시 시스템 최적화
0 1 * * 0 /opt/scripts/system-optimize.sh

# 매월 1일 새벽 5시 보안 업데이트
0 5 1 * * apt update && apt upgrade -y
```

---

## 🚨 알림 시스템

### 📱 Slack 통합 스크립트
```bash
#!/bin/bash
# /opt/scripts/slack-notifier.sh

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
CHANNEL="#videopick-alerts"

send_slack_message() {
  local message=$1
  local emoji=${2:-":warning:"}
  local color=${3:-"warning"}
  
  curl -X POST -H 'Content-type: application/json' \
    --data "{
      \"channel\": \"$CHANNEL\",
      \"username\": \"VideoPick Bot\",
      \"icon_emoji\": \"$emoji\",
      \"attachments\": [
        {
          \"color\": \"$color\",
          \"text\": \"$message\",
          \"ts\": $(date +%s)
        }
      ]
    }" $SLACK_WEBHOOK
}

# 사용 예시
# send_slack_message "🚀 배포가 완료되었습니다!" ":rocket:" "good"
# send_slack_message "⚠️ 서버 응답시간이 느립니다." ":warning:" "warning"
# send_slack_message "🚨 시스템 장애가 발생했습니다!" ":fire:" "danger"
```

---

**🤖 자동화의 핵심**: **안정성**, **모니터링**, **알림**, **백업**

**📝 마지막 업데이트**: 2025-08-20  
**📋 작성자**: Automation Team