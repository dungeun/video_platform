import { Module, ModuleConfig } from '@revu/types';
import { Logger } from '@revu/logger';
import { EventBus } from '@revu/event-bus';
import { MonitoringService } from '@revu/monitoring';
import { CacheService } from '@revu/cache';
import { MatchingService } from './services/matching.service';
import { ScoringService } from './services/scoring.service';
import { CompatibilityService } from './services/compatibility.service';
import { RecommendationService } from './services/recommendation.service';
import { OptimizationService } from './services/optimization.service';

export class MatchingAlgorithmModule implements Module {
  name = 'matching-algorithm';
  version = '1.0.0';
  
  private logger: Logger;
  private matchingService: MatchingService;
  private scoringService: ScoringService;
  private compatibilityService: CompatibilityService;
  private recommendationService: RecommendationService;
  private optimizationService: OptimizationService;
  
  private config = {
    modelUpdateInterval: 86400000, // 24 hours
    cacheEnabled: true,
    cacheTTL: 3600, // 1 hour
    maxRecommendations: 100,
    minConfidenceScore: 0.6
  };

  constructor(
    private eventBus: EventBus,
    private monitoring: MonitoringService,
    private cache: CacheService,
    config?: Partial<any>
  ) {
    this.logger = new Logger('MatchingAlgorithmModule');
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Matching Algorithm module');
    
    try {
      // Initialize services
      this.scoringService = new ScoringService(this.eventBus);
      this.compatibilityService = new CompatibilityService(this.eventBus);
      
      this.matchingService = new MatchingService(
        this.eventBus,
        this.monitoring,
        this.cache,
        this.scoringService,
        this.compatibilityService,
        null as any // recommendationService will be set after
      );

      this.recommendationService = new RecommendationService(
        this.eventBus,
        this.cache,
        this.matchingService
      );

      // Set recommendation service in matching service
      (this.matchingService as any).recommendationService = this.recommendationService;

      this.optimizationService = new OptimizationService(
        this.eventBus,
        this.matchingService
      );

      // Initialize matching service
      await this.matchingService.initialize();

      // Register event handlers
      this.registerEventHandlers();

      // Start scheduled tasks
      this.startScheduledTasks();

      this.logger.info('Matching Algorithm module initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Matching Algorithm module', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    this.logger.info('Starting Matching Algorithm module');
    
    // Start monitoring
    this.monitoring.trackMetric('matching.module.started', 1);
    
    // Emit module started event
    await this.eventBus.emit('module.matching.started', {
      module: this.name,
      version: this.version
    });
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Matching Algorithm module');
    
    // Stop scheduled tasks
    this.stopScheduledTasks();
    
    // Cleanup resources
    await this.cleanup();
    
    // Emit module stopped event
    await this.eventBus.emit('module.matching.stopped', {
      module: this.name
    });
  }

  async health(): Promise<{ status: string; details?: any }> {
    try {
      // Check service health
      const modelPerformance = this.scoringService.getModelPerformance();
      const cacheStats = await this.cache.getStats();

      const isHealthy = 
        modelPerformance.accuracy > 0.7 &&
        cacheStats.hitRate > 0.5;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          modelPerformance,
          cacheStats,
          config: this.config,
          uptime: process.uptime()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  getConfig(): ModuleConfig {
    return {
      matching: this.config
    };
  }

  /**
   * Get service instances for external use
   */
  getServices() {
    return {
      matching: this.matchingService,
      scoring: this.scoringService,
      compatibility: this.compatibilityService,
      recommendation: this.recommendationService,
      optimization: this.optimizationService
    };
  }

  private registerEventHandlers(): void {
    // Handle new brand registration
    this.eventBus.on('brand.created', async (data) => {
      try {
        await this.initializeBrandMatching(data.brandId);
      } catch (error) {
        this.logger.error('Failed to initialize brand matching', error);
      }
    });

    // Handle new influencer registration
    this.eventBus.on('influencer.created', async (data) => {
      try {
        await this.updateInfluencerIndex(data.influencerId);
      } catch (error) {
        this.logger.error('Failed to update influencer index', error);
      }
    });

    // Handle campaign completion for model training
    this.eventBus.on('campaign.completed', async (data) => {
      try {
        await this.updateModelWithCampaignData(data);
      } catch (error) {
        this.logger.error('Failed to update model with campaign data', error);
      }
    });

    // Handle match feedback
    this.eventBus.on('match.feedback.received', async (data) => {
      try {
        await this.matchingService.updateMatchScore(
          data.matchId,
          data.feedback
        );
      } catch (error) {
        this.logger.error('Failed to process match feedback', error);
      }
    });

    // Handle analytics updates
    this.eventBus.on('analytics.influencer.updated', async (data) => {
      try {
        await this.refreshInfluencerScores(data.influencerId);
      } catch (error) {
        this.logger.error('Failed to refresh influencer scores', error);
      }
    });
  }

  private startScheduledTasks(): void {
    // Periodically update model
    setInterval(async () => {
      try {
        await this.updateMatchingModel();
      } catch (error) {
        this.logger.error('Failed to update matching model', error);
      }
    }, this.config.modelUpdateInterval);

    // Clean up old cache entries
    setInterval(async () => {
      try {
        await this.cleanupCache();
      } catch (error) {
        this.logger.error('Failed to cleanup cache', error);
      }
    }, 3600000); // Every hour
  }

  private stopScheduledTasks(): void {
    // Clear all intervals
  }

  private async cleanup(): Promise<void> {
    // Cleanup resources
  }

  private async initializeBrandMatching(brandId: string): Promise<void> {
    this.logger.info('Initializing brand matching', { brandId });
    
    // Pre-calculate initial recommendations
    await this.recommendationService.refreshRecommendations(brandId);
  }

  private async updateInfluencerIndex(influencerId: string): Promise<void> {
    this.logger.info('Updating influencer index', { influencerId });
    
    // Update search index and clear related caches
    await this.cache.invalidatePattern(`*:${influencerId}:*`);
  }

  private async updateModelWithCampaignData(data: any): Promise<void> {
    this.logger.info('Updating model with campaign data', { campaignId: data.campaignId });
    
    // Extract performance data and update model
    const feedback = data.performance > 80 ? 'positive' : 
                    data.performance < 50 ? 'negative' : 'neutral';
    
    await this.matchingService.updateMatchScore(data.matchId, feedback);
  }

  private async refreshInfluencerScores(influencerId: string): Promise<void> {
    this.logger.info('Refreshing influencer scores', { influencerId });
    
    // Invalidate cached scores
    await this.cache.invalidatePattern(`*:${influencerId}:*`);
  }

  private async updateMatchingModel(): Promise<void> {
    this.logger.info('Updating matching model');
    
    // Retrain model with latest data
    await this.matchingService.initialize();
    
    this.monitoring.trackMetric('matching.model.updated', 1);
  }

  private async cleanupCache(): Promise<void> {
    this.logger.info('Cleaning up cache');
    
    // Remove expired entries
    const stats = await this.cache.cleanup();
    
    this.monitoring.trackMetric('matching.cache.cleaned', stats.removed);
  }
}