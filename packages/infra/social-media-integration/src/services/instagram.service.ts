import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import {
  InstagramConfig,
  AuthOptions,
  TokenResponse,
  ConnectAccountParams,
  InstagramProfile,
  InstagramMetrics,
  InstagramMedia,
  SchedulePostParams,
  ScheduledPost,
  MediaParams,
  MetricsParams,
  AuthenticationError,
  APIError,
  SocialPlatform
} from '../types';
import { TokenManager } from '../utils/token-manager';
import { RateLimiter } from '../utils/rate-limiter';

export class InstagramService extends EventEmitter {
  private client: AxiosInstance;
  private tokenManager: TokenManager;
  private rateLimiter: RateLimiter;
  private config: InstagramConfig;

  constructor(config: InstagramConfig) {
    super();
    this.config = config;
    this.tokenManager = new TokenManager('instagram');
    this.rateLimiter = new RateLimiter(config.rateLimit || {
      maxRequests: 200,
      windowMs: 3600000 // 1 hour
    });

    this.client = axios.create({
      baseURL: `https://graph.instagram.com/${config.apiVersion || 'v18.0'}`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        await this.rateLimiter.checkLimit();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshed = await this.refreshToken(error.config.userId);
          if (refreshed) {
            error.config.headers.Authorization = `Bearer ${refreshed.accessToken}`;
            return this.client(error.config);
          }
        }
        
        throw new APIError(
          error.response?.data?.error?.message || error.message,
          error.response?.status,
          SocialPlatform.INSTAGRAM
        );
      }
    );
  }

  // OAuth Methods
  getAuthorizationUrl(options: AuthOptions): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: options.scope.join(','),
      response_type: options.responseType || 'code',
      state: options.state
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code
      });

      const { access_token, user_id } = response.data;

      // Exchange for long-lived token
      const longLivedResponse = await this.client.get('/access_token', {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: this.config.clientSecret,
          access_token
        }
      });

      return {
        accessToken: longLivedResponse.data.access_token,
        expiresIn: longLivedResponse.data.expires_in,
        tokenType: 'Bearer',
        scope: ['user_profile', 'user_media']
      };
    } catch (error: any) {
      throw new AuthenticationError(
        `Failed to handle OAuth callback: ${error.message}`,
        SocialPlatform.INSTAGRAM
      );
    }
  }

  async refreshToken(userId: string): Promise<TokenResponse | null> {
    try {
      const currentToken = await this.tokenManager.getToken(userId);
      if (!currentToken) return null;

      const response = await this.client.get('/refresh_access_token', {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: currentToken.accessToken
        }
      });

      const newToken: TokenResponse = {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        tokenType: 'Bearer'
      };

      await this.tokenManager.saveToken(userId, newToken);
      return newToken;
    } catch (error) {
      console.error('Failed to refresh Instagram token:', error);
      return null;
    }
  }

  // Account Management
  async connectAccount(params: ConnectAccountParams): Promise<void> {
    await this.tokenManager.saveToken(params.userId, {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      expiresIn: 5184000, // 60 days
      tokenType: 'Bearer'
    });

    // Get user profile to verify connection
    const profile = await this.getProfile(params.userId);
    
    this.emit('account:connected', {
      userId: params.userId,
      platform: SocialPlatform.INSTAGRAM,
      profile
    });
  }

  async disconnectAccount(userId: string): Promise<void> {
    await this.tokenManager.deleteToken(userId);
    
    this.emit('account:disconnected', {
      userId,
      platform: SocialPlatform.INSTAGRAM
    });
  }

  // Profile Methods
  async getProfile(userId: string): Promise<InstagramProfile> {
    const token = await this.tokenManager.getToken(userId);
    if (!token) {
      throw new AuthenticationError(
        'No Instagram token found for user',
        SocialPlatform.INSTAGRAM
      );
    }

    const response = await this.client.get('/me', {
      params: {
        fields: 'id,username,account_type,profile_picture_url,followers_count,follows_count,media_count,biography,website,is_verified',
        access_token: token.accessToken
      },
      headers: { userId } // For interceptor
    });

    return {
      id: response.data.id,
      username: response.data.username,
      accountType: response.data.account_type,
      profilePictureUrl: response.data.profile_picture_url,
      followersCount: response.data.followers_count,
      followsCount: response.data.follows_count,
      mediaCount: response.data.media_count,
      biography: response.data.biography,
      website: response.data.website,
      isVerified: response.data.is_verified
    };
  }

  // Metrics Methods
  async getMetrics(params: MetricsParams): Promise<InstagramMetrics> {
    const token = await this.tokenManager.getToken(params.userId);
    if (!token) {
      throw new AuthenticationError(
        'No Instagram token found for user',
        SocialPlatform.INSTAGRAM
      );
    }

    const profile = await this.getProfile(params.userId);
    
    // Calculate engagement rate
    const recentMedia = await this.getMedia({
      userId: params.userId,
      limit: 20
    });

    let totalEngagement = 0;
    let mediaWithInsights = 0;

    for (const media of recentMedia) {
      if (media.likeCount !== undefined && media.commentCount !== undefined) {
        totalEngagement += media.likeCount + media.commentCount;
        mediaWithInsights++;
      }
    }

    const engagementRate = mediaWithInsights > 0
      ? (totalEngagement / mediaWithInsights / profile.followersCount) * 100
      : 0;

    // Get insights if business account
    let insights: any = {};
    if (profile.accountType === 'BUSINESS') {
      try {
        const insightsResponse = await this.client.get(`/${profile.id}/insights`, {
          params: {
            metric: params.metrics.join(','),
            period: params.period || 'lifetime',
            access_token: token.accessToken
          },
          headers: { userId: params.userId }
        });

        insightsResponse.data.data.forEach((metric: any) => {
          insights[metric.name] = metric.values[0].value;
        });
      } catch (error) {
        console.error('Failed to fetch Instagram insights:', error);
      }
    }

    return {
      followersCount: profile.followersCount,
      followsCount: profile.followsCount,
      mediaCount: profile.mediaCount,
      engagementRate,
      impressions: insights.impressions,
      reach: insights.reach,
      profileViews: insights.profile_views,
      websiteClicks: insights.website_clicks
    };
  }

  // Media Methods
  async getMedia(params: MediaParams): Promise<InstagramMedia[]> {
    const token = await this.tokenManager.getToken(params.userId);
    if (!token) {
      throw new AuthenticationError(
        'No Instagram token found for user',
        SocialPlatform.INSTAGRAM
      );
    }

    const response = await this.client.get('/me/media', {
      params: {
        fields: 'id,media_type,media_url,thumbnail_url,caption,permalink,timestamp,like_count,comments_count,impressions,reach,saved,shares',
        limit: params.limit || 25,
        after: params.after,
        before: params.before,
        access_token: token.accessToken
      },
      headers: { userId: params.userId }
    });

    return response.data.data.map((media: any) => ({
      id: media.id,
      mediaType: media.media_type,
      mediaUrl: media.media_url,
      thumbnailUrl: media.thumbnail_url,
      caption: media.caption,
      permalink: media.permalink,
      timestamp: new Date(media.timestamp),
      likeCount: media.like_count || 0,
      commentCount: media.comments_count || 0,
      impressions: media.impressions,
      reach: media.reach,
      saved: media.saved,
      shares: media.shares
    }));
  }

  // Scheduling Methods
  async schedulePost(params: SchedulePostParams): Promise<ScheduledPost> {
    // Instagram doesn't have a direct scheduling API
    // This would integrate with a scheduling service or queue
    const scheduledPost: ScheduledPost = {
      id: `ig_scheduled_${Date.now()}`,
      userId: params.userId,
      platform: SocialPlatform.INSTAGRAM,
      content: params.content,
      scheduledTime: params.scheduledTime,
      status: 'pending' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in scheduling queue
    this.emit('post:scheduled', scheduledPost);
    
    return scheduledPost;
  }

  async deleteScheduledPost(postId: string): Promise<void> {
    // Delete from scheduling queue
    this.emit('post:cancelled', { postId });
  }

  // Webhook handling
  async verifyWebhook(params: any): Promise<boolean> {
    // Implement Instagram webhook verification
    return params['hub.verify_token'] === this.config.clientSecret;
  }

  async handleWebhookEvent(event: any): Promise<void> {
    // Process Instagram webhook events
    this.emit('webhook:event', event);
  }
}