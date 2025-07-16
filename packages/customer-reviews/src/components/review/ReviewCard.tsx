import { useState } from 'react';
import { ReviewCardProps } from '../../types';
import { RatingStars } from '../rating/RatingStars';

interface ReviewCardComponent {
  (props: ReviewCardProps): JSX.Element;
}

export const ReviewCard: ReviewCardComponent = ({
  review,
  showProduct = false,
  onHelpful,
  className = '',
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);

  const handleHelpful = async (isHelpful: boolean) => {
    if (!onHelpful || isHelpfulLoading) return;

    setIsHelpfulLoading(true);
    try {
      await onHelpful(review.id, isHelpful);
    } finally {
      setIsHelpfulLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const shouldShowMore = review.content.length > 200;
  const displayContent = shouldShowMore && !showFullContent 
    ? review.content.slice(0, 200) + '...'
    : review.content;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <RatingStars rating={review.rating} size="sm" />
            {review.isVerifiedPurchase && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                구매 확인
              </span>
            )}
            {review.isRecommended !== undefined && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                review.isRecommended 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {review.isRecommended ? '추천' : '비추천'}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {review.title}
          </h3>
          <div className="text-sm text-gray-500">
            {formatDate(review.createdAt)}
            {review.updatedAt > review.createdAt && (
              <span className="ml-1">(수정됨)</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </p>
        
        {shouldShowMore && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showFullContent ? '접기' : '더 보기'}
          </button>
        )}

        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {review.photos.map((photo) => (
              <img
                key={photo.id}
                src={photo.thumbnailUrl}
                alt={photo.alt}
                className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => {
                  // Open full-size image modal
                  window.open(photo.url, '_blank');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          {onHelpful && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleHelpful(true)}
                disabled={isHelpfulLoading}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V9a2 2 0 00-2-2 2 2 0 00-2 2v1m7 10V9a2 2 0 00-2-2 2 2 0 00-2 2v1" />
                </svg>
                <span>도움됨</span>
              </button>
              {review.helpfulCount > 0 && (
                <span className="text-sm text-gray-500">
                  {review.helpfulCount}명이 도움되었다고 했습니다
                </span>
              )}
            </div>
          )}
        </div>

        {showProduct && (
          <div className="text-sm text-gray-500">
            상품 ID: {review.productId}
          </div>
        )}
      </div>
    </div>
  );
};