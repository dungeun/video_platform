import { IReviewRepository } from '../repositories/interfaces';

export interface PhotoUploadResult {
  url: string;
  thumbnailUrl: string;
  alt: string;
}

export interface IPhotoUploader {
  uploadPhoto(file: File): Promise<PhotoUploadResult>;
  deletePhoto(url: string): Promise<void>;
  generateThumbnail(url: string): Promise<string>;
}

export class PhotoService {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly photoUploader: IPhotoUploader
  ) {}

  async uploadReviewPhotos(reviewId: string, files: File[]): Promise<void> {
    if (files.length > 5) {
      throw new Error('Maximum 5 photos allowed per review');
    }

    const uploadPromises = files.map(async (file, index) => {
      // Validate file
      this.validatePhotoFile(file);

      // Upload photo
      const result = await this.photoUploader.uploadPhoto(file);

      return {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        alt: result.alt || `Review photo ${index + 1}`,
        order: index,
      };
    });

    const uploadedPhotos = await Promise.all(uploadPromises);

    // Add photos to review
    await this.reviewRepository.addPhotos(reviewId, uploadedPhotos);
  }

  async removeReviewPhotos(reviewId: string, photoIds: string[]): Promise<void> {
    // Remove photos from storage
    const review = await this.reviewRepository.findById(reviewId);
    if (!review || !review.photos) {
      throw new Error('Review or photos not found');
    }

    const photosToDelete = review.photos.filter(photo => photoIds.includes(photo.id));
    
    const deletePromises = photosToDelete.map(photo => 
      this.photoUploader.deletePhoto(photo.url)
    );

    await Promise.all(deletePromises);

    // Remove photos from database
    await this.reviewRepository.removePhotos(reviewId, photoIds);
  }

  private validatePhotoFile(file: File): void {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 5MB allowed.');
    }

    // Check image dimensions (optional)
    // This would require reading the image to get dimensions
    // Implementation depends on your environment (browser/Node.js)
  }

  async optimizePhoto(file: File): Promise<File> {
    // This is a placeholder for photo optimization
    // In a real implementation, you might:
    // 1. Resize large images
    // 2. Compress images
    // 3. Convert to optimal format
    // 4. Strip EXIF data for privacy
    
    return file;
  }

  async generatePhotoPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  validatePhotoCount(currentCount: number, newCount: number): void {
    const totalCount = currentCount + newCount;
    if (totalCount > 5) {
      throw new Error(`Maximum 5 photos allowed. Current: ${currentCount}, Trying to add: ${newCount}`);
    }
  }
}