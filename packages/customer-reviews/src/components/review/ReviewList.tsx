// Empty import - will be handled by JSX transform
import { ReviewListProps } from '../../types';
import { ReviewCard } from './ReviewCard';
import { useReviews } from '../../hooks';
import { ReviewService } from '../../services';

interface ReviewListComponentProps extends ReviewListProps {
  reviewService: ReviewService;
  currentUserId?: string;
}

interface ReviewListComponent {
  (props: ReviewListComponentProps): JSX.Element;
}

export const ReviewList: ReviewListComponent = ({
  productId,
  userId,
  filter,
  limit = 20,
  showPagination = true,
  className = '',
  reviewService,
  currentUserId,
}) => {
  const {
    reviews,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    markHelpful,
  } = useReviews(reviewService, {
    productId,
    userId,
    filter,
    autoLoad: true,
  });

  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }
    await markHelpful(reviewId, isHelpful);
  };

  if (loading && reviews.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
                ))}
              </div>
              <div className="w-20 h-4 bg-gray-300 rounded"></div>
            </div>
            <div className="w-3/4 h-6 bg-gray-300 rounded mb-2"></div>
            <div className="w-1/2 h-4 bg-gray-300 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-300 rounded"></div>
              <div className="w-full h-4 bg-gray-300 rounded"></div>
              <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">리뷰가 없습니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          {productId ? '이 상품에 대한 리뷰가 아직 없습니다.' : '작성한 리뷰가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Reviews Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          리뷰 {total.toLocaleString()}개
        </h3>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showProduct={!productId}
            onHelpful={currentUserId ? handleHelpful : undefined}
          />
        ))}
      </div>

      {/* Load More */}
      {showPagination && hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로딩 중...
              </>
            ) : (
              '더 보기'
            )}
          </button>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {loading && reviews.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <svg className="animate-spin h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-sm text-gray-600">추가 리뷰를 불러오는 중...</span>
          </div>
        </div>
      )}
    </div>
  );
};