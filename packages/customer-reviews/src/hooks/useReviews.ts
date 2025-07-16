import { useState, useEffect, useCallback } from 'react';
import { Review, ReviewFilter, CreateReviewRequest, UpdateReviewRequest } from '../types';
import { ReviewService } from '../services';

export interface UseReviewsOptions {
  productId?: string;
  userId?: string;
  autoLoad?: boolean;
  filter?: ReviewFilter;
}

export interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  loadReviews: () => Promise<void>;
  loadMore: () => Promise<void>;
  createReview: (data: CreateReviewRequest) => Promise<Review>;
  updateReview: (id: string, data: UpdateReviewRequest) => Promise<Review>;
  deleteReview: (id: string) => Promise<void>;
  markHelpful: (reviewId: string, isHelpful: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReviews(
  reviewService: ReviewService,
  options: UseReviewsOptions = {}
): UseReviewsReturn {
  const { productId, userId, autoLoad = true, filter } = options;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadReviews = useCallback(async () => {
    if (!productId && !userId) return;

    setLoading(true);
    setError(null);

    try {
      let result: Review[];
      
      if (productId) {
        result = await reviewService.getProductReviews(productId, filter);
      } else if (userId) {
        result = await reviewService.getUserReviews(userId, filter);
      } else {
        result = [];
      }

      setReviews(result);
      setTotal(result.length);
      setOffset(result.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [reviewService, productId, userId, filter]);

  const loadMore = useCallback(async () => {
    if (!productId || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await reviewService.getReviewsWithFilter(
        { ...filter },
        limit,
        offset
      );

      setReviews(prev => [...prev, ...result.reviews]);
      setTotal(result.total);
      setOffset(prev => prev + result.reviews.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more reviews');
    } finally {
      setLoading(false);
    }
  }, [reviewService, filter, limit, offset, loading, productId]);

  const createReview = useCallback(async (data: CreateReviewRequest): Promise<Review> => {
    if (!userId) {
      throw new Error('User ID is required to create a review');
    }

    setLoading(true);
    setError(null);

    try {
      const review = await reviewService.createReview({ ...data, userId });
      setReviews(prev => [review, ...prev]);
      setTotal(prev => prev + 1);
      return review;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [reviewService, userId]);

  const updateReview = useCallback(async (id: string, data: UpdateReviewRequest): Promise<Review> => {
    if (!userId) {
      throw new Error('User ID is required to update a review');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedReview = await reviewService.updateReview(id, userId, data);
      setReviews(prev => prev.map(review => 
        review.id === id ? updatedReview : review
      ));
      return updatedReview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [reviewService, userId]);

  const deleteReview = useCallback(async (id: string): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required to delete a review');
    }

    setLoading(true);
    setError(null);

    try {
      await reviewService.deleteReview(id, userId);
      setReviews(prev => prev.filter(review => review.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete review';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [reviewService, userId]);

  const markHelpful = useCallback(async (reviewId: string, isHelpful: boolean): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required to mark review as helpful');
    }

    try {
      await reviewService.markReviewHelpful(reviewId, userId, isHelpful);
      
      // Update the helpful count locally
      setReviews(prev => prev.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            helpfulCount: isHelpful ? review.helpfulCount + 1 : Math.max(0, review.helpfulCount - 1)
          };
        }
        return review;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark review as helpful');
    }
  }, [reviewService, userId]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (autoLoad) {
      loadReviews();
    }
  }, [autoLoad, loadReviews]);

  const hasMore = reviews.length < total;

  return {
    reviews,
    loading,
    error,
    total,
    hasMore,
    loadReviews,
    loadMore,
    createReview,
    updateReview,
    deleteReview,
    markHelpful,
    refresh,
  };
}