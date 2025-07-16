# Social Media Integration Module

A comprehensive social media integration module for LinkPick platform that provides seamless connectivity with Instagram, YouTube, and TikTok APIs.

## Features

- **Multi-Platform Support**
  - Instagram Graph API integration
  - YouTube Data API v3 integration
  - TikTok API integration
  
- **Data Collection**
  - Automated metrics fetching
  - Real-time follower tracking
  - Engagement rate calculation
  - Content performance analytics
  
- **Content Management**
  - Post scheduling
  - Media upload support
  - Hashtag management
  - Caption optimization
  
- **Authentication**
  - OAuth 2.0 flow handling
  - Token refresh management
  - Secure credential storage

## Installation

```bash
npm install @modules/social-media-integration
```

## Usage

### Basic Setup

```typescript
import { SocialMediaIntegration } from '@modules/social-media-integration';

const socialMedia = new SocialMediaIntegration({
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET
  },
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET
  }
});
```

### Connecting Social Accounts

```typescript
// Instagram OAuth
const instagramAuthUrl = socialMedia.instagram.getAuthorizationUrl({
  scope: ['user_profile', 'user_media'],
  state: 'unique_state_string'
});

// Handle OAuth callback
const tokens = await socialMedia.instagram.handleCallback(code);

// Connect account
await socialMedia.instagram.connectAccount({
  userId: 'user123',
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken
});
```

### Fetching Metrics

```typescript
// Get Instagram metrics
const instagramMetrics = await socialMedia.instagram.getMetrics({
  userId: 'user123',
  metrics: ['followers_count', 'media_count', 'engagement_rate']
});

// Get YouTube channel statistics
const youtubeStats = await socialMedia.youtube.getChannelStats({
  channelId: 'channel123'
});

// Get TikTok profile data
const tiktokProfile = await socialMedia.tiktok.getProfile({
  username: 'user123'
});
```

### Scheduling Posts

```typescript
// Schedule Instagram post
await socialMedia.instagram.schedulePost({
  userId: 'user123',
  mediaUrl: 'https://example.com/image.jpg',
  caption: 'Check out our new product!',
  hashtags: ['marketing', 'influencer'],
  scheduledTime: new Date('2024-12-25 10:00:00')
});

// Schedule YouTube video
await socialMedia.youtube.scheduleVideo({
  channelId: 'channel123',
  videoFile: videoBuffer,
  title: 'Product Review',
  description: 'Detailed review...',
  tags: ['review', 'product'],
  scheduledTime: new Date('2024-12-26 15:00:00')
});
```

### Webhook Integration

```typescript
// Set up webhook handlers
socialMedia.instagram.onWebhook('mentions', async (data) => {
  console.log('New mention:', data);
});

socialMedia.youtube.onWebhook('comments', async (data) => {
  console.log('New comment:', data);
});
```

## API Reference

### Instagram Service

```typescript
interface InstagramService {
  getAuthorizationUrl(options: AuthOptions): string;
  handleCallback(code: string): Promise<TokenResponse>;
  connectAccount(params: ConnectAccountParams): Promise<void>;
  disconnectAccount(userId: string): Promise<void>;
  getProfile(userId: string): Promise<InstagramProfile>;
  getMetrics(params: MetricsParams): Promise<InstagramMetrics>;
  getMedia(params: MediaParams): Promise<InstagramMedia[]>;
  schedulePost(params: SchedulePostParams): Promise<ScheduledPost>;
  deleteScheduledPost(postId: string): Promise<void>;
}
```

### YouTube Service

```typescript
interface YouTubeService {
  authorize(params: AuthParams): Promise<TokenResponse>;
  getChannelStats(params: ChannelParams): Promise<ChannelStats>;
  getVideos(params: VideoParams): Promise<Video[]>;
  getVideoAnalytics(videoId: string): Promise<VideoAnalytics>;
  scheduleVideo(params: ScheduleVideoParams): Promise<ScheduledVideo>;
  updateVideo(videoId: string, updates: VideoUpdate): Promise<Video>;
}
```

### TikTok Service

```typescript
interface TikTokService {
  authenticate(params: AuthParams): Promise<TokenResponse>;
  getProfile(username: string): Promise<TikTokProfile>;
  getVideos(params: VideoParams): Promise<TikTokVideo[]>;
  getAnalytics(params: AnalyticsParams): Promise<TikTokAnalytics>;
  scheduleVideo(params: ScheduleParams): Promise<ScheduledVideo>;
}
```

## Configuration

### Environment Variables

```env
# Instagram
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
INSTAGRAM_REDIRECT_URI=https://yourapp.com/auth/instagram/callback

# YouTube
YOUTUBE_API_KEY=your_api_key
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret

# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret

# General
SOCIAL_MEDIA_WEBHOOK_SECRET=your_webhook_secret
SOCIAL_MEDIA_ENCRYPTION_KEY=your_encryption_key
```

### Rate Limiting

The module implements automatic rate limiting for each platform:

```typescript
const config = {
  instagram: {
    rateLimit: {
      maxRequests: 200,
      windowMs: 3600000 // 1 hour
    }
  },
  youtube: {
    rateLimit: {
      quotaPerDay: 10000,
      requestsPerSecond: 10
    }
  },
  tiktok: {
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    }
  }
};
```

## Error Handling

```typescript
import { 
  SocialMediaError,
  AuthenticationError,
  RateLimitError,
  APIError 
} from '@modules/social-media-integration';

try {
  await socialMedia.instagram.getMetrics({ userId: 'user123' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication errors
    console.error('Authentication failed:', error.message);
  } else if (error instanceof RateLimitError) {
    // Handle rate limit errors
    console.error('Rate limit exceeded:', error.retryAfter);
  } else if (error instanceof APIError) {
    // Handle API errors
    console.error('API error:', error.statusCode, error.message);
  }
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

MIT