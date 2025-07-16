import { AnalyticsService } from '../src/services/analytics.service';
import { PerformanceService } from '../src/services/performance.service';
import { AudienceService } from '../src/services/audience.service';
import { EngagementService } from '../src/services/engagement.service';
import { TrendService } from '../src/services/trend.service';
import { EventBus } from '@revu/event-bus';
import { MonitoringService } from '@revu/monitoring';
import { MetricsPeriod } from '../src/types';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let eventBus: EventBus;
  let monitoring: MonitoringService;
  let performanceService: PerformanceService;
  let audienceService: AudienceService;
  let engagementService: EngagementService;
  let trendService: TrendService;

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

    performanceService = {
      getPerformanceMetrics: jest.fn(),
      calculatePerformanceScore: jest.fn()
    } as any;

    audienceService = {
      getAudienceAnalytics: jest.fn()
    } as any;

    engagementService = {
      getEngagementMetrics: jest.fn()
    } as any;

    trendService = {
      analyzeTrends: jest.fn()
    } as any;

    analyticsService = new AnalyticsService(
      eventBus,
      monitoring,
      performanceService,
      audienceService,
      engagementService,
      trendService
    );
  });

  describe('getInfluencerAnalytics', () => {
    it('should fetch comprehensive analytics for an influencer', async () => {
      const influencerId = 'inf_123';
      const period: MetricsPeriod = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        type: 'monthly'
      };

      const mockPerformanceData = {
        followers: { total: 50000, growth: 2500, growthRate: 5.26 },
        reach: { total: 150000, unique: 120000, impressions: 500000 },
        performance: { score: 85, ranking: 12, tier: 'micro' }
      };

      const mockAudienceData = {
        demographics: {
          age: [{ range: '18-24', percentage: 35 }],
          gender: [{ gender: 'female', percentage: 65 }]
        },
        interests: ['fashion', 'beauty'],
        topLocations: [{ country: 'USA', percentage: 45 }]
      };

      const mockEngagementData = {
        rate: 5.2,
        likes: 15000,
        comments: 3000,
        shares: 1500,
        saves: 2000
      };

      (performanceService.getPerformanceMetrics as jest.Mock).mockResolvedValue(mockPerformanceData);
      (audienceService.getAudienceAnalytics as jest.Mock).mockResolvedValue(mockAudienceData);
      (engagementService.getEngagementMetrics as jest.Mock).mockResolvedValue(mockEngagementData);

      const result = await analyticsService.getInfluencerAnalytics(influencerId, period);

      expect(result).toMatchObject({
        influencerId,
        period,
        followers: mockPerformanceData.followers,
        engagement: mockEngagementData,
        reach: mockPerformanceData.reach,
        audience: mockAudienceData,
        performance: mockPerformanceData.performance
      });

      expect(eventBus.emit).toHaveBeenCalledWith('analytics.influencer.generated', {
        influencerId,
        period,
        metrics: expect.any(Object)
      });

      expect(monitoring.trackMetric).toHaveBeenCalledWith(
        'analytics.influencer.generated',
        1,
        { influencerId, periodType: 'monthly' }
      );
    });

    it('should handle errors gracefully', async () => {
      const influencerId = 'inf_123';
      const period: MetricsPeriod = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        type: 'monthly'
      };

      const error = new Error('Failed to fetch data');
      (performanceService.getPerformanceMetrics as jest.Mock).mockRejectedValue(error);

      await expect(
        analyticsService.getInfluencerAnalytics(influencerId, period)
      ).rejects.toThrow('Failed to fetch data');

      expect(monitoring.trackMetric).toHaveBeenCalledWith(
        'analytics.influencer.error',
        1,
        { influencerId, error: 'Failed to fetch data' }
      );
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should generate campaign analytics', async () => {
      const campaignId = 'camp_123';
      const influencerId = 'inf_123';

      const result = await analyticsService.getCampaignAnalytics(campaignId, influencerId);

      expect(result).toMatchObject({
        campaignId,
        influencerId,
        metrics: expect.any(Object),
        costPerMetric: expect.any(Object),
        performance: expect.any(Object)
      });

      expect(eventBus.emit).toHaveBeenCalledWith('analytics.campaign.generated', {
        campaignId,
        influencerId,
        analytics: expect.any(Object)
      });
    });
  });

  describe('getRealTimeAnalytics', () => {
    it('should fetch real-time analytics', async () => {
      const influencerId = 'inf_123';
      const platform = 'instagram' as any;

      const result = await analyticsService.getRealTimeAnalytics(influencerId, platform);

      expect(result).toMatchObject({
        currentViewers: expect.any(Number),
        engagementRate: expect.any(Number),
        trending: expect.any(Boolean)
      });

      expect(eventBus.emit).toHaveBeenCalledWith('analytics.realtime.update', {
        influencerId,
        platform,
        data: expect.any(Object)
      });
    });
  });

  describe('generateReport', () => {
    it('should generate PDF report', async () => {
      const influencerId = 'inf_123';
      const period: MetricsPeriod = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        type: 'monthly'
      };

      const mockAnalytics = {
        influencerId,
        period,
        followers: { total: 50000 },
        engagement: { rate: 5.2 }
      };

      const mockTrends = {
        trends: { engagement: { direction: 'up' } },
        predictions: { nextMonthGrowth: 15 }
      };

      jest.spyOn(analyticsService, 'getInfluencerAnalytics').mockResolvedValue(mockAnalytics as any);
      (trendService.analyzeTrends as jest.Mock).mockResolvedValue(mockTrends);

      const result = await analyticsService.generateReport(influencerId, period, 'pdf');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('PDF content');
    });

    it('should generate Excel report', async () => {
      const influencerId = 'inf_123';
      const period: MetricsPeriod = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        type: 'monthly'
      };

      jest.spyOn(analyticsService, 'getInfluencerAnalytics').mockResolvedValue({} as any);
      (trendService.analyzeTrends as jest.Mock).mockResolvedValue({});

      const result = await analyticsService.generateReport(influencerId, period, 'excel');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('Excel content');
    });

    it('should generate JSON report', async () => {
      const influencerId = 'inf_123';
      const period: MetricsPeriod = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        type: 'monthly'
      };

      const mockAnalytics = { test: 'data' };
      const mockTrends = { trend: 'up' };

      jest.spyOn(analyticsService, 'getInfluencerAnalytics').mockResolvedValue(mockAnalytics as any);
      (trendService.analyzeTrends as jest.Mock).mockResolvedValue(mockTrends);

      const result = await analyticsService.generateReport(influencerId, period, 'json');
      const parsed = JSON.parse(result.toString());

      expect(parsed).toMatchObject({
        analytics: mockAnalytics,
        trends: mockTrends,
        period
      });
    });
  });
});