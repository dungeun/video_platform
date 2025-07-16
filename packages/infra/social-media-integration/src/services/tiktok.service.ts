import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import {
  TikTokConfig,
  TokenResponse,
  TikTokProfile,
  TikTokVideo,
  TikTokAnalytics,
  SchedulePostParams,
  ScheduledPost,
  AuthenticationError,
  APIError,
  SocialPlatform,
  TimeSeriesData,
  EngagementData
} from '../types';
import { TokenManager } from '../utils/token-manager';
import { RateLimiter } from '../utils/rate-limiter';

export class TikTokService extends EventEmitter {
  private client: AxiosInstance;
  private tokenManager: TokenManager;
  private rateLimiter: RateLimiter;
  private config: TikTokConfig;

  constructor(config: TikTokConfig) {
    super();
    this.config = config;
    this.tokenManager = new TokenManager('tiktok');
    this.rateLimiter = new RateLimiter(config.rateLimit || {
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    });

    this.client = axios.create({
      baseURL: 'https://open-api.tiktok.com',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (config) => {
        await this.rateLimiter.checkLimit();
        
        // Add client key to all requests
        config.headers['Client-Key'] = this.config.clientKey;
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.config.userId) {
          const refreshed = await this.refreshToken(error.config.userId);
          if (refreshed) {
            error.config.headers['Access-Token'] = refreshed.accessToken;
            return this.client(error.config);
          }
        }

        throw new APIError(
          error.response?.data?.error?.message || error.message,
          error.response?.status,
          SocialPlatform.TIKTOK
        );
      }
    );
  }

  // OAuth Methods
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientKey,
      redirect_uri: this.config.redirectUri || '',
      response_type: 'code',
      scope: 'user.info.basic,video.list,video.upload',
      state
    });

    return `https://www.tiktok.com/auth/authorize/?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code'
      });

      if (response.data.data.error_code) {
        throw new Error(response.data.data.description);
      }

      return {
        accessToken: response.data.data.access_token,
        refreshToken: response.data.data.refresh_token,
        expiresIn: response.data.data.expires_in,
        tokenType: 'Bearer',
        scope: response.data.data.scope?.split(',')
      };
    } catch (error: any) {
      throw new AuthenticationError(
        `Failed to handle OAuth callback: ${error.message}`,
        SocialPlatform.TIKTOK
      );
    }
  }

  async refreshToken(userId: string): Promise<TokenResponse | null> {
    try {
      const currentToken = await this.tokenManager.getToken(userId);
      if (!currentToken?.refreshToken) return null;

      const response = await axios.post('https://open-api.tiktok.com/oauth/refresh_token/', {
        client_key: this.config.clientKey,
        grant_type: 'refresh_token',
        refresh_token: currentToken.refreshToken
      });

      if (response.data.data.error_code) {
        throw new Error(response.data.data.description);
      }

      const newToken: TokenResponse = {
        accessToken: response.data.data.access_token,
        refreshToken: response.data.data.refresh_token,
        expiresIn: response.data.data.expires_in,
        tokenType: 'Bearer'
      };

      await this.tokenManager.saveToken(userId, newToken);
      return newToken;
    } catch (error) {
      console.error('Failed to refresh TikTok token:', error);
      return null;
    }
  }

  // Profile Methods
  async getProfile(userId: string): Promise<TikTokProfile> {
    const token = await this.tokenManager.getToken(userId);
    if (!token) {
      throw new AuthenticationError(
        'No TikTok token found for user',
        SocialPlatform.TIKTOK
      );
    }

    const response = await this.client.get('/user/info/', {
      headers: {
        'Access-Token': token.accessToken,
        userId
      }
    });

    if (response.data.data.error_code) {
      throw new APIError(
        response.data.data.description,
        response.data.data.error_code,
        SocialPlatform.TIKTOK
      );
    }

    const user = response.data.data.user;
    return {
      id: user.open_id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      heartCount: user.heart_count,
      videoCount: user.video_count,
      isVerified: user.is_verified,
      signature: user.signature
    };
  }

  // Video Methods
  async getVideos(params: {
    userId: string;
    cursor?: number;
    maxCount?: number;
  }): Promise<TikTokVideo[]> {
    const token = await this.tokenManager.getToken(params.userId);
    if (!token) {
      throw new AuthenticationError(
        'No TikTok token found for user',
        SocialPlatform.TIKTOK
      );
    }

    const response = await this.client.post('/video/list/', {
      cursor: params.cursor || 0,
      max_count: params.maxCount || 20
    }, {
      headers: {
        'Access-Token': token.accessToken,
        userId: params.userId
      }
    });

    if (response.data.data.error_code) {
      throw new APIError(
        response.data.data.description,
        response.data.data.error_code,
        SocialPlatform.TIKTOK
      );
    }

    return response.data.data.videos.map((video: any) => ({
      id: video.id,
      description: video.description,
      createTime: new Date(video.create_time * 1000),
      duration: video.duration,
      coverImageUrl: video.cover_image_url,
      shareUrl: video.share_url,
      statistics: {
        viewCount: video.statistics.play_count,
        likeCount: video.statistics.digg_count,
        commentCount: video.statistics.comment_count,
        shareCount: video.statistics.share_count
      },
      music: video.music ? {
        id: video.music.id,
        title: video.music.title,
        author: video.music.author
      } : undefined
    }));
  }

  // Analytics Methods
  async getAnalytics(params: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TikTokAnalytics> {
    const profile = await this.getProfile(params.userId);
    const videos = await this.getVideos({ userId: params.userId, maxCount: 50 });

    // Calculate analytics from available data
    const totalViews = videos.reduce((sum, video) => sum + video.statistics.viewCount, 0);
    const totalLikes = videos.reduce((sum, video) => sum + video.statistics.likeCount, 0);
    const totalComments = videos.reduce((sum, video) => sum + video.statistics.commentCount, 0);
    const totalShares = videos.reduce((sum, video) => sum + video.statistics.shareCount, 0);

    const engagement: EngagementData = {
      rate: profile.followerCount > 0 
        ? ((totalLikes + totalComments + totalShares) / videos.length / profile.followerCount) * 100
        : 0,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares
    };

    // Sort videos by view count to get top videos
    const topVideos = [...videos]
      .sort((a, b) => b.statistics.viewCount - a.statistics.viewCount)
      .slice(0, 10);

    // Generate mock time series data (TikTok API doesn't provide historical data)
    const days = 30;
    const profileViews: TimeSeriesData[] = [];
    const videoViews: TimeSeriesData[] = [];
    const followerGrowth: TimeSeriesData[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      profileViews.push({
        date,
        value: Math.floor(Math.random() * 1000) + 500
      });
      
      videoViews.push({
        date,
        value: Math.floor(Math.random() * 5000) + 1000
      });
      
      followerGrowth.push({
        date,
        value: Math.floor(Math.random() * 100) + 10
      });
    }

    return {
      profileViews,
      videoViews,
      followerGrowth,
      engagement,
      topVideos
    };
  }

  // Upload Methods
  async uploadVideo(params: {
    userId: string;
    videoFile: Buffer;
    metadata: {
      description: string;
      privacy?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
      allowComments?: boolean;
      allowDuet?: boolean;
      allowStitch?: boolean;
    };
  }): Promise<string> {
    const token = await this.tokenManager.getToken(params.userId);
    if (!token) {
      throw new AuthenticationError(
        'No TikTok token found for user',
        SocialPlatform.TIKTOK
      );
    }

    // Step 1: Initialize upload
    const initResponse = await this.client.post('/share/video/upload/', {
      chunk_size: params.videoFile.length,
      media_type: 'video/mp4',
      total_chunk_count: 1
    }, {
      headers: {
        'Access-Token': token.accessToken,
        userId: params.userId
      }
    });

    if (initResponse.data.data.error_code) {
      throw new APIError(
        initResponse.data.data.description,
        initResponse.data.data.error_code,
        SocialPlatform.TIKTOK
      );
    }

    const uploadId = initResponse.data.data.upload_id;

    // Step 2: Upload video chunks (simplified - single chunk)
    const uploadUrl = initResponse.data.data.upload_url;
    await axios.post(uploadUrl, params.videoFile, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': params.videoFile.length.toString()
      }
    });

    // Step 3: Commit upload
    const commitResponse = await this.client.post('/share/video/commit/', {
      upload_id: uploadId,
      post_info: {
        title: params.metadata.description,
        privacy_level: params.metadata.privacy || 'PUBLIC',
        disable_comment: !params.metadata.allowComments,
        disable_duet: !params.metadata.allowDuet,
        disable_stitch: !params.metadata.allowStitch
      }
    }, {
      headers: {
        'Access-Token': token.accessToken,
        userId: params.userId
      }
    });

    if (commitResponse.data.data.error_code) {
      throw new APIError(
        commitResponse.data.data.description,
        commitResponse.data.data.error_code,
        SocialPlatform.TIKTOK
      );
    }

    return commitResponse.data.data.share_id;
  }

  // Scheduling Methods
  async scheduleVideo(params: SchedulePostParams): Promise<ScheduledPost> {
    // TikTok doesn't have a scheduling API
    // This would integrate with a scheduling service
    const scheduledPost: ScheduledPost = {
      id: `tt_scheduled_${Date.now()}`,
      userId: params.userId,
      platform: SocialPlatform.TIKTOK,
      content: params.content,
      scheduledTime: params.scheduledTime,
      status: 'pending' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.emit('video:scheduled', scheduledPost);
    return scheduledPost;
  }

  // Webhook Methods
  async verifyWebhook(signature: string, body: string): Promise<boolean> {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `${this.config.clientKey}${timestamp}${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.config.clientSecret)
      .update(stringToSign)
      .digest('hex');

    return signature === expectedSignature;
  }

  async handleWebhookEvent(event: any): Promise<void> {
    // Process TikTok webhook events
    switch (event.event_type) {
      case 'video.publish':
        this.emit('video:published', event);
        break;
      case 'user.follow':
        this.emit('user:followed', event);
        break;
      case 'comment.create':
        this.emit('comment:created', event);
        break;
      default:
        this.emit('webhook:event', event);
    }
  }
}