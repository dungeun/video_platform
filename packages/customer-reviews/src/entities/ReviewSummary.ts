import { ReviewSummary as IReviewSummary, RatingDistribution } from '../types';

export class ReviewSummary implements IReviewSummary {
  public readonly productId: string;
  public totalReviews: number;
  public averageRating: number;
  public ratingDistribution: RatingDistribution;
  public recommendationRate: number;
  public verifiedPurchaseRate: number;

  constructor(data: IReviewSummary) {
    this.productId = data.productId;
    this.totalReviews = data.totalReviews;
    this.averageRating = data.averageRating;
    this.ratingDistribution = data.ratingDistribution;
    this.recommendationRate = data.recommendationRate;
    this.verifiedPurchaseRate = data.verifiedPurchaseRate;
  }

  public updateFromReviews(reviews: Array<{
    rating: number;
    isRecommended?: boolean;
    isVerifiedPurchase: boolean;
  }>): void {
    this.totalReviews = reviews.length;
    
    if (reviews.length === 0) {
      this.averageRating = 0;
      this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      this.recommendationRate = 0;
      this.verifiedPurchaseRate = 0;
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = Number((totalRating / reviews.length).toFixed(1));

    // Calculate rating distribution
    this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      this.ratingDistribution[review.rating as keyof RatingDistribution]++;
    });

    // Calculate recommendation rate
    const recommendedReviews = reviews.filter(review => review.isRecommended === true);
    this.recommendationRate = Number(((recommendedReviews.length / reviews.length) * 100).toFixed(1));

    // Calculate verified purchase rate
    const verifiedReviews = reviews.filter(review => review.isVerifiedPurchase);
    this.verifiedPurchaseRate = Number(((verifiedReviews.length / reviews.length) * 100).toFixed(1));
  }

  public getRatingPercentage(rating: number): number {
    if (this.totalReviews === 0) return 0;
    return Number(((this.ratingDistribution[rating as keyof RatingDistribution] / this.totalReviews) * 100).toFixed(1));
  }

  public getMostCommonRating(): number {
    let maxCount = 0;
    let mostCommonRating = 5;

    Object.entries(this.ratingDistribution).forEach(([rating, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonRating = parseInt(rating);
      }
    });

    return mostCommonRating;
  }

  public getQualityScore(): number {
    // Calculate a quality score based on average rating and review count
    const ratingScore = (this.averageRating / 5) * 100;
    const volumeBonus = Math.min(this.totalReviews / 100, 1) * 10; // Max 10% bonus for review volume
    
    return Number((ratingScore + volumeBonus).toFixed(1));
  }

  public toJSON(): IReviewSummary {
    return {
      productId: this.productId,
      totalReviews: this.totalReviews,
      averageRating: this.averageRating,
      ratingDistribution: this.ratingDistribution,
      recommendationRate: this.recommendationRate,
      verifiedPurchaseRate: this.verifiedPurchaseRate,
    };
  }
}