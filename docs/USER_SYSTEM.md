# 👥 사용자 시스템 문서

## 개요

비디오픽의 사용자 시스템은 다양한 사용자 유형을 지원하며, 각 유형별로 맞춤화된 기능과 인터페이스를 제공합니다.

## 사용자 유형

### UserType 분류
```typescript
enum UserType {
  USER = 'USER',           // 일반 시청자
  CREATOR = 'CREATOR',     // 콘텐츠 크리에이터
  BUSINESS = 'BUSINESS',   // 비즈니스 계정
  ADMIN = 'ADMIN'          // 관리자
}
```

### 유형별 특징

| 유형 | 주요 기능 | 대시보드 | 수익화 | 분석 도구 |
|------|----------|----------|---------|-----------|
| USER | 시청, 구독, 좋아요 | ❌ | ❌ | 기본 |
| CREATOR | 업로드, 채널 관리 | ✅ | ✅ | 고급 |
| BUSINESS | 캠페인, 광고 | ✅ | ✅ | 프로 |
| ADMIN | 전체 관리 | ✅ | N/A | 전체 |

## 인증 시스템

### 회원가입 프로세스

#### 1. 일반 회원가입 (`/register`)
```typescript
interface RegisterData {
  email: string;
  password: string;
  name?: string;
  type: UserType;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToMarketing?: boolean;
}
```

#### 2. 소셜 회원가입
- Google OAuth
- Facebook OAuth
- Kakao OAuth (준비중)
- Naver OAuth (준비중)

#### 3. 이메일 인증
1. 회원가입 완료
2. 인증 이메일 발송
3. 이메일 링크 클릭
4. 계정 활성화

### 로그인 시스템

#### 로그인 방식
```typescript
// 이메일/비밀번호 로그인
async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  if (response.ok) {
    const { accessToken, refreshToken, user } = await response.json();
    // 토큰 저장 및 리다이렉트
  }
}
```

#### JWT 토큰 관리
- **Access Token**: 15분 유효
- **Refresh Token**: 7일 유효
- 자동 토큰 갱신
- 보안 쿠키 저장

### 비밀번호 관리

#### 비밀번호 정책
- 최소 8자 이상
- 대소문자 포함
- 숫자 포함
- 특수문자 권장

#### 비밀번호 재설정
1. 비밀번호 찾기 요청
2. 이메일로 재설정 링크 발송
3. 새 비밀번호 설정
4. 자동 로그인

## 사용자 프로필

### 프로필 정보

#### 기본 정보
```typescript
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  verified: boolean;
  createdAt: Date;
}
```

#### 확장 정보
```typescript
interface ExtendedProfile {
  // 기본 정보
  ...UserProfile;
  
  // 소셜 링크
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  
  // 통계
  stats?: {
    followers: number;
    following: number;
    videos: number;
    totalViews: number;
  };
  
  // 설정
  preferences?: {
    language: string;
    timezone: string;
    notifications: NotificationSettings;
  };
}
```

### 프로필 페이지 (`/profile/[username]`)

#### 공개 프로필
- 기본 정보 표시
- 업로드한 비디오
- 재생목록
- 소개 정보

#### 프라이빗 설정
- 프로필 편집
- 계정 설정
- 보안 설정
- 알림 설정

## 크리에이터 기능

### 크리에이터 대시보드 (`/creator/dashboard`)

#### 대시보드 위젯
- 채널 분석
- 최근 업로드
- 수익 현황
- 구독자 증가 추이
- 인기 동영상

### 콘텐츠 관리

#### 비디오 업로드
```typescript
interface VideoUpload {
  title: string;
  description: string;
  thumbnail: File;
  category: string;
  tags: string[];
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  scheduledAt?: Date;
}
```

#### 비디오 관리
- 메타데이터 수정
- 썸네일 변경
- 공개 설정
- 통계 확인
- 댓글 관리

### 수익화

#### 수익 모델
- 광고 수익
- 구독자 후원
- 유료 콘텐츠
- 제휴 마케팅

#### 수익 조건
- 구독자 1,000명 이상
- 총 시청 시간 4,000시간
- 커뮤니티 가이드라인 준수
- 저작권 위반 없음

## 비즈니스 기능

### 비즈니스 대시보드 (`/business/dashboard`)

#### 캠페인 관리
```typescript
interface Campaign {
  id: string;
  title: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  targetAudience: {
    age: [number, number];
    gender?: 'ALL' | 'MALE' | 'FEMALE';
    interests: string[];
    location?: string[];
  };
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}
```

#### 광고 분석
- 노출 수
- 클릭률 (CTR)
- 전환율
- ROI 분석
- A/B 테스트

### 인플루언서 협업

#### 인플루언서 검색
- 카테고리별 필터
- 구독자 수 범위
- 참여율 기준
- 예산 범위

#### 협업 프로세스
1. 인플루언서 검색
2. 제안서 발송
3. 조건 협상
4. 계약 체결
5. 콘텐츠 제작
6. 성과 측정

## 사용자 상호작용

### 구독 시스템

#### 구독 관리
```typescript
interface Subscription {
  userId: string;
  channelId: string;
  notifications: boolean;
  subscribedAt: Date;
}
```

#### 알림 설정
- 새 비디오 알림
- 라이브 방송 알림
- 커뮤니티 포스트
- 댓글 답글

### 좋아요/싫어요

#### 상호작용 추적
```typescript
interface VideoInteraction {
  videoId: string;
  userId: string;
  liked?: boolean;
  watchTime: number;
  lastWatchedAt: Date;
}
```

### 댓글 시스템

#### 댓글 구조
```typescript
interface Comment {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  parentId?: string; // 답글
  likes: number;
  createdAt: Date;
  editedAt?: Date;
}
```

#### 댓글 관리
- 작성/수정/삭제
- 좋아요/싫어요
- 답글 작성
- 신고 기능

## 알림 시스템

### 알림 유형

#### 시스템 알림
- 계정 보안
- 정책 변경
- 시스템 점검

#### 활동 알림
- 댓글 답글
- 좋아요 받음
- 새 구독자
- 멘션

#### 콘텐츠 알림
- 구독 채널 새 비디오
- 추천 콘텐츠
- 라이브 방송

### 알림 채널

#### 인앱 알림
- 실시간 푸시
- 알림 센터
- 배지 카운트

#### 이메일 알림
- 주간 다이제스트
- 중요 알림
- 마케팅 메일

#### 모바일 푸시 (준비중)
- FCM 통합
- 맞춤 알림

## 보안 및 프라이버시

### 계정 보안

#### 2단계 인증 (2FA)
- TOTP 기반
- SMS 인증 (준비중)
- 백업 코드

#### 세션 관리
- 활성 세션 목록
- 원격 로그아웃
- 디바이스 관리

### 프라이버시 설정

#### 공개 범위 설정
- 프로필 공개
- 구독 목록 공개
- 활동 내역 공개

#### 데이터 관리
- 데이터 다운로드
- 계정 삭제
- 데이터 보관 기간

## API 사용

### 사용자 API

#### 인증 API
```bash
POST   /api/auth/register    # 회원가입
POST   /api/auth/login       # 로그인
POST   /api/auth/logout      # 로그아웃
POST   /api/auth/refresh     # 토큰 갱신
POST   /api/auth/forgot      # 비밀번호 찾기
POST   /api/auth/reset       # 비밀번호 재설정
```

#### 프로필 API
```bash
GET    /api/users/me         # 내 정보
PUT    /api/users/me         # 정보 수정
DELETE /api/users/me         # 계정 삭제
GET    /api/users/:id        # 사용자 정보
POST   /api/users/avatar     # 아바타 업로드
```

#### 상호작용 API
```bash
POST   /api/subscribe        # 구독
DELETE /api/subscribe        # 구독 취소
POST   /api/videos/:id/like # 좋아요
DELETE /api/videos/:id/like # 좋아요 취소
POST   /api/comments         # 댓글 작성
PUT    /api/comments/:id    # 댓글 수정
DELETE /api/comments/:id    # 댓글 삭제
```

## 사용자 경험 최적화

### 개인화

#### 추천 시스템
- 시청 기록 기반
- 관심사 분석
- 협업 필터링
- 인기도 가중치

#### 맞춤 피드
- 구독 채널 우선
- 카테고리 선호도
- 시청 시간대 분석

### 접근성

#### 웹 접근성
- WCAG 2.1 준수
- 키보드 네비게이션
- 스크린 리더 지원
- 고대비 모드

#### 다국어 지원
- 한국어 (기본)
- 영어
- 일본어 (준비중)
- 중국어 (준비중)

## 문제 해결

### 일반적인 문제

#### 로그인 실패
- 이메일/비밀번호 확인
- 계정 활성화 상태
- 계정 정지 여부

#### 비디오 업로드 실패
- 파일 형식 확인
- 파일 크기 제한
- 네트워크 상태

#### 프로필 업데이트 실패
- 입력값 유효성
- 이미지 크기
- 권한 확인

### 지원 채널

#### 고객 지원
- 이메일: support@videopick.com
- 도움말 센터: /help
- FAQ: /faq
- 커뮤니티 포럼: /community

## 개발자 가이드

### 사용자 인증 구현

#### Frontend (React)
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // 토큰 검증 및 사용자 정보 로드
    }
  }, []);
  
  return { user, loading, login, logout, register };
}
```

#### Backend (Next.js API)
```typescript
// middleware/auth.ts
export async function verifyToken(req: Request) {
  const token = req.headers.get('Authorization')?.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 권한 체크

#### 페이지 레벨
```typescript
// app/admin/page.tsx
export default async function AdminPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }
  
  return <AdminDashboard />;
}
```

#### API 레벨
```typescript
// api/admin/route.ts
export async function GET(req: Request) {
  const user = await verifyToken(req);
  
  if (user.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }
  
  // 관리자 데이터 반환
}