# Coolify 환경변수 설정 가이드

## VideoPick 앱 환경변수 (nkkc88c8k8008k0ssws4g848)

아래 환경변수를 Coolify 대시보드에서 설정해야 합니다:

### 데이터베이스 설정
```
DATABASE_URL=postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres
POSTGRES_URL=postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres
POSTGRES_PRISMA_URL=postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres
POSTGRES_URL_NON_POOLING=postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres
```

### JWT 설정
```
JWT_SECRET=VideoPick2024!SuperSecretJWTKey#VideoPickProduction$
JWT_REFRESH_SECRET=VideoPick2024!RefreshSecretKey#VideoPickProductionRefresh$
```

### Redis 설정
```
REDIS_URL=redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0
KV_URL=redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0
```

### 애플리케이션 URL
```
NEXT_PUBLIC_API_URL=http://nkkc88c8k8008k0ssws4g848.141.164.60.51.sslip.io
NEXT_PUBLIC_APP_URL=http://nkkc88c8k8008k0ssws4g848.141.164.60.51.sslip.io
```

### 기타 설정
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 설정 방법

1. Coolify 대시보드 접속: https://coolify.one-q.xyz
2. Applications → "dungeun/video_platform:main" 선택
3. Environment Variables 섹션으로 이동
4. 각 환경변수를 Key-Value 형태로 추가
5. Save 후 Redeploy

## 데이터베이스 정보

- **Database UUID**: i4sccwsosskookos4084ogkc
- **Database Name**: postgresql-database-video
- **Environment ID**: 6
- **Internal URL**: postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres

## Redis 정보

- **Redis UUID**: bssgk8sogo8cgs4c4o0gkwkw
- **Environment ID**: 6
- **Internal URL**: redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0

## 주의사항

- 모든 환경변수는 Internal Network (Coolify Docker 네트워크) 내에서만 접근 가능한 호스트명을 사용합니다
- 외부에서 접근시에는 SSH 터널 또는 외부 포트 (21871)를 사용해야 합니다
- JWT Secret은 프로덕션용으로 VideoPick 전용 값을 사용합니다