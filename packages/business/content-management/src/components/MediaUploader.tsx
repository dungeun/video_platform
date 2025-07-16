import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Card,
  Text,
  Button,
  Progress,
  Badge,
  Icon,
  Alert
} from '@revu/ui-kit';
import { formatFileSize } from '@revu/shared-utils';
import type { MediaAsset } from '../types';
import { useContentUpload, useMediaValidation } from '../hooks/useContentUpload';

interface MediaUploaderProps {
  contentId: string;
  media: MediaAsset[];
  onMediaChange: (media: MediaAsset[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  contentId,
  media,
  onMediaChange,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  maxSize = 500 * 1024 * 1024 // 500MB
}) => {
  const {
    uploads,
    uploadFile,
    uploadMultiple,
    deleteMedia,
    retryUpload,
    cancelUpload
  } = useContentUpload(contentId);
  
  const { validateMedia } = useMediaValidation();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    acceptedFiles.forEach(file => {
      const validation = validateMedia(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      // Show errors (would use notification in real app)
      console.error('File validation errors:', errors);
    }
    
    // Check max files limit
    const remainingSlots = maxFiles - media.length - uploads.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);
    
    if (filesToUpload.length < validFiles.length) {
      console.warn(`Only uploading ${filesToUpload.length} files due to limit`);
    }
    
    // Upload files
    const uploadedAssets = await uploadMultiple(filesToUpload);
    
    // Update media list
    onMediaChange([...media, ...uploadedAssets]);
  }, [media, uploads.length, maxFiles, uploadMultiple, validateMedia, onMediaChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      if (type === 'image/*') {
        acc['image/*'] = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      } else if (type === 'video/*') {
        acc['video/*'] = ['.mp4', '.mov', '.avi', '.webm'];
      }
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    disabled: media.length >= maxFiles
  });

  const handleDelete = async (asset: MediaAsset) => {
    await deleteMedia(asset.id);
    onMediaChange(media.filter(m => m.id !== asset.id));
  };

  const totalMedia = media.length + uploads.length;

  return (
    <div className="media-uploader">
      <div className="uploader-header">
        <Text variant="h3">Media Files</Text>
        <Text variant="caption" color="secondary">
          {totalMedia} / {maxFiles} files
        </Text>
      </div>

      {totalMedia < maxFiles && (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <Icon name="upload" size="large" />
          <Text variant="body1">
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'}
          </Text>
          <Text variant="caption" color="secondary">
            Accepted: {acceptedTypes.join(', ')} • Max size: {formatFileSize(maxSize)}
          </Text>
        </div>
      )}

      {/* Current Uploads */}
      {uploads.length > 0 && (
        <Card variant="secondary">
          <Text variant="h4">Uploading</Text>
          {uploads.map(upload => (
            <div key={upload.id} className="upload-item">
              <div className="upload-info">
                <Text variant="body2">{upload.file.name}</Text>
                <Text variant="caption" color="secondary">
                  {formatFileSize(upload.file.size)}
                </Text>
              </div>
              
              {upload.status === 'uploading' && (
                <>
                  <Progress value={upload.progress} size="small" />
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => cancelUpload(upload.id)}
                  >
                    Cancel
                  </Button>
                </>
              )}
              
              {upload.status === 'error' && (
                <>
                  <Badge variant="error" size="small">Failed</Badge>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => retryUpload(upload.id)}
                  >
                    Retry
                  </Button>
                </>
              )}
              
              {upload.status === 'success' && (
                <Badge variant="success" size="small">Uploaded</Badge>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Uploaded Media */}
      {media.length > 0 && (
        <div className="uploaded-media">
          <Text variant="h4">Uploaded Media</Text>
          <div className="media-grid">
            {media.map(asset => (
              <Card key={asset.id} className="media-item">
                {asset.type === 'image' ? (
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={asset.filename}
                  />
                ) : (
                  <div className="video-placeholder">
                    <Icon name="video" size="large" />
                    <Badge variant="dark">Video</Badge>
                  </div>
                )}
                
                <div className="media-info">
                  <Text variant="caption" numberOfLines={1}>
                    {asset.filename}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {formatFileSize(asset.size)}
                  </Text>
                </div>
                
                <div className="media-actions">
                  <Button
                    variant="ghost"
                    size="small"
                    icon="delete"
                    onClick={() => handleDelete(asset)}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {totalMedia >= maxFiles && (
        <Alert variant="warning">
          Maximum number of files reached ({maxFiles})
        </Alert>
      )}
    </div>
  );
};

export default MediaUploader;