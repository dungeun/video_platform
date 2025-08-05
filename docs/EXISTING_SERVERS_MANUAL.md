# 📖 기존 서버 운영 매뉴얼

## 🖥️ 서버 1: 158.247.233.83 (웹 호스팅 서버)

### 📊 하드웨어 사양
- **CPU**: 1 vCPU
- **RAM**: 2GB (2048MB)
- **Storage**: 25GB NVMe SSD
- **Network**: 1Gbps
- **Location**: Seoul (Vultr)
- **OS**: Ubuntu 22.04 LTS
- **비용**: $3.36/월

### 🛠️ 설치된 주요 서비스

#### 1. **CyberPanel** (웹 호스팅 관리 패널)
- **버전**: 최신
- **접속**: https://158.247.233.83:8090
- **관리자**: admin
- **주요 기능**: 웹사이트 관리, SSL 인증서, 이메일, FTP

#### 2. **LiteSpeed 웹서버**
- **포트**: 80, 443, 7080
- **설정 위치**: `/usr/local/lsws/conf/`
- **가상 호스트**: `/home/*/public_html`

#### 3. **MariaDB**
- **포트**: 3306 (localhost only)
- **데이터 디렉토리**: `/var/lib/mysql`
- **관리**: phpMyAdmin (CyberPanel 내장)

#### 4. **Redis**
- **포트**: 6379 (localhost only)
- **설정**: `/etc/redis/redis.conf`
- **용도**: 세션 캐싱, 객체 캐싱

#### 5. **PowerDNS**
- **포트**: 53 (DNS), 8081 (API)
- **설정**: `/etc/powerdns/pdns.conf`
- **관리 도메인**: one-q.kr, ntcap.kr 등

#### 6. **PM2 프로세스**
```bash
# PM2 상태 확인
pm2 list

# 실행 중인 앱:
- linkpick (포트 3002)
- revu-platform (포트 3001)  
- project-manager (포트 3500)
```

### 📁 디렉토리 구조
```
/home/
├── one-q.kr/          # 메인 사이트
├── ntcap.kr/          # 고객 사이트
├── panel.one-q.kr/    # 관리 패널
└── nodejs-apps/       # Node.js 애플리케이션
    ├── linkpick/
    ├── revu-platform/
    └── project-manager/
```

### 🔧 일일 관리 작업
```bash
# 1. 서비스 상태 확인
systemctl status lscpd      # CyberPanel
systemctl status mariadb    # 데이터베이스
systemctl status redis      # Redis
systemctl status pdns       # PowerDNS

# 2. 디스크 공간 확인
df -h

# 3. 메모리 사용량 확인
free -h

# 4. PM2 앱 상태
pm2 status

# 5. 로그 확인
tail -f /home/cyberpanel/error-logs.txt
tail -f /usr/local/lsws/logs/error.log
```

### 🚨 문제 해결
```bash
# CyberPanel 재시작
systemctl restart lscpd

# LiteSpeed 재시작
/usr/local/lsws/bin/lswsctrl restart

# PM2 앱 재시작
pm2 restart all

# Redis 플러시 (주의!)
redis-cli FLUSHALL
```

---

## 🖥️ 서버 2: 141.164.60.51 (개발/컨테이너 서버)

### 📊 하드웨어 사양
- **CPU**: 2 vCPUs
- **RAM**: 16GB (16384MB)
- **Storage**: 100GB NVMe SSD
- **Network**: 2Gbps
- **Location**: Seoul (Vultr)
- **OS**: Ubuntu 22.04 LTS
- **비용**: $9.58/월

### 🛠️ 설치된 주요 서비스

#### 1. **Coolify** (PaaS 플랫폼)
- **버전**: 4.0.0-beta.420.6
- **접속**: http://141.164.60.51:8000
- **주요 기능**: Docker 앱 배포, CI/CD, 모니터링

#### 2. **Docker 컨테이너** (35+ 실행 중)
```yaml
주요 컨테이너:
  - Coolify 코어 서비스 (6개)
  - Appwrite (24개 컨테이너)
  - PostgreSQL 인스턴스 (5개)
  - Redis 인스턴스 (3개)
  - Traefik (리버스 프록시)
```

#### 3. **PostgreSQL** (호스트)
- **포트**: 5432
- **버전**: 15
- **데이터**: `/var/lib/postgresql/15/main`

#### 4. **Redis** (호스트)
- **포트**: 6379
- **설정**: `/etc/redis/redis.conf`

#### 5. **Verdaccio** (Private NPM)
- **포트**: 4873
- **PM2로 관리**
- **저장소**: `/home/verdaccio/storage`

### 📁 Docker 볼륨 구조
```
/var/lib/docker/volumes/
├── coolify-db/          # Coolify 데이터베이스
├── appwrite-uploads/    # Appwrite 파일
├── postgres-data/       # PostgreSQL 데이터
└── redis-data/          # Redis 영구 저장소
```

### 🔧 일일 관리 작업
```bash
# 1. Docker 상태 확인
docker ps --format "table {{.Names}}\t{{.Status}}"

# 2. Coolify 상태
docker logs coolify --tail 50

# 3. 디스크 사용량 (Docker 포함)
docker system df

# 4. 컨테이너 리소스 사용량
docker stats --no-stream

# 5. Traefik 라우팅 확인
curl http://localhost:8080/api/http/routers
```

### 🚨 문제 해결
```bash
# Coolify 재시작
docker restart coolify

# 모든 컨테이너 재시작
docker restart $(docker ps -q)

# Docker 정리 (주의!)
docker system prune -a

# Coolify 업데이트
cd /data/coolify/source
docker compose pull
docker compose up -d
```

---

## 🔐 보안 설정

### 방화벽 규칙 (두 서버 공통)
```bash
# SSH
ufw allow 22/tcp

# 웹 서비스
ufw allow 80/tcp
ufw allow 443/tcp

# 서버별 특수 포트
# 158.247.233.83
ufw allow 8090/tcp  # CyberPanel
ufw allow 7080/tcp  # LiteSpeed Admin

# 141.164.60.51  
ufw allow 8000/tcp  # Coolify
```

### SSH 키 관리
```bash
# 키 위치
~/.ssh/authorized_keys

# 권한 설정
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## 📊 모니터링

### 리소스 모니터링 명령어
```bash
# CPU 사용률
top -b -n 1 | head -20

# 메모리 상세
vmstat 1 5

# 네트워크 연결
ss -tunap | grep ESTABLISHED

# 디스크 I/O
iostat -x 1 5
```

### 로그 위치
```bash
# 시스템 로그
/var/log/syslog
/var/log/auth.log

# 웹 서버 로그
/usr/local/lsws/logs/  # 158 서버
/var/log/nginx/        # 141 서버 (Docker)

# 애플리케이션 로그
~/.pm2/logs/           # PM2 앱
docker logs <container> # Docker 앱
```

---

## 🔄 백업 절차

### 158.247.233.83 백업
```bash
# CyberPanel 백업
/usr/local/CyberCP/bin/python /usr/local/CyberCP/plogical/backup.py

# 데이터베이스 백업
mysqldump --all-databases > backup.sql

# 웹사이트 파일
tar -czf websites.tar.gz /home/*/public_html
```

### 141.164.60.51 백업
```bash
# Docker 볼륨 백업
docker run --rm -v coolify-db:/data -v $(pwd):/backup alpine tar czf /backup/coolify-backup.tar.gz -C /data .

# PostgreSQL 백업
pg_dumpall > postgres_backup.sql

# Coolify 설정 백업
docker exec coolify-db pg_dump coolify > coolify.sql
```

---

## 📞 긴급 연락처

- **Vultr 지원**: https://my.vultr.com/support/
- **CyberPanel 포럼**: https://forums.cyberpanel.net/
- **Coolify Discord**: https://discord.gg/coolify

---

마지막 업데이트: 2024-08-04