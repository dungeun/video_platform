# 🔧 VideoPick 문제 해결 가이드

## 🚨 긴급 상황 대응

### ⚠️ 서비스 전체 다운
**증상**: 메인 사이트 접속 불가 (https://main.one-q.xyz)

**즉시 대응**:
```bash
# 1. 서버 상태 확인
ssh root@158.247.203.55
systemctl status nginx
pm2 status

# 2. 애플리케이션 재시작
pm2 restart videopick

# 3. Nginx 재시작 (필요시)
systemctl restart nginx

# 4. 헬스체크
curl -I https://main.one-q.xyz
```

**근본 원인 분석**:
```bash
# 시스템 리소스 확인
htop
df -h
free -h

# 로그 분석
pm2 logs videopick --lines 100
tail -100 /var/log/nginx/error.log
```

---

## 📺 스트리밍 관련 문제

### 🎥 라이브 방송이 안 시작됨

**증상**: OBS에서 스트리밍 시작했으나 시청자가 볼 수 없음

**체크리스트**:
1. **RTMP 서버 상태 확인**
   ```bash
   ssh root@141.164.42.213
   docker logs mediamtx
   
   # MediaMTX API 상태 확인
   curl http://localhost:9997/v1/paths/list
   ```

2. **스트림 키 검증**
   ```bash
   # 데이터베이스에서 스트림 키 확인
   docker exec -e PGPASSWORD=secure_password_here videopick-postgres \
     psql -U videopick -d videopick -c \
     "SELECT streamKey, status FROM stream_keys WHERE channelId = 'CHANNEL_ID';"
   ```

3. **네트워크 연결 테스트**
   ```bash
   # RTMP 포트 확인
   nc -zv 141.164.42.213 1935
   
   # HLS 출력 확인
   curl -I http://stream.one-q.xyz/live/STREAM_KEY/index.m3u8
   ```

**해결 방법**:
- 스트림 키 재생성
- MediaMTX 컨테이너 재시작
- 방화벽 설정 확인

### 🎞️ 비디오 재생 안됨

**증상**: 업로드한 비디오가 재생되지 않음

**진단 단계**:
```bash
# 1. 비디오 파일 상태 확인
ssh root@64.176.226.119
docker exec -it minio mc ls local/videos/

# 2. 인코딩 상태 확인
ssh root@158.247.203.55
docker exec videopick-postgres psql -U videopick -d videopick -c \
  "SELECT id, title, status FROM videos WHERE status != 'published' ORDER BY createdAt DESC LIMIT 10;"

# 3. FFmpeg 로그 확인 (인코딩 서버에서)
docker logs encoding-worker
```

**일반적인 해결책**:
- 지원하지 않는 코덱: 재인코딩 필요
- 파일 손상: 원본 파일 재업로드
- 스토리지 공간 부족: 디스크 정리

---

## 💬 채팅 시스템 문제

### 💭 실시간 채팅 안됨

**증상**: 메시지 전송했으나 다른 사용자에게 보이지 않음

**확인 사항**:
```bash
# 1. Centrifugo 서버 상태
ssh root@141.164.42.213
docker logs centrifugo

# 2. WebSocket 연결 테스트
curl -I http://158.247.203.55:8000/connection/websocket

# 3. 채팅 메시지 데이터베이스 확인
docker exec videopick-postgres psql -U videopick -d videopick -c \
  "SELECT COUNT(*) FROM live_chat_messages WHERE createdAt > NOW() - INTERVAL '1 hour';"
```

**해결 방법**:
```bash
# Centrifugo 재시작
docker restart centrifugo

# 브라우저에서 WebSocket 재연결
# 개발자 도구 > Console에서 실행
window.location.reload();
```

### 💰 슈퍼챗 결제 실패

**증상**: 슈퍼챗 결제 진행 중 오류 발생

**로그 확인**:
```bash
# 1. 결제 로그 확인
pm2 logs videopick | grep "payment"

# 2. 데이터베이스 결제 상태
docker exec videopick-postgres psql -U videopick -d videopick -c \
  "SELECT orderId, status, failReason FROM payments WHERE type = 'SUPER_CHAT' ORDER BY createdAt DESC LIMIT 10;"
```

**일반적인 원인**:
- 결제 게이트웨이 장애
- 네트워크 타임아웃
- 잘못된 결제 정보

---

## 🗄️ 데이터베이스 문제

### 🔍 데이터베이스 연결 오류

**증상**: "Connection refused" 또는 "Connection timeout"

**즉시 확인**:
```bash
# 1. PostgreSQL 컨테이너 상태
docker ps | grep postgres
docker logs videopick-postgres

# 2. 데이터베이스 연결 테스트
docker exec videopick-postgres pg_isready -U videopick

# 3. 연결 수 확인
docker exec videopick-postgres psql -U videopick -d videopick -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

**복구 방법**:
```bash
# PostgreSQL 재시작
docker restart videopick-postgres

# 연결 수 제한 해제
docker exec videopick-postgres psql -U postgres -c \
  "ALTER SYSTEM SET max_connections = 200; SELECT pg_reload_conf();"
```

### 💾 디스크 공간 부족

**증상**: "No space left on device" 오류

**공간 확인 및 정리**:
```bash
# 1. 디스크 사용량 확인
df -h
du -sh /var/lib/docker/volumes/*

# 2. 로그 파일 정리
find /var/log -name "*.log" -mtime +7 -delete
pm2 flush

# 3. Docker 정리
docker system prune -f
docker volume prune -f

# 4. 임시 파일 정리
rm -rf /tmp/*
rm -rf /opt/videopick/uploads/temp/*
```

---

## 🌐 네트워크 및 DNS 문제

### 🔗 도메인 접속 안됨

**증상**: 도메인으로 접속 시 "사이트에 연결할 수 없음"

**DNS 진단**:
```bash
# 1. DNS 서버 상태 확인
ssh root@141.164.60.51
systemctl status named

# 2. DNS 해석 테스트
nslookup main.one-q.xyz
dig @141.164.60.51 main.one-q.xyz

# 3. 웹서버 직접 접속
curl -I http://158.247.203.55
```

**DNS 설정 확인**:
```bash
# BIND9 설정 확인
cat /etc/bind/db.one-q.xyz

# DNS 서비스 재시작
systemctl restart named
```

### 🔒 SSL 인증서 문제

**증상**: "보안 연결 실패" 또는 "인증서 만료"

**인증서 상태 확인**:
```bash
# 1. 인증서 만료일 확인
openssl s_client -connect main.one-q.xyz:443 -servername main.one-q.xyz 2>/dev/null | \
openssl x509 -noout -dates

# 2. Let's Encrypt 갱신
certbot renew --dry-run

# 3. Nginx SSL 설정 확인
nginx -t
systemctl reload nginx
```

---

## 📱 모바일 및 브라우저 문제

### 📲 모바일에서 비디오 재생 안됨

**일반적인 원인**:
- iOS Safari: HLS 호환성 문제
- Android Chrome: 자동재생 정책
- 네트워크 속도: 비트레이트 조정 필요

**해결 방법**:
```javascript
// 모바일 브라우저 호환성 체크
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  // 모바일 최적화 설정
  videoPlayer.config({
    autoplay: false,
    preload: 'metadata',
    playsinline: true
  });
}
```

### 🔧 브라우저별 문제

**Internet Explorer 지원 중단**:
- 안내 메시지 표시
- 최신 브라우저 사용 권장

**Safari 특이사항**:
- WebSocket 연결 제한
- 자동재생 정책 엄격

---

## 📊 성능 관련 문제

### 🐌 페이지 로딩 느림

**성능 분석**:
```bash
# 1. 서버 리소스 확인
htop
iotop -o

# 2. 네트워크 대역폭 확인
iftop -i eth0

# 3. 응답 시간 측정
curl -w "@curl-format.txt" -o /dev/null -s https://main.one-q.xyz
```

**최적화 방법**:
- 이미지 압축 및 WebP 변환
- CDN 캐싱 활용
- 데이터베이스 쿼리 최적화
- 번들 크기 최적화

### 💻 높은 CPU 사용률

**원인 분석**:
```bash
# 1. CPU 사용률 높은 프로세스
ps aux --sort=-%cpu | head -10

# 2. Node.js 메모리 사용량
pm2 monit

# 3. 데이터베이스 쿼리 분석
docker exec videopick-postgres psql -U videopick -d videopick -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## 🔄 자동화된 복구 스크립트

### 🚨 헬스체크 스크립트
```bash
#!/bin/bash
# /opt/scripts/health-monitor.sh

LOG_FILE="/var/log/videopick-health.log"

check_service() {
  local service=$1
  local url=$2
  
  if curl -f -s "$url" > /dev/null; then
    echo "$(date): $service OK" >> $LOG_FILE
    return 0
  else
    echo "$(date): $service FAIL" >> $LOG_FILE
    return 1
  fi
}

# 메인 사이트 체크
if ! check_service "Main Site" "https://main.one-q.xyz"; then
  pm2 restart videopick
  systemctl restart nginx
fi

# 스트리밍 서버 체크
if ! check_service "Streaming" "http://stream.one-q.xyz"; then
  ssh root@141.164.42.213 "docker restart mediamtx"
fi

# 데이터베이스 체크
if ! docker exec videopick-postgres pg_isready -U videopick; then
  docker restart videopick-postgres
  sleep 30  # 재시작 대기
fi
```

### 🔧 자동 복구 Cron 작업
```bash
# crontab -e 에 추가
*/5 * * * * /opt/scripts/health-monitor.sh
0 2 * * * /opt/scripts/log-rotation.sh
0 3 * * 0 /opt/scripts/system-maintenance.sh
```

---

## 📞 에스컬레이션 절차

### 🆘 심각한 장애 시
1. **즉시 대응팀 알림** (Slack/Discord)
2. **장애 원인 파악** (로그 분석)
3. **임시 복구 조치** (서비스 재시작)
4. **사용자 공지** (상태 페이지 업데이트)
5. **근본 원인 분석** (사후 검토)

### 📋 장애 보고서 템플릿
```markdown
## 장애 보고서

**발생 시간**: 2025-08-20 14:30 KST
**복구 시간**: 2025-08-20 14:45 KST
**영향 범위**: 전체 사용자 (약 1,200명)

### 장애 내용
- 메인 사이트 접속 불가
- 라이브 스트리밍 중단

### 원인
- PM2 프로세스 메모리 부족으로 인한 자동 종료

### 조치 사항
1. PM2 메모리 제한 설정 (1GB → 2GB)
2. 메모리 모니터링 강화
3. 자동 재시작 스크립트 개선

### 예방 대책
- 주기적 메모리 사용량 모니터링
- 알람 임계치 조정 (80% → 70%)
```

---

**🔧 문제 해결의 핵심**: **빠른 진단**, **체계적 접근**, **철저한 기록**

**📝 마지막 업데이트**: 2025-08-20  
**📋 작성자**: DevOps Team