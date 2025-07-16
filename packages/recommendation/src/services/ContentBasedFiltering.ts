import {
  User,
  Product,
  Recommendation,
  ProductSimilarity,
  UserPreferences
} from '../types';
import { StorageManager } from '@modules/storage';

export class ContentBasedFiltering {
  private storage: StorageManager;
  private productSimilarityCache: Map<string, ProductSimilarity[]>;
  private attributeWeights: Record<string, number>;

  constructor() {
    this.storage = new StorageManager('content_based_filtering');
    this.productSimilarityCache = new Map();
    
    // Default attribute weights for product similarity calculation
    this.attributeWeights = {
      category: 0.3,
      brand: 0.2,
      price: 0.15,
      tags: 0.25,
      rating: 0.1
    };
  }

  /**
   * Get content-based recommendations for a user
   */
  async getRecommendations(
    user: User,
    products: Product[],
    targetProductId?: string,
    limit: number = 10
  ): Promise<Recommendation[]> {
    if (targetProductId) {
      // Get similar products to the target product
      return this.getSimilarProductRecommendations(targetProductId, products, limit);
    } else {
      // Get personalized recommendations based on user preferences
      return this.getPersonalizedRecommendations(user, products, limit);
    }
  }

  /**
   * Get recommendations based on user preferences and behavior
   */
  private async getPersonalizedRecommendations(
    user: User,
    products: Product[],
    limit: number
  ): Promise<Recommendation[]> {
    const userProfile = await this.buildUserProfile(user);
    const recommendations: Recommendation[] = [];

    for (const product of products) {
      const score = this.calculateUserProductScore(userProfile, product);
      
      if (score > 0.1) { // Minimum threshold
        recommendations.push({
          productId: product.id,
          product,
          score,
          reason: {
            type: 'content',
            explanation: this.generateExplanation(userProfile, product),
            confidence: Math.min(score, 0.9),
            factors: this.getMatchingFactors(userProfile, product)
          },
          algorithm: 'content_based'
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get recommendations for similar products
   */
  private async getSimilarProductRecommendations(
    targetProductId: string,
    products: Product[],
    limit: number
  ): Promise<Recommendation[]> {
    const targetProduct = products.find(p => p.id === targetProductId);
    if (!targetProduct) {
      return [];
    }

    const similarities = await this.findSimilarProducts(targetProduct, products);
    const recommendations: Recommendation[] = [];

    for (const similarity of similarities.slice(0, limit)) {
      const product = products.find(p => p.id === similarity.productId2);
      if (product) {
        recommendations.push({
          productId: product.id,
          product,
          score: similarity.score,
          reason: {
            type: 'content',
            explanation: `Similar to "${targetProduct.name}" based on ${similarity.reasons.join(', ')}`,
            confidence: similarity.score,
            factors: similarity.reasons
          },
          algorithm: 'content_based'
        });
      }
    }

    return recommendations;
  }

  /**
   * Build user profile from preferences and behavior
   */
  private async buildUserProfile(user: User): Promise<UserPreferences> {
    const behaviors = await this.getUserBehaviors(user.id);
    const preferences = { ...user.preferences };

    // Extract preferences from user behavior
    const categoryFreq = new Map<string, number>();
    const brandFreq = new Map<string, number>();
    const tagFreq = new Map<string, number>();
    let totalPrice = 0;
    let priceCount = 0;

    for (const behavior of behaviors) {
      if (behavior.type === 'purchase' || behavior.type === 'view' || behavior.type === 'cart') {
        const product = await this.getProduct(behavior.productId);
        if (product) {
          // Update category frequency
          categoryFreq.set(product.category, (categoryFreq.get(product.category) || 0) + 1);
          
          // Update brand frequency
          brandFreq.set(product.brand, (brandFreq.get(product.brand) || 0) + 1);
          
          // Update tag frequency
          for (const tag of product.tags) {
            tagFreq.set(tag, (tagFreq.get(tag) || 0) + 1);
          }
          
          // Update price preferences
          if (behavior.type === 'purchase') {
            totalPrice += product.price;
            priceCount++;
          }
        }
      }
    }

    // Update preferences based on behavior patterns
    if (categoryFreq.size > 0) {
      preferences.categories = Array.from(categoryFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([category]) => category);
    }

    if (brandFreq.size > 0) {
      preferences.brands = Array.from(brandFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([brand]) => brand);
    }

    if (tagFreq.size > 0) {
      preferences.tags = Array.from(tagFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag]) => tag);
    }

    if (priceCount > 0) {
      const avgPrice = totalPrice / priceCount;
      preferences.priceRange = {
        min: Math.max(0, avgPrice * 0.5),
        max: avgPrice * 2
      };
    }

    return preferences;
  }

  /**
   * Calculate score between user profile and product
   */
  private calculateUserProductScore(profile: UserPreferences, product: Product): number {
    let score = 0;
    let totalWeight = 0;

    // Category match
    if (profile.categories.includes(product.category)) {
      score += this.attributeWeights.category;
    }
    totalWeight += this.attributeWeights.category;

    // Brand match
    if (profile.brands.includes(product.brand)) {
      score += this.attributeWeights.brand;
    }
    totalWeight += this.attributeWeights.brand;

    // Price match
    const priceScore = this.calculatePriceScore(profile.priceRange, product.price);
    score += priceScore * this.attributeWeights.price;
    totalWeight += this.attributeWeights.price;

    // Tag overlap
    const tagScore = this.calculateTagOverlap(profile.tags, product.tags);
    score += tagScore * this.attributeWeights.tags;
    totalWeight += this.attributeWeights.tags;

    // Rating bonus
    const ratingScore = Math.min(product.rating / 5, 1);
    score += ratingScore * this.attributeWeights.rating;
    totalWeight += this.attributeWeights.rating;

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Calculate price compatibility score
   */
  private calculatePriceScore(priceRange: { min: number; max: number }, productPrice: number): number {
    if (productPrice >= priceRange.min && productPrice <= priceRange.max) {
      return 1.0;
    } else if (productPrice < priceRange.min) {
      const distance = priceRange.min - productPrice;
      return Math.max(0, 1 - distance / priceRange.min);
    } else {
      const distance = productPrice - priceRange.max;
      return Math.max(0, 1 - distance / priceRange.max);
    }
  }

  /**
   * Calculate tag overlap score
   */
  private calculateTagOverlap(userTags: string[], productTags: string[]): number {
    if (userTags.length === 0 || productTags.length === 0) {
      return 0;
    }

    const intersection = userTags.filter(tag => productTags.includes(tag));
    const union = new Set([...userTags, ...productTags]);
    
    return intersection.length / union.size; // Jaccard similarity
  }

  /**
   * Find products similar to the given product
   */
  private async findSimilarProducts(
    targetProduct: Product,
    products: Product[]
  ): Promise<ProductSimilarity[]> {
    const cacheKey = `similar_${targetProduct.id}`;
    
    if (this.productSimilarityCache.has(cacheKey)) {
      return this.productSimilarityCache.get(cacheKey)!;
    }

    const similarities: ProductSimilarity[] = [];

    for (const product of products) {
      if (product.id === targetProduct.id) continue;

      const similarity = this.calculateProductSimilarity(targetProduct, product);
      if (similarity.score > 0.1) {
        similarities.push(similarity);
      }
    }

    const sortedSimilarities = similarities.sort((a, b) => b.score - a.score);
    this.productSimilarityCache.set(cacheKey, sortedSimilarities);

    return sortedSimilarities;
  }

  /**
   * Calculate similarity between two products
   */
  private calculateProductSimilarity(product1: Product, product2: Product): ProductSimilarity {
    let score = 0;
    const reasons: string[] = [];

    // Category similarity
    if (product1.category === product2.category) {
      score += this.attributeWeights.category;
      reasons.push('same category');
    }

    // Brand similarity
    if (product1.brand === product2.brand) {
      score += this.attributeWeights.brand;
      reasons.push('same brand');
    }

    // Price similarity
    const priceDiff = Math.abs(product1.price - product2.price);
    const avgPrice = (product1.price + product2.price) / 2;
    const priceScore = Math.max(0, 1 - priceDiff / avgPrice);
    
    if (priceScore > 0.7) {
      score += priceScore * this.attributeWeights.price;
      reasons.push('similar price');
    }

    // Tag similarity
    const tagSimilarity = this.calculateTagOverlap(product1.tags, product2.tags);
    if (tagSimilarity > 0.3) {
      score += tagSimilarity * this.attributeWeights.tags;
      reasons.push('similar features');
    }

    // Rating similarity
    const ratingDiff = Math.abs(product1.rating - product2.rating);
    const ratingScore = Math.max(0, 1 - ratingDiff / 5);
    
    if (ratingScore > 0.8) {
      score += ratingScore * this.attributeWeights.rating;
      reasons.push('similar rating');
    }

    // Attribute similarity
    const attrScore = this.calculateAttributeSimilarity(product1.attributes, product2.attributes);
    if (attrScore > 0.3) {
      score += attrScore * 0.1; // Small weight for attributes
      reasons.push('similar attributes');
    }

    return {
      productId1: product1.id,
      productId2: product2.id,
      score: Math.min(score, 1.0),
      reasons
    };
  }

  /**
   * Calculate similarity between product attributes
   */
  private calculateAttributeSimilarity(attr1: Record<string, any>, attr2: Record<string, any>): number {
    const keys1 = Object.keys(attr1);
    const keys2 = Object.keys(attr2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    if (allKeys.size === 0) return 0;

    let matches = 0;
    for (const key of allKeys) {
      if (attr1[key] === attr2[key]) {
        matches++;
      }
    }

    return matches / allKeys.size;
  }

  /**
   * Generate explanation for recommendation
   */
  private generateExplanation(profile: UserPreferences, product: Product): string {
    const reasons: string[] = [];

    if (profile.categories.includes(product.category)) {
      reasons.push(`you often browse ${product.category} products`);
    }

    if (profile.brands.includes(product.brand)) {
      reasons.push(`you like ${product.brand} brand`);
    }

    const tagOverlap = this.calculateTagOverlap(profile.tags, product.tags);
    if (tagOverlap > 0.3) {
      const commonTags = profile.tags.filter(tag => product.tags.includes(tag));
      reasons.push(`it has features you like: ${commonTags.slice(0, 3).join(', ')}`);
    }

    if (reasons.length === 0) {
      return 'This product matches your preferences';
    }

    return `Recommended because ${reasons.join(' and ')}`;
  }

  /**
   * Get matching factors between user profile and product
   */
  private getMatchingFactors(profile: UserPreferences, product: Product): string[] {
    const factors: string[] = [];

    if (profile.categories.includes(product.category)) {
      factors.push('category_match');
    }

    if (profile.brands.includes(product.brand)) {
      factors.push('brand_preference');
    }

    if (product.price >= profile.priceRange.min && product.price <= profile.priceRange.max) {
      factors.push('price_range');
    }

    const tagOverlap = this.calculateTagOverlap(profile.tags, product.tags);
    if (tagOverlap > 0.3) {
      factors.push('feature_match');
    }

    if (product.rating >= 4.0) {
      factors.push('high_rating');
    }

    return factors;
  }

  /**
   * Update attribute weights for better personalization
   */
  updateAttributeWeights(weights: Record<string, number>): void {
    this.attributeWeights = { ...this.attributeWeights, ...weights };
  }

  /**
   * Clear product similarity cache
   */
  clearCache(): void {
    this.productSimilarityCache.clear();
  }

  // Helper methods
  private async getUserBehaviors(userId: string): Promise<any[]> {
    return this.storage.get(`user_behaviors_${userId}`) || [];
  }

  private async getProduct(productId: string): Promise<Product | null> {
    const products = await this.storage.get('products') || [];
    return products.find((p: Product) => p.id === productId) || null;
  }
}