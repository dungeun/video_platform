import { Injectable } from '@revu/types';
import { Logger } from '@revu/logger';
import { EventBus } from '@revu/event-bus';
import {
  OptimizationRequest,
  OptimizationResult,
  InfluencerProfile,
  UUID
} from '../types';
import { OptimizationSolver } from '../algorithms/optimization-solver';
import { MatchingService } from './matching.service';

@Injectable()
export class OptimizationService {
  private logger: Logger;
  private solver: OptimizationSolver;

  constructor(
    private eventBus: EventBus,
    private matchingService: MatchingService
  ) {
    this.logger = new Logger('OptimizationService');
    this.solver = new OptimizationSolver();
  }

  /**
   * Optimize influencer portfolio
   */
  async optimizePortfolio(
    request: OptimizationRequest
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Optimizing portfolio', { request });

      // Get candidate influencers
      const candidates = await this.getCandidates(request);

      // Calculate match scores
      const matchScores = await this.calculateMatchScores(
        request.brandId,
        candidates
      );

      // Run optimization
      const result = this.solver.solve(request, candidates, matchScores);

      // Validate result
      await this.validateOptimizationResult(result, request);

      // Emit event
      await this.eventBus.emit('portfolio.optimized', {
        brandId: request.brandId,
        portfolioSize: result.portfolio.length,
        totalScore: result.totalScore
      });

      // Track metrics
      const duration = Date.now() - startTime;
      this.monitoring.trackMetric('optimization.completed', 1, {
        brandId: request.brandId,
        duration,
        portfolioSize: result.portfolio.length
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to optimize portfolio', error);
      throw error;
    }
  }

  /**
   * Run scenario analysis
   */
  async runScenarioAnalysis(
    brandId: UUID,
    scenarios: OptimizationRequest[]
  ): Promise<any> {
    try {
      this.logger.info('Running scenario analysis', {
        brandId,
        scenarioCount: scenarios.length
      });

      const results = await Promise.all(
        scenarios.map(async (scenario, index) => ({
          scenarioId: `scenario_${index}`,
          request: scenario,
          result: await this.optimizePortfolio(scenario)
        }))
      );

      // Compare scenarios
      const comparison = this.compareScenarios(results);

      // Generate recommendations
      const recommendations = this.generateScenarioRecommendations(
        results,
        comparison
      );

      return {
        scenarios: results,
        comparison,
        recommendations
      };
    } catch (error) {
      this.logger.error('Failed to run scenario analysis', error);
      throw error;
    }
  }

  /**
   * Optimize budget allocation
   */
  async optimizeBudgetAllocation(
    brandId: UUID,
    totalBudget: number,
    influencerIds: UUID[]
  ): Promise<any> {
    try {
      this.logger.info('Optimizing budget allocation', {
        brandId,
        budget: totalBudget,
        influencerCount: influencerIds.length
      });

      // Get influencer profiles and scores
      const influencers = await this.getInfluencerProfiles(influencerIds);
      const scores = await this.getInfluencerScores(brandId, influencerIds);

      // Calculate optimal allocation
      const allocation = this.calculateOptimalAllocation(
        totalBudget,
        influencers,
        scores
      );

      // Validate allocation
      this.validateAllocation(allocation, totalBudget);

      return {
        allocations: allocation,
        totalAllocated: allocation.reduce((sum, a) => sum + a.amount, 0),
        recommendations: this.generateAllocationRecommendations(allocation)
      };
    } catch (error) {
      this.logger.error('Failed to optimize budget allocation', error);
      throw error;
    }
  }

  /**
   * Suggest portfolio improvements
   */
  async suggestImprovements(
    brandId: UUID,
    currentPortfolio: UUID[]
  ): Promise<any> {
    try {
      this.logger.info('Suggesting portfolio improvements', {
        brandId,
        currentSize: currentPortfolio.length
      });

      // Analyze current portfolio
      const analysis = await this.analyzeCurrentPortfolio(
        brandId,
        currentPortfolio
      );

      // Identify weaknesses
      const weaknesses = this.identifyWeaknesses(analysis);

      // Find improvement opportunities
      const improvements = await this.findImprovements(
        brandId,
        currentPortfolio,
        weaknesses
      );

      return {
        currentAnalysis: analysis,
        weaknesses,
        improvements,
        expectedImpact: this.calculateImprovementImpact(improvements)
      };
    } catch (error) {
      this.logger.error('Failed to suggest improvements', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async getCandidates(
    request: OptimizationRequest
  ): Promise<InfluencerProfile[]> {
    // Get candidate influencers based on constraints
    const criteria = this.buildCriteriaFromRequest(request);
    const matches = await this.matchingService.findMatches(
      request.brandId,
      criteria
    );

    // Convert to profiles
    return this.getInfluencerProfiles(
      matches.map(m => m.influencerId)
    );
  }

  private async calculateMatchScores(
    brandId: UUID,
    candidates: InfluencerProfile[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    
    // Get matches for all candidates
    const matches = await Promise.all(
      candidates.map(candidate => 
        this.matchingService.getMatch(brandId, candidate.id)
      )
    );

    matches.forEach(match => {
      scores.set(match.influencerId, match.score);
    });

    return scores;
  }

  private async validateOptimizationResult(
    result: OptimizationResult,
    request: OptimizationRequest
  ): Promise<void> {
    // Validate budget constraint
    const totalCost = result.portfolio.reduce(
      (sum, p) => sum + p.allocation,
      0
    );
    if (totalCost > request.budget) {
      throw new Error('Optimization exceeded budget constraint');
    }

    // Validate other constraints
    if (request.constraints.minInfluencers && 
        result.portfolio.length < request.constraints.minInfluencers) {
      throw new Error('Optimization did not meet minimum influencer constraint');
    }
  }

  private compareScenarios(results: any[]): any {
    // Sort by total score
    const sorted = [...results].sort((a, b) => 
      b.result.totalScore - a.result.totalScore
    );

    return {
      best: sorted[0],
      rankings: sorted.map((s, i) => ({
        scenarioId: s.scenarioId,
        rank: i + 1,
        score: s.result.totalScore,
        roi: s.result.estimatedROI
      })),
      tradeoffs: this.analyzeTradeoffs(results)
    };
  }

  private generateScenarioRecommendations(
    results: any[],
    comparison: any
  ): string[] {
    const recommendations: string[] = [];

    // Best overall scenario
    recommendations.push(
      `Scenario ${comparison.best.scenarioId} provides the best overall results`
    );

    // Identify specific strengths
    results.forEach(result => {
      if (result.result.estimatedROI > comparison.best.result.estimatedROI) {
        recommendations.push(
          `Consider ${result.scenarioId} for maximum ROI`
        );
      }
    });

    return recommendations;
  }

  private calculateOptimalAllocation(
    budget: number,
    influencers: InfluencerProfile[],
    scores: Map<string, number>
  ): any[] {
    // Simple proportional allocation based on scores
    const totalScore = Array.from(scores.values()).reduce((a, b) => a + b, 0);

    return influencers.map(influencer => {
      const score = scores.get(influencer.id) || 0;
      const proportion = score / totalScore;
      
      return {
        influencerId: influencer.id,
        amount: Math.round(budget * proportion),
        percentage: proportion * 100
      };
    });
  }

  private validateAllocation(allocation: any[], totalBudget: number): void {
    const allocated = allocation.reduce((sum, a) => sum + a.amount, 0);
    if (allocated > totalBudget) {
      throw new Error('Allocation exceeds total budget');
    }
  }

  private generateAllocationRecommendations(allocation: any[]): string[] {
    const recommendations: string[] = [];

    // Check for imbalanced allocations
    const maxAllocation = Math.max(...allocation.map(a => a.percentage));
    if (maxAllocation > 50) {
      recommendations.push('Consider diversifying budget across more influencers');
    }

    // Check for minimal allocations
    const minAllocation = Math.min(...allocation.map(a => a.percentage));
    if (minAllocation < 5) {
      recommendations.push('Some influencers have minimal allocation - consider removing or increasing');
    }

    return recommendations;
  }

  private async analyzeCurrentPortfolio(
    brandId: UUID,
    portfolio: UUID[]
  ): Promise<any> {
    // Analyze portfolio characteristics
    const profiles = await this.getInfluencerProfiles(portfolio);
    
    return {
      size: portfolio.length,
      totalReach: profiles.reduce((sum, p) => sum + p.audienceData.totalReach, 0),
      platformDistribution: this.analyzePlatformDistribution(profiles),
      categoryDistribution: this.analyzeCategoryDistribution(profiles),
      averageEngagement: this.calculateAverageEngagement(profiles)
    };
  }

  private identifyWeaknesses(analysis: any): any {
    const weaknesses = {
      coverage: [],
      performance: [],
      diversity: []
    };

    // Check platform coverage
    if (Object.keys(analysis.platformDistribution).length < 3) {
      weaknesses.coverage.push('Limited platform diversity');
    }

    // Check performance metrics
    if (analysis.averageEngagement < 3) {
      weaknesses.performance.push('Below average engagement rates');
    }

    return weaknesses;
  }

  private async findImprovements(
    brandId: UUID,
    currentPortfolio: UUID[],
    weaknesses: any
  ): Promise<any> {
    const improvements = {
      additions: [],
      replacements: [],
      adjustments: []
    };

    // Find influencers to add
    if (weaknesses.coverage.length > 0) {
      const complementary = await this.matchingService.getRecommendations({
        brandId,
        filters: {
          brandId,
          preferences: {
            platforms: ['tiktok'], // Example: missing platform
            categories: []
          },
          requirements: {}
        }
      });
      improvements.additions = complementary.recommendations.slice(0, 3);
    }

    return improvements;
  }

  private calculateImprovementImpact(improvements: any): any {
    return {
      estimatedReachIncrease: 25,
      estimatedEngagementIncrease: 15,
      estimatedROIIncrease: 20
    };
  }

  private buildCriteriaFromRequest(request: OptimizationRequest): any {
    return {
      brandId: request.brandId,
      campaign: {
        budget: { min: 0, max: request.budget, currency: 'USD' },
        goals: request.goals
      },
      preferences: {},
      requirements: {}
    };
  }

  private async getInfluencerProfiles(ids: UUID[]): Promise<InfluencerProfile[]> {
    // Fetch influencer profiles
    return [];
  }

  private async getInfluencerScores(
    brandId: UUID,
    influencerIds: UUID[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    // Fetch scores
    return scores;
  }

  private analyzeTradeoffs(results: any[]): any {
    return {
      reachVsCost: 'Higher reach scenarios require 20% more budget',
      engagementVsReach: 'Engagement-focused scenarios have 30% less reach'
    };
  }

  private analyzePlatformDistribution(profiles: InfluencerProfile[]): any {
    const distribution: any = {};
    
    profiles.forEach(profile => {
      profile.platforms.forEach(platform => {
        distribution[platform.platform] = (distribution[platform.platform] || 0) + 1;
      });
    });

    return distribution;
  }

  private analyzeCategoryDistribution(profiles: InfluencerProfile[]): any {
    const distribution: any = {};
    
    profiles.forEach(profile => {
      profile.categories.forEach(category => {
        distribution[category] = (distribution[category] || 0) + 1;
      });
    });

    return distribution;
  }

  private calculateAverageEngagement(profiles: InfluencerProfile[]): number {
    const totalEngagement = profiles.reduce((sum, profile) => {
      const avgPlatformEngagement = profile.platforms.reduce(
        (pSum, p) => pSum + p.engagementRate,
        0
      ) / profile.platforms.length;
      return sum + avgPlatformEngagement;
    }, 0);

    return totalEngagement / profiles.length;
  }

  private monitoring = {
    trackMetric: (name: string, value: number, tags?: any) => {
      // Monitoring implementation
    }
  };
}