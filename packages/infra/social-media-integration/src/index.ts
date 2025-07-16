import { EventEmitter } from 'events';
import {
  SocialMediaConfig,
  SocialPlatform,
  AuthOptions,
  TokenResponse,
  ConnectAccountParams,
  SchedulePostParams,
  ScheduledPost,
  WebhookEvent
} from './types';
import { InstagramService } from './services/instagram.service';
import { YouTubeService } from './services/youtube.service';
import { TikTokService } from './services/tiktok.service';
import { PostScheduler } from './utils/scheduler';
import { WebhookHandler } from './utils/webhook-handler';

export * from './types';
export * from './services/instagram.service';
export * from './services/youtube.service';
export * from './services/tiktok.service';
export * from './utils';

export class SocialMediaIntegration extends EventEmitter {
  public instagram: InstagramService;
  public youtube: YouTubeService;
  public tiktok: TikTokService;
  private scheduler: PostScheduler;
  private webhookHandler: WebhookHandler;
  private config: SocialMediaConfig;

  constructor(config: SocialMediaConfig) {
    super();
    this.config = config;

    // Initialize services
    if (config.instagram) {
      this.instagram = new InstagramService(config.instagram);
      this.setupServiceListeners(this.instagram, SocialPlatform.INSTAGRAM);
    }

    if (config.youtube) {
      this.youtube = new YouTubeService(config.youtube);
      this.setupServiceListeners(this.youtube, SocialPlatform.YOUTUBE);
    }

    if (config.tiktok) {
      this.tiktok = new TikTokService(config.tiktok);
      this.setupServiceListeners(this.tiktok, SocialPlatform.TIKTOK);
    }

    // Initialize scheduler
    this.scheduler = new PostScheduler({
      concurrency: 5,
      retryAttempts: 3,
      retryDelay: 5000
    });
    this.setupSchedulerListeners();

    // Initialize webhook handler
    if (config.webhook) {
      this.webhookHandler = new WebhookHandler(config.webhook);
      this.setupWebhookListeners();
    }
  }

  private setupServiceListeners(service: any, platform: SocialPlatform): void {
    // Forward service events
    service.on('account:connected', (data: any) => {
      this.emit('account:connected', { ...data, platform });
    });

    service.on('account:disconnected', (data: any) => {
      this.emit('account:disconnected', { ...data, platform });
    });

    service.on('post:scheduled', (post: ScheduledPost) => {
      this.scheduler.schedulePost(post);
    });

    service.on('webhook:event', (event: any) => {
      this.emit('webhook:event', { ...event, platform });
    });
  }

  private setupSchedulerListeners(): void {
    this.scheduler.on('post:publish', async (post: ScheduledPost) => {
      try {
        switch (post.platform) {
          case SocialPlatform.INSTAGRAM:
            // Publish to Instagram
            if (this.instagram && post.content.mediaUrl) {
              // Instagram API doesn't support direct posting
              // This would integrate with Instagram Business API
              this.emit('post:manual_publish_required', post);
            }
            break;

          case SocialPlatform.YOUTUBE:
            // Upload to YouTube
            if (this.youtube && post.content.mediaUrl) {
              const videoId = await this.youtube.uploadVideo({
                userId: post.userId,
                videoFile: Buffer.from(''), // Would fetch from mediaUrl
                metadata: {
                  title: post.content.title || '',
                  description: post.content.description || '',
                  tags: post.content.tags,
                  privacy: 'public'
                }
              });
              this.emit('post:published', { ...post, videoId });
            }
            break;

          case SocialPlatform.TIKTOK:
            // Upload to TikTok
            if (this.tiktok && post.content.mediaUrl) {
              const videoId = await this.tiktok.uploadVideo({
                userId: post.userId,
                videoFile: Buffer.from(''), // Would fetch from mediaUrl
                metadata: {
                  description: post.content.caption || '',
                  privacy: 'PUBLIC'
                }
              });
              this.emit('post:published', { ...post, videoId });
            }
            break;
        }
      } catch (error) {
        this.emit('post:error', { post, error });
      }
    });

    // Forward scheduler events
    ['post:scheduled', 'post:cancelled', 'post:updated', 'post:published', 'post:failed', 'post:retry'].forEach(event => {
      this.scheduler.on(event, (data: any) => this.emit(event, data));
    });
  }

  private setupWebhookListeners(): void {
    this.webhookHandler.on('webhook:event', (event: WebhookEvent) => {
      this.emit('webhook:event', event);
    });

    this.webhookHandler.on('webhook:error', (data: any) => {
      this.emit('webhook:error', data);
    });
  }

  // Unified methods
  async connectAccount(params: ConnectAccountParams): Promise<void> {
    switch (params.platform) {
      case SocialPlatform.INSTAGRAM:
        if (!this.instagram) throw new Error('Instagram service not configured');
        await this.instagram.connectAccount(params);
        break;
      case SocialPlatform.YOUTUBE:
        if (!this.youtube) throw new Error('YouTube service not configured');
        // YouTube connection handled differently
        break;
      case SocialPlatform.TIKTOK:
        if (!this.tiktok) throw new Error('TikTok service not configured');
        // TikTok connection handled differently
        break;
    }
  }

  async disconnectAccount(userId: string, platform: SocialPlatform): Promise<void> {
    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        if (this.instagram) await this.instagram.disconnectAccount(userId);
        break;
      case SocialPlatform.YOUTUBE:
        // YouTube disconnection
        break;
      case SocialPlatform.TIKTOK:
        // TikTok disconnection
        break;
    }
  }

  async schedulePost(params: SchedulePostParams): Promise<ScheduledPost> {
    const post: ScheduledPost = {
      id: `${params.platform}_${Date.now()}`,
      userId: params.userId,
      platform: params.platform,
      content: params.content,
      scheduledTime: params.scheduledTime,
      status: 'pending' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.scheduler.schedulePost(post);
    return post;
  }

  async cancelScheduledPost(postId: string): Promise<void> {
    await this.scheduler.cancelScheduledPost(postId);
  }

  getScheduledPosts(filters?: any): ScheduledPost[] {
    return this.scheduler.getScheduledPosts(filters);
  }

  // Webhook processing
  async processWebhook(
    platform: SocialPlatform,
    headers: Record<string, string>,
    body: any
  ): Promise<void> {
    if (!this.webhookHandler) {
      throw new Error('Webhook handler not configured');
    }

    await this.webhookHandler.processWebhook(platform, headers, body);
  }

  handleWebhookVerification(
    platform: SocialPlatform,
    query: any
  ): string | null {
    if (!this.webhookHandler) {
      throw new Error('Webhook handler not configured');
    }

    return this.webhookHandler.handleVerification(platform, query);
  }

  // Cleanup
  async destroy(): Promise<void> {
    await this.scheduler.stop();
    this.removeAllListeners();
  }
}

// Export a factory function for easier instantiation
export function createSocialMediaIntegration(config: SocialMediaConfig): SocialMediaIntegration {
  return new SocialMediaIntegration(config);
}