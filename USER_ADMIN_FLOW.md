# 유저 관리 플로우 분석 및 설계

## 1. 사용자 유형 분석

### 1.1 일반 사용자 (End Users)
- **인플루언서**: 캠페인 참여, 콘텐츠 제출, 리뷰 작성
- **비즈니스**: 캠페인 생성, 인플루언서 관리, 결제 처리

### 1.2 관리자 (Admin)
- **시스템 관리자**: 전체 시스템 관리, 사용자 관리
- **운영 관리자**: 캠페인 승인, 분쟁 조정, 결제 관리

## 2. 주요 플로우

### 2.1 사용자 등록 플로우
```
1. 이메일/비밀번호 입력
2. 사용자 유형 선택 (인플루언서/비즈니스)
3. 이메일 인증
4. 프로필 설정
   - 인플루언서: SNS 계정 연동, 카테고리 선택
   - 비즈니스: 사업자 정보, 업종 선택
5. 온보딩 완료
```

### 2.2 로그인/인증 플로우
```
1. 이메일/비밀번호 입력
2. JWT 토큰 발급
3. 리프레시 토큰 저장 (Redis)
4. 사용자 유형별 대시보드 리다이렉트
```

### 2.3 관리자 플로우
```
1. 관리자 로그인 (별도 경로)
2. 2FA 인증
3. 관리자 대시보드 접근
4. 권한별 기능 제공
   - 사용자 관리
   - 캠페인 승인/거절
   - 결제 관리
   - 시스템 설정
```

## 3. 권한 체계

### 3.1 역할 기반 접근 제어 (RBAC)
```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',     // 모든 권한
  ADMIN = 'admin',                 // 운영 관리
  BUSINESS = 'business',           // 비즈니스 사용자
  INFLUENCER = 'influencer',       // 인플루언서
  GUEST = 'guest'                  // 미인증 사용자
}

enum Permission {
  // 사용자 관리
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // 캠페인 관리
  CAMPAIGN_CREATE = 'campaign:create',
  CAMPAIGN_READ = 'campaign:read',
  CAMPAIGN_UPDATE = 'campaign:update',
  CAMPAIGN_DELETE = 'campaign:delete',
  CAMPAIGN_APPROVE = 'campaign:approve',
  
  // 결제 관리
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_READ = 'payment:read',
  PAYMENT_APPROVE = 'payment:approve',
  PAYMENT_REFUND = 'payment:refund',
  
  // 시스템 관리
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_MONITOR = 'system:monitor'
}
```

### 3.2 권한 매핑
```typescript
const rolePermissions = {
  [UserRole.SUPER_ADMIN]: ['*'], // 모든 권한
  [UserRole.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_APPROVE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_APPROVE,
    Permission.SYSTEM_MONITOR
  ],
  [UserRole.BUSINESS]: [
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE,
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_READ
  ],
  [UserRole.INFLUENCER]: [
    Permission.CAMPAIGN_READ,
    Permission.PAYMENT_READ
  ],
  [UserRole.GUEST]: []
};
```

## 4. API 엔드포인트 설계

### 4.1 인증 API
```
POST   /api/auth/register        # 회원가입
POST   /api/auth/login          # 로그인
POST   /api/auth/logout         # 로그아웃
POST   /api/auth/refresh        # 토큰 갱신
GET    /api/auth/me            # 현재 사용자 정보
POST   /api/auth/verify-email   # 이메일 인증
POST   /api/auth/forgot-password # 비밀번호 찾기
POST   /api/auth/reset-password  # 비밀번호 재설정
```

### 4.2 사용자 관리 API
```
GET    /api/users              # 사용자 목록 (관리자)
GET    /api/users/:id          # 사용자 상세
PUT    /api/users/:id          # 사용자 수정
DELETE /api/users/:id          # 사용자 삭제 (관리자)
GET    /api/users/profile      # 내 프로필
PUT    /api/users/profile      # 프로필 수정
POST   /api/users/profile/avatar # 아바타 업로드
```

### 4.3 관리자 API
```
GET    /api/admin/dashboard     # 관리자 대시보드
GET    /api/admin/users         # 전체 사용자 관리
PUT    /api/admin/users/:id/status # 사용자 상태 변경
GET    /api/admin/campaigns     # 캠페인 관리
PUT    /api/admin/campaigns/:id/approve # 캠페인 승인
GET    /api/admin/payments      # 결제 관리
GET    /api/admin/reports       # 보고서
GET    /api/admin/settings      # 시스템 설정
```

## 5. 보안 고려사항

### 5.1 인증/인가
- JWT + Refresh Token 방식
- Access Token: 15분 유효
- Refresh Token: 7일 유효 (Redis 저장)
- 관리자는 2FA 필수

### 5.2 데이터 보호
- 비밀번호: bcrypt 해싱
- 민감정보: AES-256 암호화
- API Rate Limiting
- CORS 설정
- SQL Injection 방어
- XSS 방어

### 5.3 감사 로그
- 모든 관리자 활동 로깅
- 중요 사용자 활동 로깅
- IP 주소 및 User Agent 기록

## 6. 프론트엔드 라우팅

### 6.1 공통 페이지
```
/                       # 홈
/login                  # 로그인
/register              # 회원가입
/forgot-password       # 비밀번호 찾기
```

### 6.2 인플루언서 페이지
```
/influencer/dashboard   # 대시보드
/influencer/campaigns   # 캠페인 목록
/influencer/profile    # 프로필 관리
/influencer/earnings   # 수익 관리
```

### 6.3 비즈니스 페이지
```
/business/dashboard    # 대시보드
/business/campaigns    # 캠페인 관리
/business/create       # 캠페인 생성
/business/payments     # 결제 관리
```

### 6.4 관리자 페이지
```
/admin                 # 관리자 로그인
/admin/dashboard       # 대시보드
/admin/users           # 사용자 관리
/admin/campaigns       # 캠페인 관리
/admin/payments        # 결제 관리
/admin/settings        # 시스템 설정
```

## 7. 구현 우선순위

### Phase 1 (필수)
1. 기본 인증 시스템 (로그인/회원가입)
2. JWT 토큰 관리
3. 사용자 프로필 CRUD
4. 역할 기반 권한 체계

### Phase 2 (중요)
1. 관리자 대시보드
2. 사용자 관리 기능
3. 이메일 인증
4. 비밀번호 재설정

### Phase 3 (추가)
1. 2FA 인증
2. 소셜 로그인
3. 감사 로그
4. 고급 보안 기능