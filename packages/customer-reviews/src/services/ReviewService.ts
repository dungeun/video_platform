import { 
  Review, 
  ReviewFilter, 
  CreateReviewRequest, 
  UpdateReviewRequest,
  ReviewStatus,
  ReviewSortBy
} from '../types';
import { IReviewRepository, IReviewSummaryRepository } from '../repositories/interfaces';
import { ReviewValidator } from '../validators/ReviewValidator';
import { ReviewCreatedEvent, ReviewUpdatedEvent, ReviewDeletedEvent } from '../events';

// Simple EventEmitter interface for now
interface EventEmitter {
  emit(event: string, data: any): void;
}

export class ReviewService {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly summaryRepository: IReviewSummaryRepository,
    private readonly validator: ReviewValidator,
    private readonly eventEmitter: EventEmitter
  ) {}

  async createReview(data: CreateReviewRequest & { userId: string }): Promise<Review> {
    // Validate review data
    await this.validator.validateCreateRequest(data);

    // Check if user already reviewed this product
    const existingReviews = await this.reviewRepository.findByUserId(data.userId, {
      // Add product filter logic here
    });
    
    const hasExistingReview = existingReviews.some(review => review.productId === data.productId);
    if (hasExistingReview) {
      throw new Error('User has already reviewed this product');
    }

    // Create review with proper typing
    const reviewData = {
      ...data,
      userId: data.userId,
      productId: data.productId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      isRecommended: data.isRecommended,
      photos: data.photos,
    };
    
    const review = await this.reviewRepository.create(reviewData);

    // Emit event
    this.eventEmitter.emit('review.created', new ReviewCreatedEvent(review));

    // Update product summary
    await this.updateProductSummary(data.productId);

    return review;
  }

  async getReview(id: string): Promise<Review | null> {
    return this.reviewRepository.findById(id);
  }

  async getProductReviews(productId: string, filter?: ReviewFilter): Promise<Review[]> {
    const defaultFilter = {
      ...filter,
      sortBy: filter?.sortBy || ReviewSortBy.NEWEST,
      sortOrder: filter?.sortOrder || 'desc',
    };

    return this.reviewRepository.findByProductId(productId, defaultFilter);
  }

  async getUserReviews(userId: string, filter?: ReviewFilter): Promise<Review[]> {
    return this.reviewRepository.findByUserId(userId, filter);
  }

  async updateReview(id: string, userId: string, data: UpdateReviewRequest): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Unauthorized to update this review');
    }

    if (!this.canModifyReview(review)) {
      throw new Error('Review cannot be modified in its current status');
    }

    // Validate update data
    await this.validator.validateUpdateRequest(data);

    const updatedReview = await this.reviewRepository.update(id, data);

    // Emit event
    this.eventEmitter.emit('review.updated', new ReviewUpdatedEvent(updatedReview));

    // Update product summary
    await this.updateProductSummary(review.productId);

    return updatedReview;
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Unauthorized to delete this review');
    }

    await this.reviewRepository.delete(id);

    // Emit event
    this.eventEmitter.emit('review.deleted', new ReviewDeletedEvent(review));

    // Update product summary
    await this.updateProductSummary(review.productId);
  }

  async markReviewHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId === userId) {
      throw new Error('Cannot mark your own review as helpful');
    }

    const wasAlreadyMarked = await this.reviewRepository.isMarkedHelpful(reviewId, userId);

    if (isHelpful && !wasAlreadyMarked) {
      await this.reviewRepository.markHelpful(reviewId, userId);
    } else if (!isHelpful && wasAlreadyMarked) {
      await this.reviewRepository.unmarkHelpful(reviewId, userId);
    }
  }

  async getReviewsWithFilter(filter: ReviewFilter, limit = 20, offset = 0): Promise<{
    reviews: Review[];
    total: number;
  }> {
    const [reviews, total] = await Promise.all([
      this.reviewRepository.findWithFilter(filter, limit, offset),
      this.reviewRepository.count(filter),
    ]);

    return { reviews, total };
  }

  async moderateReview(reviewId: string, status: ReviewStatus, moderationNotes?: string): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const updatedReview = await this.reviewRepository.update(reviewId, {
      title: review.title,
      content: review.content,
      rating: review.rating,
      isRecommended: review.isRecommended,
    });

    // Update product summary if status changed to/from approved
    if (status === ReviewStatus.APPROVED || review.status === ReviewStatus.APPROVED) {
      await this.updateProductSummary(review.productId);
    }

    return updatedReview;
  }

  private canModifyReview(review: Review): boolean {
    return review.status === ReviewStatus.PENDING || review.status === ReviewStatus.APPROVED;
  }

  private async updateProductSummary(productId: string): Promise<void> {
    try {
      await this.summaryRepository.refresh(productId);
    } catch (error) {
      console.error('Failed to update product summary:', error);
      // Don't throw - summary update failure shouldn't break the main operation
    }
  }
}