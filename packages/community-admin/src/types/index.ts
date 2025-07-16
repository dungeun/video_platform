import { ReactNode } from 'react';

// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Content Management Types
export interface CommunityPost extends BaseEntity {
  title: string;
  content: string;
  excerpt?: string;
  author: CommunityUser;
  authorId: string;
  category: PostCategory;
  categoryId: string;
  tags: string[];
  status: PostStatus;
  visibility: PostVisibility;
  metadata: PostMetadata;
  engagement: EngagementMetrics;
  moderation: ModerationRecord;
  featuredImageUrl?: string;
  attachments: MediaAttachment[];
}

export interface Comment extends BaseEntity {
  content: string;
  author: CommunityUser;
  authorId: string;
  postId: string;
  parentId?: string; // For nested comments
  status: CommentStatus;
  moderation: ModerationRecord;
  reactions: CommentReaction[];
  replies?: Comment[];
}

export interface MediaAttachment extends BaseEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  description?: string;
  status: MediaStatus;
  uploadedBy: string;
}

export interface PostCategory extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  postCount: number;
}

// User Management Types
export interface CommunityUser extends BaseEntity {
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  reputation: number;
  badges: UserBadge[];
  profile: UserProfile;
  moderation: UserModerationRecord;
  activity: UserActivity;
  preferences: UserPreferences;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  level: number;
  color?: string;
  badge?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UserBadge extends BaseEntity {
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
  isVisible: boolean;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  location?: string;
  website?: string;
  socialLinks: SocialLink[];
  interests: string[];
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface SocialLink {
  platform: string;
  url: string;
  isVerified: boolean;
}

// Moderation Types
export interface ModerationRecord {
  status: ModerationStatus;
  moderatedBy?: string;
  moderatedAt?: Date;
  reason?: string;
  notes?: string;
  autoModerated: boolean;
  appeals: ModerationAppeal[];
}

export interface UserModerationRecord {
  warnings: Warning[];
  suspensions: Suspension[];
  bans: Ban[];
  totalWarnings: number;
  totalSuspensions: number;
  isBanned: boolean;
  trustScore: number;
}

export interface Warning extends BaseEntity {
  reason: string;
  description: string;
  issuedBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface Suspension extends BaseEntity {
  reason: string;
  description: string;
  issuedBy: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

export interface Ban extends BaseEntity {
  reason: string;
  description: string;
  issuedBy: string;
  isPermanent: boolean;
  expiresAt?: Date;
  isActive: boolean;
}

export interface ModerationAppeal extends BaseEntity {
  reason: string;
  description: string;
  status: AppealStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  decision?: string;
}

export interface UserReport extends BaseEntity {
  reportedUserId: string;
  reportedUser: CommunityUser;
  reporterId: string;
  reporter: CommunityUser;
  reason: ReportReason;
  description: string;
  evidence: ReportEvidence[];
  status: ReportStatus;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  priority: ReportPriority;
}

export interface ContentReport extends BaseEntity {
  contentType: 'post' | 'comment' | 'media';
  contentId: string;
  reporterId: string;
  reporter: CommunityUser;
  reason: ReportReason;
  description: string;
  evidence: ReportEvidence[];
  status: ReportStatus;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  priority: ReportPriority;
}

export interface ReportEvidence {
  type: 'screenshot' | 'link' | 'text' | 'other';
  content: string;
  url?: string;
  description?: string;
}

// Analytics Types
export interface CommunityAnalytics {
  timeRange: DateRange;
  overview: CommunityOverview;
  content: ContentAnalytics;
  users: UserAnalytics;
  engagement: EngagementAnalytics;
  moderation: ModerationAnalytics;
}

export interface CommunityOverview {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalPosts: number;
  totalComments: number;
  engagement: {
    rate: number;
    trend: number;
  };
  health: {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface ContentAnalytics {
  posts: {
    total: number;
    published: number;
    draft: number;
    pending: number;
    trend: TrendData[];
  };
  comments: {
    total: number;
    approved: number;
    pending: number;
    spam: number;
    trend: TrendData[];
  };
  popular: {
    posts: PopularContent[];
    categories: PopularCategory[];
    tags: PopularTag[];
  };
}

export interface UserAnalytics {
  registrations: TrendData[];
  activity: ActivityData[];
  retention: RetentionData[];
  demographics: DemographicData[];
  topContributors: TopContributor[];
}

export interface EngagementAnalytics {
  interactions: InteractionData[];
  reactions: ReactionData[];
  sharing: SharingData[];
  timeOnSite: TrendData[];
  pageViews: TrendData[];
}

export interface ModerationAnalytics {
  reports: {
    total: number;
    pending: number;
    resolved: number;
    trend: TrendData[];
  };
  actions: {
    warnings: number;
    suspensions: number;
    bans: number;
    deletions: number;
  };
  autoModeration: {
    flagged: number;
    approved: number;
    accuracy: number;
  };
  responseTime: {
    average: number;
    median: number;
    trend: TrendData[];
  };
}

// Notification Types
export interface CommunityNotification extends BaseEntity {
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  userId: string;
  isRead: boolean;
  readAt?: Date;
  priority: NotificationPriority;
  channels: NotificationChannel[];
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  bodyTemplate: string;
  isActive: boolean;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  required: boolean;
  defaultValue?: any;
}

// Widget Types
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  data?: any;
  isLoading?: boolean;
  error?: string;
}

export interface WidgetConfig {
  refreshInterval?: number;
  showHeader?: boolean;
  showControls?: boolean;
  customSettings?: Record<string, any>;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Form Types
export interface ContentFormData {
  title: string;
  content: string;
  excerpt?: string;
  categoryId: string;
  tags: string[];
  status: PostStatus;
  visibility: PostVisibility;
  featuredImage?: File;
  attachments: File[];
  metadata: Record<string, any>;
}

export interface UserFormData {
  username: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  role: string;
  status: UserStatus;
  avatar?: File;
}

export interface ModerationActionData {
  action: ModerationAction;
  reason: string;
  description?: string;
  duration?: number;
  notifyUser: boolean;
  publicNote?: string;
}

// Hook Types
export interface UseCommunityAdminOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

export interface UseModerationOptions {
  queueType?: 'all' | 'posts' | 'comments' | 'reports' | 'users';
  priority?: ReportPriority;
  autoAssign?: boolean;
}

export interface UseCommunityAnalyticsOptions {
  timeRange: DateRange;
  metrics: string[];
  realtime?: boolean;
}

// Utility Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TrendData {
  date: Date;
  value: number;
  change?: number;
}

export interface ActivityData {
  hour: number;
  users: number;
  posts: number;
  comments: number;
}

export interface RetentionData {
  cohort: string;
  day1: number;
  day7: number;
  day30: number;
}

export interface DemographicData {
  label: string;
  value: number;
  percentage: number;
}

export interface PopularContent {
  id: string;
  title: string;
  views: number;
  engagement: number;
  author: string;
}

export interface PopularCategory {
  id: string;
  name: string;
  posts: number;
  engagement: number;
}

export interface PopularTag {
  name: string;
  usage: number;
  trend: number;
}

export interface TopContributor {
  user: CommunityUser;
  posts: number;
  comments: number;
  reputation: number;
}

export interface InteractionData {
  type: string;
  count: number;
  trend: number;
}

export interface ReactionData {
  emoji: string;
  count: number;
  percentage: number;
}

export interface SharingData {
  platform: string;
  shares: number;
  clickbacks: number;
}

export interface CommentReaction {
  id: string;
  userId: string;
  type: 'like' | 'dislike' | 'love' | 'laugh' | 'angry' | 'sad';
  createdAt: Date;
}

export interface PostMetadata {
  readTime?: number;
  wordCount: number;
  language?: string;
  seoTitle?: string;
  seoDescription?: string;
  customFields: Record<string, any>;
}

export interface EngagementMetrics {
  views: number;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
  reactions: Record<string, number>;
  avgRating?: number;
}

export interface UserActivity {
  lastLoginAt: Date;
  loginCount: number;
  postsCount: number;
  commentsCount: number;
  reactionsGiven: number;
  reactionsReceived: number;
  reputationChangeToday: number;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  mentionNotifications: boolean;
  followNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
}

// Enums
export type PostStatus = 'draft' | 'pending' | 'published' | 'archived' | 'deleted';
export type PostVisibility = 'public' | 'private' | 'unlisted' | 'members';
export type CommentStatus = 'pending' | 'approved' | 'spam' | 'deleted';
export type MediaStatus = 'pending' | 'approved' | 'rejected' | 'deleted';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'removed';
export type AppealStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type ReportStatus = 'open' | 'assigned' | 'investigating' | 'resolved' | 'closed' | 'dismissed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ReportReason = 'spam' | 'harassment' | 'hate_speech' | 'inappropriate_content' | 'copyright' | 'fraud' | 'other';
export type ModerationAction = 'approve' | 'reject' | 'flag' | 'warn' | 'suspend' | 'ban' | 'delete';
export type NotificationType = 'system' | 'moderation' | 'content' | 'user' | 'community' | 'security';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';
export type WidgetType = 'stats' | 'chart' | 'table' | 'list' | 'metric' | 'activity' | 'queue';
export type WidgetSize = 'small' | 'medium' | 'large' | 'extra-large';

// Component Props Types
export interface CommunityAdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
}

export interface ModerationLayoutProps {
  children: ReactNode;
  queue?: ReactNode;
  filters?: ReactNode;
}

export interface DashboardWidgetProps {
  widget: DashboardWidget;
  onUpdate?: (widget: DashboardWidget) => void;
  onRemove?: (widgetId: string) => void;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  filter?: {
    type: 'text' | 'select' | 'date' | 'number';
    options?: { label: string; value: any }[];
  };
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'file' | 'rich-text';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | undefined;
  };
  description?: string;
  defaultValue?: any;
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResponse<T = any> extends ServiceResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  status?: string[];
  category?: string[];
  author?: string[];
  dateRange?: DateRange;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ModerationFilters extends SearchFilters {
  priority?: ReportPriority[];
  assignedTo?: string[];
  reportReason?: ReportReason[];
  autoModerated?: boolean;
}

// Configuration Types
export interface CommunityAdminConfig {
  features: {
    autoModeration: boolean;
    userReporting: boolean;
    contentAnalytics: boolean;
    realTimeNotifications: boolean;
    bulkActions: boolean;
    customRoles: boolean;
  };
  limits: {
    maxFileSize: number;
    maxPostLength: number;
    maxCommentLength: number;
    rateLimit: {
      posts: number;
      comments: number;
      reports: number;
    };
  };
  moderation: {
    autoApprove: {
      trustedUsers: boolean;
      lowRiskContent: boolean;
    };
    quarantine: {
      enabled: boolean;
      duration: number;
    };
    escalation: {
      enabled: boolean;
      rules: EscalationRule[];
    };
  };
  notifications: {
    templates: NotificationTemplate[];
    channels: NotificationChannel[];
    frequency: {
      digest: 'daily' | 'weekly' | 'monthly';
      immediate: NotificationType[];
    };
  };
}

export interface EscalationRule {
  id: string;
  name: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  isActive: boolean;
}

export interface EscalationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
}

export interface EscalationAction {
  type: 'notify' | 'assign' | 'escalate' | 'auto_resolve';
  target?: string;
  params?: Record<string, any>;
}