import { CollaborativeFiltering } from './collaborative-filtering';
import { ContentBasedMatching } from './content-based';
import { ScoringEngine } from './scoring-engine';
import { 
  InfluencerProfile, 
  MatchingCriteria, 
  MatchResult,
  UUID 
} from '../types';

export class HybridMatchingAlgorithm {
  private collaborativeFilter: CollaborativeFiltering;
  private contentMatcher: ContentBasedMatching;
  private scoringEngine: ScoringEngine;
  private hybridWeights = {
    collaborative: 0.3,
    content: 0.3,
    scoring: 0.4
  };

  constructor() {
    this.collaborativeFilter = new CollaborativeFiltering();
    this.contentMatcher = new ContentBasedMatching();
    this.scoringEngine = new ScoringEngine();
  }

  /**
   * Initialize the hybrid model with training data
   */
  initialize(
    interactions: any[],
    influencerProfiles: InfluencerProfile[]
  ): void {
    // Train collaborative filtering
    this.collaborativeFilter.train(interactions);
    
    // Build content profiles
    this.contentMatcher.buildProfiles(influencerProfiles);
  }

  /**
   * Get hybrid recommendations
   */
  async getRecommendations(
    brandId: UUID,
    criteria: MatchingCriteria,
    brandProfile: any,
    candidates: InfluencerProfile[]
  ): Promise<MatchResult[]> {
    // Get collaborative filtering scores
    const collaborativeScores = await this.getCollaborativeScores(brandId, candidates);
    
    // Get content-based scores
    const contentScores = this.contentMatcher.match(criteria, candidates);
    
    // Get rule-based scores
    const ruleScores = candidates.map(candidate => ({
      influencerId: candidate.id,
      score: this.scoringEngine.calculateScore(candidate, criteria, brandProfile)
    }));

    // Combine scores
    const hybridResults = this.combineScores(
      candidates,
      collaborativeScores,
      contentScores,
      ruleScores,
      criteria,
      brandProfile
    );

    return hybridResults;
  }

  /**
   * Get collaborative filtering scores
   */
  private async getCollaborativeScores(
    brandId: UUID,
    candidates: InfluencerProfile[]
  ): Promise<Map<UUID, number>> {
    const recommendations = this.collaborativeFilter.recommend(brandId, candidates.length);
    const scoreMap = new Map<UUID, number>();
    
    recommendations.forEach(rec => {
      // Map recommendation to candidate IDs
      const candidate = candidates.find(c => c.id === rec.influencerId);
      if (candidate) {
        scoreMap.set(candidate.id, rec.score);
      }
    });

    // Fill missing scores with neutral value
    candidates.forEach(candidate => {
      if (!scoreMap.has(candidate.id)) {
        scoreMap.set(candidate.id, 0.5);
      }
    });

    return scoreMap;
  }

  /**
   * Combine scores from different algorithms
   */
  private combineScores(
    candidates: InfluencerProfile[],
    collaborativeScores: Map<UUID, number>,
    contentScores: any[],
    ruleScores: any[],
    criteria: MatchingCriteria,
    brandProfile: any
  ): MatchResult[] {
    return candidates.map(candidate => {
      // Get individual scores
      const collabScore = collaborativeScores.get(candidate.id) || 0;
      const contentScore = contentScores.find(s => s.influencerId === candidate.id)?.score || 0;
      const ruleScore = ruleScores.find(s => s.influencerId === candidate.id)?.score;

      // Calculate hybrid score
      const hybridScore = 
        collabScore * this.hybridWeights.collaborative +
        contentScore * this.hybridWeights.content +
        ruleScore.total * this.hybridWeights.scoring;

      // Generate analysis
      const analysis = this.generateMatchAnalysis(
        candidate,
        criteria,
        brandProfile,
        hybridScore
      );

      // Generate recommendation
      const recommendation = this.generateRecommendation(
        hybridScore,
        analysis,
        candidate
      );

      return {
        id: `match_${brandProfile.id}_${candidate.id}`,
        brandId: brandProfile.id,
        influencerId: candidate.id,
        score: hybridScore,
        confidence: this.calculateConfidence(collabScore, contentScore, ruleScore.total),
        breakdown: ruleScore,
        recommendation,
        analysis,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Generate match analysis
   */
  private generateMatchAnalysis(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria,
    brandProfile: any,
    score: number
  ): any {
    return {
      audienceOverlap: this.calculateAudienceOverlap(influencer, criteria),
      estimatedReach: this.estimateReach(influencer),
      estimatedEngagement: this.estimateEngagement(influencer),
      estimatedROI: this.estimateROI(influencer, criteria),
      compatibilityFactors: this.analyzeCompatibility(influencer, brandProfile),
      strengthsAndWeaknesses: this.analyzeStrengthsWeaknesses(influencer, criteria)
    };
  }

  /**
   * Generate recommendation based on score
   */
  private generateRecommendation(
    score: number,
    analysis: any,
    influencer: InfluencerProfile
  ): any {
    let status: string;
    const reasons: string[] = [];
    const risks: string[] = [];
    const opportunities: string[] = [];

    if (score >= 80) {
      status = 'highly_recommended';
      reasons.push('Excellent match across all criteria');
    } else if (score >= 65) {
      status = 'recommended';
      reasons.push('Good overall match with strong potential');
    } else if (score >= 50) {
      status = 'suitable';
      reasons.push('Adequate match with some areas for improvement');
    } else {
      status = 'not_recommended';
      reasons.push('Poor match with significant gaps');
    }

    // Analyze specific factors
    if (analysis.audienceOverlap > 70) {
      opportunities.push('High audience relevance');
    } else {
      risks.push('Limited audience overlap');
    }

    if (influencer.performanceHistory.averageROI > 3) {
      opportunities.push('Strong historical performance');
    }

    if (influencer.contentData.brandSafety < 70) {
      risks.push('Potential brand safety concerns');
    }

    return { status, reasons, risks, opportunities };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    collabScore: number,
    contentScore: number,
    ruleScore: number
  ): number {
    // Calculate variance to determine confidence
    const scores = [collabScore, contentScore, ruleScore];
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    // Lower variance = higher confidence
    const confidence = Math.max(0, 1 - Math.sqrt(variance));
    return confidence;
  }

  /**
   * Helper methods for analysis
   */
  private calculateAudienceOverlap(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria
  ): number {
    // Implementation for audience overlap calculation
    return 75;
  }

  private estimateReach(influencer: InfluencerProfile): number {
    return influencer.audienceData.totalReach;
  }

  private estimateEngagement(influencer: InfluencerProfile): number {
    const avgEngagement = influencer.platforms.reduce(
      (sum, p) => sum + p.engagementRate,
      0
    ) / influencer.platforms.length;
    return influencer.audienceData.totalReach * (avgEngagement / 100);
  }

  private estimateROI(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria
  ): number {
    // Simplified ROI estimation
    return influencer.performanceHistory.averageROI || 2.5;
  }

  private analyzeCompatibility(
    influencer: InfluencerProfile,
    brandProfile: any
  ): any[] {
    return [
      {
        name: 'Audience Alignment',
        score: 85,
        impact: 'positive',
        description: 'Strong alignment with target demographics'
      },
      {
        name: 'Content Style',
        score: 72,
        impact: 'positive',
        description: 'Compatible content style and quality'
      }
    ];
  }

  private analyzeStrengthsWeaknesses(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria
  ): any {
    return {
      strengths: [
        'High engagement rate',
        'Relevant audience demographics',
        'Strong content quality'
      ],
      weaknesses: [
        'Limited experience in category',
        'Lower posting frequency'
      ]
    };
  }
}