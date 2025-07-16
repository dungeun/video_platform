import { BaseEntity, UUID } from '@revu/types';

export interface InfluencerMetrics extends BaseEntity {
  influencerId: UUID;
  period: MetricsPeriod;
  followers: {
    total: number;
    growth: number;
    growthRate: number;
  };
  engagement: {
    rate: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  reach: {
    total: number;
    unique: number;
    impressions: number;
  };
  audience: {
    demographics: Demographics;
    interests: string[];
    topLocations: Location[];
  };
  content: {
    totalPosts: number;
    averagePostsPerDay: number;
    topPerformingPosts: PostMetrics[];
  };
  performance: {
    score: number;
    ranking: number;
    tier: InfluencerTier;
  };
}

export interface Demographics {
  age: AgeDistribution[];
  gender: GenderDistribution[];
  education: EducationDistribution[];
  income: IncomeDistribution[];
}

export interface AgeDistribution {
  range: string;
  percentage: number;
}

export interface GenderDistribution {
  gender: 'male' | 'female' | 'other';
  percentage: number;
}

export interface EducationDistribution {
  level: string;
  percentage: number;
}

export interface IncomeDistribution {
  range: string;
  percentage: number;
}

export interface Location {
  country: string;
  city?: string;
  percentage: number;
}

export interface PostMetrics {
  postId: string;
  platform: SocialPlatform;
  publishedAt: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  reach: number;
  impressions: number;
  clickThroughRate: number;
}

export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  BLOG = 'blog'
}

export enum InfluencerTier {
  NANO = 'nano',        // 1K-10K followers
  MICRO = 'micro',      // 10K-100K followers
  MID = 'mid',          // 100K-500K followers
  MACRO = 'macro',      // 500K-1M followers
  MEGA = 'mega'         // 1M+ followers
}

export interface MetricsPeriod {
  start: Date;
  end: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface PerformanceScore {
  overall: number;
  engagement: number;
  growth: number;
  consistency: number;
  quality: number;
  reach: number;
}

export interface TrendAnalysis {
  influencerId: UUID;
  period: MetricsPeriod;
  trends: {
    engagement: TrendData;
    followers: TrendData;
    content: TrendData;
  };
  predictions: {
    nextMonthGrowth: number;
    nextQuarterEngagement: number;
    recommendedPostingFrequency: number;
  };
  insights: Insight[];
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  changePercentage: number;
  dataPoints: DataPoint[];
}

export interface DataPoint {
  timestamp: Date;
  value: number;
}

export interface Insight {
  type: InsightType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
}

export enum InsightType {
  ENGAGEMENT_DROP = 'engagement_drop',
  GROWTH_SPIKE = 'growth_spike',
  AUDIENCE_SHIFT = 'audience_shift',
  CONTENT_PERFORMANCE = 'content_performance',
  OPTIMAL_POSTING_TIME = 'optimal_posting_time',
  COMPETITOR_ANALYSIS = 'competitor_analysis'
}

export interface CampaignAnalytics {
  campaignId: UUID;
  influencerId: UUID;
  metrics: {
    reach: number;
    impressions: number;
    engagement: number;
    clicks: number;
    conversions: number;
    roi: number;
  };
  costPerMetric: {
    cpm: number;    // Cost per mille (1000 impressions)
    cpc: number;    // Cost per click
    cpe: number;    // Cost per engagement
    cpa: number;    // Cost per acquisition
  };
  performance: {
    vsExpected: number;
    vsBenchmark: number;
    score: number;
  };
}

export interface BenchmarkData {
  industry: string;
  platform: SocialPlatform;
  tier: InfluencerTier;
  metrics: {
    averageEngagementRate: number;
    averageGrowthRate: number;
    averagePostFrequency: number;
    averageReach: number;
  };
}

export interface AnalyticsConfig {
  refreshInterval: number;
  retentionDays: number;
  samplingRate: number;
  enableRealtime: boolean;
  benchmarkSource: 'internal' | 'external';
}