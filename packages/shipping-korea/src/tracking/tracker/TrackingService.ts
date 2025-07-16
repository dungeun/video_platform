/**
 * Unified tracking service for all carriers
 */

import { Logger, EventEmitter } from '@repo/core';
import { CacheManager } from '@repo/cache';
import {
  TrackingRequest,
  TrackingInfo,
  ApiResponse,
  CarrierCode,
  BatchTrackingRequest,
  BatchTrackingResponse
} from '../../types';
import { CJApiClient } from '../../carriers/cj/api/CJApiClient';
// Import other carrier clients when implemented
// import { HanjinApiClient } from '../../carriers/hanjin/api/HanjinApiClient';
// import { LotteApiClient } from '../../carriers/lotte/api/LotteApiClient';
// import { PostOfficeApiClient } from '../../carriers/post-office/api/PostOfficeApiClient';
// import { LogenApiClient } from '../../carriers/logen/api/LogenApiClient';

export interface TrackingServiceConfig {
  carriers: {
    cj?: any;
    hanjin?: any;
    lotte?: any;
    postOffice?: any;
    logen?: any;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

export class TrackingService extends EventEmitter {
  private logger: Logger;
  private cache: CacheManager;
  private carriers: Map<CarrierCode, any>;

  constructor(private config: TrackingServiceConfig) {
    super();
    this.logger = new Logger('TrackingService');
    this.cache = new CacheManager({
      ttl: config.cache?.ttl || 300000, // 5 minutes default
      maxSize: 1000
    });
    
    this.initializeCarriers();
  }

  /**
   * Initialize carrier clients
   */
  private initializeCarriers(): void {
    this.carriers = new Map();

    if (this.config.carriers.cj) {
      this.carriers.set('CJ', new CJApiClient(this.config.carriers.cj));
    }

    // Initialize other carriers when implemented
    // if (this.config.carriers.hanjin) {
    //   this.carriers.set('HANJIN', new HanjinApiClient(this.config.carriers.hanjin));
    // }

    this.logger.info('Carriers initialized', {
      carriers: Array.from(this.carriers.keys())
    });
  }

  /**
   * Track single shipment
   */
  async track(request: TrackingRequest): Promise<ApiResponse<TrackingInfo>> {
    const cacheKey = this.getCacheKey(request);

    // Check cache if enabled
    if (this.config.cache?.enabled) {
      const cached = await this.cache.get<ApiResponse<TrackingInfo>>(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', { cacheKey });
        return cached;
      }
    }

    // Get carrier client
    const client = this.carriers.get(request.carrier);
    if (!client) {
      return {
        success: false,
        error: {
          code: 'UNSUPPORTED_CARRIER',
          message: `Carrier ${request.carrier} is not supported`,
          retryable: false
        },
        timestamp: new Date(),
        requestId: this.generateRequestId()
      };
    }

    // Track shipment
    const response = await client.track(request.trackingNumber);

    // Cache successful response
    if (response.success && this.config.cache?.enabled) {
      await this.cache.set(cacheKey, response);
    }

    // Emit event
    this.emit('tracking:complete', {
      request,
      response
    });

    return response;
  }

  /**
   * Track multiple shipments in batch
   */
  async trackBatch(
    request: BatchTrackingRequest
  ): Promise<BatchTrackingResponse> {
    const startTime = Date.now();
    const results = [];
    const parallel = request.options?.parallel || 5;

    // Process in chunks
    for (let i = 0; i < request.requests.length; i += parallel) {
      const chunk = request.requests.slice(i, i + parallel);
      const chunkResults = await Promise.all(
        chunk.map(async (req) => {
          try {
            const response = await this.track(req);
            return {
              request: req,
              success: response.success,
              data: response.data,
              error: response.error
            };
          } catch (error) {
            this.logger.error('Batch tracking error', error);
            return {
              request: req,
              success: false,
              error: {
                code: 'BATCH_TRACKING_ERROR',
                message: 'Failed to track shipment',
                retryable: true
              }
            };
          }
        })
      );
      results.push(...chunkResults);
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration: Date.now() - startTime
    };

    this.emit('batch:complete', { summary });

    return {
      results,
      summary
    };
  }

  /**
   * Get tracking updates (for polling)
   */
  async getUpdates(
    trackingNumbers: Array<{ carrier: CarrierCode; trackingNumber: string }>
  ): Promise<Map<string, TrackingInfo>> {
    const updates = new Map<string, TrackingInfo>();

    await Promise.all(
      trackingNumbers.map(async ({ carrier, trackingNumber }) => {
        const response = await this.track({ carrier, trackingNumber });
        if (response.success && response.data) {
          updates.set(`${carrier}-${trackingNumber}`, response.data);
        }
      })
    );

    return updates;
  }

  /**
   * Clear cache for specific tracking
   */
  async clearCache(request: TrackingRequest): Promise<void> {
    const cacheKey = this.getCacheKey(request);
    await this.cache.delete(cacheKey);
    this.logger.debug('Cache cleared', { cacheKey });
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    await this.cache.clear();
    this.logger.info('All cache cleared');
  }

  /**
   * Get cache key
   */
  private getCacheKey(request: TrackingRequest): string {
    return `tracking:${request.carrier}:${request.trackingNumber}`;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get supported carriers
   */
  getSupportedCarriers(): CarrierCode[] {
    return Array.from(this.carriers.keys());
  }

  /**
   * Check if carrier is supported
   */
  isCarrierSupported(carrier: CarrierCode): boolean {
    return this.carriers.has(carrier);
  }
}