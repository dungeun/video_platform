import {
  User,
  UserBehavior,
  Recommendation,
  SimilarityScore,
  Product
} from '../types';
import { StorageManager } from '@modules/storage';

export class CollaborativeFiltering {
  private storage: StorageManager;
  private userSimilarityCache: Map<string, SimilarityScore[]>;

  constructor() {
    this.storage = new StorageManager('collaborative_filtering');
    this.userSimilarityCache = new Map();
  }

  /**
   * Get recommendations using user-based collaborative filtering
   */
  async getRecommendations(
    user: User,
    userBehaviors: UserBehavior[],
    limit: number = 10
  ): Promise<Recommendation[]> {
    // Find similar users
    const similarUsers = await this.findSimilarUsers(user.id, userBehaviors);
    
    if (similarUsers.length === 0) {
      return [];
    }

    // Get product scores based on similar users' preferences
    const productScores = await this.calculateProductScores(user.id, similarUsers);
    
    // Convert to recommendations
    const recommendations = await this.convertToRecommendations(productScores);
    
    return recommendations.slice(0, limit);
  }

  /**
   * Find users similar to the given user based on behavior patterns
   */
  private async findSimilarUsers(userId: string, userBehaviors: UserBehavior[]): Promise<SimilarityScore[]> {
    const cacheKey = `similar_users_${userId}`;
    
    // Check cache first
    if (this.userSimilarityCache.has(cacheKey)) {
      return this.userSimilarityCache.get(cacheKey)!;
    }

    const allUsers = await this.getAllUserBehaviors();
    const currentUserItems = this.extractUserItems(userBehaviors);
    const similarities: SimilarityScore[] = [];

    for (const [otherUserId, otherBehaviors] of allUsers.entries()) {
      if (otherUserId === userId) continue;

      const otherUserItems = this.extractUserItems(otherBehaviors);
      const similarity = this.calculateCosineSimilarity(currentUserItems, otherUserItems);
      
      if (similarity > 0.1) { // Minimum similarity threshold
        similarities.push({
          userId1: userId,
          userId2: otherUserId,
          score: similarity,
          commonItems: this.countCommonItems(currentUserItems, otherUserItems)
        });
      }
    }

    // Sort by similarity score and take top neighbors
    const sortedSimilarities = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // Max 50 neighbors

    // Cache the result
    this.userSimilarityCache.set(cacheKey, sortedSimilarities);
    
    return sortedSimilarities;
  }

  /**
   * Calculate product scores based on similar users' preferences
   */
  private async calculateProductScores(
    userId: string,
    similarUsers: SimilarityScore[]
  ): Promise<Map<string, number>> {
    const productScores = new Map<string, number>();
    const userBehaviors = await this.getUserBehaviors(userId);
    const userItems = this.extractUserItems(userBehaviors);

    for (const similarUser of similarUsers) {
      const neighborBehaviors = await this.getUserBehaviors(similarUser.userId2);
      const neighborItems = this.extractUserItems(neighborBehaviors);

      for (const [productId, rating] of neighborItems.entries()) {
        // Skip items the user has already interacted with
        if (userItems.has(productId)) continue;

        const weightedScore = rating * similarUser.score;
        const currentScore = productScores.get(productId) || 0;
        productScores.set(productId, currentScore + weightedScore);
      }
    }

    // Normalize scores
    const maxScore = Math.max(...Array.from(productScores.values()));
    if (maxScore > 0) {
      for (const [productId, score] of productScores.entries()) {
        productScores.set(productId, score / maxScore);
      }
    }

    return productScores;
  }

  /**
   * Convert product scores to recommendation objects
   */
  private async convertToRecommendations(
    productScores: Map<string, number>
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    for (const [productId, score] of productScores.entries()) {
      const product = await this.getProduct(productId);
      if (product) {
        recommendations.push({
          productId,
          product,
          score,
          reason: {
            type: 'collaborative',
            explanation: 'Users with similar preferences also liked this product',
            confidence: Math.min(score, 0.9),
            factors: ['user_similarity', 'behavior_patterns']
          },
          algorithm: 'user_based_cf'
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Extract user-item interactions from behaviors
   */
  private extractUserItems(behaviors: UserBehavior[]): Map<string, number> {
    const items = new Map<string, number>();
    
    for (const behavior of behaviors) {
      const currentRating = items.get(behavior.productId) || 0;
      let rating = 0;

      // Assign weights based on behavior type
      switch (behavior.type) {
        case 'purchase':
          rating = 5;
          break;
        case 'cart':
          rating = 3;
          break;
        case 'wishlist':
          rating = 2;
          break;
        case 'view':
          rating = 1;
          break;
        case 'rating':
          rating = behavior.value || 0;
          break;
        default:
          rating = 1;
      }

      // Take the maximum rating for each product
      items.set(behavior.productId, Math.max(currentRating, rating));
    }

    return items;
  }

  /**
   * Calculate cosine similarity between two user item vectors
   */
  private calculateCosineSimilarity(
    userItems1: Map<string, number>,
    userItems2: Map<string, number>
  ): number {
    const commonItems = new Set([...userItems1.keys()].filter(x => userItems2.has(x)));
    
    if (commonItems.size === 0) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const item of commonItems) {
      const rating1 = userItems1.get(item) || 0;
      const rating2 = userItems2.get(item) || 0;
      
      dotProduct += rating1 * rating2;
      magnitude1 += rating1 * rating1;
      magnitude2 += rating2 * rating2;
    }

    const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculatePearsonCorrelation(
    userItems1: Map<string, number>,
    userItems2: Map<string, number>
  ): number {
    const commonItems = new Set([...userItems1.keys()].filter(x => userItems2.has(x)));
    
    if (commonItems.size < 2) return 0;

    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    
    for (const item of commonItems) {
      const rating1 = userItems1.get(item) || 0;
      const rating2 = userItems2.get(item) || 0;
      
      sum1 += rating1;
      sum2 += rating2;
      sum1Sq += rating1 * rating1;
      sum2Sq += rating2 * rating2;
      pSum += rating1 * rating2;
    }

    const num = pSum - (sum1 * sum2 / commonItems.size);
    const den = Math.sqrt(
      (sum1Sq - sum1 * sum1 / commonItems.size) *
      (sum2Sq - sum2 * sum2 / commonItems.size)
    );

    return den === 0 ? 0 : num / den;
  }

  /**
   * Count common items between two users
   */
  private countCommonItems(
    userItems1: Map<string, number>,
    userItems2: Map<string, number>
  ): number {
    return new Set([...userItems1.keys()].filter(x => userItems2.has(x))).size;
  }

  /**
   * Item-based collaborative filtering
   */
  async getItemBasedRecommendations(
    userId: string,
    targetProductId: string,
    limit: number = 10
  ): Promise<Recommendation[]> {
    const userBehaviors = await this.getUserBehaviors(userId);
    const userItems = this.extractUserItems(userBehaviors);
    
    // Find items similar to target product
    const similarItems = await this.findSimilarItems(targetProductId);
    
    const recommendations: Recommendation[] = [];
    
    for (const similarItem of similarItems.slice(0, limit)) {
      const product = await this.getProduct(similarItem.productId2);
      if (product && !userItems.has(similarItem.productId2)) {
        recommendations.push({
          productId: similarItem.productId2,
          product,
          score: similarItem.score,
          reason: {
            type: 'collaborative',
            explanation: 'Similar to products you\'ve shown interest in',
            confidence: similarItem.score,
            factors: ['item_similarity', 'user_preferences']
          },
          algorithm: 'item_based_cf'
        });
      }
    }

    return recommendations;
  }

  /**
   * Find items similar to the given item
   */
  private async findSimilarItems(productId: string): Promise<Array<{productId1: string, productId2: string, score: number}>> {
    // This would typically be pre-computed and stored
    // For now, return mock data
    return [];
  }

  // Helper methods
  private async getAllUserBehaviors(): Promise<Map<string, UserBehavior[]>> {
    // This would typically query the database for all users' behaviors
    return new Map();
  }

  private async getUserBehaviors(userId: string): Promise<UserBehavior[]> {
    return this.storage.get(`user_behaviors_${userId}`) || [];
  }

  private async getProduct(productId: string): Promise<Product | null> {
    const products = await this.storage.get('products') || [];
    return products.find((p: Product) => p.id === productId) || null;
  }

  /**
   * Pre-compute user similarities for better performance
   */
  async precomputeSimilarities(): Promise<void> {
    console.log('Starting similarity precomputation...');
    const allUsers = await this.getAllUserBehaviors();
    
    for (const [userId, behaviors] of allUsers.entries()) {
      await this.findSimilarUsers(userId, behaviors);
    }
    
    console.log('Similarity precomputation completed');
  }

  /**
   * Clear similarity cache
   */
  clearCache(): void {
    this.userSimilarityCache.clear();
  }
}