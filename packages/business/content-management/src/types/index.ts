export interface Content {
  id: string;
  campaignId: string;
  influencerId: string;
  type: ContentType;
  platform: ContentPlatform;
  status: ContentStatus;
  title: string;
  description: string;
  hashtags: string[];
  mentions: string[];
  media: MediaAsset[];
  caption: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  url?: string;
  guidelines: ContentGuideline[];
  revisions: ContentRevision[];
  approval: ApprovalInfo;
  performance?: ContentPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'carousel';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // For videos
  metadata?: Record<string, any>;
  uploadedAt: Date;
}

export interface ContentGuideline {
  id: string;
  type: GuidelineType;
  requirement: string;
  mandatory: boolean;
  completed: boolean;
}

export interface ContentRevision {
  id: string;
  version: number;
  changes: string;
  requestedBy: string;
  requestedAt: Date;
  completedAt?: Date;
  media?: MediaAsset[];
  caption?: string;
}

export interface ApprovalInfo {
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  feedback?: string;
  requiredApprovers: string[];
  currentApprovers: string[];
}

export interface ContentPerformance {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagement: number;
  clicks: number;
  conversions: number;
  lastUpdated: Date;
}

export interface ContentBrief {
  id: string;
  campaignId: string;
  title: string;
  objective: string;
  targetAudience: string;
  keyMessages: string[];
  contentRequirements: ContentRequirement[];
  brandGuidelines: BrandGuideline[];
  deliverables: Deliverable[];
  timeline: Timeline[];
  budget?: number;
  examples: string[];
  restrictions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentRequirement {
  type: ContentType;
  platform: ContentPlatform;
  quantity: number;
  specifications: {
    minDuration?: number;
    maxDuration?: number;
    aspectRatio?: string;
    resolution?: string;
    format?: string[];
  };
}

export interface BrandGuideline {
  type: 'visual' | 'tone' | 'messaging' | 'legal';
  description: string;
  examples?: string[];
  doNots?: string[];
}

export interface Deliverable {
  id: string;
  name: string;
  type: ContentType;
  platform: ContentPlatform;
  dueDate: Date;
  status: DeliverableStatus;
  contentId?: string;
}

export interface Timeline {
  phase: string;
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  date: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface ContentTemplate {
  id: string;
  name: string;
  category: string;
  platform: ContentPlatform;
  type: ContentType;
  structure: {
    sections: TemplateSection[];
    placeholders: TemplatePlaceholder[];
  };
  thumbnailUrl?: string;
  usageCount: number;
  rating: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateSection {
  id: string;
  type: 'intro' | 'body' | 'cta' | 'outro';
  content: string;
  duration?: number; // For video templates
  order: number;
}

export interface TemplatePlaceholder {
  id: string;
  name: string;
  type: 'text' | 'image' | 'video' | 'product';
  defaultValue?: string;
  required: boolean;
}

export interface ContentCalendar {
  id: string;
  campaignId?: string;
  influencerId?: string;
  month: number;
  year: number;
  entries: CalendarEntry[];
}

export interface CalendarEntry {
  date: Date;
  contents: Content[];
  status: 'empty' | 'scheduled' | 'published';
}

export type ContentType = 
  | 'post'
  | 'story'
  | 'reel'
  | 'video'
  | 'live'
  | 'blog'
  | 'tweet'
  | 'thread';

export type ContentPlatform = 
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'pinterest'
  | 'blog';

export type ContentStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected'
  | 'archived';

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export type GuidelineType = 
  | 'hashtag'
  | 'mention'
  | 'disclosure'
  | 'timing'
  | 'visual'
  | 'copy';

export type DeliverableStatus = 
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected';

export interface ContentFilter {
  campaignId?: string;
  influencerId?: string;
  type?: ContentType[];
  platform?: ContentPlatform[];
  status?: ContentStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface ContentAnalytics {
  contentId: string;
  metrics: ContentPerformance;
  trends: {
    daily: TrendData[];
    hourly: TrendData[];
  };
  demographics: {
    age: Record<string, number>;
    gender: Record<string, number>;
    location: Record<string, number>;
  };
  bestPerformingTime: string;
  engagementRate: number;
  roi: number;
}

export interface TrendData {
  timestamp: Date;
  value: number;
  metric: string;
}