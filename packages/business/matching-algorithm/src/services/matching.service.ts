import { Injectable } from '@revu/types';
import { Logger } from '@revu/logger';
import { EventBus } from '@revu/event-bus';
import { MonitoringService } from '@revu/monitoring';
import { CacheService } from '@revu/cache';
import {
  MatchingCriteria,
  MatchResult,
  UUID,
  InfluencerProfile,
  RecommendationRequest,
  RecommendationResponse
} from '../types';
import { HybridMatchingAlgorithm } from '../algorithms/hybrid-matching';
import { ScoringService } from './scoring.service';
import { CompatibilityService } from './compatibility.service';
import { RecommendationService } from './recommendation.service';

@Injectable()
export class MatchingService {
  private logger: Logger;
  private hybridMatcher: HybridMatchingAlgorithm;

  constructor(
    private eventBus: EventBus,
    private monitoring: MonitoringService,
    private cache: CacheService,
    private scoringService: ScoringService,
    private compatibilityService: CompatibilityService,
    private recommendationService: RecommendationService
  ) {
    this.logger = new Logger('MatchingService');
    this.hybridMatcher = new HybridMatchingAlgorithm();
  }

  /**
   * Initialize matching service with training data
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing matching service');

      // Load training data
      const interactions = await this.loadInteractionData();
      const influencerProfiles = await this.loadInfluencerProfiles();

      // Initialize hybrid matcher
      this.hybridMatcher.initialize(interactions, influencerProfiles);

      this.logger.info('Matching service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize matching service', error);
      throw error;
    }
  }

  /**
   * Find matches for a brand based on criteria
   */
  async findMatches(
    brandId: UUID,
    criteria: MatchingCriteria
  ): Promise<MatchResult[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Finding matches', { brandId, criteria });

      // Check cache
      const cacheKey = this.generateCacheKey(brandId, criteria);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.monitoring.trackMetric('matching.cache.hit', 1);
        return cached;
      }

      // Get brand profile
      const brandProfile = await this.getBrandProfile(brandId);

      // Get candidate influencers
      const candidates = await this.getCandidates(criteria);

      // Run hybrid matching algorithm
      const matches = await this.hybridMatcher.getRecommendations(
        brandId,
        criteria,
        brandProfile,
        candidates
      );

      // Post-process matches
      const processedMatches = await this.postProcessMatches(matches, criteria);

      // Cache results
      await this.cache.set(cacheKey, processedMatches, 3600); // 1 hour

      // Emit event
      await this.eventBus.emit('matching.completed', {
        brandId,
        criteria,
        matchCount: processedMatches.length
      });

      // Track metrics
      this.monitoring.trackMetric('matching.completed', 1, {
        brandId,
        matchCount: processedMatches.length
      });

      return processedMatches;
    } catch (error) {
      this.logger.error('Failed to find matches', error);
      this.monitoring.trackMetric('matching.error', 1, {
        brandId,
        error: error.message
      });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.monitoring.trackMetric('matching.duration', duration);
    }
  }

  /**
   * Get a single match between brand and influencer
   */
  async getMatch(
    brandId: UUID,
    influencerId: UUID,
    criteria?: MatchingCriteria
  ): Promise<MatchResult> {
    try {
      this.logger.info('Getting match', { brandId, influencerId });

      // Get profiles
      const [brandProfile, influencerProfile] = await Promise.all([
        this.getBrandProfile(brandId),
        this.getInfluencerProfile(influencerId)
      ]);

      // Use default criteria if not provided
      const matchCriteria = criteria || this.getDefaultCriteria(brandProfile);

      // Calculate match
      const matches = await this.hybridMatcher.getRecommendations(
        brandId,
        matchCriteria,
        brandProfile,
        [influencerProfile]
      );

      if (matches.length === 0) {
        throw new Error('No match found');
      }

      return matches[0];
    } catch (error) {
      this.logger.error('Failed to get match', error);
      throw error;
    }
  }

  /**
   * Update match score based on feedback
   */
  async updateMatchScore(
    matchId: UUID,
    feedback: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    try {
      this.logger.info('Updating match score', { matchId, feedback });

      // Get match details
      const match = await this.getMatchById(matchId);

      // Update scoring model
      await this.scoringService.updateModel(match, feedback);

      // Emit event
      await this.eventBus.emit('match.feedback', {
        matchId,
        brandId: match.brandId,
        influencerId: match.influencerId,
        feedback
      });

      // Invalidate cache
      await this.invalidateMatchCache(match.brandId);

    } catch (error) {
      this.logger.error('Failed to update match score', error);
      throw error;
    }
  }

  /**
   * Get match recommendations
   */
  async getRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    try {
      return await this.recommendationService.getRecommendations(request);
    } catch (error) {
      this.logger.error('Failed to get recommendations', error);
      throw error;
    }
  }

  /**
   * Analyze match compatibility
   */
  async analyzeCompatibility(
    brandId: UUID,
    influencerId: UUID
  ): Promise<any> {
    try {
      return await this.compatibilityService.analyzeCompatibility(
        brandId,
        influencerId
      );
    } catch (error) {
      this.logger.error('Failed to analyze compatibility', error);
      throw error;
    }
  }

  /**
   * Get matching insights
   */
  async getMatchingInsights(brandId: UUID): Promise<any> {
    try {
      this.logger.info('Getting matching insights', { brandId });

      // Get historical matches
      const historicalMatches = await this.getHistoricalMatches(brandId);

      // Analyze patterns
      const insights = {
        topCategories: this.analyzeTopCategories(historicalMatches),
        averageMatchScore: this.calculateAverageScore(historicalMatches),
        successRate: this.calculateSuccessRate(historicalMatches),
        recommendations: this.generateInsightRecommendations(historicalMatches)
      };

      return insights;
    } catch (error) {
      this.logger.error('Failed to get matching insights', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async loadInteractionData(): Promise<any[]> {
    // Load historical brand-influencer interactions
    return [];
  }

  private async loadInfluencerProfiles(): Promise<InfluencerProfile[]> {
    // Load all influencer profiles
    return [];
  }

  private async getBrandProfile(brandId: UUID): Promise<any> {
    // Fetch brand profile
    return {
      id: brandId,
      categories: ['fashion', 'lifestyle'],
      values: ['sustainability', 'quality']
    };
  }

  private async getInfluencerProfile(influencerId: UUID): Promise<InfluencerProfile> {
    // Fetch influencer profile
    return {} as InfluencerProfile;
  }

  private async getCandidates(criteria: MatchingCriteria): Promise<InfluencerProfile[]> {
    // Get candidate influencers based on criteria
    return [];
  }

  private async postProcessMatches(
    matches: MatchResult[],
    criteria: MatchingCriteria
  ): Promise<MatchResult[]> {
    // Apply final filters and enhancements
    let processed = [...matches];

    // Filter by requirements
    if (criteria.requirements?.verifiedOnly) {
      processed = processed.filter(match => {
        // Check if influencer is verified
        return true; // Placeholder
      });
    }

    // Sort by score
    processed.sort((a, b) => b.score - a.score);

    // Limit results
    return processed.slice(0, 100);
  }

  private generateCacheKey(brandId: UUID, criteria: MatchingCriteria): string {
    return `match:${brandId}:${JSON.stringify(criteria)}`;
  }

  private getDefaultCriteria(brandProfile: any): MatchingCriteria {
    return {
      brandId: brandProfile.id,
      preferences: {
        platforms: ['instagram', 'youtube'],
        categories: brandProfile.categories
      },
      requirements: {
        minEngagementRate: 2.0
      }
    };
  }

  private async getMatchById(matchId: UUID): Promise<MatchResult> {
    // Fetch match from database
    return {} as MatchResult;
  }

  private async invalidateMatchCache(brandId: UUID): Promise<void> {
    // Invalidate all cache entries for brand
    const pattern = `match:${brandId}:*`;
    await this.cache.invalidatePattern(pattern);
  }

  private async getHistoricalMatches(brandId: UUID): Promise<MatchResult[]> {
    // Fetch historical matches
    return [];
  }

  private analyzeTopCategories(matches: MatchResult[]): string[] {
    // Analyze most common categories
    return ['fashion', 'beauty', 'lifestyle'];
  }

  private calculateAverageScore(matches: MatchResult[]): number {
    if (matches.length === 0) return 0;
    return matches.reduce((sum, m) => sum + m.score, 0) / matches.length;
  }

  private calculateSuccessRate(matches: MatchResult[]): number {
    // Calculate success rate based on completed campaigns
    return 0.75;
  }

  private generateInsightRecommendations(matches: MatchResult[]): string[] {
    return [
      'Consider expanding to TikTok influencers',
      'Focus on micro-influencers for better engagement'
    ];
  }
}