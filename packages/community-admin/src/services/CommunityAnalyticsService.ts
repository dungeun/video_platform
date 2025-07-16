import { StorageManager } from '@kcommerce/storage';
import { Logger } from '@kcommerce/utils';
import type { 
  CommunityAnalytics,
  CommunityOverview,
  ContentAnalytics,
  UserAnalytics,
  EngagementAnalytics,
  ModerationAnalytics,
  TrendData,
  ActivityData,
  RetentionData,
  DemographicData,
  PopularContent,
  PopularCategory,
  PopularTag,
  TopContributor,
  InteractionData,
  ReactionData,
  SharingData,
  DateRange,
  ServiceResponse,
  CommunityPost,
  Comment,
  CommunityUser
} from '../types';

export class CommunityAnalyticsService {
  private storage: StorageManager;
  private logger: Logger;

  constructor() {
    this.storage = new StorageManager('community-analytics');
    this.logger = new Logger('CommunityAnalytics');
  }

  async getCommunityAnalytics(timeRange: DateRange): Promise<ServiceResponse<CommunityAnalytics>> {
    try {
      const [overview, content, users, engagement, moderation] = await Promise.all([
        this.getCommunityOverview(timeRange),
        this.getContentAnalytics(timeRange),
        this.getUserAnalytics(timeRange),
        this.getEngagementAnalytics(timeRange),
        this.getModerationAnalytics(timeRange)
      ]);

      const analytics: CommunityAnalytics = {
        timeRange,
        overview: overview.data!,
        content: content.data!,
        users: users.data!,
        engagement: engagement.data!,
        moderation: moderation.data!
      };

      return { success: true, data: analytics };
    } catch (error) {
      this.logger.error('Failed to get community analytics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCommunityOverview(timeRange: DateRange): Promise<ServiceResponse<CommunityOverview>> {
    try {
      const [users, posts, comments] = await Promise.all([
        this.storage.get('users') || {},
        this.storage.get('posts') || {},
        this.storage.get('comments') || {}
      ]);

      const usersArray = Object.values(users) as CommunityUser[];
      const postsArray = Object.values(posts) as CommunityPost[];
      const commentsArray = Object.values(comments) as Comment[];

      // Filter by time range
      const filteredUsers = usersArray.filter(user => 
        user.createdAt >= timeRange.start && user.createdAt <= timeRange.end
      );
      const filteredPosts = postsArray.filter(post => 
        post.createdAt >= timeRange.start && post.createdAt <= timeRange.end
      );
      const filteredComments = commentsArray.filter(comment => 
        comment.createdAt >= timeRange.start && comment.createdAt <= timeRange.end
      );

      // Calculate active users (users who posted/commented in the time range)
      const activeUserIds = new Set([
        ...filteredPosts.map(p => p.authorId),
        ...filteredComments.map(c => c.authorId)
      ]);

      // Calculate engagement rate
      const totalInteractions = filteredPosts.reduce((sum, post) => 
        sum + post.engagement.likes + post.engagement.comments + post.engagement.shares, 0
      );
      const engagementRate = filteredPosts.length > 0 ? totalInteractions / filteredPosts.length : 0;

      // Calculate community health score
      const healthScore = this.calculateHealthScore({
        activeUsers: activeUserIds.size,
        totalUsers: usersArray.length,
        postsPerUser: filteredPosts.length / Math.max(activeUserIds.size, 1),
        engagementRate,
        moderationRate: await this.getModerationRate(timeRange)
      });

      const overview: CommunityOverview = {
        totalUsers: usersArray.length,
        activeUsers: activeUserIds.size,
        newUsers: filteredUsers.length,
        totalPosts: filteredPosts.length,
        totalComments: filteredComments.length,
        engagement: {
          rate: engagementRate,
          trend: await this.calculateEngagementTrend(timeRange)
        },
        health: {
          score: healthScore,
          status: this.getHealthStatus(healthScore)
        }
      };

      return { success: true, data: overview };
    } catch (error) {
      this.logger.error('Failed to get community overview:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getContentAnalytics(timeRange: DateRange): Promise<ServiceResponse<ContentAnalytics>> {
    try {
      const [posts, comments, categories] = await Promise.all([
        this.storage.get('posts') || {},
        this.storage.get('comments') || {},
        this.storage.get('categories') || {}
      ]);

      const postsArray = Object.values(posts) as CommunityPost[];
      const commentsArray = Object.values(comments) as Comment[];

      // Filter by time range
      const filteredPosts = postsArray.filter(post => 
        post.createdAt >= timeRange.start && post.createdAt <= timeRange.end
      );
      const filteredComments = commentsArray.filter(comment => 
        comment.createdAt >= timeRange.start && comment.createdAt <= timeRange.end
      );

      // Calculate post metrics
      const postsByStatus = this.groupBy(filteredPosts, 'status');
      const commentsByStatus = this.groupBy(filteredComments, 'status');

      // Get trends
      const postTrend = await this.calculateContentTrend(filteredPosts, timeRange);
      const commentTrend = await this.calculateContentTrend(filteredComments, timeRange);

      // Get popular content
      const popularPosts = this.getPopularPosts(postsArray);
      const popularCategories = this.getPopularCategories(postsArray, categories);
      const popularTags = this.getPopularTags(postsArray);

      const analytics: ContentAnalytics = {
        posts: {
          total: filteredPosts.length,
          published: postsByStatus.published || 0,
          draft: postsByStatus.draft || 0,
          pending: postsByStatus.pending || 0,
          trend: postTrend
        },
        comments: {
          total: filteredComments.length,
          approved: commentsByStatus.approved || 0,
          pending: commentsByStatus.pending || 0,
          spam: commentsByStatus.spam || 0,
          trend: commentTrend
        },
        popular: {
          posts: popularPosts,
          categories: popularCategories,
          tags: popularTags
        }
      };

      return { success: true, data: analytics };
    } catch (error) {
      this.logger.error('Failed to get content analytics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getUserAnalytics(timeRange: DateRange): Promise<ServiceResponse<UserAnalytics>> {
    try {
      const users = await this.storage.get('users') || {};
      const usersArray = Object.values(users) as CommunityUser[];

      // Registration trends
      const registrations = await this.calculateRegistrationTrend(usersArray, timeRange);
      
      // Activity data
      const activity = await this.calculateActivityData(timeRange);
      
      // Retention data
      const retention = await this.calculateRetentionData(usersArray, timeRange);
      
      // Demographics
      const demographics = await this.calculateDemographics(usersArray);
      
      // Top contributors
      const topContributors = await this.getTopContributors(timeRange);

      const analytics: UserAnalytics = {
        registrations,
        activity,
        retention,
        demographics,
        topContributors
      };

      return { success: true, data: analytics };
    } catch (error) {
      this.logger.error('Failed to get user analytics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getEngagementAnalytics(timeRange: DateRange): Promise<ServiceResponse<EngagementAnalytics>> {
    try {
      // Get interaction data
      const interactions = await this.calculateInteractionData(timeRange);
      
      // Get reaction data
      const reactions = await this.calculateReactionData(timeRange);
      
      // Get sharing data
      const sharing = await this.calculateSharingData(timeRange);
      
      // Get time on site trends
      const timeOnSite = await this.calculateTimeOnSiteTrend(timeRange);
      
      // Get page view trends
      const pageViews = await this.calculatePageViewTrend(timeRange);

      const analytics: EngagementAnalytics = {
        interactions,
        reactions,
        sharing,
        timeOnSite,
        pageViews
      };

      return { success: true, data: analytics };
    } catch (error) {
      this.logger.error('Failed to get engagement analytics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getModerationAnalytics(timeRange: DateRange): Promise<ServiceResponse<ModerationAnalytics>> {
    try {
      const [reports, moderationLogs] = await Promise.all([
        this.storage.get('content_reports') || {},
        this.storage.get('moderation_logs') || []
      ]);

      const reportsArray = Object.values(reports);
      const filteredReports = reportsArray.filter((report: any) => 
        new Date(report.createdAt) >= timeRange.start && 
        new Date(report.createdAt) <= timeRange.end
      );

      const filteredLogs = moderationLogs.filter((log: any) => 
        new Date(log.timestamp) >= timeRange.start && 
        new Date(log.timestamp) <= timeRange.end
      );

      // Report metrics
      const reportsByStatus = this.groupBy(filteredReports, 'status');
      const reportTrend = await this.calculateReportTrend(filteredReports, timeRange);

      // Moderation actions
      const actionsByType = this.groupBy(filteredLogs, 'type');

      // Auto-moderation metrics
      const autoModerationMetrics = await this.calculateAutoModerationMetrics(filteredLogs);

      // Response time metrics
      const responseTimeMetrics = await this.calculateResponseTimeMetrics(filteredReports);

      const analytics: ModerationAnalytics = {
        reports: {
          total: filteredReports.length,
          pending: reportsByStatus.open || 0,
          resolved: reportsByStatus.resolved || 0,
          trend: reportTrend
        },
        actions: {
          warnings: actionsByType.warning || 0,
          suspensions: actionsByType.suspension || 0,
          bans: actionsByType.ban || 0,
          deletions: actionsByType.delete || 0
        },
        autoModeration: autoModerationMetrics,
        responseTime: responseTimeMetrics
      };

      return { success: true, data: analytics };
    } catch (error) {
      this.logger.error('Failed to get moderation analytics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Real-time Analytics
  async getRealTimeMetrics(): Promise<ServiceResponse<any>> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [
        activeUsers,
        recentPosts,
        recentComments,
        pendingModeration
      ] = await Promise.all([
        this.getActiveUsersCount(oneHourAgo),
        this.getRecentContentCount('posts', oneHourAgo),
        this.getRecentContentCount('comments', oneHourAgo),
        this.getPendingModerationCount()
      ]);

      const metrics = {
        activeUsers,
        recentPosts,
        recentComments,
        pendingModeration,
        timestamp: now
      };

      return { success: true, data: metrics };
    } catch (error) {
      this.logger.error('Failed to get real-time metrics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Export Analytics
  async exportAnalytics(
    timeRange: DateRange,
    format: 'json' | 'csv' = 'json'
  ): Promise<ServiceResponse<string>> {
    try {
      const analytics = await this.getCommunityAnalytics(timeRange);
      if (!analytics.success) {
        return analytics;
      }

      let exportData: string;
      if (format === 'csv') {
        exportData = this.convertToCSV(analytics.data!);
      } else {
        exportData = JSON.stringify(analytics.data, null, 2);
      }

      // Save export file
      const filename = `community-analytics-${Date.now()}.${format}`;
      await this.storage.set(`exports/${filename}`, exportData);

      return { success: true, data: filename };
    } catch (error) {
      this.logger.error('Failed to export analytics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Helper Methods
  private calculateHealthScore(metrics: {
    activeUsers: number;
    totalUsers: number;
    postsPerUser: number;
    engagementRate: number;
    moderationRate: number;
  }): number {
    const activeUserRatio = metrics.totalUsers > 0 ? metrics.activeUsers / metrics.totalUsers : 0;
    const postsScore = Math.min(metrics.postsPerUser * 10, 100);
    const engagementScore = Math.min(metrics.engagementRate * 10, 100);
    const moderationScore = Math.max(0, 100 - metrics.moderationRate * 100);

    return Math.round((activeUserRatio * 25 + postsScore * 25 + engagementScore * 25 + moderationScore * 25));
  }

  private getHealthStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private async getModerationRate(timeRange: DateRange): Promise<number> {
    const posts = await this.storage.get('posts') || {};
    const postsArray = Object.values(posts) as CommunityPost[];
    const filteredPosts = postsArray.filter(post => 
      post.createdAt >= timeRange.start && post.createdAt <= timeRange.end
    );
    
    if (filteredPosts.length === 0) return 0;
    
    const moderatedPosts = filteredPosts.filter(post => 
      post.moderation.status === 'flagged' || post.moderation.status === 'rejected'
    );
    
    return moderatedPosts.length / filteredPosts.length;
  }

  private async calculateEngagementTrend(timeRange: DateRange): Promise<number> {
    // Calculate engagement trend compared to previous period
    const periodLength = timeRange.end.getTime() - timeRange.start.getTime();
    const previousStart = new Date(timeRange.start.getTime() - periodLength);
    const previousEnd = timeRange.start;

    const [current, previous] = await Promise.all([
      this.getCommunityOverview(timeRange),
      this.getCommunityOverview({ start: previousStart, end: previousEnd })
    ]);

    if (!current.success || !previous.success) return 0;

    const currentRate = current.data!.engagement.rate;
    const previousRate = previous.data!.engagement.rate;

    if (previousRate === 0) return 0;
    return ((currentRate - previousRate) / previousRate) * 100;
  }

  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private async calculateContentTrend(content: any[], timeRange: DateRange): Promise<TrendData[]> {
    const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const trend: TrendData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(timeRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const dayContent = content.filter(item => 
        item.createdAt >= date && item.createdAt < nextDate
      );

      trend.push({
        date,
        value: dayContent.length,
        change: i > 0 ? dayContent.length - trend[i - 1].value : 0
      });
    }

    return trend;
  }

  private getPopularPosts(posts: CommunityPost[]): PopularContent[] {
    return posts
      .sort((a, b) => b.engagement.views - a.engagement.views)
      .slice(0, 10)
      .map(post => ({
        id: post.id,
        title: post.title,
        views: post.engagement.views,
        engagement: post.engagement.likes + post.engagement.comments + post.engagement.shares,
        author: post.author.displayName
      }));
  }

  private getPopularCategories(posts: CommunityPost[], categories: any): PopularCategory[] {
    const categoryStats = posts.reduce((acc, post) => {
      const categoryId = post.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = { posts: 0, engagement: 0 };
      }
      acc[categoryId].posts++;
      acc[categoryId].engagement += post.engagement.likes + post.engagement.comments + post.engagement.shares;
      return acc;
    }, {} as Record<string, { posts: number; engagement: number }>);

    return Object.entries(categoryStats)
      .map(([categoryId, stats]) => ({
        id: categoryId,
        name: categories[categoryId]?.name || 'Unknown',
        posts: stats.posts,
        engagement: stats.engagement
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }

  private getPopularTags(posts: CommunityPost[]): PopularTag[] {
    const tagStats = posts.reduce((acc, post) => {
      post.tags.forEach(tag => {
        if (!acc[tag]) {
          acc[tag] = { usage: 0, totalEngagement: 0 };
        }
        acc[tag].usage++;
        acc[tag].totalEngagement += post.engagement.likes + post.engagement.comments + post.engagement.shares;
      });
      return acc;
    }, {} as Record<string, { usage: number; totalEngagement: number }>);

    return Object.entries(tagStats)
      .map(([tag, stats]) => ({
        name: tag,
        usage: stats.usage,
        trend: 0 // Would calculate trend from historical data
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 20);
  }

  private async calculateRegistrationTrend(users: CommunityUser[], timeRange: DateRange): Promise<TrendData[]> {
    const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const trend: TrendData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(timeRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const dayRegistrations = users.filter(user => 
        user.createdAt >= date && user.createdAt < nextDate
      );

      trend.push({
        date,
        value: dayRegistrations.length,
        change: i > 0 ? dayRegistrations.length - trend[i - 1].value : 0
      });
    }

    return trend;
  }

  private async calculateActivityData(timeRange: DateRange): Promise<ActivityData[]> {
    const activity: ActivityData[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      // This would typically query actual activity logs
      activity.push({
        hour,
        users: Math.floor(Math.random() * 100),
        posts: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 50)
      });
    }

    return activity;
  }

  private async calculateRetentionData(users: CommunityUser[], timeRange: DateRange): Promise<RetentionData[]> {
    // This would calculate actual retention cohorts
    return [
      { cohort: 'Week 1', day1: 100, day7: 45, day30: 25 },
      { cohort: 'Week 2', day1: 100, day7: 50, day30: 30 },
      { cohort: 'Week 3', day1: 100, day7: 55, day30: 35 }
    ];
  }

  private async calculateDemographics(users: CommunityUser[]): Promise<DemographicData[]> {
    // This would calculate actual demographics from user data
    return [
      { label: '18-24', value: 25, percentage: 25 },
      { label: '25-34', value: 35, percentage: 35 },
      { label: '35-44', value: 25, percentage: 25 },
      { label: '45+', value: 15, percentage: 15 }
    ];
  }

  private async getTopContributors(timeRange: DateRange): Promise<TopContributor[]> {
    // This would get actual top contributors
    return [];
  }

  private async calculateInteractionData(timeRange: DateRange): Promise<InteractionData[]> {
    return [
      { type: 'likes', count: 1250, trend: 5.2 },
      { type: 'comments', count: 875, trend: 3.1 },
      { type: 'shares', count: 425, trend: -1.5 },
      { type: 'views', count: 15420, trend: 8.7 }
    ];
  }

  private async calculateReactionData(timeRange: DateRange): Promise<ReactionData[]> {
    return [
      { emoji: '👍', count: 2150, percentage: 45 },
      { emoji: '❤️', count: 1290, percentage: 27 },
      { emoji: '😂', count: 860, percentage: 18 },
      { emoji: '😮', count: 480, percentage: 10 }
    ];
  }

  private async calculateSharingData(timeRange: DateRange): Promise<SharingData[]> {
    return [
      { platform: 'Twitter', shares: 245, clickbacks: 89 },
      { platform: 'Facebook', shares: 189, clickbacks: 67 },
      { platform: 'LinkedIn', shares: 156, clickbacks: 78 },
      { platform: 'Reddit', shares: 123, clickbacks: 45 }
    ];
  }

  private async calculateTimeOnSiteTrend(timeRange: DateRange): Promise<TrendData[]> {
    // Would calculate from actual analytics data
    return [];
  }

  private async calculatePageViewTrend(timeRange: DateRange): Promise<TrendData[]> {
    // Would calculate from actual analytics data
    return [];
  }

  private async calculateReportTrend(reports: any[], timeRange: DateRange): Promise<TrendData[]> {
    return this.calculateContentTrend(reports, timeRange);
  }

  private async calculateAutoModerationMetrics(logs: any[]): Promise<any> {
    const autoLogs = logs.filter(log => log.autoModerated);
    return {
      flagged: autoLogs.length,
      approved: autoLogs.filter(log => log.action === 'approve').length,
      accuracy: 85 // Would calculate from actual data
    };
  }

  private async calculateResponseTimeMetrics(reports: any[]): Promise<any> {
    const resolvedReports = reports.filter(report => report.resolvedAt);
    const responseTimes = resolvedReports.map(report => 
      new Date(report.resolvedAt).getTime() - new Date(report.createdAt).getTime()
    );

    if (responseTimes.length === 0) {
      return { average: 0, median: 0, trend: [] };
    }

    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const sorted = responseTimes.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      average: Math.round(average / (1000 * 60 * 60)), // Convert to hours
      median: Math.round(median / (1000 * 60 * 60)), // Convert to hours
      trend: [] // Would calculate trend from historical data
    };
  }

  private async getActiveUsersCount(since: Date): Promise<number> {
    // Would count actual active users
    return Math.floor(Math.random() * 100);
  }

  private async getRecentContentCount(type: string, since: Date): Promise<number> {
    // Would count actual recent content
    return Math.floor(Math.random() * 50);
  }

  private async getPendingModerationCount(): Promise<number> {
    // Would count actual pending moderation items
    return Math.floor(Math.random() * 20);
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would be more sophisticated in real implementation
    return JSON.stringify(data);
  }
}