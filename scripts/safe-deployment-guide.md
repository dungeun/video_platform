# 🛡️ Coolify-PowerDNS 안전 배포 가이드

## 충돌 방지 체크리스트

### 1. **PowerDNS 상태 확인** (158.247.233.83)
```bash
# PowerDNS API 이미 활성화되어 있는지 확인
sudo ss -tlnp | grep 8081

# PowerDNS 설정 확인
sudo cat /etc/powerdns/pdns.conf | grep -E "(webserver|api)"

# 기존 DNS 존 확인
curl -H "X-API-Key: YOUR_KEY" http://localhost:8081/api/v1/servers/localhost/zones
```

### 2. **안전한 테스트 방법**
```bash
# 1단계: DRY RUN 모드로 실행 (기본값)
cd /home/nodejs-apps/coolify-webhook
DRY_RUN=true node coolify-webhook-server.js

# 2단계: 테스트 요청 보내기
curl -X POST http://localhost:3333/webhook/coolify \
  -H "Content-Type: application/json" \
  -d '{"event":"service.created","project_name":"test-project"}'

# 3단계: 로그 확인 (실제 생성 없음)
# "DRY RUN MODE - Would create DNS record:" 메시지 확인
```

### 3. **기존 서비스와 격리**
- **접두사 사용**: `app-` 접두사로 기존 레코드와 분리
  - 예: `app-live-stream.video.one-q.xyz`
- **별도 도메인**: `video.one-q.xyz` (기존 one-q.kr과 분리)
- **포트 분리**: 3333 포트 (충돌 없음)

### 4. **단계별 배포**
```bash
# 1. 환경변수 설정 (.env 파일)
POWERDNS_API_KEY=your-actual-api-key
DNS_DOMAIN=video.one-q.xyz
COOLIFY_SERVER_IP=141.164.60.51
DRY_RUN=true  # 처음엔 true로 설정

# 2. 의존성 설치
npm install express axios dotenv

# 3. PM2로 실행
pm2 start coolify-webhook-server.js --name coolify-webhook

# 4. 테스트 후 실제 모드 전환
pm2 restart coolify-webhook --update-env
DRY_RUN=false pm2 restart coolify-webhook
```

### 5. **롤백 계획**
```bash
# 문제 발생 시 즉시 중지
pm2 stop coolify-webhook

# DNS 레코드 수동 삭제 (필요시)
curl -X DELETE ...

# 로그 확인
pm2 logs coolify-webhook
```

## ⚠️ 주의사항

1. **CyberPanel DNS와 혼용 금지**
   - PowerDNS로만 video.one-q.xyz 관리
   - CyberPanel은 기존 도메인만 관리

2. **API 키 보안**
   - 환경변수로만 관리
   - 절대 코드에 하드코딩 금지

3. **중복 체크**
   - 스크립트가 자동으로 중복 확인
   - 기존 레코드 덮어쓰기 방지

4. **모니터링**
   - PM2 로그 주기적 확인
   - PowerDNS 로그 모니터링