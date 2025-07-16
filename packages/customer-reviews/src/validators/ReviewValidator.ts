import { CreateReviewRequest, UpdateReviewRequest } from '../types';

export class ReviewValidator {
  async validateCreateRequest(data: CreateReviewRequest & { userId: string }): Promise<void> {
    const errors: string[] = [];

    // Validate user ID
    if (!data.userId || typeof data.userId !== 'string' || data.userId.trim() === '') {
      errors.push('User ID is required');
    }

    // Validate product ID
    if (!data.productId || typeof data.productId !== 'string' || data.productId.trim() === '') {
      errors.push('Product ID is required');
    }

    // Validate rating
    if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
      errors.push('Rating must be an integer between 1 and 5');
    }

    // Validate title
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required');
    } else {
      const title = data.title.trim();
      if (title.length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > 100) {
        errors.push('Title cannot exceed 100 characters');
      }
    }

    // Validate content
    if (!data.content || typeof data.content !== 'string') {
      errors.push('Content is required');
    } else {
      const content = data.content.trim();
      if (content.length === 0) {
        errors.push('Content cannot be empty');
      } else if (content.length < 10) {
        errors.push('Content must be at least 10 characters long');
      } else if (content.length > 2000) {
        errors.push('Content cannot exceed 2000 characters');
      }
    }

    // Validate isRecommended (optional)
    if (data.isRecommended !== undefined && typeof data.isRecommended !== 'boolean') {
      errors.push('isRecommended must be a boolean value');
    }

    // Validate photos (optional)
    if (data.photos) {
      if (!Array.isArray(data.photos)) {
        errors.push('Photos must be an array');
      } else if (data.photos.length > 5) {
        errors.push('Maximum 5 photos allowed');
      } else {
        data.photos.forEach((photo, index) => {
          if (!(photo instanceof File)) {
            errors.push(`Photo at index ${index} must be a File object`);
          } else {
            this.validatePhotoFile(photo, index, errors);
          }
        });
      }
    }

    // Check for profanity and inappropriate content
    this.validateContentAppropriate(data.title, 'title', errors);
    this.validateContentAppropriate(data.content, 'content', errors);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  async validateUpdateRequest(data: UpdateReviewRequest): Promise<void> {
    const errors: string[] = [];

    // Validate rating (optional)
    if (data.rating !== undefined) {
      if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
        errors.push('Rating must be an integer between 1 and 5');
      }
    }

    // Validate title (optional)
    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        errors.push('Title must be a string');
      } else {
        const title = data.title.trim();
        if (title.length === 0) {
          errors.push('Title cannot be empty');
        } else if (title.length > 100) {
          errors.push('Title cannot exceed 100 characters');
        }
        this.validateContentAppropriate(title, 'title', errors);
      }
    }

    // Validate content (optional)
    if (data.content !== undefined) {
      if (typeof data.content !== 'string') {
        errors.push('Content must be a string');
      } else {
        const content = data.content.trim();
        if (content.length === 0) {
          errors.push('Content cannot be empty');
        } else if (content.length < 10) {
          errors.push('Content must be at least 10 characters long');
        } else if (content.length > 2000) {
          errors.push('Content cannot exceed 2000 characters');
        }
        this.validateContentAppropriate(content, 'content', errors);
      }
    }

    // Validate isRecommended (optional)
    if (data.isRecommended !== undefined && typeof data.isRecommended !== 'boolean') {
      errors.push('isRecommended must be a boolean value');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private validatePhotoFile(file: File, index: number, errors: string[]): void {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Photo at index ${index}: Invalid file type. Only JPEG, PNG, and WebP are allowed`);
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      errors.push(`Photo at index ${index}: File size too large. Maximum 5MB allowed`);
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push(`Photo at index ${index}: File name too long. Maximum 255 characters allowed`);
    }
  }

  private validateContentAppropriate(content: string, field: string, errors: string[]): void {
    // Basic profanity filter - in a real app, you'd use a more sophisticated service
    const profanityWords = [
      // Add your profanity filter words here
      'spam', 'fake', 'scam'
    ];

    const lowerContent = content.toLowerCase();
    const foundProfanity = profanityWords.find(word => lowerContent.includes(word));
    
    if (foundProfanity) {
      errors.push(`${field} contains inappropriate content`);
    }

    // Check for excessive capitalization
    const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (uppercaseRatio > 0.7 && content.length > 10) {
      errors.push(`${field} contains excessive capitalization`);
    }

    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?.,;:]/g) || []).length / content.length;
    if (punctuationRatio > 0.3) {
      errors.push(`${field} contains excessive punctuation`);
    }

    // Check for repeated characters
    if (/(.)\1{4,}/.test(content)) {
      errors.push(`${field} contains excessive repeated characters`);
    }

    // Check for URLs (reviews shouldn't contain links)
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    if (urlPattern.test(content)) {
      errors.push(`${field} cannot contain URLs`);
    }

    // Check for email addresses
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    if (emailPattern.test(content)) {
      errors.push(`${field} cannot contain email addresses`);
    }

    // Check for phone numbers
    const phonePattern = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    if (phonePattern.test(content)) {
      errors.push(`${field} cannot contain phone numbers`);
    }
  }

  validateRating(rating: number): boolean {
    return typeof rating === 'number' && 
           rating >= 1 && 
           rating <= 5 && 
           Number.isInteger(rating);
  }

  validateSearchQuery(query: string): boolean {
    if (typeof query !== 'string') {
      return false;
    }

    const trimmed = query.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
  }

  sanitizeContent(content: string): string {
    return content
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s.,!?;:()"-]/g, ''); // Remove special characters except common punctuation
  }
}