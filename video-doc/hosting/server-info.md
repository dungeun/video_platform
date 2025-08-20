# 🖥️ VideoPick 서버 호스팅 정보

## 📍 Vultr 클라우드 인프라

### 🏗️ 서버 구성

| 서버 타입 | IP 주소 | 스펙 | 월 비용 | 용도 |
|-----------|---------|------|---------|------|
| **App Server** | 158.247.203.55 | 8vCPU, 16GB RAM, 320GB SSD | $160 | 메인 애플리케이션 |
| **Streaming Server** | 141.164.42.213 | 4vCPU, 8GB RAM, 160GB SSD | $80 | RTMP/HLS 스트리밍 |
| **Storage Server** | 64.176.226.119 | 4vCPU, 8GB RAM, 160GB SSD | $80 | 파일 저장소 |
| **Backup Server** | 141.164.37.63 | 2vCPU, 4GB RAM, 80GB SSD | $40 | 백업 및 복구 |

**총 월 비용**: $360 USD

### 🌐 도메인 및 DNS

**메인 도메인**: one-q.xyz  
**DNS 서버**: 141.164.60.51

#### 서브도메인 구조
```
one-q.xyz
├── main.one-q.xyz → 158.247.203.55 (메인 앱)
├── stream.one-q.xyz → 141.164.42.213 (스트리밍)
├── storage.one-q.xyz → 64.176.226.119 (스토리지)
└── monitor.one-q.xyz → 158.247.203.55 (모니터링)
```

### 🔐 SSL 인증서

- **발급기관**: Let's Encrypt
- **도메인**: main.one-q.xyz
- **자동갱신**: ✅ 설정됨
- **만료일**: 90일 자동 갱신

---

## 🔑 접속 정보

### SSH 접속 계정

**사용자**: root  
**인증**: SSH Key 방식 (비밀번호 로그인 비활성화)

```bash
# 각 서버 접속 명령어
ssh root@158.247.203.55  # App Server
ssh root@141.164.42.213  # Streaming Server  
ssh root@64.176.226.119  # Storage Server
ssh root@141.164.37.63   # Backup Server
ssh root@141.164.60.51   # DNS Server
```

### 🛡️ 방화벽 설정

```bash
# 열려있는 포트
Port 22    # SSH
Port 80    # HTTP
Port 443   # HTTPS
Port 5432  # PostgreSQL (내부 접근만)
Port 6379  # Redis (내부 접근만)
```

---

## 💾 데이터베이스 접속

### PostgreSQL
- **호스트**: 158.247.203.55
- **포트**: 5432
- **데이터베이스**: videopick
- **사용자**: videopick
- **비밀번호**: `secure_password_here`

```bash
# Docker를 통한 데이터베이스 접속
docker exec -e PGPASSWORD=secure_password_here videopick-postgres psql -U videopick -d videopick
```

### Redis
- **호스트**: 158.247.203.55
- **포트**: 6379
- **패스워드**: 없음 (내부 네트워크만)

```bash
# Redis 클라이언트 접속
docker exec -it videopick-redis redis-cli
```

---

## 🐳 Docker 컨테이너 정보

### App Server (158.247.203.55)
```bash
videopick-postgres     # PostgreSQL 데이터베이스
videopick-redis        # Redis 캐시
node-exporter          # 시스템 메트릭
prometheus             # 메트릭 수집
grafana                # 모니터링 대시보드
nginx                  # 리버스 프록시
```

### Streaming Server (141.164.42.213)
```bash
mediamtx              # RTMP/HLS 스트리밍
centrifugo            # 실시간 채팅
nginx                 # 리버스 프록시
```

### Storage Server (64.176.226.119)
```bash
minio                 # S3 호환 객체 스토리지
tusd                  # 대용량 파일 업로드
nginx                 # 리버스 프록시
```

### Backup Server (141.164.37.63)
```bash
postgres-backup       # 백업 데이터베이스
nginx                 # 리버스 프록시
```

---

## 📊 모니터링 대시보드

### Grafana
- **URL**: http://monitor.one-q.xyz
- **계정**: admin
- **비밀번호**: admin (첫 로그인 후 변경 필요)

### Prometheus
- **내부 URL**: http://158.247.203.55:9090
- **외부 접근**: 차단됨 (보안)

---

## ⚙️ 시스템 리소스

### 현재 사용량 확인
```bash
# CPU 및 메모리 사용량
htop

# 디스크 사용량  
df -h

# 네트워크 상태
netstat -tuln

# Docker 컨테이너 상태
docker ps
```

### 로그 위치
```bash
# Nginx 로그
/var/log/nginx/access.log
/var/log/nginx/error.log

# Docker 컨테이너 로그
docker logs [container_name]

# PM2 애플리케이션 로그
pm2 logs videopick
```

---

## 🚨 긴급 연락처

### Vultr 지원
- **지원 티켓**: https://my.vultr.com/support/
- **긴급 전화**: 지원팀 티켓을 통해 연락

### DNS 관리
- **DNS 서버**: 141.164.60.51
- **관리 방법**: SSH 접속 후 BIND9 설정

### 백업 및 복구
- **자동 백업**: 매일 새벽 2시 (UTC)
- **보존 기간**: 7일
- **복구 절차**: backup server에서 복구

---

## 🔄 업데이트 일정

### 정기 업데이트
- **시스템 업데이트**: 매주 일요일 새벽 3시
- **SSL 인증서**: 30일마다 자동 갱신
- **Docker 이미지**: 보안 패치 시 수동 업데이트

### 유지보수 창
- **시간**: 매주 일요일 02:00-04:00 UTC
- **알림**: 48시간 전 사전 공지

---

**📝 마지막 업데이트**: 2025-08-20  
**📋 담당자**: DevOps Team