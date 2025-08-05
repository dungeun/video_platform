// Video platform type definitions
// Based on Campaign model extension for backward compatibility

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration?: number; // in seconds
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  isLive: boolean;
  status: 'processing' | 'published' | 'private' | 'deleted' | 'live';
  publishedAt?: string;
  tags: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
  
  // Channel information (transformed from business)
  channel: {
    id: string;
    name: string;
    handle?: string;
    avatarUrl?: string;
    subscriberCount?: number;
    isVerified?: boolean;
  };
  
  // Engagement stats
  commentCount?: number;
  shareCount?: number;
  
  // Live streaming specific
  streamKey?: string;
  rtmpUrl?: string;
  webrtcUrl?: string;
  hlsUrl?: string;
  viewerCount?: number; // for live streams
  peakViewers?: number;
  startedAt?: string;
  endedAt?: string;
}

export interface VideoCreateRequest {
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl?: string; // For VOD
  duration?: number;
  tags?: string[];
  category?: string;
  isLive?: boolean;
  status?: 'draft' | 'published' | 'private';
  
  // Live streaming fields
  streamKey?: string;
  isRecording?: boolean;
}

export interface VideoUpdateRequest extends Partial<VideoCreateRequest> {
  id: string;
}

export interface VideoListResponse {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  categoryStats?: Record<string, number>;
}

export interface VideoFilters {
  status?: string;
  category?: string;
  platform?: string;
  isLive?: boolean;
  channelId?: string;
  tags?: string[];
  search?: string;
  minViews?: number;
  maxViews?: number;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'latest' | 'oldest' | 'popular' | 'views' | 'likes' | 'duration';
  dateFrom?: string;
  dateTo?: string;
}

// Live streaming types
export interface LiveStream {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  streamKey: string;
  rtmpUrl: string;
  webrtcUrl?: string;
  hlsUrl?: string;
  status: 'preparing' | 'live' | 'ended';
  viewerCount: number;
  peakViewers: number;
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string; // VOD URL after stream ends
  isRecording: boolean;
  createdAt: string;
  updatedAt: string;
  
  channel: {
    id: string;
    name: string;
    handle?: string;
    avatarUrl?: string;
    subscriberCount?: number;
    isVerified?: boolean;
  };
}

export interface LiveStreamCreateRequest {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isRecording?: boolean;
  scheduledTime?: string;
}

// Channel types
export interface Channel {
  id: string;
  userId: string;
  name: string;
  handle: string;
  description?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  isVerified: boolean;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
}

// Comment types
export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  parentId?: string;
  likeCount: number;
  isPinned: boolean;
  isHearted: boolean;
  createdAt: string;
  updatedAt: string;
  
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  
  replies?: VideoComment[];
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  channelId: string;
  tier: 'free' | 'member' | 'premium';
  notificationsOn: boolean;
  createdAt: string;
  updatedAt: string;
  
  channel: Channel;
}

// Analytics types
export interface VideoAnalytics {
  videoId: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  watchTime: number; // total watch time in seconds
  averageWatchTime: number;
  retentionRate: number; // percentage
  clickThroughRate: number;
  
  // Demographic data
  viewsByCountry?: Record<string, number>;
  viewsByAge?: Record<string, number>;
  viewsByDevice?: Record<string, number>;
  
  // Time-based data
  viewsByHour?: Record<string, number>;
  viewsByDay?: Record<string, number>;
}

// Error types
export interface VideoError {
  code: string;
  message: string;
  details?: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: VideoError;
  message?: string;
}

// Utility types for transformations
export type CampaignToVideoTransform = {
  // Maps Campaign fields to Video fields
  id: string;
  businessId: string; // -> channel.id
  title: string;
  description: string;
  imageUrl?: string; // -> thumbnailUrl
  videoUrl?: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  isLive: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Business relation for channel info
  business: {
    id: string;
    name: string;
    businessProfile?: {
      companyName?: string;
    };
  };
};