export class ReviewError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ReviewError';
  }
}

export class ReviewNotFoundError extends ReviewError {
  constructor(reviewId: string) {
    super(`Review with ID ${reviewId} not found`, 'REVIEW_NOT_FOUND');
    this.name = 'ReviewNotFoundError';
  }
}

export class ReviewValidationError extends ReviewError {
  constructor(message: string, public readonly validationErrors: string[]) {
    super(message, 'REVIEW_VALIDATION_ERROR');
    this.name = 'ReviewValidationError';
  }
}

export class ReviewPermissionError extends ReviewError {
  constructor(message: string = 'Insufficient permissions to perform this action') {
    super(message, 'REVIEW_PERMISSION_ERROR');
    this.name = 'ReviewPermissionError';
  }
}

export class ReviewModerationError extends ReviewError {
  constructor(message: string) {
    super(message, 'REVIEW_MODERATION_ERROR');
    this.name = 'ReviewModerationError';
  }
}

export class PhotoUploadError extends ReviewError {
  constructor(message: string) {
    super(message, 'PHOTO_UPLOAD_ERROR');
    this.name = 'PhotoUploadError';
  }
}

export class ReviewDuplicateError extends ReviewError {
  constructor(userId: string, productId: string) {
    super(`User ${userId} has already reviewed product ${productId}`, 'REVIEW_DUPLICATE_ERROR');
    this.name = 'ReviewDuplicateError';
  }
}

export class ReviewRateLimitError extends ReviewError {
  constructor(message: string = 'Review rate limit exceeded') {
    super(message, 'REVIEW_RATE_LIMIT_ERROR');
    this.name = 'ReviewRateLimitError';
  }
}