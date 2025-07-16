import { ReviewAnalytics, Review, ReviewSummary } from '../types';
import { IReviewRepository, IReviewAnalyticsRepository } from '../repositories/interfaces';

export class AnalyticsService {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly analyticsRepository: IReviewAnalyticsRepository
  ) {}

  async getProductAnalytics(productId: string, dateRange?: { start: Date; end: Date }): Promise<ReviewAnalytics> {
    return this.analyticsRepository.getProductAnalytics(productId, dateRange);
  }

  async getOverallAnalytics(dateRange?: { start: Date; end: Date }): Promise<ReviewAnalytics> {
    return this.analyticsRepository.getOverallAnalytics(dateRange);
  }

  async getTopProducts(limit = 10): Promise<Array<{ productId: string; analytics: ReviewAnalytics }>> {
    return this.analyticsRepository.getTopProducts(limit);
  }

  async getRatingTrendData(productId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<Array<{ date: Date; value: number }>> {
    return this.analyticsRepository.getTrendData(productId, period);
  }

  async calculateReviewVelocity(productId: string, days = 30): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const analytics = await this.analyticsRepository.getProductAnalytics(productId, {
      start: startDate,
      end: endDate,
    });

    return analytics.reviewsLastMonth / days; // Reviews per day
  }

  async getReviewDistributionByRating(productId: string): Promise<{ [rating: number]: number }> {
    const reviews = await this.reviewRepository.findByProductId(productId);
    
    const distribution: { [rating: number]: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return distribution;
  }

  async getReviewLengthAnalytics(productId: string): Promise<{
    averageLength: number;
    shortReviews: number; // < 50 characters
    mediumReviews: number; // 50-200 characters
    longReviews: number; // > 200 characters
  }> {
    const reviews = await this.reviewRepository.findByProductId(productId);
    
    if (reviews.length === 0) {
      return {
        averageLength: 0,
        shortReviews: 0,
        mediumReviews: 0,
        longReviews: 0,
      };
    }

    const totalLength = reviews.reduce((sum, review) => sum + review.content.length, 0);
    const averageLength = Math.round(totalLength / reviews.length);

    const shortReviews = reviews.filter(r => r.content.length < 50).length;
    const mediumReviews = reviews.filter(r => r.content.length >= 50 && r.content.length <= 200).length;
    const longReviews = reviews.filter(r => r.content.length > 200).length;

    return {
      averageLength,
      shortReviews,
      mediumReviews,
      longReviews,
    };
  }

  async getHelpfulnessAnalytics(productId: string): Promise<{
    averageHelpfulCount: number;
    topHelpfulReviews: Review[];
    helpfulnessDistribution: { [range: string]: number };
  }> {
    const reviews = await this.reviewRepository.findByProductId(productId);
    
    if (reviews.length === 0) {
      return {
        averageHelpfulCount: 0,
        topHelpfulReviews: [],
        helpfulnessDistribution: {},
      };
    }

    const totalHelpful = reviews.reduce((sum, review) => sum + review.helpfulCount, 0);
    const averageHelpfulCount = Math.round(totalHelpful / reviews.length);

    const topHelpfulReviews = reviews
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, 5);

    // Create helpfulness distribution
    const distribution: { [range: string]: number } = {
      '0': 0,
      '1-5': 0,
      '6-10': 0,
      '11-20': 0,
      '20+': 0,
    };

    reviews.forEach(review => {
      const count = review.helpfulCount;
      if (count === 0) distribution['0']++;
      else if (count <= 5) distribution['1-5']++;
      else if (count <= 10) distribution['6-10']++;
      else if (count <= 20) distribution['11-20']++;
      else distribution['20+']++;
    });

    return {
      averageHelpfulCount,
      topHelpfulReviews,
      helpfulnessDistribution: distribution,
    };
  }

  async getPhotoAnalytics(productId: string): Promise<{
    reviewsWithPhotos: number;
    reviewsWithoutPhotos: number;
    photoPercentage: number;
    averagePhotosPerReview: number;
  }> {
    const reviews = await this.reviewRepository.findByProductId(productId);
    
    if (reviews.length === 0) {
      return {
        reviewsWithPhotos: 0,
        reviewsWithoutPhotos: 0,
        photoPercentage: 0,
        averagePhotosPerReview: 0,
      };
    }

    const reviewsWithPhotos = reviews.filter(r => r.photos && r.photos.length > 0).length;
    const reviewsWithoutPhotos = reviews.length - reviewsWithPhotos;
    const photoPercentage = Math.round((reviewsWithPhotos / reviews.length) * 100);

    const totalPhotos = reviews.reduce((sum, review) => 
      sum + (review.photos?.length || 0), 0
    );
    const averagePhotosPerReview = Math.round((totalPhotos / reviews.length) * 100) / 100;

    return {
      reviewsWithPhotos,
      reviewsWithoutPhotos,
      photoPercentage,
      averagePhotosPerReview,
    };
  }

  async getVerificationAnalytics(productId: string): Promise<{
    verifiedReviews: number;
    unverifiedReviews: number;
    verificationPercentage: number;
    verifiedVsUnverifiedRating: {
      verified: number;
      unverified: number;
      difference: number;
    };
  }> {
    const reviews = await this.reviewRepository.findByProductId(productId);
    
    if (reviews.length === 0) {
      return {
        verifiedReviews: 0,
        unverifiedReviews: 0,
        verificationPercentage: 0,
        verifiedVsUnverifiedRating: {
          verified: 0,
          unverified: 0,
          difference: 0,
        },
      };
    }

    const verifiedReviews = reviews.filter(r => r.isVerifiedPurchase).length;
    const unverifiedReviews = reviews.length - verifiedReviews;
    const verificationPercentage = Math.round((verifiedReviews / reviews.length) * 100);

    // Calculate average ratings
    const verifiedRatingSum = reviews
      .filter(r => r.isVerifiedPurchase)
      .reduce((sum, r) => sum + r.rating, 0);
    const unverifiedRatingSum = reviews
      .filter(r => !r.isVerifiedPurchase)
      .reduce((sum, r) => sum + r.rating, 0);

    const verifiedAvg = verifiedReviews > 0 ? verifiedRatingSum / verifiedReviews : 0;
    const unverifiedAvg = unverifiedReviews > 0 ? unverifiedRatingSum / unverifiedReviews : 0;

    return {
      verifiedReviews,
      unverifiedReviews,
      verificationPercentage,
      verifiedVsUnverifiedRating: {
        verified: Math.round(verifiedAvg * 100) / 100,
        unverified: Math.round(unverifiedAvg * 100) / 100,
        difference: Math.round((verifiedAvg - unverifiedAvg) * 100) / 100,
      },
    };
  }
}