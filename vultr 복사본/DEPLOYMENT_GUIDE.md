# VideoPick Platform - Phase 2 배포 가이드

## 🚀 빠른 시작 (Quick Start)

### 1. 환경 설정
```bash
# Terraform 설치 (Mac)
brew install terraform

# Vultr CLI 설치
brew install vultr/vultr-cli/vultr-cli

# API 키 설정
export VULTR_API_KEY="XZD6MCORJSZHPILSOWOIZ3R356CXOWSMBAFQ"
```

### 2. 서버 배포
```bash
cd /Users/admin/new_project/video_platform/vultr\ 복사본/terraform

# Terraform 초기화
terraform init

# 배포 계획 확인
terraform plan

# 서버 생성 (약 5분 소요)
terraform apply -auto-approve

# 서버 IP 확인
terraform output -json > server_ips.json
```

### 3. 초기 설정 실행
```bash
# 모든 서버 초기 설정
./scripts/setup-all-servers.sh

# 개별 서버 설정 (필요시)
./scripts/setup-app-server.sh
./scripts/setup-streaming-server.sh
./scripts/setup-storage-server.sh
```

## 📊 서버 모니터링

### Grafana 대시보드 접속
```
URL: http://[APP_SERVER_IP]:3000
ID: admin
PW: admin (최초 로그인 후 변경)
```

### 주요 모니터링 지표
- **스트리밍 서버**: 동시 접속자, 대역폭, CPU/메모리
- **채팅 서버**: WebSocket 연결 수, 메시지 처리율
- **스토리지 서버**: 디스크 사용량, 업로드 속도

## 🔧 서비스 관리

### Docker 컨테이너 상태 확인
```bash
# 앱 서버
ssh root@[APP_SERVER_IP] "docker ps"

# 스트리밍 서버
ssh root@[STREAMING_SERVER_IP] "docker ps"

# 스토리지 서버
ssh root@[STORAGE_SERVER_IP] "docker ps"
```

### 서비스 재시작
```bash
# MediaMTX (스트리밍)
ssh root@[STREAMING_SERVER_IP] "docker restart mediamtx"

# Centrifugo (채팅)
ssh root@[APP_SERVER_IP] "docker restart centrifugo"

# TUS (업로드)
ssh root@[STORAGE_SERVER_IP] "docker restart tus-server"
```

## 🔐 보안 설정

### SSL 인증서 설치
```bash
# Let's Encrypt 인증서 발급
./scripts/setup-ssl.sh [도메인명]
```

### 방화벽 규칙 확인
```bash
# UFW 상태 확인
ssh root@[SERVER_IP] "ufw status verbose"
```

## 📈 성능 튜닝

### MediaMTX 최적화
```yaml
# /etc/mediamtx/mediamtx.yml
rtmpServerPort: 1935
hlsSegmentCount: 3
hlsSegmentDuration: 2s
hlsPartDuration: 500ms
```

### Centrifugo 최적화
```json
// /etc/centrifugo/config.json
{
  "engine": "redis",
  "redis_address": "localhost:6379",
  "client_max_message_size": 65536,
  "channel_max_length": 255,
  "presence": true,
  "join_leave": true
}
```

### PostgreSQL 최적화
```sql
-- 연결 풀 설정
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
```

## 🔄 백업 및 복구

### 자동 백업 설정
```bash
# 백업 스크립트 설치
./scripts/setup-backup.sh

# Crontab 설정 (매일 새벽 3시)
0 3 * * * /opt/backup/daily-backup.sh
```

### 수동 백업
```bash
# 데이터베이스 백업
pg_dump -h localhost -U postgres videopick > backup_$(date +%Y%m%d).sql

# 미디어 파일 백업
rsync -avz /var/www/uploads/ /backup/uploads/
```

## 🚨 장애 대응

### 헬스체크 엔드포인트
- 앱 서버: `http://[APP_SERVER_IP]:3000/health`
- 스트리밍: `http://[STREAMING_SERVER_IP]:8888/metrics`
- 채팅: `http://[APP_SERVER_IP]:8000/health`

### 로그 확인
```bash
# 앱 서버 로그
ssh root@[APP_SERVER_IP] "docker logs app-server --tail 100"

# 스트리밍 서버 로그
ssh root@[STREAMING_SERVER_IP] "docker logs mediamtx --tail 100"

# 채팅 서버 로그
ssh root@[APP_SERVER_IP] "docker logs centrifugo --tail 100"
```

### 긴급 복구 절차
1. 서버 상태 확인: `terraform show`
2. 문제 서버 재시작: `terraform taint vultr_instance.[서버명]`
3. 서버 재생성: `terraform apply`
4. 백업 복구: `./scripts/restore-backup.sh [백업날짜]`

## 📞 지원 연락처

### Vultr 지원
- 티켓 시스템: https://my.vultr.com/support/
- 상태 페이지: https://status.vultr.com/

### 시스템 관리자
- 긴급 연락처: [관리자 연락처]
- 에스컬레이션: [매니저 연락처]

## 📋 체크리스트

### 배포 전
- [ ] Vultr API 키 설정
- [ ] Terraform 설치 확인
- [ ] 도메인 DNS 설정
- [ ] 백업 계획 수립

### 배포 후
- [ ] 모든 서비스 정상 작동 확인
- [ ] SSL 인증서 설치
- [ ] 모니터링 대시보드 설정
- [ ] 백업 자동화 설정
- [ ] 로그 수집 설정
- [ ] 알림 설정 (Slack/Email)

### 운영 중
- [ ] 일일 백업 확인
- [ ] 주간 성능 리포트
- [ ] 월간 보안 패치
- [ ] 분기별 재해 복구 훈련

## 🔄 업데이트 절차

### 무중단 배포
```bash
# Blue-Green 배포
./scripts/blue-green-deploy.sh [새버전]

# 롤링 업데이트
./scripts/rolling-update.sh [컴포넌트] [버전]
```

### 롤백 절차
```bash
# 이전 버전으로 롤백
./scripts/rollback.sh [이전버전]
```

## 📈 확장 가이드

### 10,000명 동접으로 확장시
1. `terraform.tfvars` 수정
2. 서버 스펙 업그레이드
3. 로드밸런서 추가
4. CDN 설정 (해외 서비스시)

자세한 내용은 `SCALABLE_STREAMING_ARCHITECTURE.md` 참조