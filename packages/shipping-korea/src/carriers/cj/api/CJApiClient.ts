/**
 * CJ대한통운 API Client
 */

import { HttpClient } from '@company/api-client';
import { Logger } from '@company/core';
import { 
  TrackingInfo, 
  ShippingCostRequest, 
  ShippingCostResponse,
  ApiResponse,
  ApiError,
  DeliveryStatus
} from '../../../types';
import { 
  CJApiConfig, 
  CJTrackingRequest, 
  CJTrackingResponse,
  CJCostRequest,
  CJCostResponse,
  CJ_STATUS_MAP
} from '../types';

export class CJApiClient {
  private client: HttpClient;
  private logger: Logger;
  private config: CJApiConfig;

  constructor(config: CJApiConfig) {
    this.config = config;
    this.logger = new Logger('CJApiClient');
    
    this.client = new HttpClient({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': config.apiKey,
        'X-API-SECRET': config.apiSecret
      }
    });
  }

  /**
   * Track shipment
   */
  async track(trackingNumber: string): Promise<ApiResponse<TrackingInfo>> {
    try {
      const request: CJTrackingRequest = {
        slipNo: trackingNumber
      };

      const response = await this.client.post<CJTrackingResponse>(
        '/tracking/v1/search',
        request
      );

      if (response.data.result !== 'Y') {
        return {
          success: false,
          error: {
            code: 'TRACKING_NOT_FOUND',
            message: response.data.message,
            retryable: false
          },
          timestamp: new Date(),
          requestId: this.generateRequestId()
        };
      }

      const trackingInfo = this.mapTrackingResponse(
        trackingNumber,
        response.data
      );

      return {
        success: true,
        data: trackingInfo,
        timestamp: new Date(),
        requestId: this.generateRequestId()
      };
    } catch (error) {
      this.logger.error('Track shipment failed', error);
      return {
        success: false,
        error: this.mapError(error),
        timestamp: new Date(),
        requestId: this.generateRequestId()
      };
    }
  }

  /**
   * Calculate shipping cost
   */
  async calculateCost(
    request: ShippingCostRequest
  ): Promise<ApiResponse<ShippingCostResponse>> {
    try {
      const cjRequest: CJCostRequest = {
        sndZipNo: request.origin.postalCode,
        rcvZipNo: request.destination.postalCode,
        itemWeight: request.package.weight,
        itemQty: 1,
        itemWidth: request.package.dimensions.width,
        itemLength: request.package.dimensions.length,
        itemHeight: request.package.dimensions.height
      };

      const response = await this.client.post<CJCostResponse>(
        '/fare/v1/calculate',
        cjRequest
      );

      if (response.data.result !== 'Y') {
        return {
          success: false,
          error: {
            code: 'COST_CALCULATION_FAILED',
            message: response.data.message,
            retryable: false
          },
          timestamp: new Date(),
          requestId: this.generateRequestId()
        };
      }

      const costResponse = this.mapCostResponse(request, response.data);

      return {
        success: true,
        data: costResponse,
        timestamp: new Date(),
        requestId: this.generateRequestId()
      };
    } catch (error) {
      this.logger.error('Calculate cost failed', error);
      return {
        success: false,
        error: this.mapError(error),
        timestamp: new Date(),
        requestId: this.generateRequestId()
      };
    }
  }

  /**
   * Map CJ tracking response to standard format
   */
  private mapTrackingResponse(
    trackingNumber: string,
    response: CJTrackingResponse
  ): TrackingInfo {
    const results = response.parcelResultMap.resultList;
    const latest = results[results.length - 1];
    
    return {
      carrier: 'CJ',
      trackingNumber,
      status: this.mapStatus(latest.crgSt),
      currentLocation: latest.nowLoc,
      recipient: {
        name: latest.rcvrNm,
        phone: latest.telno1
      },
      product: {
        name: latest.crgNm,
        quantity: 1
      },
      history: results.map(result => ({
        timestamp: new Date(result.dlvyDTime),
        status: this.mapStatus(result.crgSt),
        location: result.nowLoc,
        description: result.scanNm,
        branch: {
          code: '',
          name: result.rgmeBranNm
        }
      }))
    };
  }

  /**
   * Map CJ cost response to standard format
   */
  private mapCostResponse(
    request: ShippingCostRequest,
    response: CJCostResponse
  ): ShippingCostResponse {
    const fare = response.fare;
    const additionalCharges = [];

    if (fare.distFare > 0) {
      additionalCharges.push({
        type: 'REMOTE_AREA' as const,
        amount: fare.distFare,
        description: '원거리 할증'
      });
    }

    if (fare.sizeFare > 0) {
      additionalCharges.push({
        type: 'OVERSIZE' as const,
        amount: fare.sizeFare,
        description: '부피 할증'
      });
    }

    return {
      carrier: 'CJ',
      service: request.service,
      baseCost: fare.basicFare,
      additionalCharges,
      totalCost: fare.totalFare,
      currency: 'KRW',
      estimatedDays: this.getEstimatedDays(request.service),
      cutoffTime: '18:00'
    };
  }

  /**
   * Map CJ status to standard status
   */
  private mapStatus(cjStatus: string): DeliveryStatus {
    const mapped = CJ_STATUS_MAP[cjStatus];
    return (mapped as DeliveryStatus) || 'PENDING';
  }

  /**
   * Get estimated delivery days
   */
  private getEstimatedDays(service: string): number {
    switch (service) {
      case 'EXPRESS':
        return 1;
      case 'SAME_DAY':
        return 0;
      case 'DAWN':
        return 1;
      default:
        return 2;
    }
  }

  /**
   * Map error to API error
   */
  private mapError(error: any): ApiError {
    if (error.response) {
      return {
        code: error.response.data?.code || 'API_ERROR',
        message: error.response.data?.message || 'API request failed',
        details: error.response.data,
        retryable: error.response.status >= 500
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network request failed',
      retryable: true
    };
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `cj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}