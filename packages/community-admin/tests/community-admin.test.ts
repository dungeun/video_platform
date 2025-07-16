import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommunityRegistryService } from '../src/services/CommunityRegistryService';
import { ContentModerationService } from '../src/services/ContentModerationService';
import { UserModerationService } from '../src/services/UserModerationService';
import { CommunityAnalyticsService } from '../src/services/CommunityAnalyticsService';
import { NotificationService } from '../src/services/NotificationService';
import type { CommunityAdminConfig, DateRange } from '../src/types';

// Mock dependencies
vi.mock('@kcommerce/storage', () => ({
  StorageManager: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@kcommerce/utils', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }))
}));

describe('Community Admin Module', () => {
  describe('CommunityRegistryService', () => {
    let registryService: CommunityRegistryService;
    
    beforeEach(() => {
      registryService = new CommunityRegistryService();
    });

    it('should initialize with valid configuration', async () => {
      const config: CommunityAdminConfig = {
        features: {
          autoModeration: true,
          userReporting: true,
          contentAnalytics: true,
          realTimeNotifications: true,
          bulkActions: true,
          customRoles: true
        },
        limits: {
          maxFileSize: 10 * 1024 * 1024,
          maxPostLength: 10000,
          maxCommentLength: 1000,
          rateLimit: {
            posts: 10,
            comments: 50,
            reports: 5
          }
        },
        moderation: {
          autoApprove: {
            trustedUsers: true,
            lowRiskContent: true
          },
          quarantine: {
            enabled: true,
            duration: 24
          },
          escalation: {
            enabled: true,
            rules: []
          }
        },
        notifications: {
          templates: [],
          channels: ['in_app', 'email'],
          frequency: {
            digest: 'weekly',
            immediate: ['moderation', 'security']
          }
        }
      };

      const result = await registryService.initialize(config);
      expect(result.success).toBe(true);
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        features: {},
        limits: {
          maxFileSize: -1, // Invalid negative value
          maxPostLength: 0,
          maxCommentLength: 0,
          rateLimit: {
            posts: 10,
            comments: 50,
            reports: 5
          }
        }
      } as CommunityAdminConfig;

      const result = await registryService.initialize(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should create and manage roles', async () => {
      const roleData = {
        name: 'Test Role',
        permissions: [],
        level: 50,
        color: '#000000',
        badge: 'test'
      };

      const result = await registryService.createRole(roleData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Role');
      expect(result.data?.id).toBeDefined();
    });

    it('should create and manage permissions', async () => {
      const permissionData = {
        name: 'Test Permission',
        resource: 'test',
        action: 'read',
        description: 'Test permission description'
      };

      const result = await registryService.createPermission(permissionData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Permission');
      expect(result.data?.id).toBeDefined();
    });
  });

  describe('ContentModerationService', () => {
    let moderationService: ContentModerationService;
    
    beforeEach(() => {
      moderationService = new ContentModerationService();
    });

    it('should auto-moderate content', async () => {
      const content = 'This is a test post content';
      const metadata = { author: 'test-user', category: 'general' };

      const result = await moderationService.autoModerateContent(content, metadata);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('shouldFlag');
      expect(result.data).toHaveProperty('confidence');
      expect(result.data).toHaveProperty('reasons');
    });

    it('should handle moderation queue', async () => {
      const filters = { priority: ['high', 'urgent'] };
      const result = await moderationService.getModerationQueue(filters);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('should create content reports', async () => {
      const reportData = {
        contentType: 'post' as const,
        contentId: 'post-123',
        reporterId: 'user-456',
        reporter: {
          id: 'user-456',
          username: 'reporter',
          email: 'reporter@test.com',
          displayName: 'Reporter User'
        } as any,
        reason: 'spam' as const,
        description: 'This post contains spam',
        evidence: []
      };

      const result = await moderationService.createContentReport(reportData);
      expect(result.success).toBe(true);
      expect(result.data?.contentType).toBe('post');
      expect(result.data?.reason).toBe('spam');
    });
  });

  describe('UserModerationService', () => {
    let userModerationService: UserModerationService;
    
    beforeEach(() => {
      userModerationService = new UserModerationService();
    });

    it('should create user reports', async () => {
      const reportData = {
        reportedUserId: 'user-123',
        reportedUser: {
          id: 'user-123',
          username: 'reported-user',
          email: 'reported@test.com',
          displayName: 'Reported User'
        } as any,
        reporterId: 'user-456',
        reporter: {
          id: 'user-456',
          username: 'reporter',
          email: 'reporter@test.com',
          displayName: 'Reporter User'
        } as any,
        reason: 'harassment' as const,
        description: 'User is harassing other members',
        evidence: []
      };

      const result = await userModerationService.createUserReport(reportData);
      expect(result.success).toBe(true);
      expect(result.data?.reason).toBe('harassment');
    });

    it('should get user reports with filters', async () => {
      const filters = { status: ['open', 'investigating'] };
      const result = await userModerationService.getUserReports(filters);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('should get user moderation metrics', async () => {
      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const result = await userModerationService.getUserModerationMetrics(timeRange);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('CommunityAnalyticsService', () => {
    let analyticsService: CommunityAnalyticsService;
    
    beforeEach(() => {
      analyticsService = new CommunityAnalyticsService();
    });

    it('should get community analytics', async () => {
      const timeRange: DateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const result = await analyticsService.getCommunityAnalytics(timeRange);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.timeRange).toEqual(timeRange);
      expect(result.data?.overview).toBeDefined();
      expect(result.data?.content).toBeDefined();
      expect(result.data?.users).toBeDefined();
      expect(result.data?.engagement).toBeDefined();
      expect(result.data?.moderation).toBeDefined();
    });

    it('should get community overview', async () => {
      const timeRange: DateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const result = await analyticsService.getCommunityOverview(timeRange);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.totalUsers).toBeDefined();
      expect(result.data?.activeUsers).toBeDefined();
      expect(result.data?.engagement).toBeDefined();
      expect(result.data?.health).toBeDefined();
    });

    it('should get real-time metrics', async () => {
      const result = await analyticsService.getRealTimeMetrics();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.timestamp).toBeDefined();
    });

    it('should export analytics data', async () => {
      const timeRange: DateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const result = await analyticsService.exportAnalytics(timeRange, 'json');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
    });
  });

  describe('NotificationService', () => {
    let notificationService: NotificationService;
    
    beforeEach(() => {
      notificationService = new NotificationService();
    });

    it('should create notification', async () => {
      const notificationData = {
        type: 'moderation' as const,
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { testData: 'value' },
        userId: 'user-123',
        priority: 'normal' as const,
        channels: ['in_app' as const]
      };

      const result = await notificationService.createNotification(notificationData);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Notification');
      expect(result.data?.id).toBeDefined();
    });

    it('should create notification template', async () => {
      const templateData = {
        name: 'Test Template',
        type: 'moderation' as const,
        subject: 'Test Subject',
        bodyTemplate: 'Test body with {{variable}}',
        isActive: true,
        variables: [
          {
            name: 'variable',
            description: 'Test variable',
            type: 'string' as const,
            required: true
          }
        ]
      };

      const result = await notificationService.createTemplate(templateData);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Template');
      expect(result.data?.id).toBeDefined();
    });

    it('should get user notifications', async () => {
      const userId = 'user-123';
      const filters = { limit: 10 };

      const result = await notificationService.getUserNotifications(userId, filters);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('should get unread count', async () => {
      const userId = 'user-123';
      const result = await notificationService.getUnreadCount(userId);
      
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('number');
    });

    it('should get notification metrics', async () => {
      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const result = await notificationService.getNotificationMetrics(timeRange);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.total).toBeDefined();
      expect(result.data?.sent).toBeDefined();
      expect(result.data?.read).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should work with multiple services together', async () => {
      const registryService = new CommunityRegistryService();
      const analyticsService = new CommunityAnalyticsService();
      const notificationService = new NotificationService();

      // Initialize registry
      const config: CommunityAdminConfig = {
        features: {
          autoModeration: true,
          userReporting: true,
          contentAnalytics: true,
          realTimeNotifications: true,
          bulkActions: true,
          customRoles: true
        },
        limits: {
          maxFileSize: 10 * 1024 * 1024,
          maxPostLength: 10000,
          maxCommentLength: 1000,
          rateLimit: { posts: 10, comments: 50, reports: 5 }
        },
        moderation: {
          autoApprove: { trustedUsers: true, lowRiskContent: true },
          quarantine: { enabled: true, duration: 24 },
          escalation: { enabled: true, rules: [] }
        },
        notifications: {
          templates: [],
          channels: ['in_app', 'email'],
          frequency: { digest: 'weekly', immediate: ['moderation', 'security'] }
        }
      };

      const initResult = await registryService.initialize(config);
      expect(initResult.success).toBe(true);

      // Get analytics
      const timeRange: DateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const analyticsResult = await analyticsService.getCommunityAnalytics(timeRange);
      expect(analyticsResult.success).toBe(true);

      // Create notification
      const notificationResult = await notificationService.createNotification({
        type: 'community',
        title: 'Integration Test',
        message: 'Services working together',
        data: {},
        userId: 'user-123',
        priority: 'normal',
        channels: ['in_app']
      });
      expect(notificationResult.success).toBe(true);
    });
  });
});