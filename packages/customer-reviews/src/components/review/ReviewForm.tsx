import { useState } from 'react';
import { ReviewFormProps, CreateReviewRequest } from '../../types';
import { RatingStars } from '../rating/RatingStars';

interface ReviewFormComponent {
  (props: ReviewFormProps): JSX.Element;
}

export const ReviewForm: ReviewFormComponent = ({
  productId,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
    isRecommended: undefined as boolean | undefined,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.rating === 0) {
      newErrors.rating = '별점을 선택해주세요';
    }

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (formData.title.length > 100) {
      newErrors.title = '제목은 100자 이내로 입력해주세요';
    }

    if (!formData.content.trim()) {
      newErrors.content = '리뷰 내용을 입력해주세요';
    } else if (formData.content.length < 10) {
      newErrors.content = '리뷰 내용은 최소 10자 이상 입력해주세요';
    } else if (formData.content.length > 2000) {
      newErrors.content = '리뷰 내용은 2000자 이내로 입력해주세요';
    }

    if (photos.length > 5) {
      newErrors.photos = '사진은 최대 5장까지 업로드할 수 있습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData: CreateReviewRequest = {
        productId,
        rating: formData.rating,
        title: formData.title.trim(),
        content: formData.content.trim(),
        isRecommended: formData.isRecommended,
        photos: photos.length > 0 ? photos : undefined,
      };

      await onSubmit(reviewData);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : '리뷰 등록에 실패했습니다' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + photos.length > 5) {
      setErrors({ photos: '사진은 최대 5장까지 업로드할 수 있습니다' });
      return;
    }

    // Generate previews
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === files.length) {
          setPhotoPreview(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setPhotos(prev => [...prev, ...files]);
    setErrors({ ...errors, photos: '' });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">리뷰 작성</h2>

        {/* Rating */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            별점 평가 *
          </label>
          <div className="flex items-center space-x-2">
            <RatingStars
              rating={formData.rating}
              interactive
              onRatingChange={(rating) => {
                setFormData({ ...formData, rating });
                setErrors({ ...errors, rating: '' });
              }}
              size="lg"
            />
            <span className="text-sm text-gray-600">
              {formData.rating > 0 && `${formData.rating}점`}
            </span>
          </div>
          {errors.rating && (
            <p className="text-red-600 text-sm">{errors.rating}</p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            제목 *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              setErrors({ ...errors, title: '' });
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="리뷰 제목을 입력해주세요"
            maxLength={100}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{errors.title && <span className="text-red-600">{errors.title}</span>}</span>
            <span>{formData.title.length}/100</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            리뷰 내용 *
          </label>
          <textarea
            id="content"
            rows={6}
            value={formData.content}
            onChange={(e) => {
              setFormData({ ...formData, content: e.target.value });
              setErrors({ ...errors, content: '' });
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="상품에 대한 솔직한 리뷰를 작성해주세요"
            maxLength={2000}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{errors.content && <span className="text-red-600">{errors.content}</span>}</span>
            <span>{formData.content.length}/2000</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            추천 여부
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                checked={formData.isRecommended === true}
                onChange={() => setFormData({ ...formData, isRecommended: true })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">추천</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                checked={formData.isRecommended === false}
                onChange={() => setFormData({ ...formData, isRecommended: false })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">비추천</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                checked={formData.isRecommended === undefined}
                onChange={() => setFormData({ ...formData, isRecommended: undefined })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">선택안함</span>
            </label>
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            사진 첨부 (최대 5장)
          </label>
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm text-gray-600">사진 추가</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={photos.length >= 5}
              />
            </label>
          </div>

          {photoPreview.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.photos && (
            <p className="text-red-600 text-sm">{errors.photos}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '등록 중...' : '리뷰 등록'}
          </button>
        </div>
      </div>
    </form>
  );
};