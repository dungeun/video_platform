import { useState, useCallback } from 'react';
import { useNotification } from '@revu/ui-kit';
import { ContentService } from '../services';
import type { MediaAsset } from '../types';

const contentService = new ContentService();

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  asset?: MediaAsset;
  error?: string;
}

export function useContentUpload(contentId: string) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [uploading, setUploading] = useState(false);
  const { showNotification } = useNotification();

  const uploadFile = useCallback(async (
    file: File,
    metadata?: Record<string, any>
  ): Promise<MediaAsset | null> => {
    const uploadId = `${file.name}-${Date.now()}`;
    
    // Add to uploads tracking
    setUploads(prev => new Map(prev).set(uploadId, {
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setUploading(true);
    
    try {
      // Update status to uploading
      setUploads(prev => {
        const next = new Map(prev);
        const upload = next.get(uploadId)!;
        next.set(uploadId, { ...upload, status: 'uploading' });
        return next;
      });
      
      // Simulate progress (in real app, use XMLHttpRequest or fetch with progress)
      const progressInterval = setInterval(() => {
        setUploads(prev => {
          const next = new Map(prev);
          const upload = next.get(uploadId)!;
          if (upload.progress < 90) {
            next.set(uploadId, {
              ...upload,
              progress: upload.progress + 10
            });
          }
          return next;
        });
      }, 200);
      
      const asset = await contentService.uploadMedia(contentId, file, metadata);
      
      clearInterval(progressInterval);
      
      // Update to success
      setUploads(prev => {
        const next = new Map(prev);
        next.set(uploadId, {
          file,
          progress: 100,
          status: 'success',
          asset
        });
        return next;
      });
      
      showNotification({
        type: 'success',
        message: `${file.name} uploaded successfully`
      });
      
      return asset;
    } catch (err) {
      // Update to error
      setUploads(prev => {
        const next = new Map(prev);
        next.set(uploadId, {
          file,
          progress: 0,
          status: 'error',
          error: (err as Error).message
        });
        return next;
      });
      
      showNotification({
        type: 'error',
        message: `Failed to upload ${file.name}`
      });
      
      return null;
    } finally {
      setUploading(false);
    }
  }, [contentId, showNotification]);

  const uploadMultiple = useCallback(async (
    files: File[],
    metadata?: Record<string, any>
  ): Promise<MediaAsset[]> => {
    const results = await Promise.all(
      files.map(file => uploadFile(file, metadata))
    );
    
    return results.filter((asset): asset is MediaAsset => asset !== null);
  }, [uploadFile]);

  const deleteMedia = useCallback(async (
    mediaId: string
  ) => {
    try {
      await contentService.deleteMedia(contentId, mediaId);
      showNotification({
        type: 'success',
        message: 'Media deleted successfully'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to delete media'
      });
      throw err;
    }
  }, [contentId, showNotification]);

  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  const retryUpload = useCallback(async (uploadId: string) => {
    const upload = uploads.get(uploadId);
    if (!upload || upload.status !== 'error') return;
    
    // Clear the failed upload
    setUploads(prev => {
      const next = new Map(prev);
      next.delete(uploadId);
      return next;
    });
    
    // Retry
    return uploadFile(upload.file);
  }, [uploads, uploadFile]);

  const cancelUpload = useCallback((uploadId: string) => {
    setUploads(prev => {
      const next = new Map(prev);
      next.delete(uploadId);
      return next;
    });
  }, []);

  return {
    uploads: Array.from(uploads.entries()).map(([id, upload]) => ({
      id,
      ...upload
    })),
    uploading,
    uploadFile,
    uploadMultiple,
    deleteMedia,
    clearUploads,
    retryUpload,
    cancelUpload
  };
}

export function useMediaValidation() {
  const validateImage = useCallback((file: File): {
    valid: boolean;
    error?: string;
  } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, GIF or WebP images.'
      };
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 10MB limit.'
      };
    }
    
    return { valid: true };
  }, []);

  const validateVideo = useCallback((file: File): {
    valid: boolean;
    error?: string;
  } => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload MP4, MOV or WebM videos.'
      };
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 500MB limit.'
      };
    }
    
    return { valid: true };
  }, []);

  const validateMedia = useCallback((file: File): {
    valid: boolean;
    error?: string;
  } => {
    if (file.type.startsWith('image/')) {
      return validateImage(file);
    } else if (file.type.startsWith('video/')) {
      return validateVideo(file);
    }
    
    return {
      valid: false,
      error: 'Unsupported file type. Please upload images or videos.'
    };
  }, [validateImage, validateVideo]);

  return {
    validateImage,
    validateVideo,
    validateMedia
  };
}