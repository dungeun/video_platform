export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  tags: string[];
  attributes: Record<string, any>;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  preferences: UserPreferences;
  demographics: UserDemographics;
  behaviorHistory: UserBehavior[];
}

export interface UserPreferences {
  categories: string[];
  brands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  tags: string[];
  attributes: Record<string, any>;
}

export interface UserDemographics {
  age?: number;
  gender?: string;
  location?: string;
  income?: string;
}

export interface UserBehavior {
  type: 'view' | 'purchase' | 'cart' | 'wishlist' | 'rating' | 'search';
  productId: string;
  timestamp: Date;
  value?: number; // For ratings, purchase amount, etc.
  context?: Record<string, any>;
}

export interface Recommendation {
  productId: string;
  product: Product;
  score: number;
  reason: RecommendationReason;
  algorithm: RecommendationAlgorithm;
  context?: Record<string, any>;
}

export interface RecommendationReason {
  type: 'collaborative' | 'content' | 'popular' | 'trending' | 'recently_viewed' | 'cross_sell' | 'up_sell';
  explanation: string;
  confidence: number;
  factors: string[];
}

export type RecommendationAlgorithm = 
  | 'user_based_cf'
  | 'item_based_cf'
  | 'content_based'
  | 'hybrid'
  | 'popularity'
  | 'trending'
  | 'association_rules';

export interface RecommendationRequest {
  userId: string;
  productId?: string; // For related/similar products
  category?: string;
  limit: number;
  excludeProductIds?: string[];
  algorithm?: RecommendationAlgorithm;
  context?: RecommendationContext;
}

export interface RecommendationContext {
  page: 'home' | 'product' | 'cart' | 'checkout' | 'category';
  device: 'mobile' | 'desktop' | 'tablet';
  sessionDuration: number;
  currentCartItems?: string[];
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  metadata: {
    totalCount: number;
    algorithm: RecommendationAlgorithm;
    executionTime: number;
    cacheHit: boolean;
  };
}

export interface SimilarityScore {
  userId1: string;
  userId2: string;
  score: number;
  commonItems: number;
}

export interface ProductSimilarity {
  productId1: string;
  productId2: string;
  score: number;
  reasons: string[];
}

export interface TrendingProduct {
  productId: string;
  product: Product;
  trendScore: number;
  growthRate: number;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: {
    views: number;
    purchases: number;
    addToCarts: number;
    searches: number;
  };
}

export interface PopularProduct {
  productId: string;
  product: Product;
  popularityScore: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  metrics: {
    totalPurchases: number;
    averageRating: number;
    reviewCount: number;
    viewCount: number;
  };
}

export interface RecentlyViewedItem {
  productId: string;
  product: Product;
  viewedAt: Date;
  viewCount: number;
  sessionId: string;
}

export interface CrossSellRule {
  baseProductId: string;
  recommendedProductId: string;
  confidence: number;
  support: number;
  lift: number;
}

export interface RecommendationConfig {
  algorithms: {
    collaborative: {
      enabled: boolean;
      userSimilarityThreshold: number;
      maxNeighbors: number;
      weight: number;
    };
    contentBased: {
      enabled: boolean;
      attributeWeights: Record<string, number>;
      weight: number;
    };
    popularity: {
      enabled: boolean;
      weight: number;
      period: 'daily' | 'weekly' | 'monthly';
    };
    trending: {
      enabled: boolean;
      weight: number;
      growthThreshold: number;
    };
  };
  caching: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
    maxSize: number;
  };
  fallback: {
    usePopular: boolean;
    useRandom: boolean;
    minRecommendations: number;
  };
}

export interface RecommendationMetrics {
  clickThroughRate: number;
  conversionRate: number;
  averageOrderValue: number;
  diversity: number;
  novelty: number;
  coverage: number;
}

export interface ABTestConfig {
  testId: string;
  enabled: boolean;
  trafficSplit: number; // Percentage of users in test group
  algorithms: {
    control: RecommendationAlgorithm;
    variant: RecommendationAlgorithm;
  };
}

// Hook interfaces
export interface UseRecommendationsOptions {
  userId: string;
  productId?: string;
  category?: string;
  limit?: number;
  algorithm?: RecommendationAlgorithm;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseRecommendationsResult {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

// Component Props
export interface RecommendationWidgetProps {
  userId: string;
  title?: string;
  productId?: string;
  category?: string;
  limit?: number;
  algorithm?: RecommendationAlgorithm;
  className?: string;
  onProductClick?: (product: Product) => void;
  showReason?: boolean;
}

export interface ProductRecommendationsProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
  error?: Error | null;
  onProductClick?: (product: Product) => void;
  showReason?: boolean;
  className?: string;
}

export interface TrendingProductsProps {
  period: 'daily' | 'weekly' | 'monthly';
  limit?: number;
  category?: string;
  className?: string;
  onProductClick?: (product: Product) => void;
}