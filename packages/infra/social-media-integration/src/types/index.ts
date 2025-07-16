export interface SocialMediaConfig {
  instagram?: InstagramConfig;
  youtube?: YouTubeConfig;
  tiktok?: TikTokConfig;
  webhook?: WebhookConfig;
  encryption?: EncryptionConfig;
}

export interface InstagramConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiVersion?: string;
  rateLimit?: RateLimitConfig;
}

export interface YouTubeConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  rateLimit?: RateLimitConfig;
}

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri?: string;
  rateLimit?: RateLimitConfig;
}

export interface WebhookConfig {
  secret: string;
  endpoint: string;
  verifyToken?: string;
}

export interface EncryptionConfig {
  algorithm: string;
  key: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  quotaPerDay?: number;
  requestsPerSecond?: number;
}

// Authentication Types
export interface AuthOptions {
  scope: string[];
  state: string;
  responseType?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string[];
}

export interface ConnectAccountParams {
  userId: string;
  platform: SocialPlatform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// Platform Types
export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok'
}

// Instagram Types
export interface InstagramProfile {
  id: string;
  username: string;
  accountType: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  profilePictureUrl: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  biography: string;
  website?: string;
  isVerified: boolean;
}

export interface InstagramMetrics {
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  engagementRate: number;
  impressions?: number;
  reach?: number;
  profileViews?: number;
  websiteClicks?: number;
}

export interface InstagramMedia {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  permalink: string;
  timestamp: Date;
  likeCount: number;
  commentCount: number;
  impressions?: number;
  reach?: number;
  saved?: number;
  shares?: number;
}

// YouTube Types
export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnails: {
    default?: Thumbnail;
    medium?: Thumbnail;
    high?: Thumbnail;
  };
  statistics: ChannelStats;
  brandingSettings?: any;
}

export interface ChannelStats {
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
  hiddenSubscriberCount: boolean;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default?: Thumbnail;
    medium?: Thumbnail;
    high?: Thumbnail;
    standard?: Thumbnail;
    maxres?: Thumbnail;
  };
  publishedAt: Date;
  duration: string;
  statistics: VideoStats;
  tags?: string[];
  categoryId: string;
}

export interface VideoStats {
  viewCount: number;
  likeCount: number;
  dislikeCount?: number;
  commentCount: number;
  favoriteCount: number;
}

export interface VideoAnalytics {
  views: TimeSeriesData[];
  watchTime: TimeSeriesData[];
  averageViewDuration: number;
  audienceRetention: RetentionData[];
  demographics: DemographicsData;
  trafficSources: TrafficSourceData[];
}

// TikTok Types
export interface TikTokProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  isVerified: boolean;
  signature: string;
}

export interface TikTokVideo {
  id: string;
  description: string;
  createTime: Date;
  duration: number;
  coverImageUrl: string;
  shareUrl: string;
  statistics: TikTokStats;
  music?: {
    id: string;
    title: string;
    author: string;
  };
}

export interface TikTokStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export interface TikTokAnalytics {
  profileViews: TimeSeriesData[];
  videoViews: TimeSeriesData[];
  followerGrowth: TimeSeriesData[];
  engagement: EngagementData;
  topVideos: TikTokVideo[];
}

// Scheduling Types
export interface SchedulePostParams {
  userId: string;
  platform: SocialPlatform;
  content: PostContent;
  scheduledTime: Date;
  options?: PostOptions;
}

export interface PostContent {
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  caption?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  tags?: string[];
  location?: LocationData;
}

export interface PostOptions {
  autoHashtags?: boolean;
  crossPost?: boolean;
  notifyOnPublish?: boolean;
  retryOnFailure?: boolean;
}

export interface ScheduledPost {
  id: string;
  userId: string;
  platform: SocialPlatform;
  content: PostContent;
  scheduledTime: Date;
  status: ScheduleStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  error?: string;
}

export enum ScheduleStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Analytics Types
export interface TimeSeriesData {
  date: Date;
  value: number;
}

export interface RetentionData {
  seconds: number;
  percentage: number;
}

export interface DemographicsData {
  ageGroups: { group: string; percentage: number }[];
  gender: { type: string; percentage: number }[];
  countries: { code: string; percentage: number }[];
}

export interface TrafficSourceData {
  source: string;
  views: number;
  watchTime: number;
}

export interface EngagementData {
  rate: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  platform: SocialPlatform;
  data: any;
  timestamp: Date;
  signature?: string;
}

export enum WebhookEventType {
  MENTION = 'mention',
  COMMENT = 'comment',
  LIKE = 'like',
  FOLLOW = 'follow',
  UNFOLLOW = 'unfollow',
  MESSAGE = 'message',
  STORY_MENTION = 'story_mention'
}

// Error Types
export class SocialMediaError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SocialMediaError';
  }
}

export class AuthenticationError extends SocialMediaError {
  constructor(message: string, public platform?: SocialPlatform) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends SocialMediaError {
  constructor(
    message: string,
    public retryAfter?: number,
    public platform?: SocialPlatform
  ) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class APIError extends SocialMediaError {
  constructor(
    message: string,
    public statusCode?: number,
    public platform?: SocialPlatform
  ) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

// Helper Types
export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface MediaParams {
  userId: string;
  limit?: number;
  after?: string;
  before?: string;
  mediaType?: string[];
}

export interface MetricsParams {
  userId: string;
  metrics: string[];
  period?: 'day' | 'week' | 'month' | 'lifetime';
  since?: Date;
  until?: Date;
}