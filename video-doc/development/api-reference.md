# 🔗 VideoPick API 레퍼런스

## 📋 개요

VideoPick 플랫폼의 RESTful API 문서입니다. 인증, 스트리밍, 비디오 관리, 채팅, 결제 등 주요 기능들의 API 엔드포인트를 다룹니다.

**Base URL**: `https://main.one-q.xyz/api`

---

## 🔐 인증 (Authentication)

### POST `/auth/login`
사용자 로그인

**요청**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id-123",
      "email": "user@example.com",
      "name": "홍길동",
      "type": "VIEWER"
    },
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

### POST `/auth/register`
사용자 회원가입

**요청**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "type": "VIEWER"
}
```

### POST `/auth/refresh`
토큰 갱신

**요청**:
```json
{
  "refreshToken": "refresh-token-here"
}
```

### POST `/auth/logout`
로그아웃

**헤더**: `Authorization: Bearer {token}`

---

## 👤 사용자 관리 (User Management)

### GET `/users/profile`
현재 사용자 프로필 조회

**헤더**: `Authorization: Bearer {token}`

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "user-id-123",
    "email": "user@example.com",
    "name": "홍길동",
    "type": "CREATOR",
    "profile": {
      "bio": "안녕하세요!",
      "profileImage": "https://storage.one-q.xyz/profiles/image.jpg",
      "followerCount": 1234
    }
  }
}
```

### PUT `/users/profile`
사용자 프로필 수정

**요청**:
```json
{
  "name": "김철수",
  "bio": "새로운 소개글입니다",
  "profileImage": "base64-image-data"
}
```

### GET `/users/{userId}`
특정 사용자 정보 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "user-id-123",
    "name": "홍길동",
    "type": "CREATOR",
    "profile": {
      "bio": "크리에이터입니다",
      "followerCount": 5000,
      "videoCount": 45
    },
    "channel": {
      "name": "홍길동 채널",
      "subscriberCount": 5000
    }
  }
}
```

---

## 📺 채널 관리 (Channel Management)

### GET `/channels/my`
내 채널 정보 조회

**헤더**: `Authorization: Bearer {token}`

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "channel-id-123",
    "name": "홍길동 채널",
    "handle": "@hongchannel",
    "description": "재미있는 콘텐츠를 만듭니다",
    "avatarUrl": "https://storage.one-q.xyz/avatars/image.jpg",
    "subscriberCount": 1234,
    "videoCount": 45,
    "totalViews": 100000
  }
}
```

### PUT `/channels/my`
채널 정보 수정

**요청**:
```json
{
  "name": "새로운 채널명",
  "description": "새로운 채널 설명",
  "avatarUrl": "https://storage.one-q.xyz/avatars/new-image.jpg"
}
```

### POST `/channels/{channelId}/subscribe`
채널 구독

**헤더**: `Authorization: Bearer {token}`

### DELETE `/channels/{channelId}/subscribe`
채널 구독 취소

---

## 🎥 비디오 관리 (Video Management)

### GET `/videos`
비디오 목록 조회

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `category`: 카테고리 필터
- `sort`: 정렬 방식 (latest, popular, trending)

**응답**:
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "video-id-123",
        "title": "재미있는 비디오",
        "description": "비디오 설명",
        "thumbnailUrl": "https://storage.one-q.xyz/thumbnails/thumb.jpg",
        "duration": 300,
        "viewCount": 1000,
        "likeCount": 50,
        "publishedAt": "2025-08-20T10:00:00Z",
        "channel": {
          "id": "channel-id-123",
          "name": "홍길동 채널",
          "avatarUrl": "https://storage.one-q.xyz/avatars/avatar.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 100,
      "totalPages": 5
    }
  }
}
```

### GET `/videos/{videoId}`
특정 비디오 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "video-id-123",
    "title": "재미있는 비디오",
    "description": "상세한 비디오 설명",
    "videoUrl": "https://storage.one-q.xyz/videos/video.m3u8",
    "thumbnailUrl": "https://storage.one-q.xyz/thumbnails/thumb.jpg",
    "duration": 300,
    "viewCount": 1000,
    "likeCount": 50,
    "dislikeCount": 5,
    "tags": ["게임", "재미"],
    "category": "게임",
    "publishedAt": "2025-08-20T10:00:00Z",
    "channel": {
      "id": "channel-id-123",
      "name": "홍길동 채널",
      "handle": "@hongchannel",
      "subscriberCount": 5000
    }
  }
}
```

### POST `/videos/upload`
비디오 업로드 시작

**헤더**: `Authorization: Bearer {token}`

**요청** (multipart/form-data):
```
title: "비디오 제목"
description: "비디오 설명"
category: "게임"
tags: "게임,재미,엔터테인먼트"
file: [비디오 파일]
```

**응답**:
```json
{
  "success": true,
  "data": {
    "uploadId": "upload-id-123",
    "videoId": "video-id-123",
    "status": "uploading"
  }
}
```

### GET `/videos/upload/{uploadId}/status`
업로드 상태 조회

**응답**:
```json
{
  "success": true,
  "data": {
    "uploadId": "upload-id-123",
    "status": "encoding", // uploading, encoding, processing, completed, failed
    "progress": 75,
    "estimatedTime": 300
  }
}
```

### POST `/videos/{videoId}/like`
비디오 좋아요

### DELETE `/videos/{videoId}/like`
비디오 좋아요 취소

---

## 🎬 라이브 스트리밍 (Live Streaming)

### GET `/streams/my`
내 라이브 스트림 목록

**헤더**: `Authorization: Bearer {token}`

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "stream-id-123",
      "title": "실시간 방송",
      "status": "live", // preparing, live, ended
      "viewerCount": 150,
      "peakViewers": 200,
      "startedAt": "2025-08-20T14:00:00Z",
      "streamKey": "sk_123456789abcdef"
    }
  ]
}
```

### POST `/streams/create`
라이브 스트림 생성

**요청**:
```json
{
  "title": "새로운 라이브 방송",
  "description": "방송 설명",
  "category": "게임",
  "thumbnailUrl": "https://storage.one-q.xyz/thumbnails/thumb.jpg"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "stream-id-123",
    "streamKey": "sk_123456789abcdef",
    "rtmpUrl": "rtmp://stream.one-q.xyz:1935/live",
    "streamUrl": "rtmp://stream.one-q.xyz:1935/live/sk_123456789abcdef"
  }
}
```

### PUT `/streams/{streamId}`
스트림 정보 수정

### POST `/streams/{streamId}/start`
스트림 시작

### POST `/streams/{streamId}/stop`
스트림 종료

### GET `/streams/live`
현재 라이브 스트림 목록

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "stream-id-123",
      "title": "실시간 게임 방송",
      "viewerCount": 1500,
      "hlsUrl": "https://stream.one-q.xyz/live/stream-key/index.m3u8",
      "thumbnailUrl": "https://storage.one-q.xyz/thumbnails/thumb.jpg",
      "channel": {
        "name": "게이머123",
        "avatarUrl": "https://storage.one-q.xyz/avatars/avatar.jpg"
      },
      "startedAt": "2025-08-20T14:00:00Z"
    }
  ]
}
```

---

## 💬 채팅 (Chat)

### GET `/chat/{streamId}/messages`
채팅 메시지 목록 조회

**쿼리 파라미터**:
- `limit`: 메시지 수 (기본값: 50)
- `before`: 특정 시점 이전 메시지

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-id-123",
      "userId": "user-id-123",
      "username": "홍길동",
      "content": "안녕하세요!",
      "type": "message",
      "createdAt": "2025-08-20T14:30:00Z"
    },
    {
      "id": "msg-id-124",
      "userId": "user-id-124",
      "username": "김철수",
      "content": "응원합니다!",
      "type": "super_chat",
      "amount": 5000,
      "color": "#FFD700",
      "createdAt": "2025-08-20T14:31:00Z"
    }
  ]
}
```

### POST `/chat/{streamId}/message`
채팅 메시지 전송

**헤더**: `Authorization: Bearer {token}`

**요청**:
```json
{
  "content": "안녕하세요!",
  "type": "message"
}
```

### POST `/chat/{streamId}/super-chat`
슈퍼챗 전송

**요청**:
```json
{
  "content": "응원합니다!",
  "amount": 5000,
  "color": "#FFD700"
}
```

---

## 💰 슈퍼챗 & 결제 (Super Chat & Payments)

### POST `/payments/super-chat/create`
슈퍼챗 결제 생성

**헤더**: `Authorization: Bearer {token}`

**요청**:
```json
{
  "streamId": "stream-id-123",
  "channelId": "channel-id-123",
  "amount": 5000,
  "message": "응원합니다!",
  "color": "#FFD700"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-id-123",
    "orderId": "order-id-123",
    "amount": 5000,
    "paymentUrl": "https://payment-gateway.com/pay?orderId=order-id-123"
  }
}
```

### POST `/payments/super-chat/confirm`
슈퍼챗 결제 확인

**요청**:
```json
{
  "orderId": "order-id-123",
  "paymentKey": "payment-key-from-gateway"
}
```

### GET `/payments/super-chat/history`
슈퍼챗 내역 조회

**헤더**: `Authorization: Bearer {token}`

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "superchat-id-123",
      "amount": 5000,
      "message": "응원합니다!",
      "channelName": "홍길동 채널",
      "createdAt": "2025-08-20T14:30:00Z",
      "status": "paid"
    }
  ]
}
```

---

## 📝 댓글 (Comments)

### GET `/videos/{videoId}/comments`
비디오 댓글 목록 조회

**쿼리 파라미터**:
- `page`: 페이지 번호
- `sort`: 정렬 (latest, popular)

**응답**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment-id-123",
        "content": "좋은 영상이네요!",
        "likeCount": 15,
        "createdAt": "2025-08-20T10:30:00Z",
        "user": {
          "id": "user-id-123",
          "name": "홍길동",
          "profileImage": "https://storage.one-q.xyz/profiles/image.jpg"
        },
        "replies": [
          {
            "id": "reply-id-123",
            "content": "감사합니다!",
            "createdAt": "2025-08-20T10:35:00Z",
            "user": {
              "name": "크리에이터"
            }
          }
        ]
      }
    ]
  }
}
```

### POST `/videos/{videoId}/comments`
댓글 작성

**헤더**: `Authorization: Bearer {token}`

**요청**:
```json
{
  "content": "좋은 영상이네요!",
  "parentId": null  // 대댓글인 경우 부모 댓글 ID
}
```

### POST `/comments/{commentId}/like`
댓글 좋아요

### DELETE `/comments/{commentId}`
댓글 삭제

---

## 📊 분석 (Analytics)

### GET `/analytics/channel/overview`
채널 분석 개요

**헤더**: `Authorization: Bearer {token}`

**쿼리 파라미터**:
- `period`: 기간 (7d, 30d, 90d)

**응답**:
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "totalViews": 50000,
    "totalWatchTime": 150000,
    "subscriberGrowth": 150,
    "averageViewDuration": 180,
    "topVideos": [
      {
        "id": "video-id-123",
        "title": "인기 비디오",
        "views": 5000,
        "watchTime": 15000
      }
    ]
  }
}
```

### GET `/analytics/revenue`
수익 분석

**응답**:
```json
{
  "success": true,
  "data": {
    "totalEarnings": 500000,
    "superChatEarnings": 300000,
    "adEarnings": 200000,
    "monthlyEarnings": [
      { "month": "2025-07", "amount": 150000 },
      { "month": "2025-08", "amount": 200000 }
    ]
  }
}
```

---

## 🔍 검색 (Search)

### GET `/search`
통합 검색

**쿼리 파라미터**:
- `q`: 검색어
- `type`: 검색 타입 (all, videos, channels, users)
- `category`: 카테고리 필터

**응답**:
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "video-id-123",
        "title": "검색 결과 비디오",
        "thumbnailUrl": "https://storage.one-q.xyz/thumbnails/thumb.jpg",
        "channel": {
          "name": "채널명"
        },
        "viewCount": 1000
      }
    ],
    "channels": [
      {
        "id": "channel-id-123",
        "name": "검색된 채널",
        "subscriberCount": 5000
      }
    ]
  }
}
```

---

## 🔔 알림 (Notifications)

### GET `/notifications`
알림 목록 조회

**헤더**: `Authorization: Bearer {token}`

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-id-123",
      "type": "new_subscriber",
      "title": "새로운 구독자",
      "message": "홍길동님이 구독했습니다",
      "readAt": null,
      "createdAt": "2025-08-20T14:00:00Z"
    }
  ]
}
```

### POST `/notifications/{notificationId}/read`
알림 읽음 처리

---

## ⚙️ 관리자 API (Admin)

### GET `/admin/users`
사용자 관리

**헤더**: `Authorization: Bearer {admin-token}`

### GET `/admin/reports`
신고 관리

### POST `/admin/content/{videoId}/moderate`
콘텐츠 모더레이션

---

## 🚨 에러 응답

모든 API는 다음과 같은 에러 응답 형식을 사용합니다:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 유효하지 않습니다",
    "details": {
      "email": "유효한 이메일 주소를 입력해주세요"
    }
  }
}
```

### 주요 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `UNAUTHORIZED` | 401 | 인증이 필요함 |
| `FORBIDDEN` | 403 | 권한이 없음 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `VALIDATION_ERROR` | 400 | 입력 데이터 오류 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

---

## 📏 API 제한사항

### 요청 제한 (Rate Limiting)
- **인증된 사용자**: 분당 100회
- **비인증 사용자**: 분당 20회
- **업로드 API**: 시간당 10회

### 파일 업로드 제한
- **최대 파일 크기**: 50GB
- **지원 형식**: MP4, MOV, AVI, MKV, WebM
- **동시 업로드**: 사용자당 5개

---

## 🔌 WebSocket API

### 실시간 채팅
```javascript
const ws = new WebSocket('wss://main.one-q.xyz/ws/chat/stream-id-123');

// 메시지 전송
ws.send(JSON.stringify({
  type: 'message',
  content: '안녕하세요!',
  token: 'jwt-token'
}));

// 메시지 수신
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('새 메시지:', message);
};
```

### 라이브 스트림 상태
```javascript
const ws = new WebSocket('wss://main.one-q.xyz/ws/stream/stream-id-123');

// 시청자 수, 스트림 상태 실시간 업데이트
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'viewer_count') {
    updateViewerCount(data.count);
  }
};
```

---

**🔗 API 활용 팁**: **토큰 만료 체크**, **에러 핸들링**, **적절한 캐싱**, **Rate Limiting 고려**

**📝 마지막 업데이트**: 2025-08-20  
**📋 API 버전**: v1.0