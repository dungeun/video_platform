import { MatchingService } from '../src/services/matching.service';
import { ScoringService } from '../src/services/scoring.service';
import { CompatibilityService } from '../src/services/compatibility.service';
import { RecommendationService } from '../src/services/recommendation.service';
import { EventBus } from '@revu/event-bus';
import { MonitoringService } from '@revu/monitoring';
import { CacheService } from '@revu/cache';
import { MatchingCriteria } from '../src/types';

describe('MatchingService', () => {
  let matchingService: MatchingService;
  let eventBus: EventBus;
  let monitoring: MonitoringService;
  let cache: CacheService;
  let scoringService: ScoringService;
  let compatibilityService: CompatibilityService;
  let recommendationService: RecommendationService;

  beforeEach(() => {
    eventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    } as any;

    monitoring = {
      trackMetric: jest.fn(),
      trackError: jest.fn()
    } as any;

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidatePattern: jest.fn()
    } as any;

    scoringService = {
      calculateScore: jest.fn(),
      updateModel: jest.fn()
    } as any;

    compatibilityService = {
      analyzeCompatibility: jest.fn()
    } as any;

    recommendationService = {
      getRecommendations: jest.fn()
    } as any;

    matchingService = new MatchingService(
      eventBus,
      monitoring,
      cache,
      scoringService,
      compatibilityService,
      recommendationService
    );
  });

  describe('findMatches', () => {
    it('should find matches based on criteria', async () => {
      const brandId = 'brand_123';
      const criteria: MatchingCriteria = {
        brandId,
        preferences: {
          platforms: ['instagram', 'youtube'],
          categories: ['fashion', 'lifestyle']
        },
        requirements: {
          minEngagementRate: 3.0,
          verifiedOnly: true
        }
      };

      const mockMatches = [
        {
          id: 'match_1',
          brandId,
          influencerId: 'inf_1',
          score: 85,
          confidence: 0.9,
          breakdown: {
            audienceRelevance: 90,
            engagementRate: 85,
            contentQuality: 80,
            brandAlignment: 85,
            reachPotential: 85,
            costEfficiency: 90,
            pastPerformance: 80,
            total: 85
          },
          recommendation: {
            status: 'highly_recommended',
            reasons: ['Excellent match'],
            risks: [],
            opportunities: ['High engagement']
          },
          analysis: {
            audienceOverlap: 75,
            estimatedReach: 100000,
            estimatedEngagement: 5000,
            estimatedROI: 3.5
          }
        }
      ];

      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);

      // Mock internal methods
      jest.spyOn(matchingService as any, 'getBrandProfile').mockResolvedValue({
        id: brandId,
        categories: ['fashion']
      });
      jest.spyOn(matchingService as any, 'getCandidates').mockResolvedValue([
        { id: 'inf_1' }
      ]);
      jest.spyOn(matchingService as any, 'hybridMatcher', 'get').mockReturnValue({
        getRecommendations: jest.fn().mockResolvedValue(mockMatches)
      });

      const result = await matchingService.findMatches(brandId, criteria);

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(85);
      expect(cache.set).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith('matching.completed', {
        brandId,
        criteria,
        matchCount: 1
      });
      expect(monitoring.trackMetric).toHaveBeenCalledWith('matching.completed', 1, {
        brandId,
        matchCount: 1
      });
    });

    it('should return cached results when available', async () => {
      const brandId = 'brand_123';
      const criteria: MatchingCriteria = {
        brandId,
        preferences: {
          platforms: ['instagram'],
          categories: ['fashion']
        },
        requirements: {}
      };

      const cachedMatches = [{ id: 'cached_match' }];
      (cache.get as jest.Mock).mockResolvedValue(cachedMatches);

      const result = await matchingService.findMatches(brandId, criteria);

      expect(result).toEqual(cachedMatches);
      expect(monitoring.trackMetric).toHaveBeenCalledWith('matching.cache.hit', 1);
    });
  });

  describe('getMatch', () => {
    it('should calculate match between brand and influencer', async () => {
      const brandId = 'brand_123';
      const influencerId = 'inf_123';

      const mockMatch = {
        id: 'match_123',
        brandId,
        influencerId,
        score: 78,
        confidence: 0.85
      };

      jest.spyOn(matchingService as any, 'getBrandProfile').mockResolvedValue({
        id: brandId
      });
      jest.spyOn(matchingService as any, 'getInfluencerProfile').mockResolvedValue({
        id: influencerId
      });
      jest.spyOn(matchingService as any, 'hybridMatcher', 'get').mockReturnValue({
        getRecommendations: jest.fn().mockResolvedValue([mockMatch])
      });

      const result = await matchingService.getMatch(brandId, influencerId);

      expect(result).toEqual(mockMatch);
    });
  });

  describe('updateMatchScore', () => {
    it('should update match score based on feedback', async () => {
      const matchId = 'match_123';
      const feedback = 'positive';
      const mockMatch = {
        id: matchId,
        brandId: 'brand_123',
        influencerId: 'inf_123'
      };

      jest.spyOn(matchingService as any, 'getMatchById').mockResolvedValue(mockMatch);

      await matchingService.updateMatchScore(matchId, feedback);

      expect(scoringService.updateModel).toHaveBeenCalledWith(mockMatch, feedback);
      expect(eventBus.emit).toHaveBeenCalledWith('match.feedback', {
        matchId,
        brandId: mockMatch.brandId,
        influencerId: mockMatch.influencerId,
        feedback
      });
      expect(cache.invalidatePattern).toHaveBeenCalled();
    });
  });

  describe('analyzeCompatibility', () => {
    it('should analyze compatibility between brand and influencer', async () => {
      const brandId = 'brand_123';
      const influencerId = 'inf_123';

      const mockAnalysis = {
        overallScore: 82,
        factors: [],
        insights: ['Good match'],
        risks: [],
        opportunities: []
      };

      (compatibilityService.analyzeCompatibility as jest.Mock).mockResolvedValue(mockAnalysis);

      const result = await matchingService.analyzeCompatibility(brandId, influencerId);

      expect(result).toEqual(mockAnalysis);
      expect(compatibilityService.analyzeCompatibility).toHaveBeenCalledWith(
        brandId,
        influencerId
      );
    });
  });

  describe('getMatchingInsights', () => {
    it('should generate matching insights for brand', async () => {
      const brandId = 'brand_123';
      const historicalMatches = [
        { score: 80, recommendation: { status: 'recommended' } },
        { score: 75, recommendation: { status: 'recommended' } }
      ];

      jest.spyOn(matchingService as any, 'getHistoricalMatches')
        .mockResolvedValue(historicalMatches);

      const result = await matchingService.getMatchingInsights(brandId);

      expect(result).toHaveProperty('topCategories');
      expect(result).toHaveProperty('averageMatchScore');
      expect(result).toHaveProperty('successRate');
      expect(result).toHaveProperty('recommendations');
    });
  });
});