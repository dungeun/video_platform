# 🔧 관리자 시스템 문서

## 개요

비디오픽 관리자 시스템은 플랫폼의 모든 측면을 관리하는 포괄적인 도구 세트를 제공합니다.

## 관리자 권한 레벨

### 권한 체계
```typescript
enum UserRole {
  USER = 'USER',           // 일반 사용자
  MODERATOR = 'MODERATOR', // 모더레이터
  ADMIN = 'ADMIN',         // 관리자
  SUPER_ADMIN = 'SUPER_ADMIN' // 슈퍼 관리자
}
```

### 권한별 접근 범위

| 기능 | USER | MODERATOR | ADMIN | SUPER_ADMIN |
|------|------|-----------|--------|-------------|
| 콘텐츠 조회 | ✅ | ✅ | ✅ | ✅ |
| 콘텐츠 신고 | ✅ | ✅ | ✅ | ✅ |
| 콘텐츠 관리 | ❌ | ✅ | ✅ | ✅ |
| 사용자 관리 | ❌ | ❌ | ✅ | ✅ |
| UI 설정 | ❌ | ❌ | ✅ | ✅ |
| 시스템 설정 | ❌ | ❌ | ❌ | ✅ |

## 관리자 대시보드

### 접근 경로
- URL: `/admin/dashboard`
- 인증: 관리자 권한 필요

### 대시보드 구성

#### 1. 통계 카드
```tsx
// 실시간 통계 표시
<DashboardStats>
  - 총 사용자 수
  - 활성 사용자 (24시간)
  - 총 비디오 수
  - 오늘 업로드된 비디오
  - 총 조회수
  - 수익 현황
</DashboardStats>
```

#### 2. 실시간 차트
- 일일 사용자 활동
- 비디오 업로드 추이
- 카테고리별 분포
- 트래픽 분석

#### 3. 빠른 작업
- 새 비디오 추가
- 사용자 검색
- UI 설정 변경
- 공지사항 작성

## 사용자 관리

### 사용자 목록 (`/admin/users`)

#### 기능
- **검색 및 필터링**
  - 이메일, 이름으로 검색
  - 사용자 타입별 필터
  - 가입일 범위 지정
  - 상태별 필터 (활성/비활성/정지)

- **일괄 작업**
  - 다중 선택
  - 일괄 상태 변경
  - 일괄 메일 발송

#### 사용자 상세 관리
```typescript
interface UserManagement {
  // 정보 조회
  viewProfile(): UserProfile;
  viewActivity(): ActivityLog[];
  viewContent(): Content[];
  
  // 권한 관리
  changeRole(role: UserRole): void;
  changeType(type: UserType): void;
  
  // 계정 관리
  suspendAccount(reason: string, duration?: number): void;
  deleteAccount(permanent: boolean): void;
  resetPassword(): void;
  
  // 커뮤니케이션
  sendEmail(template: string, data: any): void;
  sendNotification(message: string): void;
}
```

### 사용자 생성/수정

#### 필수 필드
- 이메일 (유니크)
- 비밀번호 (최소 8자)
- 사용자 타입
- 역할

#### 선택 필드
- 이름
- 프로필 이미지
- 소개
- 소셜 링크

## UI 설정 관리

### UI 설정 메인 (`/admin/ui-config`)

#### 탭 구성
1. **헤더 설정**
   - 로고 변경
   - 메뉴 관리
   - CTA 버튼 설정

2. **푸터 설정**
   - 링크 그룹 관리
   - 소셜 미디어 링크
   - 저작권 문구

3. **사이드바 설정**
   - 메뉴 아이템 관리
   - 카테고리 메뉴
   - 구독 채널 표시

4. **섹션 관리**
   - 섹션 목록
   - 개별 섹션 편집
   - 커스텀 섹션 추가

5. **섹션 순서**
   - 드래그 앤 드롭 순서 변경
   - 표시/숨김 토글
   - 실시간 미리보기

### 섹션 편집 페이지

#### 히어로 배너 (`/admin/ui-config/sections/hero`)
```typescript
interface HeroSlide {
  id: string;
  type: 'blue' | 'dark' | 'green' | 'pink';
  tag?: string;
  title: string;
  subtitle: string;
  bgColor: string;
  backgroundImage?: string;
  link?: string;
  order: number;
  visible: boolean;
}
```

#### YouTube 섹션 (`/admin/ui-config/sections/youtube`)
```typescript
interface YoutubeSection {
  title: string;
  subtitle?: string;
  visible: boolean;
  count: number;          // 표시 개수
  category: string;       // 카테고리 필터
  keywords?: string[];    // 검색 키워드
  channelIds?: string[];  // 특정 채널
  viewAllLink?: string;   // 전체보기 링크
}
```

## 비디오 관리

### 비디오 목록 (`/admin/videos`)

#### 관리 기능
- **검색 및 필터**
  - 제목, 설명 검색
  - 카테고리 필터
  - 업로드 날짜 범위
  - 상태 필터 (공개/비공개/삭제)

- **비디오 작업**
  - 메타데이터 수정
  - 썸네일 변경
  - 카테고리 변경
  - 공개 상태 변경
  - 삭제 (소프트/하드)

### YouTube 임포트 (`/admin/videos/youtube`)

#### 임포트 프로세스
1. YouTube URL 입력
2. 메타데이터 자동 추출
3. 정보 확인 및 수정
4. 카테고리 지정
5. 임포트 실행

#### 일괄 임포트
- CSV 파일 업로드
- 채널 전체 임포트
- 재생목록 임포트

## 캠페인 관리

### 캠페인 목록 (`/admin/campaigns`)

#### 캠페인 상태
- `DRAFT` - 초안
- `ACTIVE` - 진행중
- `PAUSED` - 일시정지
- `COMPLETED` - 완료
- `CANCELLED` - 취소

#### 관리 기능
- 캠페인 생성/수정
- 예산 관리
- 타겟팅 설정
- 성과 분석
- 승인/거절

## 콘텐츠 모더레이션

### 신고 관리 (`/admin/reports`)

#### 신고 유형
- 부적절한 콘텐츠
- 저작권 침해
- 스팸
- 사기/피싱
- 기타

#### 처리 프로세스
1. 신고 접수
2. 내용 검토
3. 조치 결정
   - 무시
   - 경고
   - 콘텐츠 삭제
   - 계정 정지
4. 사용자 통보

## 시스템 설정

### 일반 설정 (`/admin/settings`)

#### 사이트 정보
- 사이트 이름
- 설명
- 키워드
- 기본 언어
- 타임존

#### 이메일 설정
- SMTP 서버
- 발신자 정보
- 템플릿 관리

#### 보안 설정
- 비밀번호 정책
- 2FA 설정
- IP 화이트리스트
- Rate Limiting

### 백업 및 복구

#### 백업 설정
- 자동 백업 주기
- 백업 보관 기간
- 백업 저장 위치

#### 복구 옵션
- 전체 복구
- 부분 복구
- 특정 시점 복구

## 분석 및 리포트

### 분석 대시보드 (`/admin/analytics`)

#### 핵심 지표
- MAU (월간 활성 사용자)
- DAU (일간 활성 사용자)
- 평균 시청 시간
- 리텐션율
- 전환율

#### 리포트 생성
- 기간 선택
- 지표 선택
- 포맷 선택 (PDF/Excel/CSV)
- 이메일 전송

## API 접근

### 관리자 API 엔드포인트

#### 인증
```bash
POST /api/admin/auth
Authorization: Bearer {admin_token}
```

#### 사용자 관리
```bash
GET    /api/admin/users
GET    /api/admin/users/:id
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

#### UI 설정
```bash
GET    /api/admin/ui-config
POST   /api/admin/ui-config
```

#### 비디오 관리
```bash
GET    /api/admin/videos
POST   /api/admin/videos/import
PUT    /api/admin/videos/:id
DELETE /api/admin/videos/:id
```

## 보안 고려사항

### 접근 제어
- IP 기반 접근 제한
- 2단계 인증 권장
- 세션 타임아웃 설정
- 감사 로그 기록

### 데이터 보호
- 민감 정보 암호화
- PII 마스킹
- 백업 암호화
- 전송 암호화 (HTTPS)

### 활동 로깅
```typescript
interface AdminActivityLog {
  adminId: string;
  action: string;
  target: string;
  details: any;
  ip: string;
  userAgent: string;
  timestamp: Date;
}
```

## 모니터링

### 실시간 모니터링
- 서버 상태
- 데이터베이스 연결
- API 응답 시간
- 에러율

### 알림 설정
- 이메일 알림
- Slack 통합
- 웹훅 설정
- 임계값 설정

## 트러블슈팅

### 일반적인 문제

#### 1. 관리자 페이지 접근 불가
- 권한 확인
- 세션 만료 확인
- IP 제한 확인

#### 2. UI 설정 저장 실패
- API 응답 확인
- 데이터 유효성 검사
- 서버 로그 확인

#### 3. 대량 작업 실패
- 타임아웃 설정 확인
- 배치 크기 조정
- 비동기 처리 고려

## 베스트 프랙티스

### 권한 관리
- 최소 권한 원칙
- 정기적인 권한 검토
- 역할 기반 접근 제어

### 데이터 관리
- 정기적인 백업
- 데이터 유효성 검사
- 트랜잭션 사용

### 성능 최적화
- 페이지네이션 활용
- 캐싱 전략
- 인덱스 최적화

### 보안
- 정기적인 보안 감사
- 취약점 스캔
- 보안 패치 적용