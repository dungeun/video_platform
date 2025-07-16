/**
 * @repo/campaign-management - Helper Utilities
 */

import { format, formatDistanceToNow, addDays, differenceInDays } from 'date-fns';
import { 
  Campaign, 
  CampaignStatus, 
  Participant,
  ParticipantStatus,
  ContentStatus,
  Platform,
  ContentType,
  Money
} from '../types';

// ===== Status Helpers =====

export function getCampaignStatusColor(status: CampaignStatus): string {
  const colors: Record<CampaignStatus, string> = {
    [CampaignStatus.DRAFT]: '#6B7280',
    [CampaignStatus.PENDING]: '#F59E0B',
    [CampaignStatus.RECRUITING]: '#3B82F6',
    [CampaignStatus.ACTIVE]: '#10B981',
    [CampaignStatus.COMPLETED]: '#8B5CF6',
    [CampaignStatus.SETTLED]: '#059669',
    [CampaignStatus.CANCELLED]: '#EF4444',
    [CampaignStatus.PAUSED]: '#F97316'
  };
  
  return colors[status] || '#6B7280';
}

export function getCampaignStatusLabel(status: CampaignStatus): string {
  const labels: Record<CampaignStatus, string> = {
    [CampaignStatus.DRAFT]: 'Draft',
    [CampaignStatus.PENDING]: 'Pending Approval',
    [CampaignStatus.RECRUITING]: 'Recruiting',
    [CampaignStatus.ACTIVE]: 'Active',
    [CampaignStatus.COMPLETED]: 'Completed',
    [CampaignStatus.SETTLED]: 'Settled',
    [CampaignStatus.CANCELLED]: 'Cancelled',
    [CampaignStatus.PAUSED]: 'Paused'
  };
  
  return labels[status] || status;
}

export function getParticipantStatusColor(status: ParticipantStatus): string {
  const colors: Record<ParticipantStatus, string> = {
    [ParticipantStatus.APPLIED]: '#F59E0B',
    [ParticipantStatus.REVIEWING]: '#3B82F6',
    [ParticipantStatus.APPROVED]: '#10B981',
    [ParticipantStatus.REJECTED]: '#EF4444',
    [ParticipantStatus.ACTIVE]: '#10B981',
    [ParticipantStatus.COMPLETED]: '#8B5CF6',
    [ParticipantStatus.WITHDRAWN]: '#6B7280',
    [ParticipantStatus.REMOVED]: '#DC2626'
  };
  
  return colors[status] || '#6B7280';
}

export function getContentStatusColor(status: ContentStatus): string {
  const colors: Record<ContentStatus, string> = {
    [ContentStatus.NOT_STARTED]: '#6B7280',
    [ContentStatus.DRAFT]: '#F59E0B',
    [ContentStatus.SUBMITTED]: '#3B82F6',
    [ContentStatus.REVIEWING]: '#8B5CF6',
    [ContentStatus.APPROVED]: '#10B981',
    [ContentStatus.REJECTED]: '#EF4444',
    [ContentStatus.PUBLISHED]: '#059669',
    [ContentStatus.REMOVED]: '#DC2626'
  };
  
  return colors[status] || '#6B7280';
}

// ===== Platform Helpers =====

export function getPlatformIcon(platform: Platform): string {
  const icons: Record<Platform, string> = {
    [Platform.INSTAGRAM]: '📷',
    [Platform.YOUTUBE]: '📺',
    [Platform.TIKTOK]: '🎵',
    [Platform.TWITTER]: '🐦',
    [Platform.FACEBOOK]: '👤',
    [Platform.BLOG]: '📝',
    [Platform.OTHER]: '🌐'
  };
  
  return icons[platform] || '🌐';
}

export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    [Platform.INSTAGRAM]: 'Instagram',
    [Platform.YOUTUBE]: 'YouTube',
    [Platform.TIKTOK]: 'TikTok',
    [Platform.TWITTER]: 'Twitter',
    [Platform.FACEBOOK]: 'Facebook',
    [Platform.BLOG]: 'Blog',
    [Platform.OTHER]: 'Other'
  };
  
  return labels[platform] || platform;
}

// ===== Content Type Helpers =====

export function getContentTypeIcon(type: ContentType): string {
  const icons: Record<ContentType, string> = {
    [ContentType.POST]: '📸',
    [ContentType.STORY]: '⏱️',
    [ContentType.REEL]: '🎬',
    [ContentType.VIDEO]: '📹',
    [ContentType.LIVE]: '🔴',
    [ContentType.BLOG_POST]: '📄',
    [ContentType.REVIEW]: '⭐'
  };
  
  return icons[type] || '📄';
}

export function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    [ContentType.POST]: 'Post',
    [ContentType.STORY]: 'Story',
    [ContentType.REEL]: 'Reel',
    [ContentType.VIDEO]: 'Video',
    [ContentType.LIVE]: 'Live Stream',
    [ContentType.BLOG_POST]: 'Blog Post',
    [ContentType.REVIEW]: 'Review'
  };
  
  return labels[type] || type;
}

// ===== Date Helpers =====

export function formatCampaignDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

export function formatCampaignDateTime(date: Date): string {
  return format(date, 'MMM d, yyyy h:mm a');
}

export function getTimeRemaining(date: Date): string {
  const now = new Date();
  
  if (date < now) {
    return 'Expired';
  }
  
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getDaysRemaining(date: Date): number {
  return differenceInDays(date, new Date());
}

export function getCampaignDuration(start: Date, end: Date): string {
  const days = differenceInDays(end, start);
  
  if (days === 0) {
    return '1 day';
  } else if (days === 1) {
    return '1 day';
  } else if (days < 7) {
    return `${days} days`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
}

// ===== Money Helpers =====

export function formatMoney(money: Money): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return formatter.format(money.amount);
}

export function formatBudgetUtilization(allocated: number, total: number): string {
  if (total === 0) return '0%';
  
  const percentage = (allocated / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

// ===== Statistics Helpers =====

export function calculateEngagementRate(likes: number, comments: number, shares: number, followers: number): number {
  if (followers === 0) return 0;
  
  const totalEngagement = likes + comments + shares;
  return (totalEngagement / followers) * 100;
}

export function calculateAverageMetric(participants: Participant[], metricGetter: (p: Participant) => number): number {
  if (participants.length === 0) return 0;
  
  const total = participants.reduce((sum, p) => sum + metricGetter(p), 0);
  return total / participants.length;
}

export function calculateCompletionRate(participants: Participant[]): number {
  if (participants.length === 0) return 0;
  
  const completed = participants.filter(p => p.status === ParticipantStatus.COMPLETED).length;
  return (completed / participants.length) * 100;
}

// ===== Filter Helpers =====

export function filterActiveParticipants(participants: Participant[]): Participant[] {
  return participants.filter(p => 
    p.status === ParticipantStatus.APPROVED || 
    p.status === ParticipantStatus.ACTIVE ||
    p.status === ParticipantStatus.COMPLETED
  );
}

export function filterPendingContent(participants: Participant[]): number {
  return participants.reduce((count, p) => {
    const pending = p.content.filter(c => 
      c.status === ContentStatus.SUBMITTED || 
      c.status === ContentStatus.REVIEWING
    ).length;
    return count + pending;
  }, 0);
}

export function groupParticipantsByStatus(participants: Participant[]): Record<ParticipantStatus, Participant[]> {
  const grouped: Record<ParticipantStatus, Participant[]> = {
    [ParticipantStatus.APPLIED]: [],
    [ParticipantStatus.REVIEWING]: [],
    [ParticipantStatus.APPROVED]: [],
    [ParticipantStatus.REJECTED]: [],
    [ParticipantStatus.ACTIVE]: [],
    [ParticipantStatus.COMPLETED]: [],
    [ParticipantStatus.WITHDRAWN]: [],
    [ParticipantStatus.REMOVED]: []
  };
  
  participants.forEach(p => {
    grouped[p.status].push(p);
  });
  
  return grouped;
}

// ===== Validation Helpers =====

export function canEditCampaign(campaign: Campaign): boolean {
  return campaign.status === CampaignStatus.DRAFT || 
         campaign.status === CampaignStatus.PENDING;
}

export function canPublishCampaign(campaign: Campaign): boolean {
  return campaign.status === CampaignStatus.DRAFT && 
         !campaign.isDraft;
}

export function canPauseCampaign(campaign: Campaign): boolean {
  return campaign.status === CampaignStatus.RECRUITING || 
         campaign.status === CampaignStatus.ACTIVE;
}

export function canCancelCampaign(campaign: Campaign): boolean {
  return campaign.status !== CampaignStatus.COMPLETED && 
         campaign.status !== CampaignStatus.SETTLED &&
         campaign.status !== CampaignStatus.CANCELLED;
}

export function canSettleCampaign(campaign: Campaign): boolean {
  return campaign.status === CampaignStatus.COMPLETED;
}

// ===== Export Helpers =====

export function exportCampaignToCSV(campaign: Campaign, participants: Participant[]): string {
  const headers = [
    'Participant ID',
    'Status',
    'Applied At',
    'Budget',
    'Content Delivered',
    'Total Reach',
    'Total Engagement',
    'Engagement Rate'
  ];
  
  const rows = participants.map(p => [
    p.influencerId,
    p.status,
    formatCampaignDate(p.appliedAt),
    p.budget ? formatMoney(p.budget) : 'N/A',
    p.content.filter(c => c.status === ContentStatus.PUBLISHED).length,
    p.performance?.totalReach || 0,
    p.performance?.totalEngagement || 0,
    p.performance?.averageEngagementRate ? `${p.performance.averageEngagementRate.toFixed(2)}%` : 'N/A'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

// ===== Summary Helpers =====

export function generateCampaignSummary(campaign: Campaign): string {
  const phase = getCampaignPhase(campaign);
  const duration = getCampaignDuration(campaign.period.campaignStart, campaign.period.campaignEnd);
  const platforms = campaign.requirements.platforms.map(p => getPlatformLabel(p)).join(', ');
  
  return `${campaign.title} is a ${duration} campaign targeting ${platforms} influencers with ${campaign.requirements.minFollowers.toLocaleString()}+ followers. Currently ${phase}.`;
}

function getCampaignPhase(campaign: Campaign): string {
  const now = new Date();
  
  if (now < campaign.period.recruitStart) {
    return 'preparing to launch';
  } else if (now >= campaign.period.recruitStart && now < campaign.period.recruitEnd) {
    return 'recruiting influencers';
  } else if (now >= campaign.period.recruitEnd && now < campaign.period.campaignStart) {
    return 'preparing to start';
  } else if (now >= campaign.period.campaignStart && now < campaign.period.campaignEnd) {
    return 'actively running';
  } else {
    return 'completed';
  }
}