import { Matrix } from 'ml-matrix';
import { 
  ScoreBreakdown, 
  MatchingWeights, 
  InfluencerProfile,
  MatchingCriteria 
} from '../types';

export class ScoringEngine {
  private defaultWeights: MatchingWeights = {
    audienceRelevance: 0.25,
    engagementRate: 0.20,
    contentQuality: 0.15,
    brandAlignment: 0.15,
    reachPotential: 0.10,
    costEfficiency: 0.10,
    pastPerformance: 0.05
  };

  /**
   * Calculate overall match score
   */
  calculateScore(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria,
    brandProfile: any
  ): ScoreBreakdown {
    const weights = criteria.weights || this.defaultWeights;

    // Calculate individual scores
    const audienceRelevance = this.calculateAudienceRelevance(influencer, criteria);
    const engagementRate = this.calculateEngagementScore(influencer);
    const contentQuality = this.calculateContentQuality(influencer);
    const brandAlignment = this.calculateBrandAlignment(influencer, brandProfile);
    const reachPotential = this.calculateReachPotential(influencer, criteria);
    const costEfficiency = this.calculateCostEfficiency(influencer, criteria);
    const pastPerformance = this.calculatePastPerformance(influencer);

    // Apply weights
    const total = 
      audienceRelevance * weights.audienceRelevance +
      engagementRate * weights.engagementRate +
      contentQuality * weights.contentQuality +
      brandAlignment * weights.brandAlignment +
      reachPotential * weights.reachPotential +
      costEfficiency * weights.costEfficiency +
      pastPerformance * weights.pastPerformance;

    return {
      audienceRelevance,
      engagementRate,
      contentQuality,
      brandAlignment,
      reachPotential,
      costEfficiency,
      pastPerformance,
      total
    };
  }

  /**
   * Calculate audience relevance score
   */
  private calculateAudienceRelevance(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria
  ): number {
    if (!criteria.campaign?.targetAudience) return 50;

    const targetAudience = criteria.campaign.targetAudience;
    const influencerAudience = influencer.audienceData.demographics;

    let score = 0;
    let factors = 0;

    // Age overlap
    if (targetAudience.demographics.ageRange && influencerAudience.age) {
      const ageScore = this.calculateAgeOverlap(
        targetAudience.demographics.ageRange,
        influencerAudience.age
      );
      score += ageScore;
      factors++;
    }

    // Location match
    if (targetAudience.demographics.locations && influencer.locations) {
      const locationScore = this.calculateLocationMatch(
        targetAudience.demographics.locations,
        influencer.locations
      );
      score += locationScore;
      factors++;
    }

    // Interest overlap
    if (targetAudience.demographics.interests && influencer.audienceData.interests) {
      const interestScore = this.calculateInterestOverlap(
        targetAudience.demographics.interests,
        influencer.audienceData.interests
      );
      score += interestScore;
      factors++;
    }

    return factors > 0 ? score / factors : 50;
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(influencer: InfluencerProfile): number {
    const avgEngagement = influencer.platforms.reduce(
      (sum, platform) => sum + platform.engagementRate,
      0
    ) / influencer.platforms.length;

    // Normalize to 0-100 scale (assuming max engagement rate of 10%)
    return Math.min(avgEngagement * 10, 100);
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQuality(influencer: InfluencerProfile): number {
    const content = influencer.contentData;
    
    const qualityFactors = [
      content.contentQuality,
      content.originalityScore,
      content.brandSafety,
      this.normalizePostingFrequency(content.postingFrequency)
    ];

    return qualityFactors.reduce((sum, factor) => sum + factor, 0) / qualityFactors.length;
  }

  /**
   * Calculate brand alignment score
   */
  private calculateBrandAlignment(
    influencer: InfluencerProfile,
    brandProfile: any
  ): number {
    let alignmentScore = 50; // Base score

    // Category match
    const categoryOverlap = this.calculateCategoryOverlap(
      influencer.categories,
      brandProfile.categories || []
    );
    alignmentScore += categoryOverlap * 0.3;

    // Previous collaboration bonus
    const hasCollaborated = influencer.brandCollaborations.some(
      collab => collab.brandId === brandProfile.id
    );
    if (hasCollaborated) {
      alignmentScore += 10;
    }

    // Brand safety alignment
    if (influencer.contentData.brandSafety > 80) {
      alignmentScore += 10;
    }

    return Math.min(alignmentScore, 100);
  }

  /**
   * Calculate reach potential score
   */
  private calculateReachPotential(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria
  ): number {
    const totalReach = influencer.audienceData.totalReach;
    const requirements = criteria.requirements;

    // Check if within follower requirements
    if (requirements?.minFollowers && totalReach < requirements.minFollowers) {
      return 0;
    }
    if (requirements?.maxFollowers && totalReach > requirements.maxFollowers) {
      return 0;
    }

    // Normalize reach (logarithmic scale)
    const reachScore = Math.log10(totalReach + 1) * 10;
    
    // Adjust for audience quality
    const qualityMultiplier = influencer.audienceData.quality / 100;
    
    return Math.min(reachScore * qualityMultiplier, 100);
  }

  /**
   * Calculate cost efficiency score
   */
  private calculateCostEfficiency(
    influencer: InfluencerProfile,
    criteria: MatchingCriteria
  ): number {
    // This would typically involve pricing data
    // For now, use a simplified model based on follower count
    const estimatedCost = this.estimateInfluencerCost(influencer);
    const budget = criteria.campaign?.budget;

    if (!budget) return 50;

    if (estimatedCost > budget.max) return 0;
    if (estimatedCost < budget.min) return 100;

    const efficiency = 1 - (estimatedCost - budget.min) / (budget.max - budget.min);
    return efficiency * 100;
  }

  /**
   * Calculate past performance score
   */
  private calculatePastPerformance(influencer: InfluencerProfile): number {
    const history = influencer.performanceHistory;
    
    if (history.campaignsCompleted === 0) return 50; // Neutral for new influencers

    const performanceFactors = [
      history.averageROI * 10, // Normalize ROI
      history.completionRate,
      history.clientSatisfaction
    ];

    return performanceFactors.reduce((sum, factor) => sum + factor, 0) / performanceFactors.length;
  }

  /**
   * Helper methods
   */
  private calculateAgeOverlap(targetRange: [number, number], audienceAge: any): number {
    // Implementation for age overlap calculation
    return 75; // Placeholder
  }

  private calculateLocationMatch(targetLocations: string[], influencerLocations: string[]): number {
    const overlap = targetLocations.filter(loc => influencerLocations.includes(loc));
    return (overlap.length / targetLocations.length) * 100;
  }

  private calculateInterestOverlap(targetInterests: string[], audienceInterests: string[]): number {
    const overlap = targetInterests.filter(interest => audienceInterests.includes(interest));
    return (overlap.length / targetInterests.length) * 100;
  }

  private calculateCategoryOverlap(influencerCategories: string[], brandCategories: string[]): number {
    if (brandCategories.length === 0) return 0;
    const overlap = influencerCategories.filter(cat => brandCategories.includes(cat));
    return (overlap.length / brandCategories.length) * 100;
  }

  private normalizePostingFrequency(frequency: number): number {
    // Optimal posting frequency is around 1-2 posts per day
    const optimal = 1.5;
    const deviation = Math.abs(frequency - optimal);
    return Math.max(0, 100 - deviation * 20);
  }

  private estimateInfluencerCost(influencer: InfluencerProfile): number {
    // Simplified cost estimation based on followers
    const baseRate = 100; // Base rate per 1000 followers
    const totalFollowers = influencer.platforms.reduce(
      (sum, platform) => sum + platform.followers,
      0
    );
    return (totalFollowers / 1000) * baseRate;
  }
}