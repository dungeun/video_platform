import { Injectable } from '@revu/types';
import { Logger } from '@revu/logger';
import { EventBus } from '@revu/event-bus';
import {
  ScoreBreakdown,
  MatchResult,
  InfluencerProfile,
  MatchingCriteria,
  ModelPerformance
} from '../types';
import { ScoringEngine } from '../algorithms/scoring-engine';

@Injectable()
export class ScoringService {
  private logger: Logger;
  private scoringEngine: ScoringEngine;
  private modelPerformance: ModelPerformance = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    trainingSamples: 0,
    validationSamples: 0
  };

  constructor(private eventBus: EventBus) {
    this.logger = new Logger('ScoringService');
    this.scoringEngine = new ScoringEngine();
  }

  /**
   * Calculate match score
   */
  async calculateScore(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria,
    brandProfile: any
  ): Promise<ScoreBreakdown> {
    try {
      this.logger.info('Calculating match score', {
        influencerId: influencer.id,
        brandId: criteria.brandId
      });

      const score = this.scoringEngine.calculateScore(
        influencer,
        criteria,
        brandProfile
      );

      // Emit score calculated event
      await this.eventBus.emit('score.calculated', {
        influencerId: influencer.id,
        brandId: criteria.brandId,
        score: score.total
      });

      return score;
    } catch (error) {
      this.logger.error('Failed to calculate score', error);
      throw error;
    }
  }

  /**
   * Batch calculate scores for multiple influencers
   */
  async batchCalculateScores(
    influencers: InfluencerProfile[],
    criteria: MatchingCriteria,
    brandProfile: any
  ): Promise<Map<string, ScoreBreakdown>> {
    try {
      this.logger.info('Batch calculating scores', {
        count: influencers.length,
        brandId: criteria.brandId
      });

      const scores = new Map<string, ScoreBreakdown>();

      // Calculate scores in parallel
      const results = await Promise.all(
        influencers.map(async (influencer) => ({
          id: influencer.id,
          score: await this.calculateScore(influencer, criteria, brandProfile)
        }))
      );

      results.forEach(result => {
        scores.set(result.id, result.score);
      });

      return scores;
    } catch (error) {
      this.logger.error('Failed to batch calculate scores', error);
      throw error;
    }
  }

  /**
   * Update scoring model based on feedback
   */
  async updateModel(
    match: MatchResult,
    feedback: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    try {
      this.logger.info('Updating scoring model', {
        matchId: match.id,
        feedback
      });

      // Convert feedback to numerical value
      const feedbackValue = this.convertFeedback(feedback);

      // Update model weights based on feedback
      await this.adjustWeights(match.breakdown, feedbackValue);

      // Update model performance metrics
      await this.updateModelPerformance(match, feedbackValue);

      // Emit model updated event
      await this.eventBus.emit('scoring.model.updated', {
        matchId: match.id,
        feedback,
        newPerformance: this.modelPerformance
      });

    } catch (error) {
      this.logger.error('Failed to update model', error);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  getModelPerformance(): ModelPerformance {
    return { ...this.modelPerformance };
  }

  /**
   * Validate score calculation
   */
  async validateScore(
    score: ScoreBreakdown,
    influencer: InfluencerProfile,
    criteria: MatchingCriteria
  ): Promise<boolean> {
    try {
      // Check if all components are within valid range
      const components = [
        score.audienceRelevance,
        score.engagementRate,
        score.contentQuality,
        score.brandAlignment,
        score.reachPotential,
        score.costEfficiency,
        score.pastPerformance
      ];

      const allValid = components.every(c => c >= 0 && c <= 100);

      // Verify total calculation
      const recalculatedTotal = this.recalculateTotal(score, criteria.weights);
      const totalValid = Math.abs(score.total - recalculatedTotal) < 0.01;

      return allValid && totalValid;
    } catch (error) {
      this.logger.error('Failed to validate score', error);
      return false;
    }
  }

  /**
   * Explain score calculation
   */
  explainScore(score: ScoreBreakdown): string[] {
    const explanations: string[] = [];

    // Audience Relevance
    if (score.audienceRelevance >= 80) {
      explanations.push('Excellent audience match with target demographics');
    } else if (score.audienceRelevance >= 60) {
      explanations.push('Good audience alignment with some gaps');
    } else {
      explanations.push('Limited audience overlap with target market');
    }

    // Engagement Rate
    if (score.engagementRate >= 70) {
      explanations.push('High engagement rate indicates active audience');
    } else if (score.engagementRate >= 40) {
      explanations.push('Average engagement rate');
    } else {
      explanations.push('Below average engagement may impact campaign performance');
    }

    // Content Quality
    if (score.contentQuality >= 80) {
      explanations.push('Premium content quality aligns with brand standards');
    } else if (score.contentQuality >= 60) {
      explanations.push('Good content quality with room for improvement');
    }

    // Brand Alignment
    if (score.brandAlignment >= 75) {
      explanations.push('Strong brand fit and values alignment');
    } else if (score.brandAlignment < 50) {
      explanations.push('Potential brand mismatch requires careful consideration');
    }

    return explanations;
  }

  /**
   * Compare scores between influencers
   */
  compareScores(
    score1: ScoreBreakdown,
    score2: ScoreBreakdown
  ): any {
    const comparison = {
      winner: score1.total > score2.total ? 'influencer1' : 'influencer2',
      difference: Math.abs(score1.total - score2.total),
      advantages: {
        influencer1: [] as string[],
        influencer2: [] as string[]
      },
      breakdown: {} as any
    };

    // Compare each component
    const components = [
      'audienceRelevance',
      'engagementRate',
      'contentQuality',
      'brandAlignment',
      'reachPotential',
      'costEfficiency',
      'pastPerformance'
    ];

    components.forEach(component => {
      const val1 = (score1 as any)[component];
      const val2 = (score2 as any)[component];
      
      comparison.breakdown[component] = {
        influencer1: val1,
        influencer2: val2,
        difference: val1 - val2
      };

      if (val1 > val2 + 10) {
        comparison.advantages.influencer1.push(`Superior ${component}`);
      } else if (val2 > val1 + 10) {
        comparison.advantages.influencer2.push(`Superior ${component}`);
      }
    });

    return comparison;
  }

  /**
   * Private helper methods
   */
  private convertFeedback(feedback: string): number {
    switch (feedback) {
      case 'positive': return 1;
      case 'negative': return -1;
      case 'neutral': return 0;
      default: return 0;
    }
  }

  private async adjustWeights(
    breakdown: ScoreBreakdown,
    feedbackValue: number
  ): Promise<void> {
    // Implement weight adjustment based on feedback
    // This would typically use gradient descent or similar optimization
    const learningRate = 0.01;

    // Adjust weights based on which components contributed most to the score
    // This is a simplified version - real implementation would be more sophisticated
  }

  private async updateModelPerformance(
    match: MatchResult,
    feedbackValue: number
  ): Promise<void> {
    // Update performance metrics
    this.modelPerformance.trainingSamples++;

    // Update accuracy (simplified)
    if ((match.score > 70 && feedbackValue > 0) || 
        (match.score < 30 && feedbackValue < 0)) {
      this.modelPerformance.accuracy = 
        (this.modelPerformance.accuracy * (this.modelPerformance.trainingSamples - 1) + 1) /
        this.modelPerformance.trainingSamples;
    }

    // Update other metrics (simplified)
    this.modelPerformance.f1Score = 
      (this.modelPerformance.accuracy + this.modelPerformance.precision) / 2;
  }

  private recalculateTotal(
    score: ScoreBreakdown,
    weights?: any
  ): number {
    const defaultWeights = {
      audienceRelevance: 0.25,
      engagementRate: 0.20,
      contentQuality: 0.15,
      brandAlignment: 0.15,
      reachPotential: 0.10,
      costEfficiency: 0.10,
      pastPerformance: 0.05
    };

    const w = weights || defaultWeights;

    return (
      score.audienceRelevance * w.audienceRelevance +
      score.engagementRate * w.engagementRate +
      score.contentQuality * w.contentQuality +
      score.brandAlignment * w.brandAlignment +
      score.reachPotential * w.reachPotential +
      score.costEfficiency * w.costEfficiency +
      score.pastPerformance * w.pastPerformance
    );
  }
}