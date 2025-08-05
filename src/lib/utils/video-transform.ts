// Utility functions for transforming Campaign data to Video format
// Maintains backward compatibility while providing video-specific features

import { Video, VideoListResponse, CampaignToVideoTransform } from '@/lib/types/video';

/**
 * Transforms Campaign data to Video format
 * Handles the mapping between legacy Campaign model and new Video interface
 */
export function transformCampaignToVideo(campaign: CampaignToVideoTransform): Video {
  // Generate channel handle from company name or user name
  const channelName = campaign.business.businessProfile?.companyName || campaign.business.name;
  const handle = generateChannelHandle(channelName);
  
  // Map status from Campaign to Video
  const videoStatus = mapCampaignStatusToVideo(campaign.status, campaign.isLive);
  
  // Parse tags from hashtags field (if it exists)
  const tags = parseHashtags(campaign.description);
  
  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    thumbnailUrl: campaign.imageUrl || '/images/videos/default-thumbnail.jpg',
    videoUrl: campaign.videoUrl || '',
    duration: campaign.duration,
    viewCount: campaign.viewCount,
    likeCount: campaign.likeCount || 0,
    dislikeCount: campaign.dislikeCount || 0,
    isLive: campaign.isLive,
    status: videoStatus,
    publishedAt: videoStatus === 'published' ? campaign.createdAt.toISOString() : undefined,
    tags,
    category: 'general', // Default category, can be mapped from business category
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    
    channel: {
      id: campaign.businessId,
      name: channelName,
      handle,
      avatarUrl: undefined, // Can be added later from user profile
      subscriberCount: 0, // Will be calculated from subscriptions
      isVerified: false, // Can be added later from business verification
    },
    
    commentCount: 0, // Will be calculated from comments
    shareCount: 0,
  };
}

/**
 * Maps Campaign status to Video status
 */
function mapCampaignStatusToVideo(
  campaignStatus: string, 
  isLive: boolean
): Video['status'] {
  if (isLive) return 'live';
  
  switch (campaignStatus.toUpperCase()) {
    case 'ACTIVE':
      return 'published';
    case 'DRAFT':
      return 'private';
    case 'PAUSED':
      return 'private';
    case 'COMPLETED':
      return 'published';
    default:
      return 'processing';
  }
}

/**
 * Generates a channel handle from channel name
 */
function generateChannelHandle(name: string): string {
  return '@' + name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '')
    .substring(0, 20);
}

/**
 * Extracts hashtags from description text
 */
function parseHashtags(description: string): string[] {
  if (!description) return [];
  
  const hashtagRegex = /#[\w가-힣]+/g;
  const matches = description.match(hashtagRegex);
  
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Transforms array of campaigns to video list response
 */
export function transformCampaignListToVideoResponse(
  campaigns: CampaignToVideoTransform[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  categoryStats?: Record<string, number>
): VideoListResponse {
  const videos = campaigns.map(transformCampaignToVideo);
  
  return {
    videos,
    pagination,
    categoryStats,
  };
}

/**
 * Validates if a campaign can be treated as a video
 */
export function isValidVideoCampaign(campaign: any): boolean {
  // Must have either videoUrl for VOD or be a live stream
  return !!(campaign.videoUrl || campaign.isLive);
}

/**
 * Builds video-specific database query filters
 */
export function buildVideoQueryFilters(filters: {
  status?: string;
  category?: string;
  platform?: string;
  isLive?: boolean;
  channelId?: string;
}) {
  const where: any = {};
  
  // Basic video filter - must have video content
  where.OR = [
    { videoUrl: { not: null } },
    { isLive: true }
  ];
  
  // Status mapping
  if (filters.status) {
    switch (filters.status.toLowerCase()) {
      case 'published':
        where.status = 'ACTIVE';
        break;
      case 'private':
        where.status = { in: ['DRAFT', 'PAUSED'] };
        break;
      case 'live':
        where.isLive = true;
        break;
      default:
        where.status = filters.status.toUpperCase();
    }
  } else {
    // Default to published videos only
    where.status = 'ACTIVE';
  }
  
  // Live stream filter
  if (filters.isLive !== undefined) {
    where.isLive = filters.isLive;
  }
  
  // Channel filter
  if (filters.channelId) {
    where.businessId = filters.channelId;
  }
  
  // Platform filter (if needed for backward compatibility)
  if (filters.platform && filters.platform !== 'all') {
    where.platform = filters.platform.toUpperCase();
  }
  
  // Category filter (mapped to business category)
  if (filters.category && filters.category !== 'all') {
    where.business = {
      businessProfile: {
        businessCategory: filters.category
      }
    };
  }
  
  return where;
}

/**
 * Transforms video creation request to campaign data
 */
export function transformVideoRequestToCampaign(
  videoData: {
    title: string;
    description: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    duration?: number;
    tags?: string[];
    category?: string;
    isLive?: boolean;
    status?: string;
  },
  userId: string
) {
  const campaignStatus = mapVideoStatusToCampaign(videoData.status || 'draft');
  
  return {
    businessId: userId,
    title: videoData.title,
    description: videoData.description,
    platform: 'YOUTUBE', // Default platform for videos
    budget: 0, // Not applicable for videos
    targetFollowers: 0, // Not applicable for videos
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    requirements: `Video content: ${videoData.title}`,
    hashtags: videoData.tags ? JSON.stringify(videoData.tags.map(tag => `#${tag}`)) : null,
    imageUrl: videoData.thumbnailUrl, // Maps to thumbnailUrl
    videoUrl: videoData.videoUrl,
    duration: videoData.duration,
    isLive: videoData.isLive || false,
    status: campaignStatus,
    isPaid: false,
    maxApplicants: 0, // Not applicable for videos
    rewardAmount: 0,
    location: '전국',
    likeCount: 0,
    dislikeCount: 0,
  };
}

/**
 * Maps video status to campaign status
 */
function mapVideoStatusToCampaign(videoStatus: string): string {
  switch (videoStatus.toLowerCase()) {
    case 'published':
      return 'ACTIVE';
    case 'private':
    case 'draft':
      return 'DRAFT';
    case 'processing':
      return 'DRAFT';
    default:
      return 'DRAFT';
  }
}

/**
 * Calculates video engagement metrics
 */
export function calculateVideoEngagement(video: Video): {
  engagementRate: number;
  likeRatio: number;
  viewsPerDay: number;
} {
  const totalEngagement = video.likeCount + video.dislikeCount + (video.commentCount || 0);
  const engagementRate = video.viewCount > 0 ? (totalEngagement / video.viewCount) * 100 : 0;
  
  const totalReactions = video.likeCount + video.dislikeCount;
  const likeRatio = totalReactions > 0 ? (video.likeCount / totalReactions) * 100 : 0;
  
  const daysSinceCreated = Math.max(1, Math.floor((Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  const viewsPerDay = video.viewCount / daysSinceCreated;
  
  return {
    engagementRate: Math.round(engagementRate * 100) / 100,
    likeRatio: Math.round(likeRatio * 100) / 100,
    viewsPerDay: Math.round(viewsPerDay),
  };
}

/**
 * Formats duration from seconds to human readable format
 */
export function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Formats view count to human readable format
 */
export function formatViewCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${Math.floor(count / 100) / 10}K`;
  if (count < 1000000000) return `${Math.floor(count / 100000) / 10}M`;
  return `${Math.floor(count / 100000000) / 10}B`;
}