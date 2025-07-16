import { Product, User, UserBehavior, Recommendation } from '../types';

// Similarity calculation utilities
export class SimilarityCalculator {
  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate Jaccard similarity between two sets
   */
  static jaccardSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  static pearsonCorrelation(dataA: number[], dataB: number[]): number {
    if (dataA.length !== dataB.length || dataA.length === 0) {
      return 0;
    }

    const n = dataA.length;
    const sumA = dataA.reduce((sum, a) => sum + a, 0);
    const sumB = dataB.reduce((sum, b) => sum + b, 0);
    const sumASquared = dataA.reduce((sum, a) => sum + a * a, 0);
    const sumBSquared = dataB.reduce((sum, b) => sum + b * b, 0);
    const sumProduct = dataA.reduce((sum, a, i) => sum + a * dataB[i], 0);

    const numerator = n * sumProduct - sumA * sumB;
    const denominator = Math.sqrt((n * sumASquared - sumA * sumA) * (n * sumBSquared - sumB * sumB));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate Manhattan distance
   */
  static manhattanDistance(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    return vectorA.reduce((sum, a, i) => sum + Math.abs(a - vectorB[i]), 0);
  }

  /**
   * Calculate Euclidean distance
   */
  static euclideanDistance(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    const squaredDiffs = vectorA.map((a, i) => Math.pow(a - vectorB[i], 2));
    return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0));
  }
}

// Ranking and scoring utilities
export class RankingAlgorithms {
  /**
   * Normalize scores to 0-1 range
   */
  static normalizeScores(scores: number[]): number[] {
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const range = max - min;
    
    if (range === 0) return scores.map(() => 1);
    
    return scores.map(score => (score - min) / range);
  }

  /**
   * Apply sigmoid function for score smoothing
   */
  static sigmoid(x: number, steepness: number = 1): number {
    return 1 / (1 + Math.exp(-steepness * x));
  }

  /**
   * Calculate weighted average of multiple scores
   */
  static weightedAverage(scores: number[], weights: number[]): number {
    if (scores.length !== weights.length) {
      throw new Error('Scores and weights arrays must have the same length');
    }

    const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    return totalWeight === 0 ? 0 : weightedSum / totalWeight;
  }

  /**
   * Apply diversity penalty to promote recommendation variety
   */
  static applyDiversityPenalty(recommendations: Recommendation[], diversityWeight: number = 0.1): Recommendation[] {
    const categoryCount = new Map<string, number>();
    const brandCount = new Map<string, number>();

    return recommendations.map((rec, index) => {
      const category = rec.product.category;
      const brand = rec.product.brand;

      const categoryPenalty = (categoryCount.get(category) || 0) * diversityWeight;
      const brandPenalty = (brandCount.get(brand) || 0) * diversityWeight;

      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      brandCount.set(brand, (brandCount.get(brand) || 0) + 1);

      return {
        ...rec,
        score: Math.max(0, rec.score - categoryPenalty - brandPenalty)
      };
    });
  }

  /**
   * Apply recency boost to newer products
   */
  static applyRecencyBoost(recommendations: Recommendation[], boostWeight: number = 0.05): Recommendation[] {
    const now = new Date();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

    return recommendations.map(rec => {
      const age = now.getTime() - rec.product.createdAt.getTime();
      const recencyFactor = Math.max(0, 1 - age / maxAge);
      const boost = recencyFactor * boostWeight;

      return {
        ...rec,
        score: Math.min(1, rec.score + boost)
      };
    });
  }
}

// Feature extraction utilities
export class FeatureExtractor {
  /**
   * Extract numerical features from a product
   */
  static extractProductFeatures(product: Product): number[] {
    const features: number[] = [];

    // Price (normalized)
    features.push(this.normalizePrice(product.price));

    // Rating
    features.push(product.rating / 5);

    // Review count (log normalized)
    features.push(Math.log(product.reviewCount + 1) / Math.log(1000));

    // Category encoding (one-hot would be better, but simplified here)
    features.push(this.hashString(product.category) % 100 / 100);

    // Brand encoding
    features.push(this.hashString(product.brand) % 100 / 100);

    // Tag features (average hash of tags)
    const tagFeature = product.tags.length > 0
      ? product.tags.reduce((sum, tag) => sum + (this.hashString(tag) % 100), 0) / (product.tags.length * 100)
      : 0;
    features.push(tagFeature);

    // Product age (normalized)
    const now = new Date();
    const ageInDays = (now.getTime() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    features.push(Math.min(1, ageInDays / 365));

    return features;
  }

  /**
   * Extract user preference vector from behavior history
   */
  static extractUserPreferences(behaviors: UserBehavior[]): number[] {
    const preferences: number[] = new Array(10).fill(0);

    if (behaviors.length === 0) return preferences;

    // Aggregate behaviors by type
    const behaviorWeights = {
      view: 1,
      cart: 3,
      wishlist: 2,
      purchase: 5,
      rating: 4,
      search: 1
    };

    let totalWeight = 0;

    for (const behavior of behaviors) {
      const weight = behaviorWeights[behavior.type] || 1;
      totalWeight += weight;

      // Price preference (index 0)
      if (behavior.value && behavior.type === 'purchase') {
        preferences[0] += this.normalizePrice(behavior.value) * weight;
      }

      // Recency preference (index 1)
      const daysSince = (Date.now() - behavior.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.exp(-daysSince / 30); // Exponential decay over 30 days
      preferences[1] += recencyScore * weight;

      // Activity level (index 2)
      preferences[2] += weight;
    }

    // Normalize by total weight
    if (totalWeight > 0) {
      for (let i = 0; i < preferences.length; i++) {
        preferences[i] /= totalWeight;
      }
    }

    return preferences;
  }

  /**
   * Create TF-IDF vectors for text-based features
   */
  static createTfIdfVector(documents: string[], vocabulary: string[]): number[][] {
    const documentCount = documents.length;
    const vectorSize = vocabulary.length;
    const vectors: number[][] = [];

    // Calculate document frequency for each term
    const documentFrequency = new Map<string, number>();
    for (const term of vocabulary) {
      let count = 0;
      for (const doc of documents) {
        if (doc.toLowerCase().includes(term.toLowerCase())) {
          count++;
        }
      }
      documentFrequency.set(term, count);
    }

    // Create TF-IDF vector for each document
    for (const document of documents) {
      const vector = new Array(vectorSize).fill(0);
      const words = document.toLowerCase().split(/\s+/);
      const wordCount = words.length;

      for (let i = 0; i < vocabulary.length; i++) {
        const term = vocabulary[i].toLowerCase();
        const termFreq = words.filter(word => word.includes(term)).length;
        
        if (termFreq > 0 && wordCount > 0) {
          const tf = termFreq / wordCount;
          const df = documentFrequency.get(vocabulary[i]) || 1;
          const idf = Math.log(documentCount / df);
          vector[i] = tf * idf;
        }
      }

      vectors.push(vector);
    }

    return vectors;
  }

  private static normalizePrice(price: number): number {
    // Normalize price using log scale (assuming max price around 10M)
    return Math.log(price + 1) / Math.log(10000000);
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Utility functions for data processing
export class DataProcessor {
  /**
   * Group array items by a key function
   */
  static groupBy<T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }

  /**
   * Calculate percentile of a value in an array
   */
  static percentile(sortedArray: number[], value: number): number {
    if (sortedArray.length === 0) return 0;
    
    let count = 0;
    for (const val of sortedArray) {
      if (val <= value) count++;
    }
    
    return count / sortedArray.length;
  }

  /**
   * Apply moving average smoothing
   */
  static movingAverage(data: number[], windowSize: number): number[] {
    if (windowSize >= data.length) {
      const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
      return new Array(data.length).fill(avg);
    }

    const result: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, start + windowSize);
      const slice = data.slice(start, end);
      const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
      result.push(avg);
    }

    return result;
  }

  /**
   * Remove outliers using IQR method
   */
  static removeOutliers(data: number[]): number[] {
    if (data.length < 4) return [...data];

    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.filter(value => value >= lowerBound && value <= upperBound);
  }

  /**
   * Normalize array to sum to 1 (for probability distributions)
   */
  static normalize(values: number[]): number[] {
    const sum = values.reduce((total, val) => total + val, 0);
    return sum === 0 ? values.map(() => 1 / values.length) : values.map(val => val / sum);
  }

  /**
   * Sample items from array with weights
   */
  static weightedSample<T>(items: T[], weights: number[], count: number): T[] {
    if (items.length !== weights.length) {
      throw new Error('Items and weights arrays must have the same length');
    }

    const normalizedWeights = this.normalize(weights);
    const cumulativeWeights: number[] = [];
    let sum = 0;

    for (const weight of normalizedWeights) {
      sum += weight;
      cumulativeWeights.push(sum);
    }

    const selected: T[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < Math.min(count, items.length); i++) {
      let index = -1;
      let attempts = 0;
      
      do {
        const random = Math.random();
        index = cumulativeWeights.findIndex(weight => random <= weight);
        attempts++;
      } while (usedIndices.has(index) && attempts < items.length * 2);

      if (index !== -1 && !usedIndices.has(index)) {
        selected.push(items[index]);
        usedIndices.add(index);
      }
    }

    return selected;
  }
}

// Performance measurement utilities
export class PerformanceTracker {
  private static timers = new Map<string, number>();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);
    return duration;
  }

  static measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    return fn().finally(() => {
      const duration = this.endTimer(label);
      console.log(`${label} took ${duration}ms`);
    });
  }

  static measure<T>(label: string, fn: () => T): T {
    this.startTimer(label);
    try {
      return fn();
    } finally {
      const duration = this.endTimer(label);
      console.log(`${label} took ${duration}ms`);
    }
  }
}

// Cache utilities
export class CacheManager {
  private cache = new Map<string, { value: any; expiry: number }>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: any, ttlMs: number = 3600000): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired items first
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    
    return this.cache.size;
  }
}