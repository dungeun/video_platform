import { EventEmitter } from 'events';
import crypto from 'crypto';
import {
  WebhookEvent,
  WebhookEventType,
  SocialPlatform,
  WebhookConfig
} from '../types';

interface WebhookHandlerConfig {
  secret: string;
  endpoint: string;
  verifyToken?: string;
}

export class WebhookHandler extends EventEmitter {
  private config: WebhookHandlerConfig;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: WebhookHandlerConfig) {
    super();
    this.config = config;
  }

  // Register webhook event handlers
  on(eventType: WebhookEventType | string, handler: (event: WebhookEvent) => void): this {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
    return this;
  }

  // Verify webhook signature
  verifySignature(
    signature: string,
    body: string,
    platform: SocialPlatform
  ): boolean {
    let isValid = false;

    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        isValid = this.verifyInstagramSignature(signature, body);
        break;
      case SocialPlatform.YOUTUBE:
        // YouTube uses different verification method
        isValid = true; // Simplified for this example
        break;
      case SocialPlatform.TIKTOK:
        isValid = this.verifyTikTokSignature(signature, body);
        break;
    }

    return isValid;
  }

  private verifyInstagramSignature(signature: string, body: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.secret)
      .update(body)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  private verifyTikTokSignature(signature: string, body: string): boolean {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `${timestamp}${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.config.secret)
      .update(stringToSign)
      .digest('hex');

    return expectedSignature === signature;
  }

  // Process incoming webhook
  async processWebhook(
    platform: SocialPlatform,
    headers: Record<string, string>,
    body: any
  ): Promise<void> {
    // Extract signature from headers
    const signature = this.getSignatureFromHeaders(headers, platform);
    
    // Verify signature
    if (signature && !this.verifySignature(signature, JSON.stringify(body), platform)) {
      throw new Error('Invalid webhook signature');
    }

    // Parse events based on platform
    const events = this.parseWebhookBody(platform, body);

    // Process each event
    for (const event of events) {
      await this.handleEvent(event);
    }
  }

  private getSignatureFromHeaders(
    headers: Record<string, string>,
    platform: SocialPlatform
  ): string | null {
    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        return headers['x-hub-signature-256'] || null;
      case SocialPlatform.TIKTOK:
        return headers['x-tiktok-signature'] || null;
      default:
        return null;
    }
  }

  private parseWebhookBody(
    platform: SocialPlatform,
    body: any
  ): WebhookEvent[] {
    const events: WebhookEvent[] = [];

    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        if (body.entry) {
          for (const entry of body.entry) {
            if (entry.changes) {
              for (const change of entry.changes) {
                events.push(this.parseInstagramChange(change));
              }
            }
          }
        }
        break;

      case SocialPlatform.YOUTUBE:
        // YouTube push notifications
        if (body.feed?.entry) {
          for (const entry of body.feed.entry) {
            events.push(this.parseYouTubeEntry(entry));
          }
        }
        break;

      case SocialPlatform.TIKTOK:
        if (body.events) {
          for (const event of body.events) {
            events.push(this.parseTikTokEvent(event));
          }
        }
        break;
    }

    return events;
  }

  private parseInstagramChange(change: any): WebhookEvent {
    let eventType: WebhookEventType;
    
    switch (change.field) {
      case 'mentions':
        eventType = WebhookEventType.MENTION;
        break;
      case 'comments':
        eventType = WebhookEventType.COMMENT;
        break;
      case 'story_mentions':
        eventType = WebhookEventType.STORY_MENTION;
        break;
      default:
        eventType = WebhookEventType.MESSAGE;
    }

    return {
      id: `ig_${Date.now()}_${Math.random()}`,
      type: eventType,
      platform: SocialPlatform.INSTAGRAM,
      data: change.value,
      timestamp: new Date()
    };
  }

  private parseYouTubeEntry(entry: any): WebhookEvent {
    return {
      id: entry.id || `yt_${Date.now()}`,
      type: WebhookEventType.MESSAGE,
      platform: SocialPlatform.YOUTUBE,
      data: {
        videoId: entry['yt:videoId'],
        channelId: entry['yt:channelId'],
        title: entry.title,
        published: entry.published,
        updated: entry.updated
      },
      timestamp: new Date(entry.updated || entry.published)
    };
  }

  private parseTikTokEvent(event: any): WebhookEvent {
    let eventType: WebhookEventType;
    
    switch (event.event) {
      case 'user.follow':
        eventType = WebhookEventType.FOLLOW;
        break;
      case 'comment.create':
        eventType = WebhookEventType.COMMENT;
        break;
      case 'like.create':
        eventType = WebhookEventType.LIKE;
        break;
      default:
        eventType = WebhookEventType.MESSAGE;
    }

    return {
      id: event.event_id || `tt_${Date.now()}`,
      type: eventType,
      platform: SocialPlatform.TIKTOK,
      data: event.data,
      timestamp: new Date(event.timestamp * 1000)
    };
  }

  private async handleEvent(event: WebhookEvent): Promise<void> {
    // Emit generic event
    this.emit('webhook:event', event);
    
    // Emit platform-specific event
    this.emit(`${event.platform}:${event.type}`, event);
    
    // Call registered handlers
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error handling webhook event ${event.type}:`, error);
        this.emit('webhook:error', { event, error });
      }
    }
  }

  // Subscription verification for platforms that require it
  handleVerification(platform: SocialPlatform, query: any): string | null {
    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        if (query['hub.verify_token'] === this.config.verifyToken) {
          return query['hub.challenge'];
        }
        break;
      case SocialPlatform.YOUTUBE:
        if (query['hub.challenge']) {
          return query['hub.challenge'];
        }
        break;
    }
    
    return null;
  }
}