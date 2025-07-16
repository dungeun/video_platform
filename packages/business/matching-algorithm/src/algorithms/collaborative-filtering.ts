import { Matrix } from 'ml-matrix';
import { UUID } from '@revu/types';

export class CollaborativeFiltering {
  private userItemMatrix: Matrix;
  private similarity: Matrix;

  constructor() {
    this.userItemMatrix = new Matrix(0, 0);
    this.similarity = new Matrix(0, 0);
  }

  /**
   * Train the collaborative filtering model
   */
  train(interactions: InteractionData[]): void {
    // Build user-item matrix
    this.buildUserItemMatrix(interactions);
    
    // Calculate similarity matrix
    this.calculateSimilarity();
  }

  /**
   * Get recommendations based on collaborative filtering
   */
  recommend(brandId: UUID, topK: number = 10): RecommendationScore[] {
    const brandIndex = this.getBrandIndex(brandId);
    if (brandIndex === -1) return [];

    // Find similar brands
    const similarBrands = this.findSimilarBrands(brandIndex, topK);
    
    // Get influencers liked by similar brands
    const recommendations = this.aggregateRecommendations(brandIndex, similarBrands);
    
    return recommendations.slice(0, topK);
  }

  /**
   * Build user-item interaction matrix
   */
  private buildUserItemMatrix(interactions: InteractionData[]): void {
    const brands = [...new Set(interactions.map(i => i.brandId))];
    const influencers = [...new Set(interactions.map(i => i.influencerId))];

    const matrix = new Matrix(brands.length, influencers.length);
    
    interactions.forEach(interaction => {
      const brandIdx = brands.indexOf(interaction.brandId);
      const influencerIdx = influencers.indexOf(interaction.influencerId);
      matrix.set(brandIdx, influencerIdx, interaction.score);
    });

    this.userItemMatrix = matrix;
  }

  /**
   * Calculate cosine similarity between brands
   */
  private calculateSimilarity(): void {
    const numBrands = this.userItemMatrix.rows;
    const similarity = new Matrix(numBrands, numBrands);

    for (let i = 0; i < numBrands; i++) {
      for (let j = i; j < numBrands; j++) {
        const sim = this.cosineSimilarity(
          this.userItemMatrix.getRow(i),
          this.userItemMatrix.getRow(j)
        );
        similarity.set(i, j, sim);
        similarity.set(j, i, sim);
      }
    }

    this.similarity = similarity;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Find most similar brands
   */
  private findSimilarBrands(brandIndex: number, k: number): number[] {
    const similarities = this.similarity.getRow(brandIndex);
    const indexed = similarities.map((sim, idx) => ({ sim, idx }));
    
    // Sort by similarity (excluding self)
    indexed.sort((a, b) => b.sim - a.sim);
    
    return indexed
      .filter(item => item.idx !== brandIndex)
      .slice(0, k)
      .map(item => item.idx);
  }

  /**
   * Aggregate recommendations from similar brands
   */
  private aggregateRecommendations(
    brandIndex: number,
    similarBrands: number[]
  ): RecommendationScore[] {
    const scores = new Map<string, number>();
    const brandRow = this.userItemMatrix.getRow(brandIndex);

    similarBrands.forEach(similarBrand => {
      const similarity = this.similarity.get(brandIndex, similarBrand);
      const similarRow = this.userItemMatrix.getRow(similarBrand);

      similarRow.forEach((score, influencerIdx) => {
        // Only recommend influencers not already worked with
        if (brandRow[influencerIdx] === 0 && score > 0) {
          const currentScore = scores.get(String(influencerIdx)) || 0;
          scores.set(String(influencerIdx), currentScore + score * similarity);
        }
      });
    });

    return Array.from(scores.entries())
      .map(([influencerIdx, score]) => ({
        influencerId: influencerIdx,
        score
      }))
      .sort((a, b) => b.score - a.score);
  }

  private getBrandIndex(brandId: UUID): number {
    // Implementation to get brand index from ID
    return 0; // Placeholder
  }
}

interface InteractionData {
  brandId: UUID;
  influencerId: UUID;
  score: number;
}

interface RecommendationScore {
  influencerId: string;
  score: number;
}