# 🔌 API 문서

## 개요

비디오픽 플랫폼의 모든 API 엔드포인트 명세서입니다. RESTful 원칙을 따르며 JSON 형식으로 데이터를 교환합니다.

## 기본 정보

### Base URL
```
개발: http://localhost:3000/api
운영: https://api.videopick.com
```

### 인증 방식
```http
Authorization: Bearer {access_token}
```

### 응답 형식
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

## 인증 API

### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "홍길동",
  "type": "USER", // USER | CREATOR | BUSINESS
  "agreeToTerms": true,
  "agreeToPrivacy": true,
  "agreeToMarketing": false
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "type": "USER",
      "verified": false
    },
    "message": "인증 이메일이 발송되었습니다."
  }
}
```

### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "type": "USER",
      "role": "USER",
      "avatar": "https://..."
    }
  }
}
```

### 토큰 갱신
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response: 200 OK
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 로그아웃
```http
POST /api/auth/logout
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "로그아웃되었습니다."
  }
}
```

### 이메일 인증
```http
GET /api/auth/verify-email?token={verification_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "이메일이 인증되었습니다.",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "verified": true
    }
  }
}
```

### 비밀번호 재설정 요청
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "비밀번호 재설정 링크가 이메일로 발송되었습니다."
  }
}
```

### 비밀번호 재설정
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "NewSecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "비밀번호가 변경되었습니다."
  }
}
```

## 사용자 API

### 현재 사용자 정보
```http
GET /api/users/me
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "type": "CREATOR",
    "role": "USER",
    "avatar": "https://...",
    "bio": "안녕하세요",
    "verified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "stats": {
      "followers": 1234,
      "following": 567,
      "videos": 89,
      "totalViews": 123456
    }
  }
}
```

### 사용자 프로필 수정
```http
PUT /api/users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "김철수",
  "bio": "비디오 크리에이터",
  "socialLinks": {
    "youtube": "https://youtube.com/@channel",
    "instagram": "https://instagram.com/user"
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { /* 업데이트된 사용자 정보 */ }
  }
}
```

### 아바타 업로드
```http
POST /api/users/avatar
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

FormData:
- avatar: [File]

Response: 200 OK
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.videopick.com/avatars/uuid.jpg"
  }
}
```

### 특정 사용자 정보
```http
GET /api/users/{userId}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "홍길동",
    "avatar": "https://...",
    "bio": "비디오 크리에이터",
    "type": "CREATOR",
    "verified": true,
    "stats": {
      "followers": 1234,
      "videos": 89
    }
  }
}
```

### 계정 삭제
```http
DELETE /api/users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "password": "currentPassword",
  "reason": "서비스 이용 중단"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "계정이 삭제되었습니다."
  }
}
```

## 비디오 API

### 비디오 목록
```http
GET /api/videos?page=1&limit=20&category=gaming&sort=latest
Authorization: Bearer {access_token} (optional)

Query Parameters:
- page: 페이지 번호 (기본: 1)
- limit: 페이지당 항목 수 (기본: 20, 최대: 100)
- category: 카테고리 필터
- sort: 정렬 (latest | popular | trending)
- search: 검색어

Response: 200 OK
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "uuid",
        "title": "게임 플레이 영상",
        "description": "...",
        "thumbnailUrl": "https://...",
        "duration": 3600,
        "viewCount": 12345,
        "likeCount": 234,
        "channel": {
          "id": "uuid",
          "name": "게임 채널",
          "avatar": "https://..."
        },
        "publishedAt": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### 비디오 상세 정보
```http
GET /api/videos/{videoId}
Authorization: Bearer {access_token} (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "게임 플레이 영상",
    "description": "상세 설명...",
    "thumbnailUrl": "https://...",
    "videoUrl": "https://...",
    "duration": 3600,
    "viewCount": 12345,
    "likeCount": 234,
    "dislikeCount": 12,
    "commentCount": 56,
    "tags": ["게임", "FPS", "하이라이트"],
    "category": "gaming",
    "channel": {
      "id": "uuid",
      "name": "게임 채널",
      "avatar": "https://...",
      "subscriberCount": 10000,
      "verified": true
    },
    "publishedAt": "2024-01-01T00:00:00Z",
    "userInteraction": {
      "liked": true,
      "subscribed": false,
      "watchTime": 1234
    }
  }
}
```

### 조회수 증가
```http
POST /api/videos/{videoId}/view
Authorization: Bearer {access_token} (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "viewCount": 12346
  }
}
```

### 좋아요/싫어요
```http
POST /api/videos/{videoId}/like
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "type": "like" // "like" | "dislike" | "none"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "likeCount": 235,
    "dislikeCount": 12,
    "userLiked": "like"
  }
}
```

### 시청 시간 기록
```http
POST /api/videos/{videoId}/watch-time
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "duration": 120, // 초 단위
  "position": 360  // 현재 재생 위치
}

Response: 200 OK
{
  "success": true,
  "data": {
    "totalWatchTime": 480
  }
}
```

### YouTube 비디오 임포트
```http
POST /api/videos/youtube
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=VIDEO_ID"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "video": {
      "id": "uuid",
      "title": "임포트된 비디오",
      "youtubeId": "VIDEO_ID",
      "thumbnailUrl": "https://...",
      "channel": {
        "id": "uuid",
        "name": "YouTube 채널"
      }
    }
  }
}
```

## 댓글 API

### 댓글 목록
```http
GET /api/videos/{videoId}/comments?page=1&limit=20&sort=latest

Query Parameters:
- page: 페이지 번호
- limit: 페이지당 항목 수
- sort: 정렬 (latest | popular | oldest)

Response: 200 OK
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "content": "좋은 영상이네요!",
        "user": {
          "id": "uuid",
          "name": "사용자",
          "avatar": "https://..."
        },
        "likes": 10,
        "replies": 2,
        "createdAt": "2024-01-01T00:00:00Z",
        "editedAt": null
      }
    ]
  },
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### 댓글 작성
```http
POST /api/videos/{videoId}/comments
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "좋은 영상 감사합니다!",
  "parentId": null // 답글인 경우 부모 댓글 ID
}

Response: 201 Created
{
  "success": true,
  "data": {
    "comment": {
      "id": "uuid",
      "content": "좋은 영상 감사합니다!",
      "user": { /* 사용자 정보 */ },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 댓글 수정
```http
PUT /api/comments/{commentId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "수정된 댓글 내용"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "comment": { /* 수정된 댓글 */ }
  }
}
```

### 댓글 삭제
```http
DELETE /api/comments/{commentId}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "댓글이 삭제되었습니다."
  }
}
```

### 댓글 좋아요
```http
POST /api/comments/{commentId}/like
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "likes": 11,
    "userLiked": true
  }
}
```

## 구독 API

### 구독하기
```http
POST /api/channels/{channelId}/subscribe
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "notifications": true
}

Response: 200 OK
{
  "success": true,
  "data": {
    "subscribed": true,
    "subscriberCount": 10001
  }
}
```

### 구독 취소
```http
DELETE /api/channels/{channelId}/subscribe
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "subscribed": false,
    "subscriberCount": 10000
  }
}
```

### 구독 목록
```http
GET /api/users/me/subscriptions?page=1&limit=20
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "channel": {
          "id": "uuid",
          "name": "채널명",
          "avatar": "https://...",
          "subscriberCount": 10000
        },
        "notifications": true,
        "subscribedAt": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 35
  }
}
```

## 관리자 API

### 사용자 관리

#### 사용자 목록
```http
GET /api/admin/users?page=1&limit=20&type=CREATOR&status=active
Authorization: Bearer {admin_token}

Query Parameters:
- page: 페이지 번호
- limit: 페이지당 항목 수
- type: 사용자 타입 필터
- status: 상태 필터 (active | suspended | deleted)
- search: 검색어 (이메일, 이름)

Response: 200 OK
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "name": "홍길동",
        "type": "CREATOR",
        "role": "USER",
        "status": "active",
        "verified": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "lastLoginAt": "2024-01-15T00:00:00Z"
      }
    ]
  },
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 250
  }
}
```

#### 사용자 상태 변경
```http
PUT /api/admin/users/{userId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "suspended",
  "reason": "커뮤니티 가이드라인 위반",
  "duration": 7 // 일 단위, null이면 영구
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { /* 업데이트된 사용자 정보 */ }
  }
}
```

#### 사용자 역할 변경
```http
PUT /api/admin/users/{userId}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "MODERATOR"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { /* 업데이트된 사용자 정보 */ }
  }
}
```

### UI 설정 관리

#### UI 설정 조회
```http
GET /api/admin/ui-config
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "config": {
      "header": { /* 헤더 설정 */ },
      "footer": { /* 푸터 설정 */ },
      "sidebar": { /* 사이드바 설정 */ },
      "mainPage": {
        "sectionOrder": [
          { "id": "hero", "type": "hero", "order": 1, "visible": true },
          { "id": "youtube", "type": "youtube", "order": 2, "visible": true }
        ],
        "heroSlides": [ /* 히어로 슬라이드 */ ],
        "youtubeSection": { /* YouTube 섹션 설정 */ }
      }
    }
  }
}
```

#### UI 설정 업데이트
```http
POST /api/admin/ui-config
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "config": {
    /* 전체 UI 설정 객체 */
  }
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "UI 설정이 업데이트되었습니다."
  }
}
```

### 비디오 관리

#### 비디오 상태 변경
```http
PUT /api/admin/videos/{videoId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "private", // "public" | "private" | "deleted"
  "reason": "저작권 문제"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "video": { /* 업데이트된 비디오 정보 */ }
  }
}
```

#### 비디오 카테고리 변경
```http
PUT /api/admin/videos/{videoId}/category
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "category": "education"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "video": { /* 업데이트된 비디오 정보 */ }
  }
}
```

### 분석 API

#### 대시보드 통계
```http
GET /api/admin/analytics/dashboard
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "users": {
      "total": 10000,
      "new24h": 123,
      "active24h": 2345
    },
    "videos": {
      "total": 5000,
      "new24h": 45,
      "totalViews": 1234567
    },
    "revenue": {
      "today": 123456,
      "month": 3456789,
      "year": 45678901
    }
  }
}
```

#### 사용자 활동 분석
```http
GET /api/admin/analytics/users?period=7d
Authorization: Bearer {admin_token}

Query Parameters:
- period: 기간 (24h | 7d | 30d | 90d | 1y)

Response: 200 OK
{
  "success": true,
  "data": {
    "dailyActiveUsers": [
      { "date": "2024-01-01", "count": 2345 },
      { "date": "2024-01-02", "count": 2456 }
    ],
    "userGrowth": {
      "new": 234,
      "churned": 45,
      "netGrowth": 189
    },
    "engagement": {
      "avgSessionDuration": 1234, // 초
      "avgVideosPerSession": 3.4,
      "bounceRate": 0.23
    }
  }
}
```

## 홈페이지 데이터 API

### 홈페이지 데이터
```http
GET /api/home

Response: 200 OK
{
  "success": true,
  "data": {
    "heroSlides": [
      {
        "id": "1",
        "title": "Welcome to VideoPick",
        "subtitle": "Discover amazing videos",
        "bgColor": "#3B82F6",
        "link": "/explore"
      }
    ],
    "sections": [
      {
        "type": "youtube",
        "title": "인기 YouTube 비디오",
        "videos": [ /* 비디오 목록 */ ]
      },
      {
        "type": "category",
        "title": "카테고리별 인기 영상",
        "categories": [ /* 카테고리 목록 */ ]
      }
    ]
  }
}
```

## 에러 코드

### HTTP 상태 코드
- `200 OK`: 성공
- `201 Created`: 리소스 생성 성공
- `204 No Content`: 성공 (응답 본문 없음)
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 충돌 (중복 등)
- `422 Unprocessable Entity`: 유효성 검사 실패
- `429 Too Many Requests`: 요청 제한 초과
- `500 Internal Server Error`: 서버 오류

### 에러 코드 체계
```typescript
enum ErrorCode {
  // 인증 관련
  AUTH_INVALID_CREDENTIALS = "AUTH001",
  AUTH_TOKEN_EXPIRED = "AUTH002",
  AUTH_TOKEN_INVALID = "AUTH003",
  AUTH_EMAIL_NOT_VERIFIED = "AUTH004",
  AUTH_ACCOUNT_SUSPENDED = "AUTH005",
  
  // 유효성 검사
  VALIDATION_FAILED = "VAL001",
  VALIDATION_EMAIL_EXISTS = "VAL002",
  VALIDATION_INVALID_FORMAT = "VAL003",
  
  // 리소스
  RESOURCE_NOT_FOUND = "RES001",
  RESOURCE_ACCESS_DENIED = "RES002",
  RESOURCE_ALREADY_EXISTS = "RES003",
  
  // 비즈니스 로직
  BUSINESS_RULE_VIOLATION = "BIZ001",
  INSUFFICIENT_CREDITS = "BIZ002",
  QUOTA_EXCEEDED = "BIZ003",
  
  // 시스템
  INTERNAL_ERROR = "SYS001",
  SERVICE_UNAVAILABLE = "SYS002",
  RATE_LIMIT_EXCEEDED = "SYS003"
}
```

## Rate Limiting

### 제한 정책
```
일반 사용자:
- 60 requests/minute
- 1000 requests/hour
- 10000 requests/day

인증된 사용자:
- 120 requests/minute
- 3000 requests/hour
- 30000 requests/day

관리자:
- 제한 없음
```

### Rate Limit 헤더
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1641024000
```

## Webhook

### Webhook 이벤트
```typescript
interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  data: any;
}

// 이벤트 타입
enum WebhookEventType {
  // 사용자
  USER_REGISTERED = "user.registered",
  USER_VERIFIED = "user.verified",
  USER_DELETED = "user.deleted",
  
  // 비디오
  VIDEO_UPLOADED = "video.uploaded",
  VIDEO_PUBLISHED = "video.published",
  VIDEO_DELETED = "video.deleted",
  
  // 구독
  SUBSCRIPTION_CREATED = "subscription.created",
  SUBSCRIPTION_CANCELLED = "subscription.cancelled",
  
  // 결제
  PAYMENT_SUCCESS = "payment.success",
  PAYMENT_FAILED = "payment.failed"
}
```

### Webhook 등록
```http
POST /api/admin/webhooks
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["user.registered", "video.uploaded"],
  "secret": "your_webhook_secret"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "webhook": {
      "id": "uuid",
      "url": "https://your-server.com/webhook",
      "events": ["user.registered", "video.uploaded"],
      "active": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

## SDK 사용 예제

### JavaScript/TypeScript
```typescript
import { VideoPickAPI } from '@videopick/sdk';

const api = new VideoPickAPI({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.videopick.com'
});

// 인증
const { user, token } = await api.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// 비디오 목록
const videos = await api.videos.list({
  page: 1,
  limit: 20,
  category: 'gaming'
});

// 구독
await api.channels.subscribe('channel_id', {
  notifications: true
});
```

### Python
```python
from videopick import VideoPickAPI

api = VideoPickAPI(
    api_key='your_api_key',
    base_url='https://api.videopick.com'
)

# 인증
user, token = api.auth.login(
    email='user@example.com',
    password='password'
)

# 비디오 목록
videos = api.videos.list(
    page=1,
    limit=20,
    category='gaming'
)

# 구독
api.channels.subscribe(
    channel_id='channel_id',
    notifications=True
)
```

## 버전 관리

### API 버전
- 현재 버전: v1
- 버전 헤더: `X-API-Version: 1`
- URL 버전: `/api/v1/...` (optional)

### 지원 중단 정책
- 새 버전 출시 후 최소 6개월간 이전 버전 지원
- 지원 중단 3개월 전 공지
- 자동 마이그레이션 도구 제공

## 보안 고려사항

### HTTPS 필수
모든 API 요청은 HTTPS를 통해서만 가능합니다.

### CORS 설정
```javascript
// 허용된 도메인
const allowedOrigins = [
  'https://videopick.com',
  'https://app.videopick.com'
];
```

### API 키 관리
- API 키는 환경 변수로 관리
- 클라이언트 사이드에 노출 금지
- 정기적인 키 로테이션 권장

### 입력 검증
- 모든 입력값 검증 (Zod 스키마)
- SQL 인젝션 방지 (Prisma ORM)
- XSS 방지 (입력값 이스케이핑)