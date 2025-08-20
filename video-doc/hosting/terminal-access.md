# 💻 터미널 접속 및 CLI 사용 가이드

## 🔐 SSH 접속 방법

### 1. 기본 SSH 접속
```bash
# 각 서버별 접속 명령어
ssh root@158.247.203.55  # App Server (메인)
ssh root@141.164.42.213  # Streaming Server  
ssh root@64.176.226.119  # Storage Server
ssh root@141.164.37.63   # Backup Server
ssh root@141.164.60.51   # DNS Server
```

### 2. SSH Key 없이 접속하기
만약 SSH Key가 설정되지 않은 경우:
```bash
# 비밀번호 입력으로 접속 (현재 비활성화됨)
ssh -o PasswordAuthentication=yes root@158.247.203.55
```

### 3. SSH Key 생성 및 등록
```bash
# 로컬에서 SSH Key 생성
ssh-keygen -t ed25519 -C "your_email@example.com"

# 공개키를 서버에 등록
ssh-copy-id root@158.247.203.55

# 또는 수동으로 등록
cat ~/.ssh/id_ed25519.pub | ssh root@158.247.203.55 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

---

## 🎯 주요 서버별 접속 후 할 일

### 📱 App Server (158.247.203.55)

#### Next.js 애플리케이션 관리
```bash
# 애플리케이션 디렉토리로 이동
cd /opt/videopick/app

# PM2 상태 확인
pm2 status

# 애플리케이션 로그 확인
pm2 logs videopick

# 애플리케이션 재시작
pm2 restart videopick

# 애플리케이션 중지/시작
pm2 stop videopick
pm2 start videopick
```

#### 데이터베이스 작업
```bash
# PostgreSQL 컨테이너 접속
docker exec -it videopick-postgres bash

# 데이터베이스 직접 접속
docker exec -e PGPASSWORD=secure_password_here videopick-postgres psql -U videopick -d videopick

# 데이터베이스 백업
docker exec videopick-postgres pg_dump -U videopick videopick > backup_$(date +%Y%m%d).sql

# 데이터베이스 복원
docker exec -i videopick-postgres psql -U videopick -d videopick < backup_20250820.sql
```

#### Redis 작업
```bash
# Redis 컨테이너 접속
docker exec -it videopick-redis redis-cli

# Redis 상태 확인
docker exec videopick-redis redis-cli ping

# Redis 메모리 사용량 확인
docker exec videopick-redis redis-cli info memory
```

### 🎥 Streaming Server (141.164.42.213)

#### MediaMTX 관리
```bash
# MediaMTX 로그 확인
docker logs mediamtx

# MediaMTX 재시작
docker restart mediamtx

# 스트리밍 상태 확인
curl http://localhost:9997/v1/paths/list
```

#### Centrifugo 관리
```bash
# Centrifugo 상태 확인
docker logs centrifugo

# Centrifugo 재시작
docker restart centrifugo

# Centrifugo API 테스트
curl -X POST http://localhost:8000/api/info
```

### 💾 Storage Server (64.176.226.119)

#### MinIO 관리
```bash
# MinIO 로그 확인
docker logs minio

# MinIO 재시작
docker restart minio

# MinIO 상태 확인
curl http://localhost:9000/minio/health/live
```

#### TUS 업로드 서버
```bash
# TUS 서버 로그 확인
docker logs tusd

# TUS 서버 재시작
docker restart tusd
```

---

## 🔧 시스템 모니터링 명령어

### 📊 시스템 리소스 확인
```bash
# CPU 및 메모리 실시간 모니터링
htop

# 디스크 사용량 확인
df -h

# 디스크 I/O 확인
iostat -x 1

# 네트워크 연결 상태
netstat -tuln

# 프로세스별 리소스 사용량
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
```

### 🐳 Docker 관리 명령어
```bash
# 모든 컨테이너 상태 확인
docker ps -a

# 컨테이너 리소스 사용량
docker stats

# 컨테이너 로그 확인 (실시간)
docker logs -f [container_name]

# 사용하지 않는 리소스 정리
docker system prune -f

# Docker 디스크 사용량 확인
docker system df
```

### 📝 로그 분석 명령어
```bash
# Nginx 로그 실시간 모니터링
tail -f /var/log/nginx/access.log

# 에러 로그 확인
tail -f /var/log/nginx/error.log

# 특정 IP의 접근 로그 필터링
grep "192.168.1.100" /var/log/nginx/access.log

# 404 에러 찾기
grep " 404 " /var/log/nginx/access.log

# 가장 많이 접근된 URL Top 10
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
```

---

## ⚡ 빠른 문제 해결 명령어

### 🚨 긴급 상황 대응
```bash
# 시스템 부하가 높을 때
# CPU 사용량 높은 프로세스 확인
top -o +%CPU

# 메모리 부족 상황
free -h
echo 3 > /proc/sys/vm/drop_caches  # 캐시 클리어

# 디스크 공간 부족
du -sh /* | sort -hr | head -10    # 큰 디렉토리 찾기
find /var/log -name "*.log" -mtime +7 -delete  # 오래된 로그 삭제
```

### 🔄 서비스 재시작
```bash
# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl status nginx

# Docker 재시작
sudo systemctl restart docker

# 전체 시스템 재부팅 (최후 수단)
sudo reboot
```

### 🌐 네트워크 진단
```bash
# 도메인 DNS 해결 테스트
nslookup main.one-q.xyz

# 포트 연결 테스트
nc -zv 158.247.203.55 80
nc -zv 158.247.203.55 443

# 외부 접속 테스트
curl -I https://main.one-q.xyz

# SSL 인증서 확인
openssl s_client -connect main.one-q.xyz:443 -servername main.one-q.xyz
```

---

## 📁 중요 파일 및 디렉토리 위치

### 🔧 설정 파일
```bash
/opt/videopick/app/               # Next.js 애플리케이션
/opt/videopick/app/.env.local     # 환경 변수
/etc/nginx/nginx.conf             # Nginx 메인 설정
/etc/nginx/sites-enabled/         # 사이트별 설정
/var/docker/                      # Docker 설정 파일들
```

### 📊 로그 파일
```bash
/var/log/nginx/                   # Nginx 로그
/var/lib/docker/containers/       # Docker 컨테이너 로그
~/.pm2/logs/                      # PM2 로그
/opt/videopick/app/logs/          # 애플리케이션 로그
```

### 💾 데이터 디렉토리
```bash
/var/lib/docker/volumes/          # Docker 볼륨
/opt/videopick/data/              # 애플리케이션 데이터
/opt/videopick/uploads/           # 업로드된 파일
/opt/videopick/backups/           # 백업 파일
```

---

## 🔐 보안 명령어

### 🛡️ 방화벽 관리
```bash
# UFW 상태 확인
sudo ufw status

# 포트 열기/닫기
sudo ufw allow 80
sudo ufw deny 8080

# 특정 IP에서만 접근 허용
sudo ufw allow from 192.168.1.100 to any port 22
```

### 🔍 보안 점검
```bash
# 로그인한 사용자 확인
who

# 최근 로그인 기록
last

# 실패한 로그인 시도
grep "Failed password" /var/log/auth.log

# 열린 포트 확인
ss -tuln
```

---

## 📚 자주 사용하는 명령어 조합

### 🎯 원라이너 유틸리티
```bash
# 시스템 상태 한 번에 확인
echo "=== CPU ===" && top -bn1 | head -5 && echo "=== Memory ===" && free -h && echo "=== Disk ===" && df -h && echo "=== Docker ===" && docker ps

# 모든 서비스 상태 확인
pm2 status && docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 로그 파일 크기 확인 및 정리
find /var/log -name "*.log" -exec ls -lh {} \; | awk '{sum+=$5} END {print "Total size:", sum/1024/1024, "MB"}'

# 네트워크 연결 상태 요약
netstat -tuln | awk 'NR>2 {print $1, $4}' | sort | uniq -c | sort -nr
```

---

## ⚙️ 자동화 스크립트

### 📝 시스템 상태 체크 스크립트
```bash
#!/bin/bash
# /opt/scripts/health-check.sh

echo "=== VideoPick System Health Check ==="
echo "Date: $(date)"
echo

echo "=== System Resources ==="
free -h | grep -E "Mem:|Swap:"
df -h | grep -E "/$|/opt"
echo

echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

echo "=== PM2 Applications ==="
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status)"'
echo

echo "=== Network Connectivity ==="
curl -s -o /dev/null -w "main.one-q.xyz: %{http_code}\n" https://main.one-q.xyz
echo
```

### 🔄 로그 로테이션 스크립트
```bash
#!/bin/bash
# /opt/scripts/log-rotation.sh

# PM2 로그 아카이브
pm2 flush

# 오래된 로그 파일 압축
find /var/log -name "*.log" -mtime +1 -exec gzip {} \;

# 오래된 압축 로그 삭제 (30일)
find /var/log -name "*.gz" -mtime +30 -delete

echo "Log rotation completed at $(date)"
```

---

**💡 팁**: 이 명령어들을 bash 히스토리에 저장해두고 `ctrl+r`로 빠르게 검색하여 사용하세요!

**📝 마지막 업데이트**: 2025-08-20  
**📋 작성자**: DevOps Team