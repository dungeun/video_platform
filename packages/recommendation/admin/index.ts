import { RecommendationConfig, RecommendationMetrics, ABTestConfig } from '../src/types';

export interface RecommendationAdminConfig {
  // Algorithm configuration
  algorithms: {
    collaborative: {
      enabled: boolean;
      userSimilarityThreshold: number;
      maxNeighbors: number;
      weight: number;
      precomputeSchedule?: string; // Cron expression
    };
    contentBased: {
      enabled: boolean;
      attributeWeights: Record<string, number>;
      weight: number;
      retrainInterval?: number; // Hours
    };
    popularity: {
      enabled: boolean;
      weight: number;
      period: 'daily' | 'weekly' | 'monthly';
      updateInterval?: number; // Hours
    };
    trending: {
      enabled: boolean;
      weight: number;
      growthThreshold: number;
      analysisWindow?: number; // Days
    };
  };

  // Performance settings
  performance: {
    caching: {
      enabled: boolean;
      ttl: number; // Seconds
      maxSize: number;
      strategy: 'lru' | 'lfu' | 'ttl';
    };
    batch: {
      enabled: boolean;
      batchSize: number;
      maxWaitTime: number; // Milliseconds
    };
    precomputation: {
      enabled: boolean;
      schedules: {
        userSimilarities: string; // Cron
        itemSimilarities: string; // Cron
        popularProducts: string; // Cron
        trendingAnalysis: string; // Cron
      };
    };
  };

  // Business rules
  businessRules: {
    diversitySettings: {
      enabled: boolean;
      categoryDiversityWeight: number;
      brandDiversityWeight: number;
      maxSameCategoryRatio: number;
      maxSameBrandRatio: number;
    };
    qualityFilters: {
      minRating: number;
      minReviewCount: number;
      excludeOutOfStock: boolean;
      excludeDiscontinued: boolean;
    };
    personalizedFilters: {
      respectPriceRange: boolean;
      respectCategoryPreferences: boolean;
      respectBrandPreferences: boolean;
      ageBasedFiltering: boolean;
    };
  };

  // A/B testing
  abTesting: {
    enabled: boolean;
    tests: ABTestConfig[];
    defaultAllocation: {
      collaborative: number;
      contentBased: number;
      popularity: number;
      trending: number;
    };
  };

  // Analytics and monitoring
  analytics: {
    enabled: boolean;
    trackingEvents: {
      impressions: boolean;
      clicks: boolean;
      conversions: boolean;
      addToCarts: boolean;
      purchases: boolean;
    };
    metrics: {
      realTime: boolean;
      aggregationInterval: number; // Minutes
      retentionPeriod: number; // Days
    };
    alerts: {
      lowCtr: number; // Click-through rate threshold
      lowConversion: number; // Conversion rate threshold
      highLatency: number; // Response time threshold (ms)
      errorRate: number; // Error rate threshold
    };
  };

  // Content management
  contentManagement: {
    blacklistedProducts: string[];
    whitelistedCategories: string[];
    seasonalBoosts: {
      [category: string]: {
        startDate: string;
        endDate: string;
        boostMultiplier: number;
      };
    };
    promotionalTags: {
      [tag: string]: {
        boost: number;
        validUntil: string;
      };
    };
  };

  // Feature flags
  featureFlags: {
    enableCrossSell: boolean;
    enableUpSell: boolean;
    enableRecentlyViewed: boolean;
    enableWishlistBased: boolean;
    enableLocationBased: boolean;
    enableWeatherBased: boolean;
    enableTimeBasedBoosts: boolean;
  };
}

// Default admin configuration
export const defaultAdminConfig: RecommendationAdminConfig = {
  algorithms: {
    collaborative: {
      enabled: true,
      userSimilarityThreshold: 0.1,
      maxNeighbors: 50,
      weight: 0.3,
      precomputeSchedule: '0 2 * * *' // Daily at 2 AM
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
      weight: 0.3,
      retrainInterval: 24 // Hours
    },
    popularity: {
      enabled: true,
      weight: 0.2,
      period: 'weekly',
      updateInterval: 6 // Hours
    },
    trending: {
      enabled: true,
      weight: 0.2,
      growthThreshold: 0.2,
      analysisWindow: 7 // Days
    }
  },

  performance: {
    caching: {
      enabled: true,
      ttl: 3600, // 1 hour
      maxSize: 10000,
      strategy: 'lru'
    },
    batch: {
      enabled: true,
      batchSize: 100,
      maxWaitTime: 50
    },
    precomputation: {
      enabled: true,
      schedules: {
        userSimilarities: '0 1 * * *', // Daily at 1 AM
        itemSimilarities: '0 3 * * 0', // Weekly on Sunday at 3 AM
        popularProducts: '0 */6 * * *', // Every 6 hours
        trendingAnalysis: '0 */4 * * *' // Every 4 hours
      }
    }
  },

  businessRules: {
    diversitySettings: {
      enabled: true,
      categoryDiversityWeight: 0.1,
      brandDiversityWeight: 0.05,
      maxSameCategoryRatio: 0.4,
      maxSameBrandRatio: 0.3
    },
    qualityFilters: {
      minRating: 3.0,
      minReviewCount: 5,
      excludeOutOfStock: true,
      excludeDiscontinued: true
    },
    personalizedFilters: {
      respectPriceRange: true,
      respectCategoryPreferences: true,
      respectBrandPreferences: true,
      ageBasedFiltering: false
    }
  },

  abTesting: {
    enabled: false,
    tests: [],
    defaultAllocation: {
      collaborative: 0.3,
      contentBased: 0.3,
      popularity: 0.2,
      trending: 0.2
    }
  },

  analytics: {
    enabled: true,
    trackingEvents: {
      impressions: true,
      clicks: true,
      conversions: true,
      addToCarts: true,
      purchases: true
    },
    metrics: {
      realTime: true,
      aggregationInterval: 15, // 15 minutes
      retentionPeriod: 90 // 90 days
    },
    alerts: {
      lowCtr: 0.01, // 1%
      lowConversion: 0.005, // 0.5%
      highLatency: 1000, // 1 second
      errorRate: 0.05 // 5%
    }
  },

  contentManagement: {
    blacklistedProducts: [],
    whitelistedCategories: [],
    seasonalBoosts: {},
    promotionalTags: {}
  },

  featureFlags: {
    enableCrossSell: true,
    enableUpSell: true,
    enableRecentlyViewed: true,
    enableWishlistBased: true,
    enableLocationBased: false,
    enableWeatherBased: false,
    enableTimeBasedBoosts: true
  }
};

// Admin service for managing recommendations
export class RecommendationAdminService {
  private config: RecommendationAdminConfig;

  constructor(config: RecommendationAdminConfig = defaultAdminConfig) {
    this.config = config;
  }

  // Configuration management
  updateConfig(updates: Partial<RecommendationAdminConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }

  getConfig(): RecommendationAdminConfig {
    return { ...this.config };
  }

  validateConfig(): boolean {
    // Validate algorithm weights sum
    const { algorithms } = this.config;
    const totalWeight = algorithms.collaborative.weight +
                       algorithms.contentBased.weight +
                       algorithms.popularity.weight +
                       algorithms.trending.weight;

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      console.warn(`Algorithm weights sum to ${totalWeight}, should be 1.0`);
    }

    // Validate thresholds
    if (algorithms.collaborative.userSimilarityThreshold < 0 || 
        algorithms.collaborative.userSimilarityThreshold > 1) {
      throw new Error('User similarity threshold must be between 0 and 1');
    }

    if (algorithms.trending.growthThreshold < 0) {
      throw new Error('Growth threshold must be non-negative');
    }

    return true;
  }

  // Algorithm management
  enableAlgorithm(algorithm: keyof RecommendationAdminConfig['algorithms']): void {
    this.config.algorithms[algorithm].enabled = true;
  }

  disableAlgorithm(algorithm: keyof RecommendationAdminConfig['algorithms']): void {
    this.config.algorithms[algorithm].enabled = false;
  }

  updateAlgorithmWeight(algorithm: keyof RecommendationAdminConfig['algorithms'], weight: number): void {
    if (weight < 0 || weight > 1) {
      throw new Error('Algorithm weight must be between 0 and 1');
    }
    this.config.algorithms[algorithm].weight = weight;
  }

  // A/B testing management
  createABTest(test: ABTestConfig): void {
    this.config.abTesting.tests.push(test);
  }

  updateABTest(testId: string, updates: Partial<ABTestConfig>): void {
    const testIndex = this.config.abTesting.tests.findIndex(test => test.testId === testId);
    if (testIndex !== -1) {
      this.config.abTesting.tests[testIndex] = {
        ...this.config.abTesting.tests[testIndex],
        ...updates
      };
    }
  }

  removeABTest(testId: string): void {
    this.config.abTesting.tests = this.config.abTesting.tests.filter(
      test => test.testId !== testId
    );
  }

  // Content management
  blacklistProduct(productId: string): void {
    if (!this.config.contentManagement.blacklistedProducts.includes(productId)) {
      this.config.contentManagement.blacklistedProducts.push(productId);
    }
  }

  removeFromBlacklist(productId: string): void {
    this.config.contentManagement.blacklistedProducts = 
      this.config.contentManagement.blacklistedProducts.filter(id => id !== productId);
  }

  addSeasonalBoost(category: string, boost: {
    startDate: string;
    endDate: string;
    boostMultiplier: number;
  }): void {
    this.config.contentManagement.seasonalBoosts[category] = boost;
  }

  removeSeasonalBoost(category: string): void {
    delete this.config.contentManagement.seasonalBoosts[category];
  }

  // Feature flag management
  enableFeature(feature: keyof RecommendationAdminConfig['featureFlags']): void {
    this.config.featureFlags[feature] = true;
  }

  disableFeature(feature: keyof RecommendationAdminConfig['featureFlags']): void {
    this.config.featureFlags[feature] = false;
  }

  // Analytics and monitoring
  getMetricsSummary(): Promise<RecommendationMetrics> {
    // In a real implementation, this would fetch actual metrics
    return Promise.resolve({
      clickThroughRate: 0.15,
      conversionRate: 0.08,
      averageOrderValue: 150,
      diversity: 0.7,
      novelty: 0.6,
      coverage: 0.4
    });
  }

  getPerformanceStats(): Promise<{
    averageLatency: number;
    cacheHitRate: number;
    errorRate: number;
    throughput: number;
  }> {
    // Mock performance stats
    return Promise.resolve({
      averageLatency: 85, // ms
      cacheHitRate: 0.78,
      errorRate: 0.02,
      throughput: 1500 // requests per minute
    });
  }

  // System operations
  clearAllCaches(): Promise<void> {
    console.log('Clearing all recommendation caches...');
    return Promise.resolve();
  }

  triggerRecomputation(type: 'similarities' | 'popularity' | 'trending' | 'all'): Promise<void> {
    console.log(`Triggering ${type} recomputation...`);
    return Promise.resolve();
  }

  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfiguration(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...defaultAdminConfig, ...importedConfig };
      this.validateConfig();
    } catch (error) {
      throw new Error('Invalid configuration JSON');
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {};

    try {
      // Check cache health
      details.cache = { status: 'healthy', hitRate: 0.78 };

      // Check algorithm health
      details.algorithms = {
        collaborative: { status: this.config.algorithms.collaborative.enabled ? 'enabled' : 'disabled' },
        contentBased: { status: this.config.algorithms.contentBased.enabled ? 'enabled' : 'disabled' },
        popularity: { status: this.config.algorithms.popularity.enabled ? 'enabled' : 'disabled' },
        trending: { status: this.config.algorithms.trending.enabled ? 'enabled' : 'disabled' }
      };

      // Check performance metrics
      const perf = await this.getPerformanceStats();
      details.performance = {
        latency: perf.averageLatency < 500 ? 'good' : 'degraded',
        errorRate: perf.errorRate < 0.05 ? 'good' : 'high'
      };

      // Determine overall status
      const hasEnabledAlgorithm = Object.values(this.config.algorithms).some(alg => alg.enabled);
      const isPerformanceGood = perf.averageLatency < 1000 && perf.errorRate < 0.1;

      if (!hasEnabledAlgorithm) {
        return { status: 'unhealthy', details };
      } else if (!isPerformanceGood) {
        return { status: 'degraded', details };
      } else {
        return { status: 'healthy', details };
      }

    } catch (error) {
      details.error = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'unhealthy', details };
    }
  }
}

// Export the admin service instance
export const adminService = new RecommendationAdminService();