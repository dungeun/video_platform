import { RateLimitError, SocialPlatform } from '../types';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  quotaPerDay?: number;
  requestsPerSecond?: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requests: RequestRecord[] = [];
  private dailyQuotaUsed: number = 0;
  private lastQuotaReset: Date;
  private requestQueue: Promise<void> = Promise.resolve();

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.lastQuotaReset = new Date();
  }

  async checkLimit(): Promise<void> {
    // Queue requests to ensure proper rate limiting
    this.requestQueue = this.requestQueue.then(() => this.performCheck());
    await this.requestQueue;
  }

  private async performCheck(): Promise<void> {
    const now = Date.now();
    
    // Check daily quota if configured
    if (this.config.quotaPerDay) {
      this.checkDailyQuota();
    }

    // Check requests per second if configured
    if (this.config.requestsPerSecond) {
      await this.checkRequestsPerSecond();
    }

    // Check sliding window rate limit
    this.cleanOldRequests(now);
    
    const recentRequests = this.requests.reduce((sum, record) => sum + record.count, 0);
    
    if (recentRequests >= this.config.maxRequests) {
      const oldestRequest = this.requests[0];
      const retryAfter = oldestRequest.timestamp + this.config.windowMs - now;
      
      throw new RateLimitError(
        `Rate limit exceeded. Max ${this.config.maxRequests} requests per ${this.config.windowMs}ms`,
        Math.ceil(retryAfter / 1000)
      );
    }

    // Record this request
    this.recordRequest(now);
  }

  private checkDailyQuota(): void {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Reset quota if it's a new day
    if (this.lastQuotaReset < dayStart) {
      this.dailyQuotaUsed = 0;
      this.lastQuotaReset = now;
    }

    if (this.config.quotaPerDay && this.dailyQuotaUsed >= this.config.quotaPerDay) {
      const tomorrow = new Date(dayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const retryAfter = Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
      
      throw new RateLimitError(
        `Daily quota exceeded. Max ${this.config.quotaPerDay} requests per day`,
        retryAfter
      );
    }

    this.dailyQuotaUsed++;
  }

  private async checkRequestsPerSecond(): Promise<void> {
    if (!this.config.requestsPerSecond) return;

    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    const recentRequests = this.requests
      .filter(record => record.timestamp > oneSecondAgo)
      .reduce((sum, record) => sum + record.count, 0);

    if (recentRequests >= this.config.requestsPerSecond) {
      // Wait for the next second
      const waitTime = 1000 - (now % 1000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private cleanOldRequests(now: number): void {
    const cutoff = now - this.config.windowMs;
    this.requests = this.requests.filter(record => record.timestamp > cutoff);
  }

  private recordRequest(now: number): void {
    // Group requests by second to optimize memory usage
    const second = Math.floor(now / 1000) * 1000;
    const existingRecord = this.requests.find(r => r.timestamp === second);
    
    if (existingRecord) {
      existingRecord.count++;
    } else {
      this.requests.push({ timestamp: second, count: 1 });
    }
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.cleanOldRequests(now);
    
    const used = this.requests.reduce((sum, record) => sum + record.count, 0);
    return Math.max(0, this.config.maxRequests - used);
  }

  getRemainingQuota(): number | null {
    if (!this.config.quotaPerDay) return null;
    return Math.max(0, this.config.quotaPerDay - this.dailyQuotaUsed);
  }

  getResetTime(): Date {
    if (this.requests.length === 0) {
      return new Date();
    }

    const oldestRequest = this.requests[0];
    return new Date(oldestRequest.timestamp + this.config.windowMs);
  }
}