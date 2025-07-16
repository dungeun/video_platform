/**
 * Webhook handler for delivery status updates
 */

import { Logger, EventEmitter } from '@repo/core';
import { HttpClient } from '@repo/api-client';
import pRetry from 'p-retry';
import { WebhookEvent, WebhookEventType, CarrierCode } from '../../types';

export interface WebhookHandlerConfig {
  endpoints: WebhookEndpoint[];
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  secret?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  carriers?: CarrierCode[];
  headers?: Record<string, string>;
  active: boolean;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  attempts: number;
  status: 'pending' | 'success' | 'failed';
  lastAttempt?: Date;
  response?: {
    status: number;
    data?: any;
  };
  error?: string;
}

export class WebhookHandler extends EventEmitter {
  private logger: Logger;
  private client: HttpClient;
  private endpoints: Map<string, WebhookEndpoint>;
  private deliveries: Map<string, WebhookDelivery>;

  constructor(private config: WebhookHandlerConfig) {
    super();
    this.logger = new Logger('WebhookHandler');
    this.endpoints = new Map();
    this.deliveries = new Map();

    this.client = new HttpClient({
      timeout: config.timeout || 30000
    });

    this.initializeEndpoints();
  }

  /**
   * Initialize webhook endpoints
   */
  private initializeEndpoints(): void {
    this.config.endpoints.forEach(endpoint => {
      if (endpoint.active) {
        this.endpoints.set(endpoint.id, endpoint);
      }
    });

    this.logger.info('Webhook endpoints initialized', {
      count: this.endpoints.size
    });
  }

  /**
   * Handle webhook event
   */
  async handleEvent(event: WebhookEvent): Promise<void> {
    const eligibleEndpoints = this.getEligibleEndpoints(event);

    if (eligibleEndpoints.length === 0) {
      this.logger.debug('No eligible endpoints for event', {
        eventType: event.type,
        carrier: event.carrier
      });
      return;
    }

    // Send to all eligible endpoints
    await Promise.all(
      eligibleEndpoints.map(endpoint => 
        this.sendToEndpoint(endpoint, event)
      )
    );
  }

  /**
   * Send event to endpoint
   */
  private async sendToEndpoint(
    endpoint: WebhookEndpoint,
    event: WebhookEvent
  ): Promise<void> {
    const delivery: WebhookDelivery = {
      id: this.generateDeliveryId(),
      endpointId: endpoint.id,
      event,
      attempts: 0,
      status: 'pending'
    };

    this.deliveries.set(delivery.id, delivery);

    try {
      await pRetry(
        async () => {
          delivery.attempts++;
          delivery.lastAttempt = new Date();

          const response = await this.client.post(endpoint.url, {
            event,
            timestamp: new Date().toISOString(),
            signature: this.generateSignature(event)
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Event': event.type,
              'X-Webhook-Signature': event.signature,
              ...endpoint.headers
            }
          });

          // Check if response is successful
          if (response.status >= 200 && response.status < 300) {
            delivery.status = 'success';
            delivery.response = {
              status: response.status,
              data: response.data
            };

            this.logger.info('Webhook delivered successfully', {
              deliveryId: delivery.id,
              endpointId: endpoint.id,
              eventType: event.type
            });

            this.emit('webhook:delivered', delivery);
          } else {
            throw new Error(`Webhook failed with status ${response.status}`);
          }
        },
        {
          retries: this.config.maxRetries || 3,
          minTimeout: this.config.retryDelay || 1000,
          maxTimeout: 30000,
          onFailedAttempt: (error) => {
            this.logger.warn('Webhook delivery attempt failed', {
              deliveryId: delivery.id,
              attempt: error.attemptNumber,
              error: error.message
            });
          }
        }
      );
    } catch (error: any) {
      delivery.status = 'failed';
      delivery.error = error.message;

      this.logger.error('Webhook delivery failed', {
        deliveryId: delivery.id,
        endpointId: endpoint.id,
        error: error.message
      });

      this.emit('webhook:failed', delivery);
    }

    this.deliveries.set(delivery.id, delivery);
  }

  /**
   * Get eligible endpoints for event
   */
  private getEligibleEndpoints(event: WebhookEvent): WebhookEndpoint[] {
    return Array.from(this.endpoints.values()).filter(endpoint => {
      // Check if endpoint handles this event type
      if (!endpoint.events.includes(event.type)) {
        return false;
      }

      // Check if endpoint handles this carrier
      if (endpoint.carriers && !endpoint.carriers.includes(event.carrier)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Register new endpoint
   */
  registerEndpoint(endpoint: WebhookEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint);
    this.logger.info('Webhook endpoint registered', { endpointId: endpoint.id });
    this.emit('endpoint:registered', endpoint);
  }

  /**
   * Unregister endpoint
   */
  unregisterEndpoint(endpointId: string): void {
    this.endpoints.delete(endpointId);
    this.logger.info('Webhook endpoint unregistered', { endpointId });
    this.emit('endpoint:unregistered', endpointId);
  }

  /**
   * Update endpoint
   */
  updateEndpoint(endpointId: string, updates: Partial<WebhookEndpoint>): void {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    const updated = { ...endpoint, ...updates };
    this.endpoints.set(endpointId, updated);
    
    this.logger.info('Webhook endpoint updated', { endpointId });
    this.emit('endpoint:updated', updated);
  }

  /**
   * Get endpoint
   */
  getEndpoint(endpointId: string): WebhookEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  /**
   * Get all endpoints
   */
  getAllEndpoints(): WebhookEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(filters?: {
    endpointId?: string;
    status?: 'pending' | 'success' | 'failed';
    eventType?: WebhookEventType;
    limit?: number;
  }): WebhookDelivery[] {
    let deliveries = Array.from(this.deliveries.values());

    if (filters) {
      if (filters.endpointId) {
        deliveries = deliveries.filter(d => d.endpointId === filters.endpointId);
      }
      if (filters.status) {
        deliveries = deliveries.filter(d => d.status === filters.status);
      }
      if (filters.eventType) {
        deliveries = deliveries.filter(d => d.event.type === filters.eventType);
      }
      if (filters.limit) {
        deliveries = deliveries.slice(-filters.limit);
      }
    }

    return deliveries;
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery || delivery.status !== 'failed') {
      throw new Error('Delivery not found or not in failed state');
    }

    const endpoint = this.endpoints.get(delivery.endpointId);
    if (!endpoint) {
      throw new Error('Endpoint not found');
    }

    await this.sendToEndpoint(endpoint, delivery.event);
  }

  /**
   * Clear delivery history
   */
  clearDeliveryHistory(olderThan?: Date): void {
    if (olderThan) {
      this.deliveries.forEach((delivery, id) => {
        if (delivery.lastAttempt && delivery.lastAttempt < olderThan) {
          this.deliveries.delete(id);
        }
      });
    } else {
      this.deliveries.clear();
    }

    this.logger.info('Delivery history cleared');
  }

  /**
   * Generate delivery ID
   */
  private generateDeliveryId(): string {
    return `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate signature
   */
  private generateSignature(event: WebhookEvent): string {
    if (!this.config.secret) {
      return event.signature;
    }

    // In production, use proper HMAC-SHA256
    const payload = JSON.stringify({
      id: event.id,
      type: event.type,
      carrier: event.carrier,
      trackingNumber: event.trackingNumber,
      timestamp: event.timestamp
    });

    return Buffer.from(payload + this.config.secret).toString('base64');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string): boolean {
    const expected = this.generateSignature(payload);
    return signature === expected;
  }

  /**
   * Get webhook statistics
   */
  getStatistics(): {
    endpoints: number;
    deliveries: {
      total: number;
      success: number;
      failed: number;
      pending: number;
    };
    byEventType: Record<WebhookEventType, number>;
  } {
    const deliveries = Array.from(this.deliveries.values());
    const byEventType: Record<string, number> = {};

    deliveries.forEach(delivery => {
      byEventType[delivery.event.type] = (byEventType[delivery.event.type] || 0) + 1;
    });

    return {
      endpoints: this.endpoints.size,
      deliveries: {
        total: deliveries.length,
        success: deliveries.filter(d => d.status === 'success').length,
        failed: deliveries.filter(d => d.status === 'failed').length,
        pending: deliveries.filter(d => d.status === 'pending').length
      },
      byEventType: byEventType as Record<WebhookEventType, number>
    };
  }
}