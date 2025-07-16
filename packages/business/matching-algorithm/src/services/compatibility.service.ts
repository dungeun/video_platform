import { Injectable } from '@revu/types';
import { Logger } from '@revu/logger';
import { EventBus } from '@revu/event-bus';
import {
  UUID,
  CompatibilityFactor,
  InfluencerProfile
} from '../types';

@Injectable()
export class CompatibilityService {
  private logger: Logger;

  constructor(private eventBus: EventBus) {
    this.logger = new Logger('CompatibilityService');
  }

  /**
   * Analyze compatibility between brand and influencer
   */
  async analyzeCompatibility(
    brandId: UUID,
    influencerId: UUID
  ): Promise<any> {
    try {
      this.logger.info('Analyzing compatibility', { brandId, influencerId });

      // Get profiles
      const [brandProfile, influencerProfile] = await Promise.all([
        this.getBrandProfile(brandId),
        this.getInfluencerProfile(influencerId)
      ]);

      // Analyze different compatibility dimensions
      const factors = await this.analyzeCompatibilityFactors(
        brandProfile,
        influencerProfile
      );

      // Calculate overall compatibility
      const overallScore = this.calculateOverallCompatibility(factors);

      // Generate insights
      const insights = this.generateCompatibilityInsights(
        factors,
        brandProfile,
        influencerProfile
      );

      // Identify risks and opportunities
      const risks = this.identifyRisks(factors, brandProfile, influencerProfile);
      const opportunities = this.identifyOpportunities(
        factors,
        brandProfile,
        influencerProfile
      );

      const result = {
        brandId,
        influencerId,
        overallScore,
        factors,
        insights,
        risks,
        opportunities,
        recommendation: this.generateRecommendation(overallScore, risks)
      };

      // Emit event
      await this.eventBus.emit('compatibility.analyzed', result);

      return result;
    } catch (error) {
      this.logger.error('Failed to analyze compatibility', error);
      throw error;
    }
  }

  /**
   * Analyze multiple compatibility factors
   */
  private async analyzeCompatibilityFactors(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor[]> {
    const factors: CompatibilityFactor[] = [];

    // Values alignment
    factors.push(await this.analyzeValuesAlignment(brandProfile, influencerProfile));

    // Audience fit
    factors.push(await this.analyzeAudienceFit(brandProfile, influencerProfile));

    // Content style compatibility
    factors.push(await this.analyzeContentStyle(brandProfile, influencerProfile));

    // Geographic alignment
    factors.push(await this.analyzeGeographicAlignment(brandProfile, influencerProfile));

    // Past performance
    factors.push(await this.analyzePastPerformance(brandProfile, influencerProfile));

    // Platform presence
    factors.push(await this.analyzePlatformPresence(brandProfile, influencerProfile));

    // Pricing compatibility
    factors.push(await this.analyzePricingCompatibility(brandProfile, influencerProfile));

    // Communication style
    factors.push(await this.analyzeCommunicationStyle(brandProfile, influencerProfile));

    return factors;
  }

  /**
   * Analyze values alignment
   */
  private async analyzeValuesAlignment(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor> {
    // Analyze how well brand and influencer values align
    const brandValues = brandProfile.values || [];
    const influencerValues = this.extractInfluencerValues(influencerProfile);
    
    const alignment = this.calculateValueOverlap(brandValues, influencerValues);

    return {
      name: 'Values Alignment',
      score: alignment * 100,
      impact: alignment > 0.7 ? 'positive' : alignment < 0.3 ? 'negative' : 'neutral',
      description: `${Math.round(alignment * 100)}% alignment in core values and principles`
    };
  }

  /**
   * Analyze audience fit
   */
  private async analyzeAudienceFit(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor> {
    const targetAudience = brandProfile.targetAudience || {};
    const influencerAudience = influencerProfile.audienceData;

    // Calculate demographic overlap
    const demographicFit = this.calculateDemographicFit(
      targetAudience,
      influencerAudience.demographics
    );

    // Calculate interest overlap
    const interestFit = this.calculateInterestOverlap(
      targetAudience.interests || [],
      influencerAudience.interests
    );

    const overallFit = (demographicFit + interestFit) / 2;

    return {
      name: 'Audience Fit',
      score: overallFit,
      impact: overallFit > 70 ? 'positive' : overallFit < 40 ? 'negative' : 'neutral',
      description: `Audience demographics and interests show ${Math.round(overallFit)}% match`
    };
  }

  /**
   * Analyze content style compatibility
   */
  private async analyzeContentStyle(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor> {
    const brandStyle = brandProfile.contentStyle || {};
    const influencerContent = influencerProfile.contentData;

    // Analyze style match
    const styleScore = this.calculateStyleCompatibility(brandStyle, influencerContent);

    return {
      name: 'Content Style',
      score: styleScore,
      impact: styleScore > 75 ? 'positive' : styleScore < 50 ? 'negative' : 'neutral',
      description: `Content style and quality standards are ${Math.round(styleScore)}% compatible`
    };
  }

  /**
   * Analyze geographic alignment
   */
  private async analyzeGeographicAlignment(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor> {
    const brandMarkets = brandProfile.targetMarkets || [];
    const influencerLocations = influencerProfile.locations;

    const overlap = brandMarkets.filter((market: string) => 
      influencerLocations.includes(market)
    );

    const score = brandMarkets.length > 0 
      ? (overlap.length / brandMarkets.length) * 100 
      : 50;

    return {
      name: 'Geographic Coverage',
      score,
      impact: score > 80 ? 'positive' : score < 30 ? 'negative' : 'neutral',
      description: `${Math.round(score)}% coverage of target markets`
    };
  }

  /**
   * Analyze past performance
   */
  private async analyzePastPerformance(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor> {
    const performance = influencerProfile.performanceHistory;
    
    // Check past collaborations with similar brands
    const similarBrandCollabs = influencerProfile.brandCollaborations.filter(
      collab => this.isSimilarBrand(collab, brandProfile)
    );

    let score = 50; // Neutral baseline

    if (similarBrandCollabs.length > 0) {
      const avgPerformance = similarBrandCollabs.reduce(
        (sum, collab) => sum + collab.performance,
        0
      ) / similarBrandCollabs.length;
      score = avgPerformance;
    } else if (performance.campaignsCompleted > 0) {
      // Use general performance metrics
      score = (performance.completionRate + performance.clientSatisfaction) / 2;
    }

    return {
      name: 'Past Performance',
      score,
      impact: score > 80 ? 'positive' : score < 60 ? 'negative' : 'neutral',
      description: similarBrandCollabs.length > 0
        ? `Averaged ${Math.round(score)}% success rate with similar brands`
        : `General performance score of ${Math.round(score)}%`
    };
  }

  /**
   * Analyze platform presence
   */
  private async analyzePlatformPresence(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor> {
    const requiredPlatforms = brandProfile.requiredPlatforms || [];
    const influencerPlatforms = influencerProfile.platforms.map(p => p.platform);

    const coverage = requiredPlatforms.length > 0
      ? requiredPlatforms.filter((p: string) => influencerPlatforms.includes(p)).length / requiredPlatforms.length
      : influencerPlatforms.length > 0 ? 1 : 0;

    const score = coverage * 100;

    return {
      name: 'Platform Coverage',
      score,
      impact: score > 90 ? 'positive' : score < 50 ? 'negative' : 'neutral',
      description: `Present on ${Math.round(score)}% of required platforms`
    };
  }

  /**
   * Analyze pricing compatibility
   */
  private async analyzePricingCompatibility(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor> {
    const budget = brandProfile.typicalBudget || { min: 1000, max: 10000 };
    const estimatedCost = this.estimateInfluencerCost(influencerProfile);

    let score = 50;
    if (estimatedCost <= budget.max && estimatedCost >= budget.min) {
      score = 100;
    } else if (estimatedCost < budget.min) {
      score = 80; // Under budget is generally good
    } else {
      // Over budget - calculate how much over
      const overBudgetPercent = ((estimatedCost - budget.max) / budget.max) * 100;
      score = Math.max(0, 50 - overBudgetPercent);
    }

    return {
      name: 'Pricing Compatibility',
      score,
      impact: score > 80 ? 'positive' : score < 30 ? 'negative' : 'neutral',
      description: estimatedCost <= budget.max 
        ? 'Pricing within budget range'
        : `Pricing ${Math.round(((estimatedCost - budget.max) / budget.max) * 100)}% over budget`
    };
  }

  /**
   * Analyze communication style
   */
  private async analyzeCommunicationStyle(
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): Promise<CompatibilityFactor> {
    // This would analyze tone, language, formality level, etc.
    const score = 75; // Placeholder

    return {
      name: 'Communication Style',
      score,
      impact: 'neutral',
      description: 'Communication style appears compatible'
    };
  }

  /**
   * Helper methods
   */
  private calculateOverallCompatibility(factors: CompatibilityFactor[]): number {
    const totalScore = factors.reduce((sum, factor) => sum + factor.score, 0);
    return totalScore / factors.length;
  }

  private generateCompatibilityInsights(
    factors: CompatibilityFactor[],
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): string[] {
    const insights: string[] = [];

    // Find strongest compatibility factors
    const strongFactors = factors.filter(f => f.score > 80);
    if (strongFactors.length > 0) {
      insights.push(
        `Strong compatibility in: ${strongFactors.map(f => f.name).join(', ')}`
      );
    }

    // Find weak compatibility factors
    const weakFactors = factors.filter(f => f.score < 50);
    if (weakFactors.length > 0) {
      insights.push(
        `Areas needing attention: ${weakFactors.map(f => f.name).join(', ')}`
      );
    }

    return insights;
  }

  private identifyRisks(
    factors: CompatibilityFactor[],
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): string[] {
    const risks: string[] = [];

    factors.forEach(factor => {
      if (factor.impact === 'negative') {
        risks.push(`${factor.name}: ${factor.description}`);
      }
    });

    return risks;
  }

  private identifyOpportunities(
    factors: CompatibilityFactor[],
    brandProfile: any,
    influencerProfile: InfluencerProfile
  ): string[] {
    const opportunities: string[] = [];

    factors.forEach(factor => {
      if (factor.impact === 'positive') {
        opportunities.push(`${factor.name}: ${factor.description}`);
      }
    });

    return opportunities;
  }

  private generateRecommendation(
    overallScore: number,
    risks: string[]
  ): string {
    if (overallScore >= 80 && risks.length === 0) {
      return 'Highly recommended - Excellent compatibility';
    } else if (overallScore >= 65) {
      return 'Recommended - Good compatibility with manageable risks';
    } else if (overallScore >= 50) {
      return 'Conditional - Proceed with caution and risk mitigation';
    } else {
      return 'Not recommended - Significant compatibility issues';
    }
  }

  private async getBrandProfile(brandId: UUID): Promise<any> {
    // Fetch brand profile
    return {
      id: brandId,
      values: ['quality', 'innovation', 'sustainability'],
      targetAudience: {
        demographics: { ageRange: [25, 45] },
        interests: ['technology', 'lifestyle']
      }
    };
  }

  private async getInfluencerProfile(influencerId: UUID): Promise<InfluencerProfile> {
    // Fetch influencer profile
    return {} as InfluencerProfile;
  }

  private extractInfluencerValues(profile: InfluencerProfile): string[] {
    // Extract values from influencer content and history
    return ['authenticity', 'creativity'];
  }

  private calculateValueOverlap(values1: string[], values2: string[]): number {
    if (values1.length === 0 || values2.length === 0) return 0.5;
    const overlap = values1.filter(v => values2.includes(v));
    return overlap.length / Math.max(values1.length, values2.length);
  }

  private calculateDemographicFit(target: any, actual: any): number {
    // Calculate demographic alignment
    return 75;
  }

  private calculateInterestOverlap(interests1: string[], interests2: string[]): number {
    if (interests1.length === 0 || interests2.length === 0) return 50;
    const overlap = interests1.filter(i => interests2.includes(i));
    return (overlap.length / interests1.length) * 100;
  }

  private calculateStyleCompatibility(brandStyle: any, contentData: any): number {
    // Analyze style compatibility
    return 80;
  }

  private isSimilarBrand(collaboration: any, brandProfile: any): boolean {
    // Check if past collaboration was with similar brand
    return collaboration.category === brandProfile.category;
  }

  private estimateInfluencerCost(profile: InfluencerProfile): number {
    const totalFollowers = profile.platforms.reduce(
      (sum, p) => sum + p.followers,
      0
    );
    return Math.round(totalFollowers / 1000) * 100;
  }
}