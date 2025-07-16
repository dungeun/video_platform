import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import {
  YouTubeConfig,
  TokenResponse,
  YouTubeChannel,
  YouTubeVideo,
  VideoAnalytics,
  SchedulePostParams,
  ScheduledPost,
  AuthenticationError,
  APIError,
  SocialPlatform,
  VideoStats,
  TimeSeriesData,
  DemographicsData,
  TrafficSourceData
} from '../types';
import { TokenManager } from '../utils/token-manager';
import { RateLimiter } from '../utils/rate-limiter';

export class YouTubeService extends EventEmitter {
  private dataClient: AxiosInstance;
  private analyticsClient: AxiosInstance;
  private tokenManager: TokenManager;
  private rateLimiter: RateLimiter;
  private config: YouTubeConfig;

  constructor(config: YouTubeConfig) {
    super();
    this.config = config;
    this.tokenManager = new TokenManager('youtube');
    this.rateLimiter = new RateLimiter(config.rateLimit || {
      quotaPerDay: 10000,
      requestsPerSecond: 10,
      maxRequests: 10,
      windowMs: 1000
    });

    // YouTube Data API v3
    this.dataClient = axios.create({
      baseURL: 'https://www.googleapis.com/youtube/v3',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // YouTube Analytics API
    this.analyticsClient = axios.create({
      baseURL: 'https://youtubeanalytics.googleapis.com/v2',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    const interceptor = async (config: any) => {
      await this.rateLimiter.checkLimit();
      
      // Add API key if no auth token
      if (!config.headers.Authorization && this.config.apiKey) {
        config.params = {
          ...config.params,
          key: this.config.apiKey
        };
      }
      
      return config;
    };

    const errorHandler = async (error: any) => {
      if (error.response?.status === 401 && error.config.userId) {
        const refreshed = await this.refreshToken(error.config.userId);
        if (refreshed) {
          error.config.headers.Authorization = `Bearer ${refreshed.accessToken}`;
          return axios(error.config);
        }
      }

      throw new APIError(
        error.response?.data?.error?.message || error.message,
        error.response?.status,
        SocialPlatform.YOUTUBE
      );
    };

    this.dataClient.interceptors.request.use(interceptor);
    this.dataClient.interceptors.response.use((res) => res, errorHandler);
    
    this.analyticsClient.interceptors.request.use(interceptor);
    this.analyticsClient.interceptors.response.use((res) => res, errorHandler);
  }

  // OAuth Methods
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri || '',
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/yt-analytics.readonly'
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code'
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
        scope: response.data.scope?.split(' ')
      };
    } catch (error: any) {
      throw new AuthenticationError(
        `Failed to handle OAuth callback: ${error.message}`,
        SocialPlatform.YOUTUBE
      );
    }
  }

  async refreshToken(userId: string): Promise<TokenResponse | null> {
    try {
      const currentToken = await this.tokenManager.getToken(userId);
      if (!currentToken?.refreshToken) return null;

      const response = await axios.post('https://oauth2.googleapis.com/token', {
        refresh_token: currentToken.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token'
      });

      const newToken: TokenResponse = {
        accessToken: response.data.access_token,
        refreshToken: currentToken.refreshToken,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type
      };

      await this.tokenManager.saveToken(userId, newToken);
      return newToken;
    } catch (error) {
      console.error('Failed to refresh YouTube token:', error);
      return null;
    }
  }

  // Channel Methods
  async getChannel(userId: string, channelId?: string): Promise<YouTubeChannel> {
    const token = await this.tokenManager.getToken(userId);
    const headers = token ? { Authorization: `Bearer ${token.accessToken}`, userId } : { userId };

    const params: any = {
      part: 'snippet,statistics,brandingSettings',
      maxResults: 1
    };

    if (channelId) {
      params.id = channelId;
    } else if (token) {
      params.mine = true;
    } else {
      throw new AuthenticationError('No token or channel ID provided', SocialPlatform.YOUTUBE);
    }

    const response = await this.dataClient.get('/channels', { params, headers });
    const channel = response.data.items[0];

    if (!channel) {
      throw new APIError('Channel not found', 404, SocialPlatform.YOUTUBE);
    }

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnails: channel.snippet.thumbnails,
      statistics: {
        viewCount: parseInt(channel.statistics.viewCount),
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount
      },
      brandingSettings: channel.brandingSettings
    };
  }

  async getChannelStats(params: { channelId: string }): Promise<any> {
    const response = await this.dataClient.get('/channels', {
      params: {
        part: 'statistics',
        id: params.channelId
      }
    });

    const channel = response.data.items[0];
    if (!channel) {
      throw new APIError('Channel not found', 404, SocialPlatform.YOUTUBE);
    }

    return channel.statistics;
  }

  // Video Methods
  async getVideos(params: {
    channelId?: string;
    userId?: string;
    maxResults?: number;
    pageToken?: string;
  }): Promise<YouTubeVideo[]> {
    const searchParams: any = {
      part: 'snippet',
      type: 'video',
      maxResults: params.maxResults || 25,
      pageToken: params.pageToken,
      order: 'date'
    };

    const headers: any = {};

    if (params.channelId) {
      searchParams.channelId = params.channelId;
    } else if (params.userId) {
      const token = await this.tokenManager.getToken(params.userId);
      if (!token) {
        throw new AuthenticationError('No YouTube token found', SocialPlatform.YOUTUBE);
      }
      searchParams.forMine = true;
      headers.Authorization = `Bearer ${token.accessToken}`;
      headers.userId = params.userId;
    }

    // Get video IDs
    const searchResponse = await this.dataClient.get('/search', {
      params: searchParams,
      headers
    });

    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');

    // Get detailed video info
    const videosResponse = await this.dataClient.get('/videos', {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoIds
      },
      headers
    });

    return videosResponse.data.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnails: video.snippet.thumbnails,
      publishedAt: new Date(video.snippet.publishedAt),
      duration: video.contentDetails.duration,
      statistics: {
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        dislikeCount: video.statistics.dislikeCount ? parseInt(video.statistics.dislikeCount) : undefined,
        commentCount: parseInt(video.statistics.commentCount || 0),
        favoriteCount: parseInt(video.statistics.favoriteCount || 0)
      },
      tags: video.snippet.tags,
      categoryId: video.snippet.categoryId
    }));
  }

  async getVideoAnalytics(videoId: string, userId: string): Promise<VideoAnalytics> {
    const token = await this.tokenManager.getToken(userId);
    if (!token) {
      throw new AuthenticationError('No YouTube token found', SocialPlatform.YOUTUBE);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const response = await this.analyticsClient.get('/reports', {
      params: {
        ids: 'channel==MINE',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        metrics: 'views,estimatedMinutesWatched,averageViewDuration',
        dimensions: 'day',
        filters: `video==${videoId}`
      },
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        userId
      }
    });

    // Process analytics data
    const rows = response.data.rows || [];
    const views: TimeSeriesData[] = [];
    const watchTime: TimeSeriesData[] = [];
    let totalDuration = 0;
    let totalViews = 0;

    rows.forEach((row: any) => {
      const date = new Date(row[0]);
      views.push({ date, value: row[1] });
      watchTime.push({ date, value: row[2] });
      totalDuration += row[3];
      totalViews += row[1];
    });

    return {
      views,
      watchTime,
      averageViewDuration: totalViews > 0 ? totalDuration / totalViews : 0,
      audienceRetention: [],
      demographics: {
        ageGroups: [],
        gender: [],
        countries: []
      },
      trafficSources: []
    };
  }

  // Scheduling Methods
  async scheduleVideo(params: SchedulePostParams): Promise<ScheduledPost> {
    // YouTube doesn't have direct scheduling via API
    // This would integrate with YouTube Studio or a scheduling service
    const scheduledPost: ScheduledPost = {
      id: `yt_scheduled_${Date.now()}`,
      userId: params.userId,
      platform: SocialPlatform.YOUTUBE,
      content: params.content,
      scheduledTime: params.scheduledTime,
      status: 'pending' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.emit('video:scheduled', scheduledPost);
    return scheduledPost;
  }

  async uploadVideo(params: {
    userId: string;
    videoFile: Buffer;
    metadata: {
      title: string;
      description: string;
      tags?: string[];
      categoryId?: string;
      privacy?: 'private' | 'unlisted' | 'public';
    };
  }): Promise<string> {
    const token = await this.tokenManager.getToken(params.userId);
    if (!token) {
      throw new AuthenticationError('No YouTube token found', SocialPlatform.YOUTUBE);
    }

    // This is a simplified version - actual implementation would use resumable upload
    const response = await this.dataClient.post('/videos', {
      snippet: {
        title: params.metadata.title,
        description: params.metadata.description,
        tags: params.metadata.tags,
        categoryId: params.metadata.categoryId || '22'
      },
      status: {
        privacyStatus: params.metadata.privacy || 'private'
      }
    }, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        userId: params.userId
      },
      params: {
        part: 'snippet,status',
        uploadType: 'multipart'
      }
    });

    return response.data.id;
  }

  // Update video
  async updateVideo(videoId: string, userId: string, updates: any): Promise<YouTubeVideo> {
    const token = await this.tokenManager.getToken(userId);
    if (!token) {
      throw new AuthenticationError('No YouTube token found', SocialPlatform.YOUTUBE);
    }

    await this.dataClient.put('/videos', {
      id: videoId,
      ...updates
    }, {
      params: {
        part: Object.keys(updates).join(',')
      },
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        userId
      }
    });

    // Return updated video
    const videos = await this.getVideos({ userId });
    return videos.find(v => v.id === videoId)!;
  }

  // Comments
  async getComments(videoId: string, maxResults: number = 100): Promise<any[]> {
    const response = await this.dataClient.get('/commentThreads', {
      params: {
        part: 'snippet,replies',
        videoId,
        maxResults,
        order: 'time'
      }
    });

    return response.data.items;
  }

  // Webhook handling
  async handleWebhookEvent(event: any): Promise<void> {
    this.emit('webhook:event', event);
  }
}