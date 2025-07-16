// Main exports for community-admin module

// Services
export { CommunityRegistryService } from './services/CommunityRegistryService';
export { ContentModerationService } from './services/ContentModerationService';
export { UserModerationService } from './services/UserModerationService';
export { CommunityAnalyticsService } from './services/CommunityAnalyticsService';
export { NotificationService } from './services/NotificationService';

// Layouts
export { CommunityAdminLayout } from './layouts/CommunityAdminLayout';
export { ModerationLayout } from './layouts/ModerationLayout';

// Navigation & Dashboard
export { CommunityNavigation } from './navigation/CommunityNavigation';
export { CommunityDashboard } from './dashboard/CommunityDashboard';

// Content Management
export { ContentManager } from './content/ContentManager';

// Moderation System
export { ModerationDashboard } from './moderation/ModerationDashboard';

// Widgets
export { CommunityStatsWidget } from './widgets/CommunityStatsWidget';

// Hooks
export { useCommunityAdmin } from './hooks/useCommunityAdmin';
export { useModeration } from './hooks/useModeration';
export { useCommunityAnalytics } from './hooks/useCommunityAnalytics';

// Utilities
export * from './utils';

// Types
export type * from './types';

// Default configuration
export const defaultCommunityAdminConfig = {
  features: {
    autoModeration: true,
    userReporting: true,
    contentAnalytics: true,
    realTimeNotifications: true,
    bulkActions: true,
    customRoles: true
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxPostLength: 10000,
    maxCommentLength: 1000,
    rateLimit: {
      posts: 10, // per hour
      comments: 50, // per hour
      reports: 5 // per hour
    }
  },
  moderation: {
    autoApprove: {
      trustedUsers: true,
      lowRiskContent: true
    },
    quarantine: {
      enabled: true,
      duration: 24 // hours
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
      digest: 'weekly' as const,
      immediate: ['moderation', 'security'] as const
    }
  }
};

// Module metadata
export const moduleInfo = {
  name: '@kcommerce/community-admin',
  version: '1.0.0',
  description: 'Community administration and content moderation module',
  author: 'KCommerce Team',
  dependencies: [
    '@kcommerce/types',
    '@kcommerce/utils',
    '@kcommerce/core',
    '@kcommerce/storage',
    '@kcommerce/notification'
  ],
  features: [
    'Content Moderation',
    'User Management',
    'Community Analytics',
    'Notification System',
    'Role-based Permissions',
    'Auto-moderation Rules',
    'Bulk Operations',
    'Real-time Metrics',
    'Export Functionality',
    'Escalation Workflows'
  ]
};