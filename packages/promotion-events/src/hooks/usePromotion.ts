/**
 * usePromotion Hook
 * Custom hook for managing promotion campaigns, events, and discount calculations
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  PromotionCampaign,
  Event,
  Banner,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  CreateEventRequest,
  CreateBannerRequest,
  DiscountCalculationResult,
  CouponCode,
  CouponGenerationConfig,
  PromotionAnalytics,
  EventAnalytics,
  PromotionFilters,
  EventFilters,
  BannerFilters,
  UsePromotionReturn
} from '../types';
import { PromotionService, OrderData, UserContext } from '../services/PromotionService';

export interface UsePromotionOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
}

export const usePromotion = (options: UsePromotionOptions = {}): UsePromotionReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableCache = true
  } = options;

  // State
  const [promotions, setPromotions] = useState<PromotionCampaign[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Service instance
  const [promotionService] = useState(() => new PromotionService());

  // Cache for analytics and other expensive operations
  const [cache, setCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map());

  // Utility function to get cached data
  const getCachedData = useCallback((key: string, maxAge: number = 300000): any => {
    if (!enableCache) return null;
    
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  }, [cache, enableCache]);

  // Utility function to set cached data
  const setCachedData = useCallback((key: string, data: any): void => {
    if (!enableCache) return;
    
    setCache(prev => new Map(prev.set(key, { data, timestamp: Date.now() })));
  }, [enableCache]);

  // Load promotions
  const loadPromotions = useCallback(async (filters?: PromotionFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await promotionService.getPromotions(filters);
      setPromotions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, [promotionService]);

  // Create promotion
  const createPromotion = useCallback(async (data: CreatePromotionRequest): Promise<PromotionCampaign> => {
    setLoading(true);
    setError(null);
    
    try {
      const promotion = await promotionService.createPromotion(data);
      setPromotions(prev => [...prev, promotion]);
      return promotion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create promotion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService]);

  // Update promotion
  const updatePromotion = useCallback(async (id: string, data: UpdatePromotionRequest): Promise<PromotionCampaign> => {
    setLoading(true);
    setError(null);
    
    try {
      const promotion = await promotionService.updatePromotion(id, data);
      setPromotions(prev => prev.map(p => p.id === id ? promotion : p));
      return promotion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update promotion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService]);

  // Delete promotion
  const deletePromotion = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await promotionService.deletePromotion(id);
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete promotion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService]);

  // Activate promotion
  const activatePromotion = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await promotionService.activatePromotion(id);
      const updated = await promotionService.getPromotion(id);
      if (updated) {
        setPromotions(prev => prev.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate promotion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService]);

  // Deactivate promotion
  const deactivatePromotion = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await promotionService.deactivatePromotion(id);
      const updated = await promotionService.getPromotion(id);
      if (updated) {
        setPromotions(prev => prev.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate promotion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService]);

  // Calculate discount
  const calculateDiscount = useCallback(async (orderData: OrderData, userContext?: UserContext): Promise<DiscountCalculationResult> => {
    const cacheKey = `discount-${JSON.stringify(orderData)}-${JSON.stringify(userContext)}`;
    const cached = getCachedData(cacheKey, 10000); // 10 seconds cache
    
    if (cached) {
      return cached;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await promotionService.calculateDiscount(orderData, userContext);
      setCachedData(cacheKey, result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate discount';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService, getCachedData, setCachedData]);

  // Generate coupons
  const generateCoupons = useCallback(async (campaignId: string, config: CouponGenerationConfig): Promise<CouponCode[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const coupons = await promotionService.generateCoupons(campaignId, config);
      return coupons;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate coupons';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService]);

  // Validate coupon
  const validateCoupon = useCallback(async (code: string, userContext?: UserContext): Promise<{
    valid: boolean;
    campaign?: PromotionCampaign;
    message: string;
  }> => {
    const cacheKey = `coupon-${code}-${JSON.stringify(userContext)}`;
    const cached = getCachedData(cacheKey, 60000); // 1 minute cache
    
    if (cached) {
      return cached;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await promotionService.validateCoupon(code, userContext);
      setCachedData(cacheKey, result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate coupon';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService, getCachedData, setCachedData]);

  // Get analytics
  const getAnalytics = useCallback(async (campaignId: string, period: { startDate: Date; endDate: Date }): Promise<PromotionAnalytics> => {
    const cacheKey = `analytics-${campaignId}-${period.startDate.getTime()}-${period.endDate.getTime()}`;
    const cached = getCachedData(cacheKey, 300000); // 5 minutes cache
    
    if (cached) {
      return cached;
    }

    setLoading(true);
    setError(null);
    
    try {
      const analytics = await promotionService.getAnalytics(campaignId, period);
      setCachedData(cacheKey, analytics);
      return analytics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get analytics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [promotionService, getCachedData, setCachedData]);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadPromotions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadPromotions]);

  // Initial load
  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  // Clear cache periodically
  useEffect(() => {
    if (!enableCache) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const maxAge = 600000; // 10 minutes
      
      setCache(prev => {
        const newCache = new Map();
        for (const [key, value] of prev.entries()) {
          if (now - value.timestamp < maxAge) {
            newCache.set(key, value);
          }
        }
        return newCache;
      });
    }, 300000); // Clean every 5 minutes

    return () => clearInterval(interval);
  }, [enableCache]);

  return {
    promotions,
    loading,
    error,
    createPromotion,
    updatePromotion,
    deletePromotion,
    activatePromotion,
    deactivatePromotion,
    calculateDiscount,
    generateCoupons,
    validateCoupon,
    getAnalytics
  };
};

// Hook for events management
export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock event service - in real implementation, this would be a proper service
  const createEvent = useCallback(async (data: CreateEventRequest): Promise<Event> => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock implementation
      const event: Event = {
        id: Date.now().toString(),
        ...data,
        status: data.startDate > new Date() ? 'upcoming' : 'live',
        campaignIds: data.campaignIds || [],
        featured: data.featured || false,
        showCountdown: data.showCountdown || false,
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      } as Event;
      
      setEvents(prev => [...prev, event]);
      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    createEvent
  };
};

// Hook for banners management
export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock banner service - in real implementation, this would be a proper service
  const createBanner = useCallback(async (data: CreateBannerRequest): Promise<Banner> => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock implementation
      const banner: Banner = {
        id: Date.now().toString(),
        ...data,
        priority: data.priority || 0,
        isActive: true,
        impressions: 0,
        clicks: 0,
        clickThroughRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      } as Banner;
      
      setBanners(prev => [...prev, banner]);
      return banner;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create banner';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const recordImpression = useCallback((bannerId: string) => {
    setBanners(prev => prev.map(banner => {
      if (banner.id === bannerId) {
        const newImpressions = banner.impressions + 1;
        return {
          ...banner,
          impressions: newImpressions,
          clickThroughRate: banner.clicks > 0 ? (banner.clicks / newImpressions) * 100 : 0
        };
      }
      return banner;
    }));
  }, []);

  const recordClick = useCallback((bannerId: string) => {
    setBanners(prev => prev.map(banner => {
      if (banner.id === bannerId) {
        const newClicks = banner.clicks + 1;
        return {
          ...banner,
          clicks: newClicks,
          clickThroughRate: banner.impressions > 0 ? (newClicks / banner.impressions) * 100 : 0
        };
      }
      return banner;
    }));
  }, []);

  return {
    banners,
    loading,
    error,
    createBanner,
    recordImpression,
    recordClick
  };
};

export default usePromotion;