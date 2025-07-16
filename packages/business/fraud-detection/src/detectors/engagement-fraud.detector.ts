import {
  EngagementAnalysisParams,
  EngagementAnalysis,
  EngagementPattern,
  EngagementAnomaly,
  SuspiciousActivity,
  TimingAnalysis,
  QualityAnalysis,
  SpikeEvent,
  Post,
  Severity
} from '../types';

export class EngagementFraudDetector {
  private readonly NORMAL_ENGAGEMENT_RATE_RANGE = [0.01, 0.08]; // 1-8%
  private readonly SPIKE_THRESHOLD = 3.0; // 3x normal engagement
  private readonly BOT_COMMENT_PATTERNS = [
    /^(nice|great|amazing|love|cool|good)\s*(post|pic|photo|shot)?!*$/i,
    /^(fire|lit|🔥)+$/i,
    /^[😀-🙏🌀-🗿🚀-🛿🇠-🇿]+$/,
    /^(follow me|f4f|follow for follow|check my page)$/i
  ];

  async analyze(params: EngagementAnalysisParams): Promise<EngagementAnalysis> {
    const posts = params.posts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate baseline metrics
    const averageEngagementRate = this.calculateAverageEngagementRate(posts);
    
    // Analyze engagement patterns
    const engagementPattern = this.analyzeEngagementPattern(posts);
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(posts, averageEngagementRate);
    
    // Identify suspicious activities
    const suspiciousActivity = this.identifySuspiciousActivities(posts, anomalies);
    
    // Calculate overall fraud score
    const score = this.calculateFraudScore(engagementPattern, anomalies, suspiciousActivity);

    return {
      averageEngagementRate,
      engagementPattern,
      anomalies,
      suspiciousActivity,
      score
    };
  }

  private calculateAverageEngagementRate(posts: Post[]): number {
    if (posts.length === 0) return 0;

    const totalEngagement = posts.reduce((sum, post) => {
      return sum + (post.likes + post.comments);
    }, 0);

    // Estimate reach as average of views (if available) or use followers estimate
    const averageViews = posts.reduce((sum, post) => sum + (post.views || 0), 0) / posts.length;
    const estimatedReach = averageViews || this.estimateReach(posts);

    return estimatedReach > 0 ? totalEngagement / (posts.length * estimatedReach) : 0;
  }

  private estimateReach(posts: Post[]): number {
    // Estimate reach based on engagement if views not available
    const averageEngagement = posts.reduce((sum, post) => sum + (post.likes + post.comments), 0) / posts.length;
    return averageEngagement / 0.03; // Assume 3% engagement rate to estimate reach
  }

  private analyzeEngagementPattern(posts: Post[]): EngagementPattern {
    const timing = this.analyzeTimingPatterns(posts);
    const quality = this.analyzeQualityPatterns(posts);
    const consistency = this.calculateConsistency(posts);

    return {
      consistency,
      timing,
      quality
    };
  }

  private analyzeTimingPatterns(posts: Post[]): TimingAnalysis {
    const hourCounts = new Array(24).fill(0);
    const spikes: SpikeEvent[] = [];
    
    // Analyze posting and engagement timing
    posts.forEach(post => {
      const hour = post.timestamp.getHours();
      hourCounts[hour]++;
      
      // Check for engagement spikes
      const engagement = post.likes + post.comments;
      if (this.isEngagementSpike(post, posts)) {
        spikes.push({
          timestamp: post.timestamp,
          magnitude: this.calculateSpikeMagnitude(post, posts),
          duration: 60, // Simplified - would need more granular data
          suspicious: this.isSuspiciousSpike(post, posts)
        });
      }
    });

    // Find peak hours
    const maxCount = Math.max(...hourCounts);
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > maxCount * 0.7)
      .map(item => item.hour);

    // Check for bot-like patterns
    const botLikePatterns = this.detectBotTimingPatterns(posts);

    return {
      peakHours,
      irregularSpikes: spikes,
      botLikePatterns
    };
  }

  private analyzeQualityPatterns(posts: Post[]): QualityAnalysis {
    const likeToCommentRatios = posts.map(post => {
      return post.comments > 0 ? post.likes / post.comments : post.likes;
    });

    const averageRatio = likeToCommentRatios.reduce((sum, ratio) => sum + ratio, 0) / likeToCommentRatios.length;
    
    // Analyze engagement velocity (how quickly engagement happens)
    const velocityScore = this.calculateEngagementVelocity(posts);
    
    // Estimate comment quality (simplified)
    const commentQuality = this.estimateCommentQuality(posts);

    return {
      commentQuality,
      likeToCommentRatio: averageRatio,
      engagementVelocity: velocityScore
    };
  }

  private calculateConsistency(posts: Post[]): number {
    if (posts.length < 2) return 1.0;

    const engagementRates = posts.map(post => {
      const totalEngagement = post.likes + post.comments;
      const estimatedReach = post.views || this.estimateReach([post]);
      return estimatedReach > 0 ? totalEngagement / estimatedReach : 0;
    });

    // Calculate coefficient of variation
    const mean = engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length;
    const variance = engagementRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / engagementRates.length;
    const stdDev = Math.sqrt(variance);
    
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    
    // Lower coefficient of variation = higher consistency
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private detectAnomalies(posts: Post[], baselineRate: number): EngagementAnomaly[] {
    const anomalies: EngagementAnomaly[] = [];
    
    posts.forEach(post => {
      const postEngagementRate = this.calculatePostEngagementRate(post);
      
      // Check for engagement spikes
      if (postEngagementRate > baselineRate * this.SPIKE_THRESHOLD) {
        anomalies.push({
          postId: post.id,
          type: 'spike',
          severity: this.calculateAnomalySeverity(postEngagementRate, baselineRate),
          description: `Engagement rate ${(postEngagementRate * 100).toFixed(2)}% is ${(postEngagementRate / baselineRate).toFixed(1)}x higher than baseline`,
          evidence: {
            postEngagementRate,
            baselineRate,
            multiplier: postEngagementRate / baselineRate
          }
        });
      }
      
      // Check for unusual timing patterns
      if (this.hasUnusualTiming(post)) {
        anomalies.push({
          postId: post.id,
          type: 'pattern',
          severity: this.calculateTimingAnomalySeverity(post),
          description: 'Unusual engagement timing pattern detected',
          evidence: {
            timestamp: post.timestamp,
            hour: post.timestamp.getHours()
          }
        });
      }
    });

    return anomalies;
  }

  private identifySuspiciousActivities(posts: Post[], anomalies: EngagementAnomaly[]): SuspiciousActivity[] {
    const activities: SuspiciousActivity[] = [];
    
    // Check for coordinated engagement
    const coordinatedPosts = this.detectCoordinatedEngagement(posts);
    if (coordinatedPosts.length > 0) {
      activities.push({
        type: 'coordinated_engagement',
        description: 'Multiple posts show signs of coordinated artificial engagement',
        confidence: 0.8,
        posts: coordinatedPosts.map(p => p.id)
      });
    }
    
    // Check for engagement buying patterns
    const boughtEngagement = this.detectBoughtEngagement(posts);
    if (boughtEngagement.length > 0) {
      activities.push({
        type: 'bought_engagement',
        description: 'Posts show patterns consistent with purchased engagement',
        confidence: 0.7,
        posts: boughtEngagement.map(p => p.id)
      });
    }
    
    // Check for bot activity
    const botActivity = this.detectBotActivity(posts);
    if (botActivity.length > 0) {
      activities.push({
        type: 'bot_activity',
        description: 'Engagement patterns suggest automated bot activity',
        confidence: 0.85,
        posts: botActivity.map(p => p.id)
      });
    }

    return activities;
  }

  private calculateFraudScore(
    pattern: EngagementPattern,
    anomalies: EngagementAnomaly[],
    activities: SuspiciousActivity[]
  ): number {
    let score = 0;
    
    // Pattern-based scoring
    score += (1 - pattern.consistency) * 0.3; // Inconsistency increases fraud score
    score += pattern.timing.botLikePatterns ? 0.4 : 0;
    score += Math.max(0, (50 - pattern.quality.commentQuality) / 50) * 0.2; // Low quality increases score
    
    // Anomaly-based scoring
    const highSeverityAnomalies = anomalies.filter(a => a.severity > 0.7).length;
    score += Math.min(highSeverityAnomalies * 0.15, 0.6);
    
    // Activity-based scoring
    const highConfidenceActivities = activities.filter(a => a.confidence > 0.7).length;
    score += Math.min(highConfidenceActivities * 0.2, 0.8);
    
    return Math.min(score, 1.0);
  }

  // Helper methods
  private calculatePostEngagementRate(post: Post): number {
    const totalEngagement = post.likes + post.comments;
    const reach = post.views || this.estimateReach([post]);
    return reach > 0 ? totalEngagement / reach : 0;
  }

  private isEngagementSpike(post: Post, allPosts: Post[]): boolean {
    const postEngagement = post.likes + post.comments;
    const avgEngagement = allPosts.reduce((sum, p) => sum + p.likes + p.comments, 0) / allPosts.length;
    return postEngagement > avgEngagement * this.SPIKE_THRESHOLD;
  }

  private calculateSpikeMagnitude(post: Post, allPosts: Post[]): number {
    const postEngagement = post.likes + post.comments;
    const avgEngagement = allPosts.reduce((sum, p) => sum + p.likes + p.comments, 0) / allPosts.length;
    return avgEngagement > 0 ? postEngagement / avgEngagement : 1;
  }

  private isSuspiciousSpike(post: Post, allPosts: Post[]): boolean {
    const magnitude = this.calculateSpikeMagnitude(post, allPosts);
    return magnitude > 5.0; // 5x average is highly suspicious
  }

  private detectBotTimingPatterns(posts: Post[]): boolean {
    // Check for posts at exact minute intervals (bot-like)
    const exactMinutes = posts.filter(post => post.timestamp.getMinutes() === 0).length;
    return (exactMinutes / posts.length) > 0.3; // More than 30% at exact hours
  }

  private calculateEngagementVelocity(posts: Post[]): number {
    // Simplified velocity calculation
    // In reality, would need minute-by-minute engagement data
    return Math.random() * 100; // Mock score
  }

  private estimateCommentQuality(posts: Post[]): number {
    // Simplified comment quality estimation
    // In reality, would analyze actual comment text
    let qualityScore = 80; // Start with good quality
    
    // Simulate some quality indicators
    const hasGenericComments = Math.random() < 0.3;
    const hasSpamComments = Math.random() < 0.1;
    const hasEmojiOnlyComments = Math.random() < 0.2;
    
    if (hasGenericComments) qualityScore -= 20;
    if (hasSpamComments) qualityScore -= 30;
    if (hasEmojiOnlyComments) qualityScore -= 15;
    
    return Math.max(0, qualityScore);
  }

  private calculateAnomalySeverity(postRate: number, baselineRate: number): number {
    const multiplier = baselineRate > 0 ? postRate / baselineRate : 1;
    return Math.min((multiplier - 1) / 10, 1.0); // Normalize to 0-1
  }

  private hasUnusualTiming(post: Post): boolean {
    const hour = post.timestamp.getHours();
    // Suspicious if posted between 2-5 AM (unless it's a global audience)
    return hour >= 2 && hour <= 5;
  }

  private calculateTimingAnomalySeverity(post: Post): number {
    const hour = post.timestamp.getHours();
    if (hour >= 2 && hour <= 5) return 0.6;
    return 0.3;
  }

  private detectCoordinatedEngagement(posts: Post[]): Post[] {
    // Simplified detection - look for posts with very similar engagement patterns
    const suspicious: Post[] = [];
    
    for (let i = 0; i < posts.length - 1; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const post1 = posts[i];
        const post2 = posts[j];
        
        // Check if engagement ratios are suspiciously similar
        const ratio1 = post1.comments > 0 ? post1.likes / post1.comments : post1.likes;
        const ratio2 = post2.comments > 0 ? post2.likes / post2.comments : post2.likes;
        
        if (Math.abs(ratio1 - ratio2) < 0.1 * Math.max(ratio1, ratio2) && ratio1 > 100) {
          if (!suspicious.includes(post1)) suspicious.push(post1);
          if (!suspicious.includes(post2)) suspicious.push(post2);
        }
      }
    }
    
    return suspicious;
  }

  private detectBoughtEngagement(posts: Post[]): Post[] {
    // Look for patterns typical of bought engagement
    return posts.filter(post => {
      const engagement = post.likes + post.comments;
      const likeCommentRatio = post.comments > 0 ? post.likes / post.comments : post.likes;
      
      // High likes but very low comments often indicates bought likes
      return likeCommentRatio > 200 && engagement > 1000;
    });
  }

  private detectBotActivity(posts: Post[]): Post[] {
    // Look for bot-like engagement patterns
    return posts.filter(post => {
      // Simulate bot detection logic
      const hasRoundNumbers = post.likes % 100 === 0 || post.comments % 10 === 0;
      const highEngagement = (post.likes + post.comments) > 5000;
      
      return hasRoundNumbers && highEngagement;
    });
  }
}