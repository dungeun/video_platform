import { Review, ReviewSummary, ReviewFilter, CreateReviewRequest, UpdateReviewRequest, ReviewAnalytics } from '../types';

export interface IReviewRepository {
  // Basic CRUD operations
  create(data: CreateReviewRequest & { userId: string }): Promise<Review>;
  findById(id: string): Promise<Review | null>;
  findByProductId(productId: string, filter?: ReviewFilter): Promise<Review[]>;
  findByUserId(userId: string, filter?: ReviewFilter): Promise<Review[]>;
  update(id: string, data: UpdateReviewRequest): Promise<Review>;
  delete(id: string): Promise<void>;
  
  // Filtering and pagination
  findWithFilter(filter: ReviewFilter, limit?: number, offset?: number): Promise<Review[]>;
  count(filter?: ReviewFilter): Promise<number>;
  
  // Photo operations
  addPhotos(reviewId: string, photos: Array<{ url: string; thumbnailUrl: string; alt: string; order: number }>): Promise<void>;
  removePhotos(reviewId: string, photoIds: string[]): Promise<void>;
  
  // Helpful operations
  markHelpful(reviewId: string, userId: string): Promise<void>;
  unmarkHelpful(reviewId: string, userId: string): Promise<void>;
  isMarkedHelpful(reviewId: string, userId: string): Promise<boolean>;
}

export interface IReviewSummaryRepository {
  findByProductId(productId: string): Promise<ReviewSummary | null>;
  update(productId: string, summary: ReviewSummary): Promise<void>;
  refresh(productId: string): Promise<ReviewSummary>;
}

export interface IReviewAnalyticsRepository {
  getProductAnalytics(productId: string, dateRange?: { start: Date; end: Date }): Promise<ReviewAnalytics>;
  getOverallAnalytics(dateRange?: { start: Date; end: Date }): Promise<ReviewAnalytics>;
  getTopProducts(limit?: number): Promise<Array<{ productId: string; analytics: ReviewAnalytics }>>;
  getTrendData(productId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<Array<{ date: Date; value: number }>>;
}