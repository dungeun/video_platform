import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Review } from '../src/entities/Review';
import { ReviewSummary } from '../src/entities/ReviewSummary';
import { ReviewValidator } from '../src/validators/ReviewValidator';
import { ReviewStatus } from '../src/types';

describe('Customer Reviews Module', () => {
  describe('Review Entity', () => {
    let reviewData: any;

    beforeEach(() => {
      reviewData = {
        id: 'review-1',
        userId: 'user-1',
        productId: 'product-1',
        rating: 4,
        title: 'Great product!',
        content: 'I really enjoyed using this product. Highly recommended.',
        isVerifiedPurchase: true,
        isRecommended: true,
        helpfulCount: 5,
        status: ReviewStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    it('should create a review instance', () => {
      const review = new Review(reviewData);
      
      expect(review.id).toBe(reviewData.id);
      expect(review.rating).toBe(reviewData.rating);
      expect(review.title).toBe(reviewData.title);
      expect(review.content).toBe(reviewData.content);
    });

    it('should update rating correctly', () => {
      const review = new Review(reviewData);
      const originalUpdatedAt = review.updatedAt;
      
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);
      
      review.updateRating(5);
      
      expect(review.rating).toBe(5);
      expect(review.updatedAt).not.toEqual(originalUpdatedAt);
      
      vi.useRealTimers();
    });

    it('should throw error for invalid rating', () => {
      const review = new Review(reviewData);
      
      expect(() => review.updateRating(0)).toThrow('Rating must be between 1 and 5');
      expect(() => review.updateRating(6)).toThrow('Rating must be between 1 and 5');
    });

    it('should update content correctly', () => {
      const review = new Review(reviewData);
      const newTitle = 'Updated title';
      const newContent = 'Updated content with more details about the product.';
      
      review.updateContent(newTitle, newContent);
      
      expect(review.title).toBe(newTitle);
      expect(review.content).toBe(newContent);
    });

    it('should throw error for empty content', () => {
      const review = new Review(reviewData);
      
      expect(() => review.updateContent('', 'content')).toThrow('Title and content cannot be empty');
      expect(() => review.updateContent('title', '')).toThrow('Title and content cannot be empty');
    });

    it('should moderate review correctly', () => {
      const review = new Review(reviewData);
      const moderationNotes = 'Approved after review';
      
      review.moderate(ReviewStatus.APPROVED, moderationNotes);
      
      expect(review.status).toBe(ReviewStatus.APPROVED);
      expect(review.moderationNotes).toBe(moderationNotes);
    });

    it('should increment helpful count', () => {
      const review = new Review(reviewData);
      const originalCount = review.helpfulCount;
      
      review.incrementHelpful();
      
      expect(review.helpfulCount).toBe(originalCount + 1);
    });

    it('should decrement helpful count but not go below zero', () => {
      const review = new Review({ ...reviewData, helpfulCount: 1 });
      
      review.decrementHelpful();
      expect(review.helpfulCount).toBe(0);
      
      review.decrementHelpful();
      expect(review.helpfulCount).toBe(0);
    });

    it('should check if review can be modified', () => {
      const pendingReview = new Review({ ...reviewData, status: ReviewStatus.PENDING });
      const approvedReview = new Review({ ...reviewData, status: ReviewStatus.APPROVED });
      const rejectedReview = new Review({ ...reviewData, status: ReviewStatus.REJECTED });
      
      expect(pendingReview.canBeModified()).toBe(true);
      expect(approvedReview.canBeModified()).toBe(true);
      expect(rejectedReview.canBeModified()).toBe(false);
    });

    it('should check if review is visible', () => {
      const approvedReview = new Review({ ...reviewData, status: ReviewStatus.APPROVED });
      const pendingReview = new Review({ ...reviewData, status: ReviewStatus.PENDING });
      
      expect(approvedReview.isVisible()).toBe(true);
      expect(pendingReview.isVisible()).toBe(false);
    });
  });

  describe('ReviewSummary Entity', () => {
    let summaryData: any;

    beforeEach(() => {
      summaryData = {
        productId: 'product-1',
        totalReviews: 10,
        averageRating: 4.2,
        ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 },
        recommendationRate: 80,
        verifiedPurchaseRate: 90,
      };
    });

    it('should create a summary instance', () => {
      const summary = new ReviewSummary(summaryData);
      
      expect(summary.productId).toBe(summaryData.productId);
      expect(summary.totalReviews).toBe(summaryData.totalReviews);
      expect(summary.averageRating).toBe(summaryData.averageRating);
    });

    it('should update from reviews array', () => {
      const summary = new ReviewSummary(summaryData);
      const reviews = [
        { rating: 5, isRecommended: true, isVerifiedPurchase: true },
        { rating: 4, isRecommended: true, isVerifiedPurchase: false },
        { rating: 3, isRecommended: false, isVerifiedPurchase: true },
      ];
      
      summary.updateFromReviews(reviews);
      
      expect(summary.totalReviews).toBe(3);
      expect(summary.averageRating).toBe(4.0);
      expect(summary.ratingDistribution[5]).toBe(1);
      expect(summary.ratingDistribution[4]).toBe(1);
      expect(summary.ratingDistribution[3]).toBe(1);
    });

    it('should calculate rating percentage correctly', () => {
      const summary = new ReviewSummary(summaryData);
      
      expect(summary.getRatingPercentage(5)).toBe(40); // 4 out of 10
      expect(summary.getRatingPercentage(1)).toBe(0);  // 0 out of 10
    });

    it('should get most common rating', () => {
      const summary = new ReviewSummary(summaryData);
      
      expect(summary.getMostCommonRating()).toBe(5); // 4 reviews with 5 stars
    });

    it('should calculate quality score', () => {
      const summary = new ReviewSummary(summaryData);
      
      const score = summary.getQualityScore();
      expect(score).toBeGreaterThan(80); // Should be around 84-85
      expect(score).toBeLessThan(100);
    });
  });

  describe('ReviewValidator', () => {
    let validator: ReviewValidator;

    beforeEach(() => {
      validator = new ReviewValidator();
    });

    it('should validate correct create request', async () => {
      const validData = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 4,
        title: 'Great product',
        content: 'This is a detailed review of the product with enough content.',
      };

      await expect(validator.validateCreateRequest(validData)).resolves.not.toThrow();
    });

    it('should reject invalid rating', async () => {
      const invalidData = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 0,
        title: 'Title',
        content: 'Valid content here',
      };

      await expect(validator.validateCreateRequest(invalidData)).rejects.toThrow('Rating must be an integer between 1 and 5');
    });

    it('should reject empty title', async () => {
      const invalidData = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 4,
        title: '',
        content: 'Valid content here',
      };

      await expect(validator.validateCreateRequest(invalidData)).rejects.toThrow('Title cannot be empty');
    });

    it('should reject short content', async () => {
      const invalidData = {
        userId: 'user-1',
        productId: 'product-1',
        rating: 4,
        title: 'Title',
        content: 'Short',
      };

      await expect(validator.validateCreateRequest(invalidData)).rejects.toThrow('Content must be at least 10 characters long');
    });

    it('should validate rating correctly', () => {
      expect(validator.validateRating(1)).toBe(true);
      expect(validator.validateRating(5)).toBe(true);
      expect(validator.validateRating(3.5)).toBe(false);
      expect(validator.validateRating(0)).toBe(false);
      expect(validator.validateRating(6)).toBe(false);
    });

    it('should validate search query correctly', () => {
      expect(validator.validateSearchQuery('ab')).toBe(true);
      expect(validator.validateSearchQuery('valid search')).toBe(true);
      expect(validator.validateSearchQuery('a')).toBe(false);
      expect(validator.validateSearchQuery('')).toBe(false);
    });

    it('should sanitize content correctly', () => {
      const dirtyContent = '  Multiple   spaces   and@#$%special   chars  ';
      const sanitized = validator.sanitizeContent(dirtyContent);
      
      expect(sanitized).toBe('Multiple spaces andspecial chars');
    });
  });
});