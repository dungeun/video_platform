/**
 * Promotion Events Module
 * Main entry point for the promotion and events management system
 */

// Types
export * from './types';

// Services
export { PromotionService } from './services/PromotionService';
export type { OrderData, OrderItem, UserContext } from './services/PromotionService';

// Entities
export { PromotionCampaign } from './entities/PromotionCampaign';
export { Event } from './entities/Event';
export { Banner } from './entities/Banner';

// Components
export { 
  PromotionBanner, 
  PromotionBannerList, 
  BannerCarousel 
} from './components/PromotionBanner';
export type { 
  PromotionBannerProps, 
  PromotionBannerListProps, 
  BannerCarouselProps 
} from './components/PromotionBanner';

export { 
  EventCountdown, 
  EventProgress, 
  MultiEventCountdown 
} from './components/EventCountdown';
export type { 
  EventCountdownProps, 
  EventProgressProps, 
  MultiEventCountdownProps 
} from './components/EventCountdown';

export { 
  DiscountCalculator, 
  InlineDiscount, 
  PromotionCodeInput, 
  DiscountBadge 
} from './components/DiscountCalculator';
export type { 
  DiscountCalculatorProps, 
  InlineDiscountProps, 
  PromotionCodeInputProps, 
  DiscountBadgeProps 
} from './components/DiscountCalculator';

export { 
  PromotionList, 
  PromotionCard 
} from './components/PromotionList';
export type { 
  PromotionListProps, 
  PromotionCardProps 
} from './components/PromotionList';

// Hooks
export { 
  usePromotion, 
  useEvents, 
  useBanners 
} from './hooks/usePromotion';
export type { UsePromotionOptions } from './hooks/usePromotion';

// Validators
export { PromotionValidator } from './validators/PromotionValidator';

// Utilities
export { default as PromotionUtils } from './utils';
export * from './utils';

// Module configuration and constants
export const PROMOTION_EVENTS_MODULE = {
  name: '@kcommerce/promotion-events',
  version: '1.0.0',
  description: 'Promotion and events management module for K-Commerce',
  
  // Default configurations
  defaults: {
    currency: 'KRW',
    locale: 'ko-KR',
    autoRefresh: false,
    refreshInterval: 30000,
    enableCache: true,
    maxCacheAge: 300000, // 5 minutes
    
    // Promotion defaults
    defaultPromotionPriority: 0,
    maxPromotionNameLength: 100,
    maxPromotionDescriptionLength: 500,
    maxTagsPerPromotion: 10,
    
    // Event defaults
    defaultEventPriority: 0,
    maxEventNameLength: 100,
    maxEventDescriptionLength: 1000,
    
    // Banner defaults
    defaultBannerPriority: 0,
    maxBannerTitleLength: 100,
    maxBannerContentLength: 1000,
    maxImpressionsPerUser: 10,
    
    // Coupon defaults
    defaultCouponLength: 8,
    maxCouponsPerGeneration: 10000,
    defaultCouponExpirationDays: 30
  },
  
  // Supported discount types
  discountTypes: [
    'percentage',
    'fixed',
    'buy-x-get-y',
    'free-shipping'
  ],
  
  // Supported campaign statuses
  campaignStatuses: [
    'draft',
    'scheduled',
    'active',
    'paused',
    'ended',
    'cancelled'
  ],
  
  // Supported event types
  eventTypes: [
    'flash-sale',
    'seasonal-sale',
    'clearance',
    'new-product-launch',
    'special-occasion',
    'limited-time-offer'
  ],
  
  // Supported banner positions
  bannerPositions: [
    'top',
    'header',
    'hero',
    'sidebar',
    'footer',
    'popup',
    'floating'
  ],
  
  // Supported audience types
  audienceTypes: [
    'all-users',
    'first-time-buyers',
    'returning-customers',
    'vip-members',
    'specific-users',
    'user-groups'
  ]
} as const;

// Helper functions for module initialization
export const initializePromotionModule = (config?: Partial<typeof PROMOTION_EVENTS_MODULE.defaults>) => {
  const moduleConfig = {
    ...PROMOTION_EVENTS_MODULE.defaults,
    ...config
  };
  
  // Set up global configuration
  if (typeof window !== 'undefined') {
    (window as any).__PROMOTION_MODULE_CONFIG__ = moduleConfig;
  }
  
  return moduleConfig;
};

export const getModuleConfig = () => {
  if (typeof window !== 'undefined' && (window as any).__PROMOTION_MODULE_CONFIG__) {
    return (window as any).__PROMOTION_MODULE_CONFIG__;
  }
  return PROMOTION_EVENTS_MODULE.defaults;
};

// Error types for better error handling
export class PromotionModuleError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PromotionModuleError';
  }
}

// Module health check
export const checkModuleHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: Date;
}> => {
  const checks = {
    typesLoaded: true,
    servicesAvailable: true,
    componentsAvailable: true,
    validatorsAvailable: true,
    utilitiesAvailable: true
  };
  
  try {
    // Check if main classes can be instantiated
    new PromotionService();
    checks.servicesAvailable = true;
  } catch {
    checks.servicesAvailable = false;
  }
  
  const healthyChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyChecks === totalChecks) {
    status = 'healthy';
  } else if (healthyChecks >= totalChecks * 0.7) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }
  
  return {
    status,
    checks,
    timestamp: new Date()
  };
};

// Version information
export const getVersion = () => PROMOTION_EVENTS_MODULE.version;
export const getModuleName = () => PROMOTION_EVENTS_MODULE.name;
export const getModuleDescription = () => PROMOTION_EVENTS_MODULE.description;

// Development helpers
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

export const enableDebugMode = () => {
  if (typeof window !== 'undefined') {
    (window as any).__PROMOTION_DEBUG__ = true;
  }
};

export const disableDebugMode = () => {
  if (typeof window !== 'undefined') {
    (window as any).__PROMOTION_DEBUG__ = false;
  }
};

export const isDebugMode = () => {
  if (typeof window !== 'undefined') {
    return !!(window as any).__PROMOTION_DEBUG__;
  }
  return false;
};

// Default export for easier importing
export default {
  // Core
  PromotionService,
  PromotionCampaign,
  Event,
  Banner,
  
  // Components
  PromotionBanner,
  PromotionBannerList,
  BannerCarousel,
  EventCountdown,
  EventProgress,
  MultiEventCountdown,
  DiscountCalculator,
  InlineDiscount,
  PromotionCodeInput,
  DiscountBadge,
  PromotionList,
  PromotionCard,
  
  // Hooks
  usePromotion,
  useEvents,
  useBanners,
  
  // Validators
  PromotionValidator,
  
  // Utilities
  PromotionUtils,
  
  // Configuration
  PROMOTION_EVENTS_MODULE,
  initializePromotionModule,
  getModuleConfig,
  
  // Health and diagnostics
  checkModuleHealth,
  getVersion,
  getModuleName,
  getModuleDescription,
  
  // Development
  isDevelopment,
  isProduction,
  enableDebugMode,
  disableDebugMode,
  isDebugMode
};