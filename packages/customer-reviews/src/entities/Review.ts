import { Review as IReview, ReviewStatus } from '../types';

export class Review implements IReview {
  public readonly id: string;
  public readonly userId: string;
  public readonly productId: string;
  public rating: number;
  public title: string;
  public content: string;
  public photos?: Array<{
    id: string;
    reviewId: string;
    url: string;
    thumbnailUrl: string;
    alt: string;
    order: number;
    uploadedAt: Date;
  }>;
  public readonly isVerifiedPurchase: boolean;
  public isRecommended?: boolean;
  public helpfulCount: number;
  public status: ReviewStatus;
  public moderationNotes?: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(data: IReview) {
    this.id = data.id;
    this.userId = data.userId;
    this.productId = data.productId;
    this.rating = data.rating;
    this.title = data.title;
    this.content = data.content;
    this.photos = data.photos;
    this.isVerifiedPurchase = data.isVerifiedPurchase;
    this.isRecommended = data.isRecommended;
    this.helpfulCount = data.helpfulCount;
    this.status = data.status;
    this.moderationNotes = data.moderationNotes;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public updateRating(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    this.rating = rating;
    this.updatedAt = new Date();
  }

  public updateContent(title: string, content: string): void {
    if (!title.trim() || !content.trim()) {
      throw new Error('Title and content cannot be empty');
    }
    this.title = title;
    this.content = content;
    this.updatedAt = new Date();
  }

  public setRecommendation(isRecommended: boolean): void {
    this.isRecommended = isRecommended;
    this.updatedAt = new Date();
  }

  public moderate(status: ReviewStatus, notes?: string): void {
    this.status = status;
    this.moderationNotes = notes;
    this.updatedAt = new Date();
  }

  public incrementHelpful(): void {
    this.helpfulCount++;
    this.updatedAt = new Date();
  }

  public decrementHelpful(): void {
    if (this.helpfulCount > 0) {
      this.helpfulCount--;
      this.updatedAt = new Date();
    }
  }

  public canBeModified(): boolean {
    return this.status === ReviewStatus.PENDING || this.status === ReviewStatus.APPROVED;
  }

  public isVisible(): boolean {
    return this.status === ReviewStatus.APPROVED;
  }

  public toJSON(): IReview {
    return {
      id: this.id,
      userId: this.userId,
      productId: this.productId,
      rating: this.rating,
      title: this.title,
      content: this.content,
      photos: this.photos,
      isVerifiedPurchase: this.isVerifiedPurchase,
      isRecommended: this.isRecommended,
      helpfulCount: this.helpfulCount,
      status: this.status,
      moderationNotes: this.moderationNotes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}