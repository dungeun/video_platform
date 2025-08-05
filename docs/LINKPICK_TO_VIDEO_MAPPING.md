# 🔄 LinkPick → VideoPlatform 전환 매핑

## 📁 페이지별 전환 계획

### 1. 메인 페이지
| 현재 (LinkPick) | 변환 후 (VideoPlatform) | 상태 |
|----------------|------------------------|------|
| `/` (캠페인 리스트) | `/` (비디오 피드) | 🔄 변환 필요 |
| `/campaigns` | `/videos` | ✅ 이미 존재 |
| `/campaigns/[id]` | `/videos/[id]` | ✅ 이미 존재 |
| `/campaigns/new` | `/studio/upload` | ✅ 이미 존재 |

### 2. 비즈니스 → 크리에이터
| 현재 (LinkPick) | 변환 후 (VideoPlatform) | 상태 |
|----------------|------------------------|------|
| `/business/dashboard` | `/studio/dashboard` | 🔄 변환 필요 |
| `/business/campaigns` | `/studio/videos` | 🔄 변환 필요 |
| `/business/campaigns/new` | `/studio/upload` | ✅ 리다이렉트 |
| `/business/applications` | `/studio/analytics` | 🔄 변환 필요 |
| `/business/content/[id]` | `/studio/videos/[id]` | 🔄 변환 필요 |

### 3. 인플루언서 → 시청자
| 현재 (LinkPick) | 변환 후 (VideoPlatform) | 상태 |
|----------------|------------------------|------|
| `/influencer/campaigns` | `/my/history` | 🔄 변환 필요 |
| `/influencer/earnings` | `/my/watch-time` | 🔄 변환 필요 |
| `/influencer/applications` | `/my/subscriptions` | 🔄 변환 필요 |
| `/mypage` | `/my/profile` | 🔄 변환 필요 |

### 4. 관리자 (변경 없음)
| 현재 (LinkPick) | 변환 후 (VideoPlatform) | 상태 |
|----------------|------------------------|------|
| `/admin/*` | `/admin/*` | ✅ 유지 |

## 🔄 API 엔드포인트 매핑

### 1. 캠페인 → 비디오
| 현재 API | 변환 후 API | 상태 |
|----------|------------|------|
| `/api/campaigns` | `/api/videos` | ✅ 이미 존재 |
| `/api/campaigns/[id]` | `/api/videos/[id]` | ✅ 이미 존재 |
| `/api/campaigns/[id]/applications` | `/api/videos/[id]/comments` | 🔄 변환 필요 |
| `/api/campaigns/[id]/like` | `/api/videos/[id]/like` | ✅ 이미 존재 |

### 2. 비즈니스 → 스튜디오
| 현재 API | 변환 후 API | 상태 |
|----------|------------|------|
| `/api/business/campaigns` | `/api/studio/videos` | 🔄 변환 필요 |
| `/api/business/stats` | `/api/studio/analytics` | 🔄 변환 필요 |
| `/api/business/video-stats` | `/api/studio/video-stats` | ✅ 재사용 가능 |

### 3. 인플루언서 → 시청자
| 현재 API | 변환 후 API | 상태 |
|----------|------------|------|
| `/api/influencer/applications` | `/api/viewer/history` | 🔄 변환 필요 |
| `/api/influencer/stats` | `/api/viewer/stats` | 🔄 변환 필요 |
| `/api/influencer/saved-campaigns` | `/api/viewer/liked-videos` | 🔄 변환 필요 |

## 🧩 컴포넌트 매핑

### 1. 비즈니스 컴포넌트
| 현재 컴포넌트 | 변환 후 | 변경사항 |
|--------------|---------|---------|
| `CampaignManagementTab` | `VideoManagementTab` | ✅ 이미 존재 |
| `ApplicantManagementTab` | `AnalyticsTab` | 신청자 → 시청자 분석 |
| `CampaignCard` | `VideoCard` | ✅ 이미 존재 |
| `CampaignForm` | `VideoUploadForm` | 필드 변경 필요 |

### 2. 홈페이지 섹션
| 현재 섹션 | 변환 후 | 용도 |
|----------|---------|-----|
| `hero` | `featured-videos` | 추천 비디오 |
| `recommended` | `trending` | 인기 비디오 |
| `new` | `latest` | 최신 비디오 |
| `category` | `categories` | 카테고리별 비디오 |
| `ranking` | `top-channels` | 인기 채널 |

## 📊 데이터베이스 매핑

### 1. 테이블 매핑
```sql
-- 기존 테이블 → 새 테이블 (또는 뷰)
Campaign → Video (뷰로 생성됨)
CampaignApplication → VideoEngagement
Business → Channel
BusinessProfile → ChannelProfile
Influencer → Viewer
Settlement → Revenue
```

### 2. 필드 매핑
```typescript
// Campaign → Video
{
  title: title,
  description: description,
  imageUrl: thumbnailUrl,
  businessId: channelId,
  applicationCount: viewCount,
  // 새 필드
  videoUrl: null,
  duration: 0,
  likes: 0,
  dislikes: 0
}
```

## 🎨 UI/UX 변경사항

### 1. 네비게이션 메뉴
**현재:**
- 캠페인 둘러보기
- 비즈니스
- 인플루언서
- 커뮤니티

**변환 후:**
- 홈
- 인기
- 구독
- 라이브
- 스튜디오

### 2. 사용자 타입
**현재:**
- ADMIN
- BUSINESS
- INFLUENCER

**변환 후:**
- ADMIN
- CREATOR
- VIEWER

### 3. 주요 용어
| LinkPick | VideoPlatform |
|----------|---------------|
| 캠페인 | 비디오/콘텐츠 |
| 신청 | 구독/좋아요 |
| 비즈니스 | 크리에이터/채널 |
| 인플루언서 | 시청자 |
| 신청자 수 | 조회수 |
| 정산 | 수익 |

## 🚦 실행 우선순위

### 즉시 (오늘)
1. ✅ 홈페이지를 비디오 피드로 전환
2. ✅ Header 네비게이션 메뉴 변경
3. ✅ 기본 용어 일괄 변경
4. 🆕 **Redis 제거** - 캐싱 시스템 단순화

### 단기 (1주 내)
1. 🔄 비즈니스 → 스튜디오 페이지 전환
2. 🔄 API 엔드포인트 리매핑
3. 🔄 사용자 타입 변경
4. 🔄 Redis 완전 제거 및 대체 구현

### 중기 (2-3주)
1. 📋 비디오 플레이어 통합
2. 📋 실시간 기능 추가
3. 📋 추천 시스템 구현

### 장기 (1개월+)
1. 📅 라이브 스트리밍
2. 📅 고급 분석 도구
3. 📅 수익화 시스템

## 🔧 기술 스택 변경사항

### 제거할 기술
- **Redis**: 캐싱 시스템 제거
  - 메모리 캐시로 대체
  - 세션은 JWT 사용 (이미 구현)
  - 필요시 데이터베이스 캐싱 고려

### 유지할 기술
- **PostgreSQL**: 메인 데이터베이스
- **Prisma**: ORM
- **Next.js 14**: 프레임워크
- **JWT**: 인증 시스템