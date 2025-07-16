import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FraudDetectionService } from '../services/fraud-detection.service';
import {
  FraudDetectionConfig,
  InfluencerAnalysisParams,
  FraudType,
  Severity,
  RuleAction
} from '../types';

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;
  let mockConfig: FraudDetectionConfig;

  beforeEach(() => {
    mockConfig = {
      blocking: {
        autoBlock: false,
        reviewThreshold: 0.8
      },
      monitoring: {
        enabled: true,
        platforms: ['instagram', 'youtube'],
        checkInterval: 300000,
        alertThreshold: 0.7
      }
    };
    
    service = new FraudDetectionService(mockConfig);
  });

  describe('analyzeInfluencer', () => {
    it('should analyze an influencer and return fraud analysis', async () => {
      const params: InfluencerAnalysisParams = {
        userId: 'user123',
        socialAccounts: [{
          platform: 'instagram',
          username: 'testuser',
          followers: 10000,
          following: 500,
          posts: 100,
          verified: false
        }],
        recentPosts: [{
          id: 'post1',
          platform: 'instagram',
          likes: 1000,
          comments: 50,
          timestamp: new Date(),
          views: 5000
        }]
      };

      const analysis = await service.analyzeInfluencer(params);

      expect(analysis).toBeDefined();
      expect(analysis.userId).toBe('user123');
      expect(analysis.riskScore).toBeGreaterThanOrEqual(0);
      expect(analysis.riskScore).toBeLessThanOrEqual(1);
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(analysis.detectedIssues)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(typeof analysis.autoBlock).toBe('boolean');
    });

    it('should detect fake followers when percentage is high', async () => {
      // Mock the fake follower detector to return high fake percentage
      const originalAnalyze = service['fakeFollowerDetector'].analyze;
      service['fakeFollowerDetector'].analyze = vi.fn().mockResolvedValue({
        totalFollowers: 10000,
        analyzedSample: 1000,
        fakePercentage: 45, // High fake percentage
        botIndicators: [],
        redFlags: [],
        profileScores: [],
        confidence: 0.9
      });

      const params: InfluencerAnalysisParams = {
        userId: 'user123',
        socialAccounts: [{
          platform: 'instagram',
          username: 'testuser',
          followers: 10000,
          following: 500,
          posts: 100
        }]
      };

      const analysis = await service.analyzeInfluencer(params);

      expect(analysis.detectedIssues.length).toBeGreaterThan(0);
      expect(analysis.detectedIssues[0].type).toBe(FraudType.FAKE_FOLLOWERS);
      expect(analysis.riskScore).toBeGreaterThan(0.3);

      // Restore original method
      service['fakeFollowerDetector'].analyze = originalAnalyze;
    });

    it('should detect engagement fraud when score is high', async () => {
      // Mock the engagement fraud detector
      const originalAnalyze = service['engagementFraudDetector'].analyze;
      service['engagementFraudDetector'].analyze = vi.fn().mockResolvedValue({
        averageEngagementRate: 0.2,
        engagementPattern: {
          consistency: 0.3,
          timing: { peakHours: [12], irregularSpikes: [], botLikePatterns: true },
          quality: { commentQuality: 20, likeToCommentRatio: 100, engagementVelocity: 80 }
        },
        anomalies: [],
        suspiciousActivity: [],
        score: 0.8 // High fraud score
      });

      const params: InfluencerAnalysisParams = {
        userId: 'user123',
        socialAccounts: [{
          platform: 'instagram',
          username: 'testuser',
          followers: 10000,
          following: 500,
          posts: 100
        }],
        recentPosts: [{
          id: 'post1',
          platform: 'instagram',
          likes: 2000,
          comments: 10,
          timestamp: new Date()
        }]
      };

      const analysis = await service.analyzeInfluencer(params);

      expect(analysis.detectedIssues.some(issue => issue.type === FraudType.ENGAGEMENT_FRAUD)).toBe(true);

      // Restore original method
      service['engagementFraudDetector'].analyze = originalAnalyze;
    });
  });

  describe('analyzeFakeFollowers', () => {
    it('should delegate to fake follower detector', async () => {
      const params = {
        userId: 'user123',
        platform: 'instagram',
        sampleSize: 1000
      };

      const result = await service.analyzeFakeFollowers(params);

      expect(result).toBeDefined();
      expect(result.totalFollowers).toBeDefined();
      expect(result.fakePercentage).toBeGreaterThanOrEqual(0);
      expect(result.fakePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('addRule', () => {
    it('should add a custom fraud rule', () => {
      const ruleData = {
        name: 'Test Rule',
        description: 'Test description',
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => data.followers > 100000,
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.5
      };

      service.addRule(ruleData);

      // Verify rule was added to rule engine
      const rules = service['ruleEngine'].getAllRules();
      expect(rules.some(rule => rule.name === 'Test Rule')).toBe(true);
    });
  });

  describe('startMonitoring', () => {
    it('should start monitoring with default config', () => {
      const emitSpy = vi.spyOn(service, 'emit');
      
      service.startMonitoring();

      expect(emitSpy).toHaveBeenCalledWith('monitoring:started', expect.any(Object));
    });

    it('should not start monitoring if already active', () => {
      service.startMonitoring();
      const emitSpy = vi.spyOn(service, 'emit');
      
      service.startMonitoring(); // Second call should be ignored

      expect(emitSpy).not.toHaveBeenCalledWith('monitoring:started', expect.any(Object));
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring', () => {
      service.startMonitoring();
      const emitSpy = vi.spyOn(service, 'emit');
      
      service.stopMonitoring();

      expect(emitSpy).toHaveBeenCalledWith('monitoring:stopped');
    });
  });

  describe('analyzeBatch', () => {
    it('should process multiple users in parallel', async () => {
      const params = {
        userIds: ['user1', 'user2', 'user3'],
        analysisType: 'basic' as const,
        parallel: true
      };

      const result = await service.analyzeBatch(params);

      expect(result.totalAnalyzed).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.summary).toBeDefined();
      expect(result.summary.highRiskUsers).toBeGreaterThanOrEqual(0);
      expect(result.summary.averageRiskScore).toBeGreaterThanOrEqual(0);
    });

    it('should process users in batches when parallel is false', async () => {
      const params = {
        userIds: ['user1', 'user2', 'user3', 'user4', 'user5'],
        analysisType: 'basic' as const,
        parallel: false,
        batchSize: 2
      };

      const result = await service.analyzeBatch(params);

      expect(result.totalAnalyzed).toBe(5);
      expect(result.results).toHaveLength(5);
    });
  });

  describe('Event Handling', () => {
    it('should emit analysis events', async () => {
      const startedSpy = vi.fn();
      const completedSpy = vi.fn();
      
      service.on('analysis:started', startedSpy);
      service.on('analysis:completed', completedSpy);

      const params: InfluencerAnalysisParams = {
        userId: 'user123',
        socialAccounts: [],
        recentPosts: []
      };

      await service.analyzeInfluencer(params);

      expect(startedSpy).toHaveBeenCalled();
      expect(completedSpy).toHaveBeenCalled();
    });

    it('should emit fraud detection alert for high risk scores', async () => {
      const fraudDetectedSpy = vi.fn();
      service.on('fraud:detected', fraudDetectedSpy);

      // Mock high risk analysis
      const originalAnalyze = service['fakeFollowerDetector'].analyze;
      service['fakeFollowerDetector'].analyze = vi.fn().mockResolvedValue({
        totalFollowers: 10000,
        analyzedSample: 1000,
        fakePercentage: 80, // Very high fake percentage
        botIndicators: [],
        redFlags: [],
        profileScores: [],
        confidence: 0.95
      });

      const params: InfluencerAnalysisParams = {
        userId: 'user123',
        socialAccounts: [{
          platform: 'instagram',
          username: 'testuser',
          followers: 10000,
          following: 500,
          posts: 100
        }]
      };

      await service.analyzeInfluencer(params);

      expect(fraudDetectedSpy).toHaveBeenCalled();

      // Restore original method
      service['fakeFollowerDetector'].analyze = originalAnalyze;
    });
  });
});