import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  FraudDetectionConfig,
  InfluencerAnalysisParams,
  FraudAnalysis,
  FollowerAnalysisParams,
  FollowerAnalysis,
  ContentAnalysisParams,
  ContentAnalysis,
  PaymentAnalysisParams,
  PaymentAnalysis,
  BatchAnalysisParams,
  BatchResult,
  FraudAlert,
  FraudRule,
  FraudType,
  Severity,
  RuleAction,
  FraudIssue
} from '../types';
import { FakeFollowerDetector } from '../detectors/fake-follower.detector';
import { EngagementFraudDetector } from '../detectors/engagement-fraud.detector';
import { ContentFraudDetector } from '../detectors/content-fraud.detector';
import { PaymentFraudDetector } from '../detectors/payment-fraud.detector';
import { RuleEngine } from '../utils/rule-engine';
import { MLManager } from '../ml/ml-manager';

export class FraudDetectionService extends EventEmitter {
  private config: FraudDetectionConfig;
  private fakeFollowerDetector: FakeFollowerDetector;
  private engagementFraudDetector: EngagementFraudDetector;
  private contentFraudDetector: ContentFraudDetector;
  private paymentFraudDetector: PaymentFraudDetector;
  private ruleEngine: RuleEngine;
  private mlManager: MLManager;
  private alerts: Map<string, FraudAlert> = new Map();
  private monitoringActive = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: FraudDetectionConfig = {}) {
    super();
    this.config = config;
    
    // Initialize detectors
    this.fakeFollowerDetector = new FakeFollowerDetector();
    this.engagementFraudDetector = new EngagementFraudDetector();
    this.contentFraudDetector = new ContentFraudDetector();
    this.paymentFraudDetector = new PaymentFraudDetector();
    
    // Initialize rule engine
    this.ruleEngine = new RuleEngine();
    this.loadDefaultRules();
    
    // Initialize ML manager
    this.mlManager = new MLManager(config.ml);
  }

  async analyzeInfluencer(params: InfluencerAnalysisParams): Promise<FraudAnalysis> {
    const analysisId = uuidv4();
    
    try {
      this.emit('analysis:started', { analysisId, type: 'influencer', userId: params.userId });
      
      const detectedIssues: FraudIssue[] = [];
      let totalRiskScore = 0;
      let issueCount = 0;

      // Analyze fake followers
      if (params.socialAccounts && params.socialAccounts.length > 0) {
        for (const account of params.socialAccounts) {
          const followerAnalysis = await this.fakeFollowerDetector.analyze({
            userId: params.userId,
            platform: account.platform,
            sampleSize: 1000
          });

          if (followerAnalysis.fakePercentage > 15) {
            detectedIssues.push({
              type: FraudType.FAKE_FOLLOWERS,
              severity: this.calculateSeverity(followerAnalysis.fakePercentage, [20, 40, 60]),
              description: `${followerAnalysis.fakePercentage.toFixed(1)}% fake followers detected on ${account.platform}`,
              evidence: [{
                type: 'follower_analysis',
                description: 'Automated analysis of follower authenticity',
                data: followerAnalysis,
                weight: 0.8
              }],
              confidence: followerAnalysis.confidence,
              score: followerAnalysis.fakePercentage / 100
            });
            
            totalRiskScore += followerAnalysis.fakePercentage / 100;
            issueCount++;
          }
        }
      }

      // Analyze engagement patterns
      if (params.recentPosts && params.recentPosts.length > 0) {
        const engagementAnalysis = await this.engagementFraudDetector.analyze({
          userId: params.userId,
          posts: params.recentPosts
        });

        if (engagementAnalysis.score > 0.5) {
          detectedIssues.push({
            type: FraudType.ENGAGEMENT_FRAUD,
            severity: this.calculateSeverity(engagementAnalysis.score, [0.3, 0.6, 0.8]),
            description: 'Suspicious engagement patterns detected',
            evidence: [{
              type: 'engagement_analysis',
              description: 'Analysis of engagement timing and quality patterns',
              data: engagementAnalysis,
              weight: 0.7
            }],
            confidence: 0.8,
            score: engagementAnalysis.score
          });
          
          totalRiskScore += engagementAnalysis.score;
          issueCount++;
        }
      }

      // Apply custom rules
      const ruleResults = await this.ruleEngine.evaluate({
        userId: params.userId,
        socialAccounts: params.socialAccounts,
        recentPosts: params.recentPosts,
        historicalData: params.historicalData
      });

      for (const result of ruleResults) {
        if (result.triggered) {
          detectedIssues.push({
            type: result.rule.type,
            severity: result.rule.severity,
            description: result.description,
            evidence: [{
              type: 'rule_violation',
              description: `Rule "${result.rule.name}" triggered`,
              data: result.data,
              weight: result.rule.weight
            }],
            confidence: 0.9,
            score: result.score
          });
          
          totalRiskScore += result.score;
          issueCount++;
        }
      }

      // Calculate final risk score
      const riskScore = issueCount > 0 ? Math.min(totalRiskScore / issueCount, 1.0) : 0;
      const confidence = this.calculateConfidence(detectedIssues);
      const autoBlock = riskScore >= (this.config.blocking?.reviewThreshold || 0.9);

      const analysis: FraudAnalysis = {
        userId: params.userId,
        riskScore,
        confidence,
        detectedIssues,
        recommendations: this.generateRecommendations(detectedIssues, riskScore),
        autoBlock,
        timestamp: new Date(),
        analysisDetails: {
          // Would include detailed analysis data
        }
      };

      // Generate alert if high risk
      if (riskScore > (this.config.monitoring?.alertThreshold || 0.7)) {
        await this.generateAlert(analysis);
      }

      this.emit('analysis:completed', { analysisId, analysis });
      return analysis;

    } catch (error: any) {
      this.emit('analysis:failed', { analysisId, error: error.message });
      throw error;
    }
  }

  async analyzeFakeFollowers(params: FollowerAnalysisParams): Promise<FollowerAnalysis> {
    return this.fakeFollowerDetector.analyze(params);
  }

  async analyzeContent(params: ContentAnalysisParams): Promise<ContentAnalysis> {
    return this.contentFraudDetector.analyze(params);
  }

  async analyzePayment(params: PaymentAnalysisParams): Promise<PaymentAnalysis> {
    return this.paymentFraudDetector.analyze(params);
  }

  async analyzeBatch(params: BatchAnalysisParams): Promise<BatchResult> {
    const results: any[] = [];
    let completed = 0;
    let failed = 0;

    const processBatch = async (userIds: string[]) => {
      const promises = userIds.map(async (userId) => {
        try {
          const analysis = await this.analyzeInfluencer({
            userId,
            socialAccounts: [], // Would fetch actual data
            recentPosts: []
          });
          
          completed++;
          return { userId, status: 'success', analysis };
        } catch (error: any) {
          failed++;
          return { userId, status: 'failed', error: error.message };
        }
      });

      return Promise.all(promises);
    };

    if (params.parallel) {
      // Process all in parallel
      results.push(...await processBatch(params.userIds));
    } else {
      // Process in batches
      const batchSize = params.batchSize || 10;
      for (let i = 0; i < params.userIds.length; i += batchSize) {
        const batch = params.userIds.slice(i, i + batchSize);
        results.push(...await processBatch(batch));
      }
    }

    // Calculate summary
    const successfulResults = results.filter(r => r.status === 'success');
    const riskScores = successfulResults.map(r => r.analysis.riskScore);
    
    const summary = {
      highRiskUsers: riskScores.filter(score => score > 0.7).length,
      mediumRiskUsers: riskScores.filter(score => score > 0.4 && score <= 0.7).length,
      lowRiskUsers: riskScores.filter(score => score <= 0.4).length,
      blockedUsers: successfulResults.filter(r => r.analysis.autoBlock).length,
      averageRiskScore: riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length || 0
    };

    return {
      totalAnalyzed: params.userIds.length,
      completed,
      failed,
      results,
      summary
    };
  }

  addRule(rule: Omit<FraudRule, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.ruleEngine.addRule(rule);
  }

  removeRule(ruleId: string): void {
    this.ruleEngine.removeRule(ruleId);
  }

  async trainModel(params: any): Promise<void> {
    await this.mlManager.trainModel(params);
  }

  startMonitoring(config?: any): void {
    if (this.monitoringActive) return;

    const monitoringConfig = { ...this.config.monitoring, ...config };
    this.monitoringActive = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('Monitoring check failed:', error);
      }
    }, monitoringConfig.checkInterval || 300000); // 5 minutes default

    this.emit('monitoring:started', monitoringConfig);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.monitoringActive = false;
    this.emit('monitoring:stopped');
  }

  private async performMonitoringCheck(): Promise<void> {
    // This would implement real-time monitoring logic
    // For now, we'll emit a mock event
    this.emit('monitoring:check', { timestamp: new Date() });
  }

  private async generateAlert(analysis: FraudAnalysis): Promise<void> {
    const alert: FraudAlert = {
      id: uuidv4(),
      type: this.getPrimaryFraudType(analysis.detectedIssues),
      userId: analysis.userId,
      riskScore: analysis.riskScore,
      severity: this.calculateAlertSeverity(analysis.riskScore),
      details: analysis.detectedIssues.map(issue => issue.description).join('; '),
      autoBlock: analysis.autoBlock,
      timestamp: new Date()
    };

    this.alerts.set(alert.id, alert);
    this.emit('fraud:detected', alert);

    if (analysis.autoBlock && this.config.blocking?.autoBlock) {
      this.emit('user:blocked', { userId: analysis.userId, reason: 'Automatic fraud detection' });
    }
  }

  private loadDefaultRules(): void {
    // Follower spike rule
    this.ruleEngine.addRule({
      name: 'Sudden Follower Spike',
      description: 'Detects unusual increases in follower count',
      type: FraudType.FAKE_FOLLOWERS,
      condition: (data: any) => {
        // Simplified rule - would need historical data
        return data.socialAccounts?.some((account: any) => account.followers > 100000);
      },
      severity: Severity.HIGH,
      action: RuleAction.REVIEW,
      enabled: true,
      weight: 0.7
    });

    // High engagement rate rule
    this.ruleEngine.addRule({
      name: 'Suspiciously High Engagement',
      description: 'Detects unrealistically high engagement rates',
      type: FraudType.ENGAGEMENT_FRAUD,
      condition: (data: any) => {
        if (!data.recentPosts || data.recentPosts.length === 0) return false;
        
        const avgEngagement = data.recentPosts.reduce((sum: number, post: any) => {
          return sum + (post.likes + post.comments);
        }, 0) / data.recentPosts.length;
        
        const avgFollowers = data.socialAccounts?.reduce((sum: number, account: any) => {
          return sum + account.followers;
        }, 0) / (data.socialAccounts?.length || 1);
        
        const engagementRate = avgFollowers > 0 ? avgEngagement / avgFollowers : 0;
        return engagementRate > 0.15; // 15% engagement rate is suspicious
      },
      severity: Severity.MEDIUM,
      action: RuleAction.FLAG,
      enabled: true,
      weight: 0.6
    });
  }

  private calculateSeverity(value: number, thresholds: number[]): Severity {
    if (value < thresholds[0]) return Severity.LOW;
    if (value < thresholds[1]) return Severity.MEDIUM;
    if (value < thresholds[2]) return Severity.HIGH;
    return Severity.CRITICAL;
  }

  private calculateConfidence(issues: FraudIssue[]): number {
    if (issues.length === 0) return 1.0;
    
    const totalConfidence = issues.reduce((sum, issue) => sum + issue.confidence, 0);
    return totalConfidence / issues.length;
  }

  private generateRecommendations(issues: FraudIssue[], riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskScore > 0.8) {
      recommendations.push('High fraud risk detected - consider blocking or requiring manual verification');
    } else if (riskScore > 0.5) {
      recommendations.push('Moderate fraud risk - monitor closely and require additional verification');
    }

    if (issues.some(issue => issue.type === FraudType.FAKE_FOLLOWERS)) {
      recommendations.push('High percentage of fake followers detected - verify account authenticity');
    }

    if (issues.some(issue => issue.type === FraudType.ENGAGEMENT_FRAUD)) {
      recommendations.push('Suspicious engagement patterns detected - analyze content quality and timing');
    }

    if (recommendations.length === 0) {
      recommendations.push('Account appears legitimate based on current analysis');
    }

    return recommendations;
  }

  private getPrimaryFraudType(issues: FraudIssue[]): FraudType {
    if (issues.length === 0) return FraudType.SUSPICIOUS_BEHAVIOR;
    
    // Return the highest severity issue type
    const sortedIssues = issues.sort((a, b) => {
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    return sortedIssues[0].type;
  }

  private calculateAlertSeverity(riskScore: number): Severity {
    if (riskScore >= 0.9) return Severity.CRITICAL;
    if (riskScore >= 0.7) return Severity.HIGH;
    if (riskScore >= 0.5) return Severity.MEDIUM;
    return Severity.LOW;
  }
}