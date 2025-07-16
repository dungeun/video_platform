// Admin configuration for community-admin module

import type { 
  CommunityAdminConfig,
  UserRole,
  Permission,
  EscalationRule,
  NotificationTemplate
} from '../src/types';

// Default admin configuration
export const adminConfig: CommunityAdminConfig = {
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
      rules: [
        {
          id: 'high-priority-escalation',
          name: 'High Priority Content Escalation',
          conditions: [
            { field: 'priority', operator: 'equals', value: 'urgent' },
            { field: 'reportCount', operator: 'greater_than', value: 3 }
          ],
          actions: [
            { type: 'notify', target: 'senior-moderators', params: { immediate: true } },
            { type: 'escalate', params: { level: 'admin' } }
          ],
          isActive: true
        },
        {
          id: 'spam-detection-escalation',
          name: 'Spam Detection Auto-Escalation',
          conditions: [
            { field: 'autoModerationFlags', operator: 'contains', value: 'spam' },
            { field: 'confidence', operator: 'greater_than', value: 0.9 }
          ],
          actions: [
            { type: 'auto_resolve', params: { action: 'remove' } },
            { type: 'notify', target: 'moderation-team' }
          ],
          isActive: true
        }
      ]
    }
  },
  notifications: {
    templates: [
      {
        id: 'post-approved',
        name: 'Post Approved',
        type: 'moderation',
        subject: 'Your post has been approved',
        bodyTemplate: 'Your post "{{postTitle}}" has been approved and is now visible to the community.',
        isActive: true,
        variables: [
          { name: 'postTitle', description: 'Title of the approved post', type: 'string', required: true }
        ]
      },
      {
        id: 'post-rejected',
        name: 'Post Rejected',
        type: 'moderation',
        subject: 'Your post requires attention',
        bodyTemplate: 'Your post "{{postTitle}}" was not approved. Reason: {{reason}}. Please review our community guidelines and try again.',
        isActive: true,
        variables: [
          { name: 'postTitle', description: 'Title of the rejected post', type: 'string', required: true },
          { name: 'reason', description: 'Reason for rejection', type: 'string', required: true }
        ]
      },
      {
        id: 'user-warning',
        name: 'User Warning',
        type: 'moderation',
        subject: 'Community Guidelines Warning',
        bodyTemplate: 'You have received a warning for violating our community guidelines. Reason: {{reason}}. Please review our rules to avoid future issues.',
        isActive: true,
        variables: [
          { name: 'reason', description: 'Reason for warning', type: 'string', required: true }
        ]
      },
      {
        id: 'weekly-digest',
        name: 'Weekly Community Digest',
        type: 'community',
        subject: 'Your Weekly Community Update',
        bodyTemplate: 'Here are the highlights from this week: {{highlights}}. Don\'t miss out on the latest discussions!',
        isActive: true,
        variables: [
          { name: 'highlights', description: 'Weekly highlights summary', type: 'string', required: true }
        ]
      }
    ],
    channels: ['in_app', 'email', 'push'],
    frequency: {
      digest: 'weekly',
      immediate: ['moderation', 'security']
    }
  }
};

// Default admin roles
export const defaultAdminRoles: UserRole[] = [
  {
    id: 'super-admin',
    name: 'Super Administrator',
    permissions: [
      { id: 'manage-all', name: 'Manage All', resource: '*', action: '*', description: 'Full system access' }
    ],
    level: 100,
    color: '#dc2626',
    badge: 'super-admin'
  },
  {
    id: 'community-admin',
    name: 'Community Administrator',
    permissions: [
      { id: 'manage-users', name: 'Manage Users', resource: 'users', action: '*', description: 'Full user management' },
      { id: 'manage-content', name: 'Manage Content', resource: 'content', action: '*', description: 'Full content management' },
      { id: 'manage-moderation', name: 'Manage Moderation', resource: 'moderation', action: '*', description: 'Full moderation access' },
      { id: 'view-analytics', name: 'View Analytics', resource: 'analytics', action: 'view', description: 'View all analytics' }
    ],
    level: 90,
    color: '#059669',
    badge: 'admin'
  },
  {
    id: 'senior-moderator',
    name: 'Senior Moderator',
    permissions: [
      { id: 'moderate-content', name: 'Moderate Content', resource: 'content', action: 'moderate', description: 'Moderate all content' },
      { id: 'moderate-users', name: 'Moderate Users', resource: 'users', action: 'moderate', description: 'Moderate user accounts' },
      { id: 'handle-reports', name: 'Handle Reports', resource: 'reports', action: '*', description: 'Handle all reports' },
      { id: 'escalate-issues', name: 'Escalate Issues', resource: 'moderation', action: 'escalate', description: 'Escalate moderation issues' }
    ],
    level: 80,
    color: '#7c3aed',
    badge: 'senior-mod'
  },
  {
    id: 'moderator',
    name: 'Moderator',
    permissions: [
      { id: 'moderate-posts', name: 'Moderate Posts', resource: 'posts', action: 'moderate', description: 'Moderate posts' },
      { id: 'moderate-comments', name: 'Moderate Comments', resource: 'comments', action: 'moderate', description: 'Moderate comments' },
      { id: 'handle-basic-reports', name: 'Handle Basic Reports', resource: 'reports', action: 'handle', description: 'Handle basic reports' }
    ],
    level: 70,
    color: '#0ea5e9',
    badge: 'moderator'
  }
];

// Admin dashboard configuration
export const adminDashboardConfig = {
  defaultWidgets: [
    {
      id: 'community-stats',
      type: 'stats',
      title: 'Community Statistics',
      position: { x: 0, y: 0, w: 6, h: 4 },
      size: 'large',
      config: {
        refreshInterval: 30000,
        showHeader: true,
        showControls: true
      }
    },
    {
      id: 'moderation-queue',
      type: 'queue',
      title: 'Moderation Queue',
      position: { x: 6, y: 0, w: 6, h: 4 },
      size: 'large',
      config: {
        refreshInterval: 15000,
        showHeader: true,
        showControls: true
      }
    },
    {
      id: 'user-activity',
      type: 'activity',
      title: 'User Activity',
      position: { x: 0, y: 4, w: 4, h: 3 },
      size: 'medium',
      config: {
        refreshInterval: 60000,
        showHeader: true
      }
    },
    {
      id: 'content-metrics',
      type: 'chart',
      title: 'Content Metrics',
      position: { x: 4, y: 4, w: 4, h: 3 },
      size: 'medium',
      config: {
        refreshInterval: 60000,
        showHeader: true
      }
    },
    {
      id: 'engagement-trends',
      type: 'chart',
      title: 'Engagement Trends',
      position: { x: 8, y: 4, w: 4, h: 3 },
      size: 'medium',
      config: {
        refreshInterval: 60000,
        showHeader: true
      }
    }
  ],
  layout: {
    columns: 12,
    rowHeight: 60,
    margin: [10, 10],
    containerPadding: [10, 10]
  }
};

// Auto-moderation rules configuration
export const autoModerationRules = [
  {
    id: 'spam-detection',
    name: 'Spam Detection',
    description: 'Automatically detect and flag spam content',
    enabled: true,
    conditions: [
      { type: 'content_similarity', threshold: 0.8 },
      { type: 'link_count', threshold: 3 },
      { type: 'caps_ratio', threshold: 0.5 }
    ],
    actions: [
      { type: 'flag_for_review', priority: 'medium' },
      { type: 'notify_moderators' }
    ]
  },
  {
    id: 'hate-speech-detection',
    name: 'Hate Speech Detection',
    description: 'Detect and handle hate speech content',
    enabled: true,
    conditions: [
      { type: 'keyword_match', keywords: ['hate_speech_keywords'] },
      { type: 'sentiment_analysis', threshold: -0.8 }
    ],
    actions: [
      { type: 'quarantine', duration: 24 },
      { type: 'flag_for_review', priority: 'urgent' },
      { type: 'notify_senior_moderators' }
    ]
  },
  {
    id: 'trusted-user-bypass',
    name: 'Trusted User Auto-Approval',
    description: 'Auto-approve content from trusted users',
    enabled: true,
    conditions: [
      { type: 'user_trust_score', threshold: 80 },
      { type: 'user_role', roles: ['trusted_member', 'moderator', 'admin'] }
    ],
    actions: [
      { type: 'auto_approve' }
    ]
  }
];

// Analytics configuration
export const analyticsConfig = {
  defaultTimeRange: '7d',
  refreshInterval: 30000, // 30 seconds
  enableRealTime: true,
  exportFormats: ['json', 'csv'],
  metrics: {
    community: ['totalUsers', 'activeUsers', 'newUsers', 'engagementRate'],
    content: ['totalPosts', 'totalComments', 'popularContent', 'contentTrends'],
    moderation: ['pendingReports', 'resolvedReports', 'moderationActions', 'responseTime'],
    user: ['userGrowth', 'userActivity', 'userRetention', 'topContributors']
  }
};

// Notification configuration
export const notificationConfig = {
  enabledChannels: ['in_app', 'email', 'push'],
  digestFrequency: 'weekly',
  immediateNotifications: ['moderation', 'security', 'urgent_reports'],
  templateCategories: ['moderation', 'community', 'system', 'user'],
  retentionPeriod: 90, // days
  maxNotificationsPerUser: 1000
};

export default {
  adminConfig,
  defaultAdminRoles,
  adminDashboardConfig,
  autoModerationRules,
  analyticsConfig,
  notificationConfig
};