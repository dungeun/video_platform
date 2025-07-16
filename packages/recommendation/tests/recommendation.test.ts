import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationService, CollaborativeFiltering, ContentBasedFiltering } from '../src';
import { defaultRecommendationConfig } from '../src';

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(() => {
    service = new RecommendationService(defaultRecommendationConfig);
  });

  it('should create recommendation service instance', () => {
    expect(service).toBeInstanceOf(RecommendationService);
  });

  it('should generate recommendations for user', async () => {
    const request = {
      userId: 'user123',
      limit: 5,
      algorithm: 'hybrid' as const
    };

    const response = await service.getRecommendations(request);
    
    expect(response).toHaveProperty('recommendations');
    expect(response).toHaveProperty('metadata');
    expect(response.recommendations).toBeInstanceOf(Array);
    expect(response.recommendations.length).toBeLessThanOrEqual(request.limit);
  });

  it('should track user interactions', async () => {
    await expect(
      service.trackInteraction('user123', 'product456', 'view')
    ).resolves.not.toThrow();
  });

  it('should get recommendation metrics', async () => {
    const timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    };
    
    const metrics = await service.getMetrics(timeRange);
    
    expect(metrics).toHaveProperty('clickThroughRate');
    expect(metrics).toHaveProperty('conversionRate');
    expect(metrics).toHaveProperty('averageOrderValue');
  });
});

describe('CollaborativeFiltering', () => {
  let collaborativeFiltering: CollaborativeFiltering;

  beforeEach(() => {
    collaborativeFiltering = new CollaborativeFiltering();
  });

  it('should create collaborative filtering instance', () => {
    expect(collaborativeFiltering).toBeInstanceOf(CollaborativeFiltering);
  });

  it('should generate collaborative recommendations', async () => {
    const user = {
      id: 'user123',
      preferences: {
        categories: ['electronics'],
        brands: ['apple'],
        priceRange: { min: 100, max: 1000 },
        tags: ['premium'],
        attributes: {}
      },
      demographics: {},
      behaviorHistory: []
    };
    
    const behaviors = [
      {
        type: 'purchase' as const,
        productId: 'product1',
        timestamp: new Date(),
        value: 500
      }
    ];

    const recommendations = await collaborativeFiltering.getRecommendations(user, behaviors, 5);
    
    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations.length).toBeLessThanOrEqual(5);
  });
});

describe('ContentBasedFiltering', () => {
  let contentBasedFiltering: ContentBasedFiltering;

  beforeEach(() => {
    contentBasedFiltering = new ContentBasedFiltering();
  });

  it('should create content-based filtering instance', () => {
    expect(contentBasedFiltering).toBeInstanceOf(ContentBasedFiltering);
  });

  it('should generate content-based recommendations', async () => {
    const user = {
      id: 'user123',
      preferences: {
        categories: ['electronics'],
        brands: ['apple'],
        priceRange: { min: 100, max: 1000 },
        tags: ['premium'],
        attributes: {}
      },
      demographics: {},
      behaviorHistory: []
    };
    
    const products = [
      {
        id: 'product1',
        name: 'iPhone 15',
        description: 'Latest iPhone',
        price: 999,
        category: 'electronics',
        brand: 'apple',
        tags: ['premium', 'smartphone'],
        attributes: {},
        rating: 4.5,
        reviewCount: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const recommendations = await contentBasedFiltering.getRecommendations(user, products, undefined, 5);
    
    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations.length).toBeLessThanOrEqual(5);
  });
});