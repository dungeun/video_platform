# Community Admin Module

A comprehensive community administration and content moderation module for KCommerce applications. This module provides tools for managing community content, moderating users, analyzing community metrics, and maintaining a healthy online community environment.

## Features

### Core Features
- **Content Moderation**: Comprehensive content review and moderation workflows
- **User Management**: User account management, roles, and permissions system
- **Community Analytics**: Real-time metrics and detailed analytics dashboard
- **Notification System**: Multi-channel notification management
- **Auto-Moderation**: AI-powered automatic content moderation
- **Bulk Operations**: Efficient bulk moderation and management tools
- **Report Handling**: User reporting system with escalation workflows
- **Role-Based Permissions**: Granular permission system for different user roles

### Advanced Features
- **Real-time Monitoring**: Live community activity monitoring
- **Escalation Workflows**: Automated escalation based on configurable rules
- **Export Functionality**: Analytics and data export capabilities
- **Custom Widgets**: Configurable dashboard widgets
- **Trust Scoring**: User trust score calculation and management
- **Content Analytics**: Detailed content performance metrics

## Installation

```bash
npm install @kcommerce/community-admin
```

## Quick Start

### Basic Setup

```tsx
import { 
  useCommunityAdmin, 
  CommunityAdminLayout, 
  CommunityDashboard,
  defaultCommunityAdminConfig 
} from '@kcommerce/community-admin';

function CommunityAdminApp() {
  const {
    config,
    analytics,
    isLoading,
    error,
    services
  } = useCommunityAdmin({
    autoRefresh: true,
    refreshInterval: 30000,
    enableRealtime: true
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <CommunityAdminLayout title="Community Dashboard">
      <CommunityDashboard />
    </CommunityAdminLayout>
  );
}
```

### Content Moderation

```tsx
import { useModeration, ModerationLayout, ModerationDashboard } from '@kcommerce/community-admin';

function ModerationApp() {
  const {
    queue,
    moderateContent,
    bulkModerateContent,
    isLoading
  } = useModeration({
    queueType: 'all',
    autoAssign: true
  });

  const handleModerate = async (contentId: string, action: string) => {
    const result = await moderateContent(
      contentId,
      'post',
      {
        action,
        reason: 'Violates community guidelines',
        notifyUser: true
      },
      'moderator-id'
    );
    
    if (result.success) {
      console.log('Content moderated successfully');
    }
  };

  return (
    <ModerationLayout>
      <ModerationDashboard />
    </ModerationLayout>
  );
}
```

### Analytics Dashboard

```tsx
import { useCommunityAnalytics, CommunityStatsWidget } from '@kcommerce/community-admin';

function AnalyticsApp() {
  const {
    analytics,
    realtimeMetrics,
    loadAnalytics,
    exportAnalytics
  } = useCommunityAnalytics({
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    metrics: ['overview', 'content', 'users', 'engagement'],
    realtime: true
  });

  const handleExport = async () => {
    const result = await exportAnalytics(
      { start: new Date('2024-01-01'), end: new Date() },
      'csv'
    );
    
    if (result.success) {
      console.log('Analytics exported:', result.data);
    }
  };

  return (
    <div>
      <CommunityStatsWidget 
        widget={{
          id: 'stats',
          type: 'stats',
          title: 'Community Statistics',
          position: { x: 0, y: 0, w: 6, h: 4 },
          size: 'large',
          config: {}
        }}
      />
      <button onClick={handleExport}>Export Analytics</button>
    </div>
  );
}
```

## API Reference

### Services

#### CommunityRegistryService
Manages module registration and configuration.

```typescript
const registryService = new CommunityRegistryService();

// Initialize with configuration
await registryService.initialize(config);

// Update configuration
await registryService.updateConfig(updates);

// Manage roles and permissions
await registryService.createRole(roleData);
await registryService.updateRole(roleId, updates);
```

#### ContentModerationService
Handles content moderation workflows.

```typescript
const moderationService = new ContentModerationService();

// Moderate content
await moderationService.moderatePost(postId, action, moderatorId);
await moderationService.moderateComment(commentId, action, moderatorId);

// Bulk operations
await moderationService.bulkModerateContent(contentIds, type, action, moderatorId);

// Auto-moderation
await moderationService.autoModerateContent(content, metadata);
```

#### UserModerationService
Manages user moderation and reporting.

```typescript
const userService = new UserModerationService();

// User moderation actions
await userService.warnUser(userId, actionData, moderatorId);
await userService.suspendUser(userId, actionData, moderatorId);
await userService.banUser(userId, actionData, moderatorId);

// Report management
await userService.createUserReport(reportData);
await userService.resolveUserReport(reportId, resolution, resolvedBy);
```

#### CommunityAnalyticsService
Provides community analytics and metrics.

```typescript
const analyticsService = new CommunityAnalyticsService();

// Get analytics
await analyticsService.getCommunityAnalytics(timeRange);
await analyticsService.getCommunityOverview(timeRange);
await analyticsService.getContentAnalytics(timeRange);

// Real-time metrics
await analyticsService.getRealTimeMetrics();

// Export data
await analyticsService.exportAnalytics(timeRange, format);
```

#### NotificationService
Manages community notifications.

```typescript
const notificationService = new NotificationService();

// Send notifications
await notificationService.createNotification(notificationData);
await notificationService.sendNotificationFromTemplate(
  templateId, 
  userId, 
  variables, 
  channels, 
  priority
);

// Manage templates
await notificationService.createTemplate(templateData);
await notificationService.updateTemplate(templateId, updates);
```

### Hooks

#### useCommunityAdmin
Main hook for community administration.

```typescript
const {
  config,
  analytics,
  isLoading,
  error,
  services,
  initialize,
  updateConfig,
  refreshAnalytics,
  getModerationQueue,
  sendNotification
} = useCommunityAdmin(options);
```

#### useModeration
Hook for moderation workflows.

```typescript
const {
  queue,
  contentReports,
  userReports,
  moderateContent,
  moderateUser,
  bulkModerateContent,
  assignTask,
  escalateContent,
  resolveReport
} = useModeration(options);
```

#### useCommunityAnalytics
Hook for analytics and metrics.

```typescript
const {
  analytics,
  realtimeMetrics,
  insights,
  loadAnalytics,
  getCommunityOverview,
  getContentAnalytics,
  compareTimePeriods,
  exportAnalytics
} = useCommunityAnalytics(options);
```

### Components

#### Layouts
- `CommunityAdminLayout`: Main admin layout with navigation
- `ModerationLayout`: Specialized layout for moderation tasks

#### Navigation & Dashboard
- `CommunityNavigation`: Admin navigation component
- `CommunityDashboard`: Main community dashboard

#### Content Management
- `ContentManager`: Content management interface
- `PostManager`: Post-specific management
- `CommentManager`: Comment management
- `MediaManager`: Media content management

#### Moderation System
- `ModerationDashboard`: Moderation overview dashboard
- `ContentReview`: Content review interface
- `UserActions`: User moderation actions
- `ReportCenter`: Report management center

#### Widgets
- `CommunityStatsWidget`: Community statistics widget
- `ModerationQueueWidget`: Moderation queue widget
- `UserActivityWidget`: User activity widget
- `ContentTrendsWidget`: Content trends widget

## Configuration

### Basic Configuration

```typescript
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
      rules: escalationRules
    }
  },
  notifications: {
    templates: notificationTemplates,
    channels: ['in_app', 'email', 'push'],
    frequency: {
      digest: 'weekly',
      immediate: ['moderation', 'security']
    }
  }
};
```

### Auto-Moderation Rules

```typescript
const autoModerationRules = [
  {
    id: 'spam-detection',
    name: 'Spam Detection',
    enabled: true,
    conditions: [
      { type: 'content_similarity', threshold: 0.8 },
      { type: 'link_count', threshold: 3 }
    ],
    actions: [
      { type: 'flag_for_review', priority: 'medium' },
      { type: 'notify_moderators' }
    ]
  }
];
```

### Escalation Rules

```typescript
const escalationRules = [
  {
    id: 'high-priority-escalation',
    name: 'High Priority Content Escalation',
    conditions: [
      { field: 'priority', operator: 'equals', value: 'urgent' },
      { field: 'reportCount', operator: 'greater_than', value: 3 }
    ],
    actions: [
      { type: 'notify', target: 'senior-moderators' },
      { type: 'escalate', params: { level: 'admin' } }
    ],
    isActive: true
  }
];
```

## Types

The module exports comprehensive TypeScript types for all components and data structures. Key types include:

- `CommunityAdminConfig`: Main configuration interface
- `CommunityPost`, `Comment`, `MediaAttachment`: Content types
- `CommunityUser`, `UserRole`, `Permission`: User management types
- `ModerationRecord`, `UserReport`, `ContentReport`: Moderation types
- `CommunityAnalytics`: Analytics data structures
- `CommunityNotification`: Notification types

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:ui
```

### Development Mode

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- GitHub Issues: [Report bugs and request features]
- Documentation: [Full documentation]
- Discord: [Community chat]

## Changelog

### v1.0.0
- Initial release
- Core moderation functionality
- Analytics dashboard
- User management
- Notification system
- Auto-moderation rules
- Export capabilities