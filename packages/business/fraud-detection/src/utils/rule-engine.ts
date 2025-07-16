import { v4 as uuidv4 } from 'uuid';
import {
  FraudRule,
  FraudType,
  Severity,
  RuleAction,
  RuleError
} from '../types';

export interface RuleResult {
  rule: FraudRule;
  triggered: boolean;
  score: number;
  description: string;
  data: any;
}

export class RuleEngine {
  private rules: Map<string, FraudRule> = new Map();

  addRule(ruleData: Omit<FraudRule, 'id' | 'createdAt' | 'updatedAt'>): FraudRule {
    const rule: FraudRule = {
      ...ruleData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.validateRule(rule);
    this.rules.set(rule.id, rule);
    
    return rule;
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<Omit<FraudRule, 'id' | 'createdAt'>>): FraudRule {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      throw new RuleError(`Rule with ID ${ruleId} not found`);
    }

    const updatedRule: FraudRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date()
    };

    this.validateRule(updatedRule);
    this.rules.set(ruleId, updatedRule);
    
    return updatedRule;
  }

  getRule(ruleId: string): FraudRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): FraudRule[] {
    return Array.from(this.rules.values());
  }

  getEnabledRules(): FraudRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.enabled);
  }

  getRulesByType(type: FraudType): FraudRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.type === type);
  }

  async evaluate(data: any): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const enabledRules = this.getEnabledRules();

    for (const rule of enabledRules) {
      try {
        const result = await this.evaluateRule(rule, data);
        results.push(result);
      } catch (error: any) {
        console.error(`Error evaluating rule ${rule.name}:`, error.message);
        
        results.push({
          rule,
          triggered: false,
          score: 0,
          description: `Rule evaluation failed: ${error.message}`,
          data: null
        });
      }
    }

    return results;
  }

  async evaluateRule(rule: FraudRule, data: any): Promise<RuleResult> {
    const startTime = Date.now();
    
    try {
      const triggered = await this.executeRuleCondition(rule, data);
      const score = triggered ? this.calculateRuleScore(rule) : 0;
      const description = triggered 
        ? `Rule "${rule.name}" triggered: ${rule.description || 'No description'}`
        : `Rule "${rule.name}" not triggered`;

      const result: RuleResult = {
        rule,
        triggered,
        score,
        description,
        data: triggered ? this.extractRelevantData(rule, data) : null
      };

      const executionTime = Date.now() - startTime;
      if (executionTime > 1000) {
        console.warn(`Rule ${rule.name} took ${executionTime}ms to execute`);
      }

      return result;

    } catch (error: any) {
      throw new RuleError(`Failed to evaluate rule ${rule.name}: ${error.message}`);
    }
  }

  private async executeRuleCondition(rule: FraudRule, data: any): Promise<boolean> {
    try {
      // Execute the rule condition function
      const result = rule.condition(data);
      
      // Handle both synchronous and asynchronous conditions
      return Promise.resolve(result).then(res => res);
    } catch (error: any) {
      throw new RuleError(`Rule condition execution failed: ${error.message}`);
    }
  }

  private calculateRuleScore(rule: FraudRule): number {
    // Base score based on severity
    let baseScore = 0;
    switch (rule.severity) {
      case Severity.LOW:
        baseScore = 0.2;
        break;
      case Severity.MEDIUM:
        baseScore = 0.4;
        break;
      case Severity.HIGH:
        baseScore = 0.7;
        break;
      case Severity.CRITICAL:
        baseScore = 1.0;
        break;
    }

    // Apply rule weight
    return baseScore * rule.weight;
  }

  private extractRelevantData(rule: FraudRule, data: any): any {
    // Extract data relevant to the rule that triggered
    const relevantData: any = {};

    // Based on rule type, extract specific data
    switch (rule.type) {
      case FraudType.FAKE_FOLLOWERS:
        relevantData.socialAccounts = data.socialAccounts;
        relevantData.followerMetrics = {
          totalFollowers: data.socialAccounts?.reduce((sum: number, acc: any) => sum + acc.followers, 0),
          accountCount: data.socialAccounts?.length
        };
        break;

      case FraudType.ENGAGEMENT_FRAUD:
        relevantData.recentPosts = data.recentPosts;
        relevantData.engagementMetrics = this.calculateEngagementMetrics(data.recentPosts);
        break;

      case FraudType.BOT_ACTIVITY:
        relevantData.behaviorPattern = {
          actionVelocity: data.actionVelocity,
          sessionDuration: data.sessionDuration,
          repeatActions: data.repeatActions
        };
        break;

      case FraudType.SUSPICIOUS_BEHAVIOR:
        relevantData.suspiciousIndicators = this.identifySuspiciousIndicators(data);
        break;

      default:
        relevantData.rawData = data;
    }

    return relevantData;
  }

  private calculateEngagementMetrics(posts: any[]): any {
    if (!posts || posts.length === 0) return {};

    const totalEngagement = posts.reduce((sum, post) => sum + (post.likes + post.comments), 0);
    const avgEngagement = totalEngagement / posts.length;
    
    const likeToCommentRatios = posts.map(post => 
      post.comments > 0 ? post.likes / post.comments : post.likes
    );
    const avgLikeCommentRatio = likeToCommentRatios.reduce((sum, ratio) => sum + ratio, 0) / likeToCommentRatios.length;

    return {
      totalEngagement,
      avgEngagement,
      avgLikeCommentRatio,
      postCount: posts.length
    };
  }

  private identifySuspiciousIndicators(data: any): string[] {
    const indicators: string[] = [];

    // Check for various suspicious patterns
    if (data.socialAccounts) {
      const totalFollowers = data.socialAccounts.reduce((sum: number, acc: any) => sum + acc.followers, 0);
      if (totalFollowers > 1000000) {
        indicators.push('Very high follower count');
      }

      const newAccounts = data.socialAccounts.filter((acc: any) => {
        const accountAge = Date.now() - new Date(acc.createdAt || 0).getTime();
        return accountAge < 30 * 24 * 60 * 60 * 1000; // 30 days
      });
      
      if (newAccounts.length > 0) {
        indicators.push(`${newAccounts.length} recently created accounts`);
      }
    }

    if (data.recentPosts) {
      const highEngagementPosts = data.recentPosts.filter((post: any) => {
        const engagement = post.likes + post.comments;
        return engagement > 10000;
      });
      
      if (highEngagementPosts.length > 0) {
        indicators.push(`${highEngagementPosts.length} posts with unusually high engagement`);
      }
    }

    return indicators;
  }

  private validateRule(rule: FraudRule): void {
    if (!rule.name || rule.name.trim().length === 0) {
      throw new RuleError('Rule name is required');
    }

    if (!rule.condition || typeof rule.condition !== 'function') {
      throw new RuleError('Rule condition must be a function');
    }

    if (!Object.values(FraudType).includes(rule.type)) {
      throw new RuleError(`Invalid fraud type: ${rule.type}`);
    }

    if (!Object.values(Severity).includes(rule.severity)) {
      throw new RuleError(`Invalid severity: ${rule.severity}`);
    }

    if (!Object.values(RuleAction).includes(rule.action)) {
      throw new RuleError(`Invalid action: ${rule.action}`);
    }

    if (typeof rule.weight !== 'number' || rule.weight < 0 || rule.weight > 1) {
      throw new RuleError('Rule weight must be a number between 0 and 1');
    }

    if (typeof rule.enabled !== 'boolean') {
      throw new RuleError('Rule enabled must be a boolean');
    }
  }

  // Built-in rule templates
  createFollowerSpikeRule(threshold: number = 1000, timeWindowHours: number = 24): FraudRule {
    return this.addRule({
      name: 'Follower Spike Detection',
      description: `Detects when follower count increases by more than ${threshold} in ${timeWindowHours} hours`,
      type: FraudType.FAKE_FOLLOWERS,
      condition: (data: any) => {
        if (!data.historicalData?.followerHistory) return false;
        
        const now = new Date();
        const cutoff = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);
        
        const recentPoints = data.historicalData.followerHistory.filter((point: any) => 
          new Date(point.timestamp) > cutoff
        );
        
        if (recentPoints.length < 2) return false;
        
        const startValue = recentPoints[0].value;
        const endValue = recentPoints[recentPoints.length - 1].value;
        const increase = endValue - startValue;
        
        return increase > threshold;
      },
      severity: Severity.HIGH,
      action: RuleAction.REVIEW,
      enabled: true,
      weight: 0.8
    });
  }

  createHighEngagementRateRule(thresholdRate: number = 0.15): FraudRule {
    return this.addRule({
      name: 'Suspicious Engagement Rate',
      description: `Flags accounts with engagement rate above ${thresholdRate * 100}%`,
      type: FraudType.ENGAGEMENT_FRAUD,
      condition: (data: any) => {
        if (!data.recentPosts || data.recentPosts.length === 0) return false;
        
        const totalEngagement = data.recentPosts.reduce((sum: number, post: any) => 
          sum + (post.likes + post.comments), 0
        );
        
        const totalFollowers = data.socialAccounts?.reduce((sum: number, acc: any) => 
          sum + acc.followers, 0
        ) || 1;
        
        const engagementRate = totalEngagement / (data.recentPosts.length * totalFollowers);
        return engagementRate > thresholdRate;
      },
      severity: Severity.MEDIUM,
      action: RuleAction.FLAG,
      enabled: true,
      weight: 0.6
    });
  }

  createNewAccountRule(maxAccountAgeDays: number = 30): FraudRule {
    return this.addRule({
      name: 'New Account Detection',
      description: `Flags accounts created within ${maxAccountAgeDays} days`,
      type: FraudType.SUSPICIOUS_BEHAVIOR,
      condition: (data: any) => {
        if (!data.socialAccounts) return false;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAccountAgeDays);
        
        return data.socialAccounts.some((account: any) => {
          const createdAt = new Date(account.createdAt || 0);
          return createdAt > cutoffDate;
        });
      },
      severity: Severity.LOW,
      action: RuleAction.FLAG,
      enabled: true,
      weight: 0.3
    });
  }

  createBotActivityRule(): FraudRule {
    return this.addRule({
      name: 'Bot Activity Pattern',
      description: 'Detects patterns consistent with automated bot behavior',
      type: FraudType.BOT_ACTIVITY,
      condition: (data: any) => {
        // Check for bot-like posting patterns
        if (data.recentPosts && data.recentPosts.length > 0) {
          const postTimes = data.recentPosts.map((post: any) => new Date(post.timestamp));
          
          // Check for posts at exact minute intervals
          const exactMinutes = postTimes.filter(time => time.getMinutes() === 0).length;
          if (exactMinutes / postTimes.length > 0.5) return true;
          
          // Check for rapid posting
          const timeDiffs = [];
          for (let i = 1; i < postTimes.length; i++) {
            const diff = postTimes[i].getTime() - postTimes[i-1].getTime();
            timeDiffs.push(diff);
          }
          
          const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
          if (avgTimeDiff < 60 * 1000) return true; // Less than 1 minute between posts
        }
        
        return false;
      },
      severity: Severity.HIGH,
      action: RuleAction.REVIEW,
      enabled: true,
      weight: 0.7
    });
  }
}