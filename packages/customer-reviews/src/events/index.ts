import { Review } from '../types';

export class ReviewCreatedEvent {
  public readonly type = 'review.created';
  public readonly timestamp = new Date();

  constructor(public readonly review: Review) {}
}

export class ReviewUpdatedEvent {
  public readonly type = 'review.updated';
  public readonly timestamp = new Date();

  constructor(public readonly review: Review) {}
}

export class ReviewDeletedEvent {
  public readonly type = 'review.deleted';
  public readonly timestamp = new Date();

  constructor(public readonly review: Review) {}
}

export class ReviewModeratedEvent {
  public readonly type = 'review.moderated';
  public readonly timestamp = new Date();

  constructor(
    public readonly review: Review,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly moderationNotes?: string
  ) {}
}

export class ReviewHelpfulEvent {
  public readonly type = 'review.helpful';
  public readonly timestamp = new Date();

  constructor(
    public readonly reviewId: string,
    public readonly userId: string,
    public readonly isHelpful: boolean
  ) {}
}

export class ReviewPhotoUploadedEvent {
  public readonly type = 'review.photo.uploaded';
  public readonly timestamp = new Date();

  constructor(
    public readonly reviewId: string,
    public readonly photoIds: string[]
  ) {}
}

export class ReviewPhotoDeletedEvent {
  public readonly type = 'review.photo.deleted';
  public readonly timestamp = new Date();

  constructor(
    public readonly reviewId: string,
    public readonly photoIds: string[]
  ) {}
}