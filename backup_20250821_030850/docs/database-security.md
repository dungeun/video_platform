# 데이터베이스 보안 설정 가이드

## 현재 상황
PostgreSQL 데이터베이스가 외부 포트 21871로 노출되어 있어 보안 위험이 있습니다.

## 권장 보안 조치

### 1. IP 화이트리스트 설정

Coolify 서버에서 다음 방화벽 규칙을 적용합니다:

```bash
# SSH로 서버 접속
ssh root@coolify.one-q.xyz

# 현재 방화벽 규칙 확인
iptables -L -n

# PostgreSQL 포트를 특정 IP에서만 접근 허용
# 개발자 IP 추가 (예시 - 실제 IP로 변경 필요)
iptables -A INPUT -p tcp --dport 21871 -s YOUR_DEV_IP/32 -j ACCEPT

# 로컬 Docker 네트워크는 허용
iptables -A INPUT -p tcp --dport 21871 -s 172.16.0.0/12 -j ACCEPT

# 나머지 모든 접근 차단
iptables -A INPUT -p tcp --dport 21871 -j DROP

# 규칙 저장 (Ubuntu/Debian)
apt-get install iptables-persistent
netfilter-persistent save
```

### 2. PostgreSQL 접근 제어 설정

PostgreSQL 컨테이너 내부에서 pg_hba.conf 수정:

```bash
# 컨테이너 접속
docker exec -it i4sccwsosskookos4084ogkc bash

# pg_hba.conf 편집
vi /var/lib/postgresql/data/pg_hba.conf

# 다음 규칙 추가
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             172.16.0.0/12           md5     # Docker 네트워크
host    all             all             YOUR_DEV_IP/32          md5     # 개발자 IP
host    all             all             0.0.0.0/0               reject  # 나머지 차단

# PostgreSQL 재시작
docker restart i4sccwsosskookos4084ogkc
```

### 3. SSH 터널링 사용 (권장)

외부 포트를 완전히 닫고 SSH 터널을 통해서만 접근:

```bash
# 로컬에서 SSH 터널 생성
ssh -L 5432:localhost:21871 root@coolify.one-q.xyz

# 이제 localhost:5432로 데이터베이스 접근 가능
DATABASE_URL="postgres://postgres:password@localhost:5432/postgres"
```

### 4. Coolify 내부 네트워크만 사용

프로덕션 환경에서는 외부 포트를 제거하고 내부 네트워크만 사용:

```bash
# Docker 컨테이너 재생성 (포트 매핑 제거)
docker stop i4sccwsosskookos4084ogkc
docker rm i4sccwsosskookos4084ogkc
docker run -d \
  --name i4sccwsosskookos4084ogkc \
  --network coolify \
  -e POSTGRES_PASSWORD=47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX \
  -e POSTGRES_DB=postgres \
  -v i4sccwsosskookos4084ogkc:/var/lib/postgresql/data \
  postgres:16-alpine
```

그리고 애플리케이션에서 내부 호스트명 사용:
```
DATABASE_URL="postgres://postgres:password@i4sccwsosskookos4084ogkc:5432/postgres"
```

### 5. 비밀번호 보안

현재 비밀번호가 매우 강력하지만, 추가 보안을 위해:

1. 정기적으로 비밀번호 변경
2. 각 환경별로 다른 비밀번호 사용
3. 비밀번호를 환경 변수로만 관리

### 6. 모니터링 설정

데이터베이스 접근 로그 모니터링:

```bash
# PostgreSQL 로그 확인
docker logs -f i4sccwsosskookos4084ogkc | grep "connection"

# 실패한 접근 시도 모니터링
docker logs i4sccwsosskookos4084ogkc | grep "FATAL"
```

## 즉시 적용 가능한 조치

가장 빠르게 적용할 수 있는 보안 조치:

1. **긴급**: iptables로 포트 21871을 필요한 IP만 허용
2. **중요**: SSH 터널링으로 전환
3. **장기**: Coolify 내부 네트워크만 사용하도록 재구성

## Coolify 환경변수 설정

Coolify 대시보드에서 다음 환경변수 확인:

```
NODE_ENV=production
JWT_SECRET=[강력한 랜덤 값]
JWT_REFRESH_SECRET=[강력한 랜덤 값]
DATABASE_URL=[내부 네트워크 주소 사용]
```

## 보안 체크리스트

- [ ] 외부 포트 접근 제한 설정
- [ ] PostgreSQL pg_hba.conf 설정
- [ ] SSH 터널링 구성
- [ ] 강력한 비밀번호 사용
- [ ] 정기적인 로그 모니터링
- [ ] 백업 설정
- [ ] SSL/TLS 인증서 설정 (프로덕션)