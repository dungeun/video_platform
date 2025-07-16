/**
 * @repo/shipping-korea
 * Korean domestic delivery services integration module
 */

// Export types
export * from './types';

// Export carrier types
export * from './carriers/cj/types';
// export * from './carriers/hanjin/types';
// export * from './carriers/lotte/types';
// export * from './carriers/post-office/types';
// export * from './carriers/logen/types';

// Export API clients
export { CJApiClient } from './carriers/cj/api/CJApiClient';
// export { HanjinApiClient } from './carriers/hanjin/api/HanjinApiClient';
// export { LotteApiClient } from './carriers/lotte/api/LotteApiClient';
// export { PostOfficeApiClient } from './carriers/post-office/api/PostOfficeApiClient';
// export { LogenApiClient } from './carriers/logen/api/LogenApiClient';

// Export tracking service
export { TrackingService, TrackingServiceConfig } from './tracking/tracker/TrackingService';

// Export cost calculator
export { CostCalculator, CostCalculatorConfig, CostRule } from './cost/calculator/CostCalculator';

// Export status manager
export { StatusManager } from './status/manager/StatusManager';

// Export webhook handler
export { WebhookHandler } from './webhook/handler/WebhookHandler';

// Export batch processor
export { BatchProcessor } from './batch/processor/BatchProcessor';

// Export rate limiter
export { RateLimiter } from './rate-limiter/limiter/RateLimiter';

// Export cache manager
export { ShippingCacheManager } from './cache/manager/ShippingCacheManager';

// Export error handler
export { ShippingErrorHandler } from './error/handler/ShippingErrorHandler';

// Export React hooks (if React is available)
export { useTracking } from './hooks/useTracking';
export { useShippingCost } from './hooks/useShippingCost';
export { useCarrierStatus } from './hooks/useCarrierStatus';

// Export React components (if React is available)
export { TrackingWidget } from './components/TrackingWidget';
export { CostCalculatorWidget } from './components/CostCalculatorWidget';
export { CarrierSelector } from './components/CarrierSelector';

// Export utilities
export { trackingNumberValidator } from './utils/validators';
export { addressFormatter } from './utils/formatters';
export { carrierInfo } from './utils/carrierInfo';

// Export constants
export const CARRIERS = {
  CJ: {
    code: 'CJ',
    name: 'CJ대한통운',
    displayName: 'CJ대한통운',
    customerService: '1588-1255',
    trackingUrl: 'https://www.cjlogistics.com/ko/tool/parcel/tracking'
  },
  HANJIN: {
    code: 'HANJIN',
    name: '한진택배',
    displayName: '한진택배',
    customerService: '1588-0011',
    trackingUrl: 'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do'
  },
  LOTTE: {
    code: 'LOTTE',
    name: '롯데택배',
    displayName: '롯데글로벌로지스',
    customerService: '1588-2121',
    trackingUrl: 'https://www.lotteglogis.com/mobile/reservation/tracking/index'
  },
  POST_OFFICE: {
    code: 'POST_OFFICE',
    name: '우체국택배',
    displayName: '우체국택배',
    customerService: '1588-1300',
    trackingUrl: 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm'
  },
  LOGEN: {
    code: 'LOGEN',
    name: '로젠택배',
    displayName: '로젠택배',
    customerService: '1588-9988',
    trackingUrl: 'https://www.ilogen.com/web/personal/trace'
  }
} as const;

// Export default configuration
export const DEFAULT_CONFIG = {
  tracking: {
    cache: {
      enabled: true,
      ttl: 300000 // 5 minutes
    },
    retry: {
      attempts: 3,
      delay: 1000
    }
  },
  cost: {
    currency: 'KRW',
    includeVAT: true
  },
  webhook: {
    timeout: 30000,
    maxRetries: 3
  },
  rateLimit: {
    default: {
      limit: 100,
      window: 60000 // 1 minute
    }
  }
} as const;