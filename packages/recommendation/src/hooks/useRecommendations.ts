import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UseRecommendationsOptions,
  UseRecommendationsResult,
  RecommendationRequest,
  RecommendationResponse,
  Recommendation
} from '../types';
import { RecommendationService } from '../services/RecommendationService';

// Default configuration for the recommendation service
const defaultConfig = {
  algorithms: {
    collaborative: {
      enabled: true,
      userSimilarityThreshold: 0.1,
      maxNeighbors: 50,
      weight: 0.3
    },
    contentBased: {
      enabled: true,
      attributeWeights: {
        category: 0.3,
        brand: 0.2,
        price: 0.15,
        tags: 0.25,
        rating: 0.1
      },
      weight: 0.3
    },
    popularity: {
      enabled: true,
      weight: 0.2,
      period: 'weekly' as const
    },
    trending: {
      enabled: true,
      weight: 0.2,
      growthThreshold: 0.2
    }
  },
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 1000
  },
  fallback: {
    usePopular: true,
    useRandom: true,
    minRecommendations: 3
  }
};

// Singleton instance of the recommendation service
let recommendationServiceInstance: RecommendationService | null = null;

const getRecommendationService = (): RecommendationService => {
  if (!recommendationServiceInstance) {
    recommendationServiceInstance = new RecommendationService(defaultConfig);
  }
  return recommendationServiceInstance;
};

export const useRecommendations = (
  options: UseRecommendationsOptions
): UseRecommendationsResult => {
  const {
    userId,
    productId,
    category,
    limit = 10,
    algorithm,
    enabled = true,
    refetchInterval
  } = options;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const service = getRecommendationService();

  const fetchRecommendations = useCallback(async (
    reset: boolean = true,
    pageNumber: number = 1
  ) => {
    if (!enabled || !userId) {
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    if (reset) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const request: RecommendationRequest = {
        userId,
        productId,
        category,
        limit: limit * pageNumber,
        algorithm,
        context: {
          page: productId ? 'product' : 'home',
          device: getDeviceType(),
          sessionDuration: getSessionDuration(),
          currentCartItems: getCurrentCartItems()
        }
      };

      const response: RecommendationResponse = await service.getRecommendations(request);
      
      if (reset) {
        setRecommendations(response.recommendations);
        setCurrentPage(1);
      } else {
        setRecommendations(prev => {
          const existingIds = new Set(prev.map(rec => rec.productId));
          const newRecommendations = response.recommendations.filter(
            rec => !existingIds.has(rec.productId)
          );
          return [...prev, ...newRecommendations];
        });
      }

      setHasMore(response.recommendations.length === limit * pageNumber);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, productId, category, limit, algorithm, enabled]);

  const refetch = useCallback(async () => {
    await fetchRecommendations(true, 1);
  }, [fetchRecommendations]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      await fetchRecommendations(false, nextPage);
      setCurrentPage(nextPage);
    }
  }, [fetchRecommendations, hasMore, isLoading, currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Set up polling if refetchInterval is provided
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchRecommendations();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchRecommendations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore
  };
};

// Hook for tracking recommendation interactions
export const useRecommendationTracking = () => {
  const service = getRecommendationService();

  const trackView = useCallback(async (userId: string, productId: string) => {
    try {
      await service.trackInteraction(userId, productId, 'view');
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  }, [service]);

  const trackClick = useCallback(async (userId: string, productId: string) => {
    try {
      await service.trackInteraction(userId, productId, 'click');
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  }, [service]);

  const trackPurchase = useCallback(async (userId: string, productId: string) => {
    try {
      await service.trackInteraction(userId, productId, 'purchase');
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  }, [service]);

  return {
    trackView,
    trackClick,
    trackPurchase
  };
};

// Hook for similar products
export const useSimilarProducts = (productId: string, limit: number = 6) => {
  const [similarProducts, setSimilarProducts] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const service = getRecommendationService();

  const fetchSimilarProducts = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const request: RecommendationRequest = {
        userId: 'anonymous', // For similar products, we don't need user context
        productId,
        limit,
        algorithm: 'content_based',
        context: {
          page: 'product',
          device: getDeviceType(),
          sessionDuration: getSessionDuration()
        }
      };

      const response = await service.getRecommendations(request);
      setSimilarProducts(response.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch similar products'));
    } finally {
      setIsLoading(false);
    }
  }, [productId, limit, service]);

  useEffect(() => {
    fetchSimilarProducts();
  }, [fetchSimilarProducts]);

  return {
    similarProducts,
    isLoading,
    error,
    refetch: fetchSimilarProducts
  };
};

// Hook for recommendation metrics
export const useRecommendationMetrics = (timeRange: { start: Date; end: Date }) => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const service = getRecommendationService();

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const metricsData = await service.getMetrics(timeRange);
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, service]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics
  };
};

// Utility functions
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = window.navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

function getSessionDuration(): number {
  if (typeof window === 'undefined') return 0;
  
  const sessionStart = sessionStorage.getItem('sessionStartTime');
  if (!sessionStart) {
    const startTime = Date.now().toString();
    sessionStorage.setItem('sessionStartTime', startTime);
    return 0;
  }
  
  return Date.now() - parseInt(sessionStart, 10);
}

function getCurrentCartItems(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const cartData = localStorage.getItem('cartItems');
    if (cartData) {
      const cart = JSON.parse(cartData);
      return Array.isArray(cart) ? cart.map(item => item.productId || item.id) : [];
    }
  } catch (error) {
    console.error('Failed to parse cart items:', error);
  }
  
  return [];
}

// Custom hook for managing recommendation preferences
export const useRecommendationPreferences = (userId: string) => {
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const updatePreferences = useCallback(async (newPreferences: any) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call an API
      // For now, we'll store in localStorage
      localStorage.setItem(`recommendations_preferences_${userId}`, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(`recommendations_preferences_${userId}`);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadPreferences();
    }
  }, [userId, loadPreferences]);

  return {
    preferences,
    updatePreferences,
    isLoading
  };
};