// Services
export { RecommendationService } from './services/RecommendationService';
export { CollaborativeFiltering } from './services/CollaborativeFiltering';
export { ContentBasedFiltering } from './services/ContentBasedFiltering';

// Components
export { RecommendationWidget } from './components/RecommendationWidget';
export { ProductRecommendations } from './components/ProductRecommendations';
export { TrendingProducts } from './components/TrendingProducts';

// Hooks
export {
  useRecommendations,
  useRecommendationTracking,
  useSimilarProducts,
  useRecommendationMetrics,
  useRecommendationPreferences
} from './hooks/useRecommendations';

// Utilities
export {
  SimilarityCalculator,
  RankingAlgorithms,
  FeatureExtractor,
  DataProcessor,
  PerformanceTracker,
  CacheManager
} from './utils';

// Types
export * from './types';

// Default configuration
export const defaultRecommendationConfig = {
  algorithms: {
    collaborative: {
      enabled: true,
      userSimilarityThreshold: 0.1,
      maxNeighbors: 50,
      weight: 0.3
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
      weight: 0.3
    },
    popularity: {
      enabled: true,
      weight: 0.2,
      period: 'weekly' as const
    },
    trending: {
      enabled: true,
      weight: 0.2,
      growthThreshold: 0.2
    }
  },
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour in seconds
    maxSize: 1000
  },
  fallback: {
    usePopular: true,
    useRandom: true,
    minRecommendations: 3
  }
};

// Create service instance with default config
let serviceInstance: RecommendationService | null = null;

export const createRecommendationService = (config = defaultRecommendationConfig): RecommendationService => {
  if (!serviceInstance) {
    serviceInstance = new RecommendationService(config);
  }
  return serviceInstance;
};

export const getRecommendationService = (): RecommendationService => {
  if (!serviceInstance) {
    serviceInstance = createRecommendationService();
  }
  return serviceInstance;
};

// Helper function to initialize the module
export const initializeRecommendations = (config = defaultRecommendationConfig) => {
  const service = createRecommendationService(config);
  
  // Pre-warm any caches or perform initialization tasks
  console.log('Recommendation module initialized');
  
  return service;
};

// Module metadata
export const moduleInfo = {
  name: '@modules/recommendation',
  version: '1.0.0',
  description: 'AI-powered product recommendation system with collaborative and content-based filtering',
  author: 'Module Development Team',
  dependencies: [
    '@modules/types',
    '@modules/api-client',
    '@modules/storage'
  ],
  features: [
    'Collaborative Filtering',
    'Content-Based Filtering',
    'Popularity-Based Recommendations',
    'Trending Product Detection',
    'Cross-sell and Upsell',
    'Real-time Personalization',
    'A/B Testing Support',
    'Performance Analytics',
    'Caching and Optimization'
  ],
  algorithms: [
    'User-Based Collaborative Filtering',
    'Item-Based Collaborative Filtering',
    'Content-Based Filtering',
    'Hybrid Recommendations',
    'Popularity and Trending Analysis',
    'Association Rules Mining'
  ]
};