/**
 * Cache manager for shipping data
 */

import { CacheManager } from '@company/cache';
import { Logger } from '@company/core';

export class ShippingCacheManager extends CacheManager {
  private logger: Logger;

  constructor() {
    super({ ttl: 300000, maxSize: 1000 });
    this.logger = new Logger('ShippingCacheManager');
  }
}