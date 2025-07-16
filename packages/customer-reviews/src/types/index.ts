export interface Review {
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

export interface ReviewPhoto {
  id: string;
  reviewId: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  order: number;
  uploadedAt: Date;
}

export interface ReviewSummary {
  productId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: RatingDistribution;
  recommendationRate: number;
  verifiedPurchaseRate: number;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ReviewFilter {
  rating?: number;
  isVerifiedPurchase?: boolean;
  isRecommended?: boolean;
  hasPhotos?: boolean;
  sortBy?: ReviewSortBy;
  sortOrder?: 'asc' | 'desc';
}

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  reviewsLastMonth: number;
  ratingTrend: number;
  topKeywords: string[];
  sentimentAnalysis: SentimentAnalysis;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  HIDDEN = 'hidden'
}

export enum ReviewSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  HIGHEST_RATED = 'highest_rated',
  LOWEST_RATED = 'lowest_rated',
  MOST_HELPFUL = 'most_helpful'
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title: string;
  content: string;
  isRecommended?: boolean;
  photos?: File[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
  isRecommended?: boolean;
}

export interface ReviewModerationRequest {
  reviewId: string;
  status: ReviewStatus;
  moderationNotes?: string;
}

export interface ReviewHelpfulRequest {
  reviewId: string;
  isHelpful: boolean;
}

// Component Props Types
export interface ReviewListProps {
  productId?: string;
  userId?: string;
  filter?: ReviewFilter;
  limit?: number;
  showPagination?: boolean;
  className?: string;
}

export interface ReviewCardProps {
  review: Review;
  showProduct?: boolean;
  onHelpful?: (reviewId: string, isHelpful: boolean) => void;
  className?: string;
}

export interface ReviewFormProps {
  productId: string;
  onSubmit: (data: CreateReviewRequest) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export interface ReviewStatsProps {
  summary: ReviewSummary;
  className?: string;
}

export interface PhotoUploadProps {
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  className?: string;
}

export interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export interface ReviewFilterProps {
  filter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  className?: string;
}

export interface ReviewModerationProps {
  reviews: Review[];
  onModerate: (request: ReviewModerationRequest) => Promise<void>;
  className?: string;
}

export interface ReviewAnalyticsProps {
  analytics: ReviewAnalytics;
  className?: string;
}