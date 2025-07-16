import {
  OptimizationRequest,
  OptimizationResult,
  InfluencerPortfolio,
  InfluencerProfile,
  CampaignGoal
} from '../types';

export class OptimizationSolver {
  /**
   * Solve portfolio optimization problem
   */
  solve(
    request: OptimizationRequest,
    candidates: InfluencerProfile[],
    matchScores: Map<string, number>
  ): OptimizationResult {
    // Filter candidates based on constraints
    const eligibleCandidates = this.filterByConstraints(candidates, request);

    // Calculate optimal allocation
    const portfolio = this.optimizePortfolio(
      eligibleCandidates,
      matchScores,
      request
    );

    // Calculate portfolio metrics
    const metrics = this.calculatePortfolioMetrics(portfolio, request);

    // Generate recommendations
    const recommendations = this.generateOptimizationRecommendations(
      portfolio,
      metrics,
      request
    );

    return {
      portfolio,
      totalScore: metrics.totalScore,
      estimatedReach: metrics.reach,
      estimatedEngagement: metrics.engagement,
      estimatedROI: metrics.roi,
      budgetUtilization: metrics.budgetUtilization,
      recommendations
    };
  }

  /**
   * Filter candidates based on constraints
   */
  private filterByConstraints(
    candidates: InfluencerProfile[],
    request: OptimizationRequest
  ): InfluencerProfile[] {
    let filtered = [...candidates];

    // Apply time constraints
    if (request.constraints.timeConstraints) {
      filtered = filtered.filter(candidate => 
        this.checkAvailability(candidate, request.constraints.timeConstraints!)
      );
    }

    // Apply platform distribution
    if (request.constraints.platformDistribution) {
      // This is handled in portfolio optimization
    }

    return filtered;
  }

  /**
   * Optimize influencer portfolio using linear programming approach
   */
  private optimizePortfolio(
    candidates: InfluencerProfile[],
    matchScores: Map<string, number>,
    request: OptimizationRequest
  ): InfluencerPortfolio[] {
    // Sort candidates by value (score / cost)
    const candidatesWithValue = candidates.map(candidate => {
      const score = matchScores.get(candidate.id) || 0;
      const cost = this.estimateCost(candidate);
      const value = score / cost;

      return { candidate, score, cost, value };
    }).sort((a, b) => b.value - a.value);

    // Greedy allocation with constraints
    const portfolio: InfluencerPortfolio[] = [];
    let remainingBudget = request.budget;
    const platformCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    for (const { candidate, cost, score } of candidatesWithValue) {
      // Check budget constraint
      if (cost > remainingBudget) continue;

      // Check min/max influencer constraints
      if (request.constraints.maxInfluencers && 
          portfolio.length >= request.constraints.maxInfluencers) {
        break;
      }

      // Check platform distribution
      if (!this.checkPlatformConstraints(
        candidate,
        platformCounts,
        request.constraints.platformDistribution
      )) {
        continue;
      }

      // Check category requirements
      if (!this.checkCategoryConstraints(
        candidate,
        categoryCounts,
        request.constraints.categoryRequirements
      )) {
        continue;
      }

      // Add to portfolio
      const role = this.determineRole(portfolio.length, score);
      const deliverables = this.generateDeliverables(candidate, request.goals);
      const impact = this.estimateImpact(candidate, score, request.goals);

      portfolio.push({
        influencerId: candidate.id,
        allocation: cost,
        role,
        deliverables,
        estimatedImpact: impact
      });

      remainingBudget -= cost;

      // Update counts
      candidate.platforms.forEach(p => {
        platformCounts.set(p.platform, (platformCounts.get(p.platform) || 0) + 1);
      });
      candidate.categories.forEach(c => {
        categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1);
      });
    }

    // Check minimum constraints
    if (request.constraints.minInfluencers && 
        portfolio.length < request.constraints.minInfluencers) {
      // Add more influencers if needed
      // Implementation depends on specific requirements
    }

    return portfolio;
  }

  /**
   * Calculate portfolio metrics
   */
  private calculatePortfolioMetrics(
    portfolio: InfluencerPortfolio[],
    request: OptimizationRequest
  ): any {
    const totalScore = portfolio.reduce((sum, p) => sum + p.estimatedImpact, 0);
    const totalCost = portfolio.reduce((sum, p) => sum + p.allocation, 0);
    const budgetUtilization = totalCost / request.budget;

    // Aggregate reach and engagement
    // This would need actual influencer data
    const reach = portfolio.length * 50000; // Placeholder
    const engagement = portfolio.length * 2500; // Placeholder
    const roi = (reach * 0.02) / totalCost; // Simplified ROI

    return {
      totalScore,
      reach,
      engagement,
      roi,
      budgetUtilization
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    portfolio: InfluencerPortfolio[],
    metrics: any,
    request: OptimizationRequest
  ): string[] {
    const recommendations: string[] = [];

    // Budget utilization
    if (metrics.budgetUtilization < 0.8) {
      recommendations.push(
        `Consider increasing budget utilization from ${(metrics.budgetUtilization * 100).toFixed(1)}% to maximize impact`
      );
    }

    // Portfolio diversity
    const uniquePlatforms = new Set(portfolio.map(p => p.influencerId)).size;
    if (uniquePlatforms < 3) {
      recommendations.push('Diversify across more platforms to reduce risk');
    }

    // Goal alignment
    request.goals.forEach(goal => {
      if (goal.type === 'awareness' && portfolio.length < 5) {
        recommendations.push('Consider adding more influencers for awareness campaigns');
      } else if (goal.type === 'conversion' && !portfolio.some(p => p.role === 'primary')) {
        recommendations.push('Ensure primary influencers are focused on conversion');
      }
    });

    return recommendations;
  }

  /**
   * Helper methods
   */
  private checkAvailability(
    candidate: InfluencerProfile,
    timeConstraints: any
  ): boolean {
    // Check if influencer is available during campaign period
    return true; // Placeholder
  }

  private checkPlatformConstraints(
    candidate: InfluencerProfile,
    currentCounts: Map<string, number>,
    constraints?: { [platform: string]: number }
  ): boolean {
    if (!constraints) return true;

    for (const platform of candidate.platforms) {
      const current = currentCounts.get(platform.platform) || 0;
      const max = constraints[platform.platform];
      if (max && current >= max) return false;
    }

    return true;
  }

  private checkCategoryConstraints(
    candidate: InfluencerProfile,
    currentCounts: Map<string, number>,
    requirements?: { [category: string]: number }
  ): boolean {
    if (!requirements) return true;

    // Check if adding this candidate helps meet requirements
    for (const category of candidate.categories) {
      if (requirements[category]) {
        const current = currentCounts.get(category) || 0;
        if (current < requirements[category]) return true;
      }
    }

    return false;
  }

  private estimateCost(candidate: InfluencerProfile): number {
    // Simple cost estimation based on followers
    const totalFollowers = candidate.platforms.reduce(
      (sum, p) => sum + p.followers,
      0
    );
    return Math.round(totalFollowers / 1000) * 100;
  }

  private determineRole(
    position: number,
    score: number
  ): 'primary' | 'supporting' | 'amplifier' {
    if (position === 0 || score > 85) return 'primary';
    if (score > 70) return 'supporting';
    return 'amplifier';
  }

  private generateDeliverables(
    candidate: InfluencerProfile,
    goals: CampaignGoal[]
  ): any[] {
    const deliverables = [];

    // Generate based on goals and influencer capabilities
    if (goals.some(g => g.type === 'awareness')) {
      deliverables.push({
        type: 'post',
        quantity: 3,
        platform: candidate.platforms[0].platform,
        description: 'Brand awareness posts'
      });
    }

    if (goals.some(g => g.type === 'engagement')) {
      deliverables.push({
        type: 'story',
        quantity: 5,
        platform: candidate.platforms[0].platform,
        description: 'Interactive stories'
      });
    }

    return deliverables;
  }

  private estimateImpact(
    candidate: InfluencerProfile,
    score: number,
    goals: CampaignGoal[]
  ): number {
    // Calculate weighted impact based on goals
    let impact = score;

    goals.forEach(goal => {
      if (goal.type === 'awareness') {
        impact *= (candidate.audienceData.totalReach / 100000);
      } else if (goal.type === 'engagement') {
        const avgEngagement = candidate.platforms.reduce(
          (sum, p) => sum + p.engagementRate,
          0
        ) / candidate.platforms.length;
        impact *= (avgEngagement / 5);
      }
    });

    return Math.min(impact, 100);
  }
}