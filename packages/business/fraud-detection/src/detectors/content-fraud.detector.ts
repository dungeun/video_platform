import {
  ContentAnalysisParams,
  ContentAnalysis,
  ContentAnomaly,
  AuthenticityCheck,
  DuplicateMatch,
  ManipulationSignal,
  Severity
} from '../types';

export class ContentFraudDetector {
  async analyze(params: ContentAnalysisParams): Promise<ContentAnalysis> {
    const anomalies = await this.detectAnomalies(params);
    const authenticity = await this.checkAuthenticity(params);
    const engagementScore = this.analyzeEngagementManipulation(params);
    
    const isSuspicious = anomalies.length > 0 || 
                        !authenticity.isOriginal || 
                        engagementScore > 0.6;
    
    const score = this.calculateOverallScore(anomalies, authenticity, engagementScore);

    return {
      contentId: params.contentId,
      isSuspicious,
      anomalies,
      authenticity,
      engagement: {
        averageEngagementRate: this.calculateEngagementRate(params),
        engagementPattern: this.analyzeEngagementPattern(params),
        anomalies: this.detectEngagementAnomalies(params),
        suspiciousActivity: [],
        score: engagementScore
      },
      score
    };
  }

  private async detectAnomalies(params: ContentAnalysisParams): Promise<ContentAnomaly[]> {
    const anomalies: ContentAnomaly[] = [];

    // Engagement manipulation detection
    const engagementAnomaly = this.detectEngagementManipulation(params);
    if (engagementAnomaly) {
      anomalies.push(engagementAnomaly);
    }

    // Timing fraud detection
    const timingAnomaly = this.detectTimingFraud(params);
    if (timingAnomaly) {
      anomalies.push(timingAnomaly);
    }

    // Metric inconsistencies
    const metricAnomaly = this.detectMetricInconsistencies(params);
    if (metricAnomaly) {
      anomalies.push(metricAnomaly);
    }

    return anomalies;
  }

  private async checkAuthenticity(params: ContentAnalysisParams): Promise<AuthenticityCheck> {
    // Check for duplicate content
    const duplicateMatches = await this.findDuplicateContent(params);
    
    // Check for manipulation signals
    const manipulationSignals = this.detectManipulationSignals(params);
    
    // Calculate deepfake score if media content
    const deepfakeScore = params.mediaUrl ? this.calculateDeepfakeScore(params.mediaUrl) : undefined;

    return {
      isOriginal: duplicateMatches.length === 0,
      duplicateMatches,
      deepfakeScore,
      manipulationSignals
    };
  }

  private detectEngagementManipulation(params: ContentAnalysisParams): ContentAnomaly | null {
    const { metrics, accountMetrics } = params;
    
    // Calculate expected engagement based on account averages
    const expectedLikes = accountMetrics.avgLikes;
    const expectedComments = accountMetrics.avgComments;
    
    // Check for unusual spikes
    const likeSpike = expectedLikes > 0 ? metrics.likes / expectedLikes : 1;
    const commentSpike = expectedComments > 0 ? metrics.comments / expectedComments : 1;
    
    if (likeSpike > 5 || commentSpike > 5) {
      return {
        type: 'engagement_manipulation',
        severity: likeSpike > 10 || commentSpike > 10 ? Severity.HIGH : Severity.MEDIUM,
        description: `Unusual engagement spike detected: ${likeSpike.toFixed(1)}x likes, ${commentSpike.toFixed(1)}x comments`,
        confidence: 0.8
      };
    }

    // Check like-to-comment ratio
    const currentRatio = metrics.comments > 0 ? metrics.likes / metrics.comments : metrics.likes;
    const avgRatio = accountMetrics.avgComments > 0 ? accountMetrics.avgLikes / accountMetrics.avgComments : accountMetrics.avgLikes;
    
    if (avgRatio > 0 && currentRatio > avgRatio * 3 && metrics.likes > 1000) {
      return {
        type: 'engagement_manipulation',
        severity: Severity.MEDIUM,
        description: `Suspicious like-to-comment ratio: ${currentRatio.toFixed(1)} vs average ${avgRatio.toFixed(1)}`,
        confidence: 0.7
      };
    }

    return null;
  }

  private detectTimingFraud(params: ContentAnalysisParams): ContentAnomaly | null {
    const hour = params.timestamp.getHours();
    const minute = params.timestamp.getMinutes();
    
    // Check for posting at suspicious times
    if (hour >= 2 && hour <= 5) {
      return {
        type: 'timing_fraud',
        severity: Severity.LOW,
        description: 'Content posted during unusual hours (2-5 AM)',
        confidence: 0.4
      };
    }

    // Check for exact minute intervals (bot-like behavior)
    if (minute === 0) {
      return {
        type: 'timing_fraud',
        severity: Severity.LOW,
        description: 'Content posted at exact hour interval',
        confidence: 0.3
      };
    }

    return null;
  }

  private detectMetricInconsistencies(params: ContentAnalysisParams): ContentAnomaly | null {
    const { metrics } = params;
    
    // Check for impossible metrics
    if (metrics.views && metrics.likes > metrics.views) {
      return {
        type: 'fake_metrics',
        severity: Severity.HIGH,
        description: 'Likes exceed views count',
        confidence: 0.95
      };
    }

    // Check for round number manipulation
    const hasRoundNumbers = [metrics.likes, metrics.comments, metrics.views, metrics.shares]
      .filter(val => val && val > 100)
      .some(val => val % 100 === 0);

    if (hasRoundNumbers && metrics.likes > 5000) {
      return {
        type: 'fake_metrics',
        severity: Severity.MEDIUM,
        description: 'Suspiciously round engagement numbers detected',
        confidence: 0.6
      };
    }

    return null;
  }

  private async findDuplicateContent(params: ContentAnalysisParams): Promise<DuplicateMatch[]> {
    // In a real implementation, this would:
    // 1. Use reverse image search APIs
    // 2. Compare text content against databases
    // 3. Check for common stock images/videos
    
    // Mock implementation
    const matches: DuplicateMatch[] = [];
    
    // Simulate finding some duplicate content
    if (Math.random() < 0.1) { // 10% chance of finding duplicate
      matches.push({
        source: 'stock_image_database',
        similarity: 0.95,
        url: 'https://example.com/stock-image-123'
      });
    }

    return matches;
  }

  private detectManipulationSignals(params: ContentAnalysisParams): ManipulationSignal[] {
    const signals: ManipulationSignal[] = [];
    
    // Check for metadata inconsistencies
    if (params.mediaUrl) {
      // In reality, would analyze EXIF data, compression artifacts, etc.
      if (Math.random() < 0.05) { // 5% chance of manipulation signals
        signals.push({
          type: 'metadata_inconsistency',
          confidence: 0.7,
          description: 'EXIF data suggests possible image manipulation'
        });
      }
    }

    // Check text content for AI generation patterns
    if (params.content) {
      const aiGeneratedScore = this.detectAIGeneratedText(params.content);
      if (aiGeneratedScore > 0.8) {
        signals.push({
          type: 'ai_generated_text',
          confidence: aiGeneratedScore,
          description: 'Text appears to be AI-generated'
        });
      }
    }

    return signals;
  }

  private calculateDeepfakeScore(mediaUrl: string): number {
    // In a real implementation, this would use ML models to detect deepfakes
    // For now, return a mock score
    return Math.random() * 0.3; // Low probability of deepfake
  }

  private detectAIGeneratedText(content: string): number {
    // Simplified AI detection - look for patterns common in AI text
    const aiIndicators = [
      /as an ai/i,
      /i'm an artificial/i,
      /in conclusion/i,
      /furthermore/i,
      /it's important to note/i
    ];

    const matches = aiIndicators.filter(pattern => pattern.test(content)).length;
    return Math.min(matches * 0.3, 1.0);
  }

  private analyzeEngagementManipulation(params: ContentAnalysisParams): number {
    const { metrics, accountMetrics } = params;
    
    let suspicionScore = 0;
    
    // Check engagement rate
    const engagementRate = this.calculateEngagementRate(params);
    if (engagementRate > 0.15) { // >15% is suspicious
      suspicionScore += 0.4;
    }
    
    // Check for unusual patterns
    const avgEngagement = accountMetrics.avgLikes + accountMetrics.avgComments;
    const currentEngagement = metrics.likes + metrics.comments;
    
    if (avgEngagement > 0) {
      const multiplier = currentEngagement / avgEngagement;
      if (multiplier > 5) {
        suspicionScore += 0.5;
      } else if (multiplier > 3) {
        suspicionScore += 0.3;
      }
    }
    
    return Math.min(suspicionScore, 1.0);
  }

  private calculateEngagementRate(params: ContentAnalysisParams): number {
    const totalEngagement = params.metrics.likes + params.metrics.comments;
    const reach = params.metrics.views || params.accountMetrics.followers;
    return reach > 0 ? totalEngagement / reach : 0;
  }

  private analyzeEngagementPattern(params: ContentAnalysisParams): any {
    // Simplified pattern analysis
    return {
      consistency: 0.8,
      timing: {
        peakHours: [12, 18, 21],
        irregularSpikes: [],
        botLikePatterns: false
      },
      quality: {
        commentQuality: 75,
        likeToCommentRatio: params.metrics.comments > 0 ? params.metrics.likes / params.metrics.comments : params.metrics.likes,
        engagementVelocity: 50
      }
    };
  }

  private detectEngagementAnomalies(params: ContentAnalysisParams): any[] {
    const anomalies = [];
    
    const engagementRate = this.calculateEngagementRate(params);
    if (engagementRate > 0.1) { // 10% threshold
      anomalies.push({
        postId: params.contentId,
        type: 'spike',
        severity: engagementRate > 0.2 ? 0.8 : 0.6,
        description: `High engagement rate: ${(engagementRate * 100).toFixed(2)}%`,
        evidence: { engagementRate, metrics: params.metrics }
      });
    }
    
    return anomalies;
  }

  private calculateOverallScore(
    anomalies: ContentAnomaly[],
    authenticity: AuthenticityCheck,
    engagementScore: number
  ): number {
    let score = 0;
    
    // Anomaly-based scoring
    const highSeverityAnomalies = anomalies.filter(a => a.severity === Severity.HIGH || a.severity === Severity.CRITICAL);
    score += highSeverityAnomalies.length * 0.3;
    score += (anomalies.length - highSeverityAnomalies.length) * 0.15;
    
    // Authenticity scoring
    if (!authenticity.isOriginal) {
      score += 0.5;
    }
    if (authenticity.deepfakeScore && authenticity.deepfakeScore > 0.7) {
      score += 0.4;
    }
    score += authenticity.manipulationSignals.length * 0.1;
    
    // Engagement scoring
    score += engagementScore * 0.4;
    
    return Math.min(score, 1.0);
  }
}