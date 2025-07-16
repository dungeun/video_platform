import { 
  RecommendationRequest, 
  RecommendationResponse, 
  Recommendation, 
  RecommendationConfig,
  RecommendationAlgorithm,
  User,
  Product,
  UserBehavior,
  RecommendationMetrics
} from '../types';
import { CollaborativeFiltering } from './CollaborativeFiltering';
import { ContentBasedFiltering } from './ContentBasedFiltering';
import { StorageManager } from '@modules/storage';

export class RecommendationService {
  private collaborativeFiltering: CollaborativeFiltering;
  private contentBasedFiltering: ContentBasedFiltering;
  private storage: StorageManager;
  private config: RecommendationConfig;
  private cache: Map<string, { data: RecommendationResponse; timestamp: number }>;

  constructor(config: RecommendationConfig) {
    this.config = config;
    this.collaborativeFiltering = new CollaborativeFiltering();
    this.contentBasedFiltering = new ContentBasedFiltering();
    this.storage = new StorageManager('recommendation');
    this.cache = new Map();
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    if (this.config.caching.enabled) {
      const cached = this.getCachedRecommendations(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheHit: true,
            executionTime: Date.now() - startTime
          }
        };
      }
    }

    try {
      const recommendations = await this.generateRecommendations(request);
      
      const response: RecommendationResponse = {
        recommendations: recommendations.slice(0, request.limit),
        metadata: {
          totalCount: recommendations.length,
          algorithm: request.algorithm || 'hybrid',
          executionTime: Date.now() - startTime,
          cacheHit: false
        }
      };

      // Cache the response
      if (this.config.caching.enabled) {
        this.cacheRecommendations(cacheKey, response);
      }

      return response;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Generate recommendations using specified algorithm or hybrid approach
   */
  private async generateRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    const algorithm = request.algorithm || 'hybrid';
    let recommendations: Recommendation[] = [];

    switch (algorithm) {
      case 'collaborative':
        recommendations = await this.getCollaborativeRecommendations(request);
        break;
      case 'content_based':
        recommendations = await this.getContentBasedRecommendations(request);
        break;
      case 'popularity':
        recommendations = await this.getPopularRecommendations(request);
        break;
      case 'trending':
        recommendations = await this.getTrendingRecommendations(request);
        break;
      case 'hybrid':
      default:
        recommendations = await this.getHybridRecommendations(request);
        break;
    }

    // Apply business rules and filters
    recommendations = this.applyBusinessRules(recommendations, request);
    
    // Sort by score and remove duplicates
    return this.deduplicateAndSort(recommendations);
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    if (!this.config.algorithms.collaborative.enabled) {
      return [];
    }

    const user = await this.getUserData(request.userId);
    const userBehaviors = await this.getUserBehaviors(request.userId);
    
    return this.collaborativeFiltering.getRecommendations(
      user,
      userBehaviors,
      request.limit * 2 // Get more for filtering
    );
  }

  /**
   * Get content-based filtering recommendations
   */
  private async getContentBasedRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    if (!this.config.algorithms.contentBased.enabled) {
      return [];
    }

    const user = await this.getUserData(request.userId);
    const products = await this.getProducts(request.category);
    
    return this.contentBasedFiltering.getRecommendations(
      user,
      products,
      request.productId,
      request.limit * 2
    );
  }

  /**
   * Get popular products as recommendations
   */
  private async getPopularRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    if (!this.config.algorithms.popularity.enabled) {
      return [];
    }

    const popularProducts = await this.getPopularProducts(
      request.category,
      this.config.algorithms.popularity.period
    );

    return popularProducts.map((product, index) => ({
      productId: product.id,
      product,
      score: 1 - (index / popularProducts.length), // Decreasing score by popularity rank
      reason: {
        type: 'popular',
        explanation: 'This product is popular among other customers',
        confidence: 0.8,
        factors: ['high_purchase_rate', 'good_ratings']
      },
      algorithm: 'popularity'
    }));
  }

  /**
   * Get trending products as recommendations
   */
  private async getTrendingRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    if (!this.config.algorithms.trending.enabled) {
      return [];
    }

    const trendingProducts = await this.getTrendingProducts(
      request.category,
      this.config.algorithms.trending.growthThreshold
    );

    return trendingProducts.map((trendingProduct, index) => ({
      productId: trendingProduct.productId,
      product: trendingProduct.product,
      score: trendingProduct.trendScore,
      reason: {
        type: 'trending',
        explanation: `This product is trending with ${trendingProduct.growthRate}% growth`,
        confidence: 0.7,
        factors: ['high_growth_rate', 'increasing_views']
      },
      algorithm: 'trending'
    }));
  }

  /**
   * Get hybrid recommendations combining multiple algorithms
   */
  private async getHybridRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Get recommendations from each enabled algorithm
    const [collaborative, contentBased, popular, trending] = await Promise.all([
      this.getCollaborativeRecommendations(request),
      this.getContentBasedRecommendations(request),
      this.getPopularRecommendations(request),
      this.getTrendingRecommendations(request)
    ]);

    // Apply weights and combine
    const weightedRecommendations = [
      ...collaborative.map(rec => ({ ...rec, score: rec.score * this.config.algorithms.collaborative.weight })),
      ...contentBased.map(rec => ({ ...rec, score: rec.score * this.config.algorithms.contentBased.weight })),
      ...popular.map(rec => ({ ...rec, score: rec.score * this.config.algorithms.popularity.weight })),
      ...trending.map(rec => ({ ...rec, score: rec.score * this.config.algorithms.trending.weight }))
    ];

    return weightedRecommendations;
  }

  /**
   * Apply business rules and filters
   */
  private applyBusinessRules(recommendations: Recommendation[], request: RecommendationRequest): Recommendation[] {
    let filtered = recommendations;

    // Exclude specified products
    if (request.excludeProductIds?.length) {
      filtered = filtered.filter(rec => !request.excludeProductIds!.includes(rec.productId));
    }

    // Apply category filter
    if (request.category) {
      filtered = filtered.filter(rec => rec.product.category === request.category);
    }

    // Apply minimum score threshold
    filtered = filtered.filter(rec => rec.score > 0.1);

    return filtered;
  }

  /**
   * Remove duplicates and sort by score
   */
  private deduplicateAndSort(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    const unique = recommendations.filter(rec => {
      if (seen.has(rec.productId)) {
        return false;
      }
      seen.add(rec.productId);
      return true;
    });

    return unique.sort((a, b) => b.score - a.score);
  }

  /**
   * Get fallback recommendations when main algorithms fail
   */
  private async getFallbackRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    let recommendations: Recommendation[] = [];

    if (this.config.fallback.usePopular) {
      const popularProducts = await this.getPopularProducts(request.category, 'weekly');
      recommendations = popularProducts.slice(0, request.limit).map((product, index) => ({
        productId: product.id,
        product,
        score: 1 - (index / popularProducts.length),
        reason: {
          type: 'popular',
          explanation: 'Fallback to popular products',
          confidence: 0.5,
          factors: ['fallback_mode']
        },
        algorithm: 'popularity'
      }));
    }

    if (recommendations.length < this.config.fallback.minRecommendations && this.config.fallback.useRandom) {
      const randomProducts = await this.getRandomProducts(
        this.config.fallback.minRecommendations - recommendations.length,
        request.category
      );
      
      const randomRecommendations = randomProducts.map(product => ({
        productId: product.id,
        product,
        score: Math.random() * 0.5,
        reason: {
          type: 'popular' as const,
          explanation: 'Random product selection',
          confidence: 0.3,
          factors: ['random_fallback']
        },
        algorithm: 'popularity' as RecommendationAlgorithm
      }));

      recommendations = [...recommendations, ...randomRecommendations];
    }

    return {
      recommendations: recommendations.slice(0, request.limit),
      metadata: {
        totalCount: recommendations.length,
        algorithm: 'popularity',
        executionTime: 0,
        cacheHit: false
      }
    };
  }

  /**
   * Track user interaction with recommendations
   */
  async trackInteraction(userId: string, productId: string, interactionType: 'view' | 'click' | 'purchase'): Promise<void> {
    const behavior: UserBehavior = {
      type: interactionType === 'purchase' ? 'purchase' : 'view',
      productId,
      timestamp: new Date(),
      context: { source: 'recommendation' }
    };

    await this.storage.append(`user_behaviors_${userId}`, behavior);
  }

  /**
   * Get recommendation metrics
   */
  async getMetrics(timeRange: { start: Date; end: Date }): Promise<RecommendationMetrics> {
    // This would typically query analytics data
    return {
      clickThroughRate: 0.15,
      conversionRate: 0.08,
      averageOrderValue: 150,
      diversity: 0.7,
      novelty: 0.6,
      coverage: 0.4
    };
  }

  // Helper methods
  private generateCacheKey(request: RecommendationRequest): string {
    return `rec_${request.userId}_${request.productId || 'none'}_${request.category || 'all'}_${request.algorithm || 'hybrid'}_${request.limit}`;
  }

  private getCachedRecommendations(key: string): RecommendationResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.caching.ttl * 1000) {
      return cached.data;
    }
    return null;
  }

  private cacheRecommendations(key: string, response: RecommendationResponse): void {
    if (this.cache.size >= this.config.caching.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data: response, timestamp: Date.now() });
  }

  private async getUserData(userId: string): Promise<User> {
    return this.storage.get(`user_${userId}`) || {
      id: userId,
      preferences: {
        categories: [],
        brands: [],
        priceRange: { min: 0, max: 1000 },
        tags: [],
        attributes: {}
      },
      demographics: {},
      behaviorHistory: []
    };
  }

  private async getUserBehaviors(userId: string): Promise<UserBehavior[]> {
    return this.storage.get(`user_behaviors_${userId}`) || [];
  }

  private async getProducts(category?: string): Promise<Product[]> {
    // Mock data - in real implementation, this would query the product database
    return this.storage.get('products') || [];
  }

  private async getPopularProducts(category?: string, period: string = 'weekly'): Promise<Product[]> {
    // Mock data - would typically query analytics for popular products
    const products = await this.getProducts(category);
    return products.slice(0, 20); // Return top 20 popular products
  }

  private async getTrendingProducts(category?: string, growthThreshold: number = 0.2): Promise<any[]> {
    // Mock data - would typically query analytics for trending products
    return [];
  }

  private async getRandomProducts(count: number, category?: string): Promise<Product[]> {
    const products = await this.getProducts(category);
    const shuffled = products.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}