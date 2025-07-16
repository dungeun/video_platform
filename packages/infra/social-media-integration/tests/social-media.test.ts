import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SocialMediaIntegration,
  SocialPlatform,
  ScheduleStatus
} from '../src';

describe('SocialMediaIntegration', () => {
  let socialMedia: SocialMediaIntegration;

  beforeEach(() => {
    socialMedia = new SocialMediaIntegration({
      instagram: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      },
      youtube: {
        apiKey: 'test-api-key',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      },
      tiktok: {
        clientKey: 'test-client-key',
        clientSecret: 'test-client-secret'
      }
    });
  });

  describe('Instagram Service', () => {
    it('should generate authorization URL', () => {
      const url = socialMedia.instagram.getAuthorizationUrl({
        scope: ['user_profile', 'user_media'],
        state: 'test-state'
      });

      expect(url).toContain('https://api.instagram.com/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('scope=user_profile,user_media');
      expect(url).toContain('state=test-state');
    });

    it('should schedule a post', async () => {
      const scheduledPost = await socialMedia.instagram.schedulePost({
        userId: 'user123',
        platform: SocialPlatform.INSTAGRAM,
        content: {
          mediaUrl: 'https://example.com/image.jpg',
          caption: 'Test post',
          hashtags: ['test', 'instagram']
        },
        scheduledTime: new Date('2024-12-25 10:00:00')
      });

      expect(scheduledPost.id).toBeDefined();
      expect(scheduledPost.status).toBe(ScheduleStatus.PENDING);
      expect(scheduledPost.platform).toBe(SocialPlatform.INSTAGRAM);
    });
  });

  describe('YouTube Service', () => {
    it('should generate authorization URL', () => {
      const url = socialMedia.youtube.getAuthorizationUrl('test-state');

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('scope=');
      expect(url).toContain('youtube.readonly');
    });
  });

  describe('TikTok Service', () => {
    it('should generate authorization URL', () => {
      const url = socialMedia.tiktok.getAuthorizationUrl('test-state');

      expect(url).toContain('https://www.tiktok.com/auth/authorize');
      expect(url).toContain('client_key=test-client-key');
      expect(url).toContain('scope=user.info.basic,video.list,video.upload');
    });
  });

  describe('Unified Methods', () => {
    it('should schedule posts across platforms', async () => {
      const post = await socialMedia.schedulePost({
        userId: 'user123',
        platform: SocialPlatform.INSTAGRAM,
        content: {
          mediaUrl: 'https://example.com/image.jpg',
          caption: 'Cross-platform post'
        },
        scheduledTime: new Date('2024-12-25 12:00:00')
      });

      expect(post.id).toBeDefined();
      expect(post.userId).toBe('user123');
      expect(post.platform).toBe(SocialPlatform.INSTAGRAM);

      const posts = socialMedia.getScheduledPosts({ userId: 'user123' });
      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe(post.id);
    });

    it('should cancel scheduled posts', async () => {
      const post = await socialMedia.schedulePost({
        userId: 'user123',
        platform: SocialPlatform.YOUTUBE,
        content: {
          title: 'Test Video',
          description: 'Test description'
        },
        scheduledTime: new Date('2024-12-26 15:00:00')
      });

      await socialMedia.cancelScheduledPost(post.id);

      const posts = socialMedia.getScheduledPosts({ userId: 'user123' });
      expect(posts).toHaveLength(0);
    });
  });

  describe('Event Handling', () => {
    it('should emit events for account connections', async () => {
      const connectSpy = vi.fn();
      socialMedia.on('account:connected', connectSpy);

      // Simulate account connection event
      socialMedia.instagram.emit('account:connected', {
        userId: 'user123',
        platform: SocialPlatform.INSTAGRAM,
        profile: { username: 'testuser' }
      });

      expect(connectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          platform: SocialPlatform.INSTAGRAM
        })
      );
    });

    it('should emit events for scheduled posts', async () => {
      const scheduleSpy = vi.fn();
      socialMedia.on('post:scheduled', scheduleSpy);

      await socialMedia.schedulePost({
        userId: 'user123',
        platform: SocialPlatform.TIKTOK,
        content: {
          caption: 'TikTok video'
        },
        scheduledTime: new Date('2024-12-27 18:00:00')
      });

      expect(scheduleSpy).toHaveBeenCalled();
    });
  });
});