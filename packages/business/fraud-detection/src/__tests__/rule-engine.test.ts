import { describe, it, expect, beforeEach } from 'vitest';
import { RuleEngine } from '../utils/rule-engine';
import { FraudType, Severity, RuleAction } from '../types';

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
  });

  describe('addRule', () => {
    it('should add a new rule successfully', () => {
      const ruleData = {
        name: 'Test Rule',
        description: 'Test description',
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => data.followers > 1000,
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.5
      };

      const rule = ruleEngine.addRule(ruleData);

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Rule');
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid rule data', () => {
      const invalidRuleData = {
        name: '', // Empty name
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => true,
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.5
      };

      expect(() => ruleEngine.addRule(invalidRuleData)).toThrow('Rule name is required');
    });

    it('should throw error for invalid weight', () => {
      const invalidRuleData = {
        name: 'Test Rule',
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => true,
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 1.5 // Invalid weight > 1
      };

      expect(() => ruleEngine.addRule(invalidRuleData)).toThrow('Rule weight must be a number between 0 and 1');
    });
  });

  describe('updateRule', () => {
    it('should update an existing rule', () => {
      const rule = ruleEngine.addRule({
        name: 'Original Rule',
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => true,
        severity: Severity.LOW,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.3
      });

      const updatedRule = ruleEngine.updateRule(rule.id, {
        name: 'Updated Rule',
        severity: Severity.HIGH,
        weight: 0.8
      });

      expect(updatedRule.name).toBe('Updated Rule');
      expect(updatedRule.severity).toBe(Severity.HIGH);
      expect(updatedRule.weight).toBe(0.8);
      expect(updatedRule.updatedAt.getTime()).toBeGreaterThan(rule.createdAt.getTime());
    });

    it('should throw error when updating non-existent rule', () => {
      expect(() => ruleEngine.updateRule('non-existent-id', { name: 'Updated' }))
        .toThrow('Rule with ID non-existent-id not found');
    });
  });

  describe('removeRule', () => {
    it('should remove an existing rule', () => {
      const rule = ruleEngine.addRule({
        name: 'Test Rule',
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => true,
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.5
      });

      const removed = ruleEngine.removeRule(rule.id);
      expect(removed).toBe(true);

      const retrievedRule = ruleEngine.getRule(rule.id);
      expect(retrievedRule).toBeUndefined();
    });

    it('should return false when removing non-existent rule', () => {
      const removed = ruleEngine.removeRule('non-existent-id');
      expect(removed).toBe(false);
    });
  });

  describe('evaluate', () => {
    it('should evaluate all enabled rules', async () => {
      // Add some test rules
      ruleEngine.addRule({
        name: 'High Follower Rule',
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => data.followers > 10000,
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.6
      });

      ruleEngine.addRule({
        name: 'Disabled Rule',
        type: FraudType.ENGAGEMENT_FRAUD,
        condition: (data: any) => false,
        severity: Severity.LOW,
        action: RuleAction.FLAG,
        enabled: false, // This rule should not be evaluated
        weight: 0.3
      });

      const testData = {
        followers: 15000,
        engagement: 0.05
      };

      const results = await ruleEngine.evaluate(testData);

      expect(results).toHaveLength(1); // Only enabled rule should be evaluated
      expect(results[0].triggered).toBe(true);
      expect(results[0].rule.name).toBe('High Follower Rule');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should handle rule evaluation errors gracefully', async () => {
      ruleEngine.addRule({
        name: 'Error Rule',
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => {
          throw new Error('Test error');
        },
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.5
      });

      const results = await ruleEngine.evaluate({});

      expect(results).toHaveLength(1);
      expect(results[0].triggered).toBe(false);
      expect(results[0].description).toContain('Rule evaluation failed');
    });
  });

  describe('getRulesByType', () => {
    it('should return rules of specified type', () => {
      ruleEngine.addRule({
        name: 'Follower Rule 1',
        type: FraudType.FAKE_FOLLOWERS,
        condition: (data: any) => true,
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.5
      });

      ruleEngine.addRule({
        name: 'Engagement Rule 1',
        type: FraudType.ENGAGEMENT_FRAUD,
        condition: (data: any) => true,
        severity: Severity.MEDIUM,
        action: RuleAction.FLAG,
        enabled: true,
        weight: 0.5
      });

      const followerRules = ruleEngine.getRulesByType(FraudType.FAKE_FOLLOWERS);
      expect(followerRules).toHaveLength(1);
      expect(followerRules[0].name).toBe('Follower Rule 1');
    });
  });

  describe('Built-in Rule Templates', () => {
    it('should create follower spike rule', () => {
      const rule = ruleEngine.createFollowerSpikeRule(500, 12);
      
      expect(rule.name).toBe('Follower Spike Detection');
      expect(rule.type).toBe(FraudType.FAKE_FOLLOWERS);
      expect(rule.severity).toBe(Severity.HIGH);
      expect(rule.enabled).toBe(true);

      // Test the condition
      const testData = {
        historicalData: {
          followerHistory: [
            { timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), value: 1000 }, // 10 hours ago
            { timestamp: new Date(), value: 2000 } // Now
          ]
        }
      };

      const triggered = rule.condition(testData);
      expect(triggered).toBe(true); // 1000 increase > 500 threshold
    });

    it('should create high engagement rate rule', () => {
      const rule = ruleEngine.createHighEngagementRateRule(0.1);
      
      expect(rule.name).toBe('Suspicious Engagement Rate');
      expect(rule.type).toBe(FraudType.ENGAGEMENT_FRAUD);

      // Test with high engagement rate
      const testData = {
        recentPosts: [
          { likes: 500, comments: 100 }, // 600 total engagement
          { likes: 400, comments: 50 }   // 450 total engagement
        ],
        socialAccounts: [
          { followers: 5000 } // Total: 1050 engagement / (2 posts * 5000 followers) = 0.105 > 0.1 threshold
        ]
      };

      const triggered = rule.condition(testData);
      expect(triggered).toBe(true);
    });

    it('should create new account rule', () => {
      const rule = ruleEngine.createNewAccountRule(15);
      
      expect(rule.name).toBe('New Account Detection');
      expect(rule.type).toBe(FraudType.SUSPICIOUS_BEHAVIOR);

      // Test with new account
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      const testData = {
        socialAccounts: [
          { createdAt: recentDate }
        ]
      };

      const triggered = rule.condition(testData);
      expect(triggered).toBe(true);
    });

    it('should create bot activity rule', () => {
      const rule = ruleEngine.createBotActivityRule();
      
      expect(rule.name).toBe('Bot Activity Pattern');
      expect(rule.type).toBe(FraudType.BOT_ACTIVITY);

      // Test with bot-like posting pattern (exact minute intervals)
      const testData = {
        recentPosts: [
          { timestamp: new Date('2023-01-01T12:00:00Z') }, // Exact hour
          { timestamp: new Date('2023-01-01T13:00:00Z') }, // Exact hour
          { timestamp: new Date('2023-01-01T14:00:00Z') }  // Exact hour
        ]
      };

      const triggered = rule.condition(testData);
      expect(triggered).toBe(true);
    });
  });
});