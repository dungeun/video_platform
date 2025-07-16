# Customer Reviews Module

상품 리뷰 관리를 위한 종합적인 모듈입니다. 평점 시스템, 사진 리뷰, 리뷰 검토, 분석 기능, 필터링 기능을 제공합니다.

## 주요 기능

### 리뷰 관리 (Review Management)
- ✅ 리뷰 생성, 수정, 삭제 (CRUD)
- ✅ 리뷰 상태 관리 (대기, 승인, 거부, 숨김)
- ✅ 리뷰 도움됨 기능
- ✅ 검증된 구매 여부 표시

### 평점 시스템 (Rating System)
- ✅ 1-5점 평점 시스템
- ✅ 평균 평점 계산
- ✅ 평점 분포 통계
- ✅ 인터랙티브 별점 컴포넌트

### 사진 리뷰 (Photo Reviews)
- ✅ 리뷰별 최대 5장 사진 업로드
- ✅ 이미지 최적화 및 썸네일 생성
- ✅ 사진 미리보기 및 삭제
- ✅ 파일 유효성 검증

### 리뷰 검토 (Review Moderation)
- ✅ 자동 콘텐츠 필터링
- ✅ 수동 검토 시스템
- ✅ 부적절한 콘텐츠 감지
- ✅ 검토 상태 및 노트 관리

### 리뷰 분석 (Review Analytics)
- ✅ 상품별 리뷰 통계
- ✅ 평점 추세 분석
- ✅ 감정 분석
- ✅ 키워드 분석

### 리뷰 필터링 (Review Filtering)
- ✅ 평점별 필터링
- ✅ 검증된 구매 필터
- ✅ 사진 포함 리뷰 필터
- ✅ 정렬 옵션 (최신순, 평점순, 도움됨순)

## 설치

```bash
npm install @repo/customer-reviews
```

## 의존성

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@repo/core": "workspace:*",
    "@repo/types": "workspace:*",
    "@repo/utils": "workspace:*"
  }
}
```

## 사용법

### 기본 사용법

```tsx
import {
  ReviewService,
  ReviewList,
  ReviewForm,
  RatingStars,
  useReviews
} from '@repo/customer-reviews';

// 리뷰 서비스 초기화
const reviewService = new ReviewService(
  reviewRepository,
  summaryRepository,
  validator,
  eventEmitter
);

// 리뷰 목록 컴포넌트
function ProductReviews({ productId }: { productId: string }) {
  return (
    <ReviewList
      productId={productId}
      reviewService={reviewService}
      currentUserId="user-123"
      showPagination={true}
    />
  );
}

// 리뷰 작성 컴포넌트
function WriteReview({ productId }: { productId: string }) {
  const handleSubmit = async (data) => {
    await reviewService.createReview({
      ...data,
      userId: 'current-user-id'
    });
  };

  return (
    <ReviewForm
      productId={productId}
      onSubmit={handleSubmit}
    />
  );
}
```

### 커스텀 훅 사용

```tsx
import { useReviews, useReviewAnalytics } from '@repo/customer-reviews';

function ProductPage({ productId }: { productId: string }) {
  const {
    reviews,
    loading,
    error,
    createReview,
    markHelpful
  } = useReviews(reviewService, {
    productId,
    autoLoad: true,
    filter: { sortBy: 'newest' }
  });

  const {
    analytics,
    loading: analyticsLoading
  } = useReviewAnalytics(analyticsService, {
    productId,
    autoLoad: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Reviews ({analytics?.totalReviews})</h2>
      <RatingStars rating={analytics?.averageRating || 0} />
      {/* 리뷰 목록 렌더링 */}
    </div>
  );
}
```

### 필터링 및 정렬

```tsx
import { ReviewFilter, ReviewSortBy } from '@repo/customer-reviews';

const filter: ReviewFilter = {
  rating: 5,                    // 5점 리뷰만
  isVerifiedPurchase: true,     // 검증된 구매만
  hasPhotos: true,              // 사진 포함 리뷰만
  sortBy: ReviewSortBy.MOST_HELPFUL,
  sortOrder: 'desc'
};

<ReviewList
  productId={productId}
  filter={filter}
  reviewService={reviewService}
/>
```

### 리뷰 분석

```tsx
import { AnalyticsService } from '@repo/customer-reviews';

const analyticsService = new AnalyticsService(
  reviewRepository,
  analyticsRepository
);

// 상품별 분석
const analytics = await analyticsService.getProductAnalytics(productId);

// 전체 분석
const overallAnalytics = await analyticsService.getOverallAnalytics();

// 최고 평점 상품
const topProducts = await analyticsService.getTopProducts(10);
```

## API 레퍼런스

### 서비스 클래스

#### ReviewService
- `createReview(data)`: 새 리뷰 생성
- `getReview(id)`: 리뷰 조회
- `updateReview(id, userId, data)`: 리뷰 수정
- `deleteReview(id, userId)`: 리뷰 삭제
- `markReviewHelpful(reviewId, userId, isHelpful)`: 도움됨 표시
- `moderateReview(reviewId, status, notes)`: 리뷰 검토

#### PhotoService
- `uploadReviewPhotos(reviewId, files)`: 사진 업로드
- `removeReviewPhotos(reviewId, photoIds)`: 사진 삭제
- `optimizePhoto(file)`: 사진 최적화
- `generatePhotoPreview(file)`: 미리보기 생성

#### AnalyticsService
- `getProductAnalytics(productId, dateRange)`: 상품 분석
- `getOverallAnalytics(dateRange)`: 전체 분석
- `getTopProducts(limit)`: 인기 상품
- `getRatingTrendData(productId, period)`: 평점 추세

### 컴포넌트

#### ReviewList
- `productId`: 상품 ID
- `userId`: 사용자 ID (선택)
- `filter`: 필터 옵션
- `limit`: 페이지당 개수
- `showPagination`: 페이지네이션 표시 여부

#### ReviewForm
- `productId`: 상품 ID
- `onSubmit`: 제출 핸들러
- `onCancel`: 취소 핸들러

#### RatingStars
- `rating`: 평점 (0-5)
- `size`: 크기 ('sm', 'md', 'lg')
- `interactive`: 클릭 가능 여부
- `onRatingChange`: 평점 변경 핸들러

### 훅

#### useReviews
```tsx
const {
  reviews,           // 리뷰 목록
  loading,           // 로딩 상태
  error,             // 에러 메시지
  total,             // 전체 리뷰 수
  hasMore,           // 더 불러올 리뷰 있음
  loadReviews,       // 리뷰 로드
  loadMore,          // 추가 로드
  createReview,      // 리뷰 생성
  updateReview,      // 리뷰 수정
  deleteReview,      // 리뷰 삭제
  markHelpful,       // 도움됨 표시
  refresh            // 새로고침
} = useReviews(reviewService, options);
```

#### useReviewAnalytics
```tsx
const {
  analytics,         // 분석 데이터
  loading,           // 로딩 상태
  error,             // 에러 메시지
  loadAnalytics,     // 분석 로드
  refresh            // 새로고침
} = useReviewAnalytics(analyticsService, options);
```

## 타입 정의

### 주요 인터페이스

```typescript
interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string;
  content: string;
  photos?: ReviewPhoto[];
  isVerifiedPurchase: boolean;
  isRecommended?: boolean;
  helpfulCount: number;
  status: ReviewStatus;
  moderationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewSummary {
  productId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: RatingDistribution;
  recommendationRate: number;
  verifiedPurchaseRate: number;
}

interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  reviewsLastMonth: number;
  ratingTrend: number;
  topKeywords: string[];
  sentimentAnalysis: SentimentAnalysis;
}
```

## 개발

### 빌드

```bash
npm run build
```

### 테스트

```bash
npm test
npm run test:watch
npm run test:ui
```

### 타입 검사

```bash
npm run type-check
```

## 아키텍처

### 레이어 구조
- **Presentation Layer**: React 컴포넌트, 훅
- **Business Logic Layer**: 서비스 클래스, 엔티티
- **Data Access Layer**: 레포지토리 인터페이스
- **Infrastructure Layer**: 외부 서비스 연동

### 디자인 패턴
- **Repository Pattern**: 데이터 접근 추상화
- **Service Layer Pattern**: 비즈니스 로직 캡슐화
- **Observer Pattern**: 이벤트 기반 아키텍처
- **Strategy Pattern**: 다양한 정렬/필터링 전략

## 라이센스

MIT

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request