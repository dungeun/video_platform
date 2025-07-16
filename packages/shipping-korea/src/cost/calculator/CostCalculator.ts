/**
 * Shipping cost calculator for all carriers
 */

import { Logger } from '@company/core';
import { 
  ShippingCostRequest,
  ShippingCostResponse,
  ApiResponse,
  CarrierCode,
  ShippingService,
  ChargeType
} from '../../types';
import { CJApiClient } from '../../carriers/cj/api/CJApiClient';

export interface CostCalculatorConfig {
  carriers: {
    cj?: any;
    hanjin?: any;
    lotte?: any;
    postOffice?: any;
    logen?: any;
  };
  rules?: CostRuleConfig[];
}

export interface CostRuleConfig {
  carrier: CarrierCode;
  service: ShippingService;
  rules: CostRule[];
}

export interface CostRule {
  type: 'WEIGHT' | 'DIMENSION' | 'DISTANCE' | 'ZONE';
  condition: any;
  charge: {
    type: ChargeType;
    amount: number | ((value: number) => number);
    description: string;
  };
}

export class CostCalculator {
  private logger: Logger;
  private carriers: Map<CarrierCode, any>;
  private rules: Map<string, CostRule[]>;

  constructor(private config: CostCalculatorConfig) {
    this.logger = new Logger('CostCalculator');
    this.initializeCarriers();
    this.initializeRules();
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
  }

  /**
   * Initialize cost rules
   */
  private initializeRules(): void {
    this.rules = new Map();

    if (this.config.rules) {
      this.config.rules.forEach(ruleConfig => {
        const key = `${ruleConfig.carrier}-${ruleConfig.service}`;
        this.rules.set(key, ruleConfig.rules);
      });
    }
  }

  /**
   * Calculate shipping cost
   */
  async calculate(
    request: ShippingCostRequest
  ): Promise<ApiResponse<ShippingCostResponse>> {
    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: validation.message!,
          retryable: false
        },
        timestamp: new Date(),
        requestId: this.generateRequestId()
      };
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

    try {
      // Get base cost from carrier API
      const response = await client.calculateCost(request);

      if (response.success && response.data) {
        // Apply additional rules
        const updatedCost = this.applyRules(request, response.data);
        response.data = updatedCost;
      }

      return response;
    } catch (error) {
      this.logger.error('Cost calculation failed', error);
      return {
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate shipping cost',
          retryable: true
        },
        timestamp: new Date(),
        requestId: this.generateRequestId()
      };
    }
  }

  /**
   * Compare costs across carriers
   */
  async compareCosts(
    request: Omit<ShippingCostRequest, 'carrier'>
  ): Promise<ShippingCostResponse[]> {
    const carriers = Array.from(this.carriers.keys());
    const results: ShippingCostResponse[] = [];

    await Promise.all(
      carriers.map(async (carrier) => {
        const response = await this.calculate({
          ...request,
          carrier
        });

        if (response.success && response.data) {
          results.push(response.data);
        }
      })
    );

    // Sort by total cost
    return results.sort((a, b) => a.totalCost - b.totalCost);
  }

  /**
   * Apply custom rules to cost
   */
  private applyRules(
    request: ShippingCostRequest,
    cost: ShippingCostResponse
  ): ShippingCostResponse {
    const key = `${request.carrier}-${request.service}`;
    const rules = this.rules.get(key);

    if (!rules) {
      return cost;
    }

    const additionalCharges = [...cost.additionalCharges];

    rules.forEach(rule => {
      if (this.evaluateRule(rule, request)) {
        const charge = this.calculateCharge(rule, request);
        additionalCharges.push(charge);
      }
    });

    const totalCost = cost.baseCost + 
      additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);

    return {
      ...cost,
      additionalCharges,
      totalCost
    };
  }

  /**
   * Evaluate if rule applies
   */
  private evaluateRule(rule: CostRule, request: ShippingCostRequest): boolean {
    switch (rule.type) {
      case 'WEIGHT':
        return this.evaluateWeightRule(rule.condition, request.package.weight);
      case 'DIMENSION':
        return this.evaluateDimensionRule(rule.condition, request.package.dimensions);
      case 'DISTANCE':
        return this.evaluateDistanceRule(rule.condition, request);
      case 'ZONE':
        return this.evaluateZoneRule(rule.condition, request);
      default:
        return false;
    }
  }

  /**
   * Evaluate weight rule
   */
  private evaluateWeightRule(condition: any, weight: number): boolean {
    if (condition.min !== undefined && weight < condition.min) return false;
    if (condition.max !== undefined && weight > condition.max) return false;
    return true;
  }

  /**
   * Evaluate dimension rule
   */
  private evaluateDimensionRule(condition: any, dimensions: any): boolean {
    const volume = dimensions.length * dimensions.width * dimensions.height;
    const girth = 2 * (dimensions.width + dimensions.height);
    const longestSide = Math.max(dimensions.length, dimensions.width, dimensions.height);

    if (condition.maxVolume && volume > condition.maxVolume) return true;
    if (condition.maxGirth && girth > condition.maxGirth) return true;
    if (condition.maxLength && longestSide > condition.maxLength) return true;

    return false;
  }

  /**
   * Evaluate distance rule
   */
  private evaluateDistanceRule(condition: any, request: ShippingCostRequest): boolean {
    // Check if destination is in remote area
    const remoteAreas = condition.remotePostalCodes || [];
    return remoteAreas.some((pattern: string) => 
      request.destination.postalCode.startsWith(pattern)
    );
  }

  /**
   * Evaluate zone rule
   */
  private evaluateZoneRule(condition: any, request: ShippingCostRequest): boolean {
    // Check delivery zone
    const zone = this.getDeliveryZone(
      request.origin.postalCode,
      request.destination.postalCode
    );
    return condition.zones?.includes(zone);
  }

  /**
   * Calculate charge amount
   */
  private calculateCharge(rule: CostRule, request: ShippingCostRequest): any {
    let amount = 0;

    if (typeof rule.charge.amount === 'function') {
      amount = rule.charge.amount(this.getChargeBase(rule, request));
    } else {
      amount = rule.charge.amount;
    }

    return {
      type: rule.charge.type,
      amount,
      description: rule.charge.description
    };
  }

  /**
   * Get base value for charge calculation
   */
  private getChargeBase(rule: CostRule, request: ShippingCostRequest): number {
    switch (rule.type) {
      case 'WEIGHT':
        return request.package.weight;
      case 'DIMENSION':
        const dims = request.package.dimensions;
        return dims.length * dims.width * dims.height;
      default:
        return 0;
    }
  }

  /**
   * Get delivery zone
   */
  private getDeliveryZone(origin: string, destination: string): string {
    // Simplified zone calculation based on postal codes
    const originPrefix = origin.substring(0, 2);
    const destPrefix = destination.substring(0, 2);

    if (originPrefix === destPrefix) return 'SAME_CITY';
    if (Math.abs(parseInt(originPrefix) - parseInt(destPrefix)) <= 10) return 'NEARBY';
    return 'REMOTE';
  }

  /**
   * Validate request
   */
  private validateRequest(request: ShippingCostRequest): { valid: boolean; message?: string } {
    if (!request.carrier || !request.service) {
      return { valid: false, message: 'Carrier and service are required' };
    }

    if (!request.origin?.postalCode || !request.destination?.postalCode) {
      return { valid: false, message: 'Origin and destination postal codes are required' };
    }

    if (!request.package?.weight || request.package.weight <= 0) {
      return { valid: false, message: 'Package weight must be greater than 0' };
    }

    if (!request.package?.dimensions) {
      return { valid: false, message: 'Package dimensions are required' };
    }

    return { valid: true };
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}