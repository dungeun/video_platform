import cron from 'node-cron';
import PQueue from 'p-queue';
import { EventEmitter } from 'events';
import {
  ScheduledPost,
  ScheduleStatus,
  SocialPlatform,
  PostContent
} from '../types';

interface SchedulerConfig {
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class PostScheduler extends EventEmitter {
  private queue: PQueue;
  private scheduledPosts: Map<string, ScheduledPost> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig = {}) {
    super();
    this.config = {
      concurrency: config.concurrency || 5,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 5000
    };

    this.queue = new PQueue({ concurrency: this.config.concurrency });
    this.startSchedulerDaemon();
  }

  async schedulePost(post: ScheduledPost): Promise<void> {
    this.scheduledPosts.set(post.id, post);
    
    // If the post should be published within the next minute, add to queue
    const now = new Date();
    const scheduledTime = new Date(post.scheduledTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    
    if (timeDiff <= 60000 && timeDiff > 0) {
      // Schedule immediate execution
      setTimeout(() => this.processPost(post.id), timeDiff);
    }
    
    this.emit('post:scheduled', post);
  }

  async cancelScheduledPost(postId: string): Promise<void> {
    const post = this.scheduledPosts.get(postId);
    if (!post) return;

    post.status = ScheduleStatus.CANCELLED;
    post.updatedAt = new Date();
    
    // Cancel any cron job
    const cronJob = this.cronJobs.get(postId);
    if (cronJob) {
      cronJob.stop();
      this.cronJobs.delete(postId);
    }
    
    this.scheduledPosts.delete(postId);
    this.emit('post:cancelled', post);
  }

  async updateScheduledPost(postId: string, updates: Partial<ScheduledPost>): Promise<void> {
    const post = this.scheduledPosts.get(postId);
    if (!post) return;

    Object.assign(post, updates, { updatedAt: new Date() });
    
    // If schedule time changed, update cron job
    if (updates.scheduledTime) {
      await this.cancelScheduledPost(postId);
      await this.schedulePost(post);
    }
    
    this.emit('post:updated', post);
  }

  getScheduledPost(postId: string): ScheduledPost | undefined {
    return this.scheduledPosts.get(postId);
  }

  getScheduledPosts(filters?: {
    userId?: string;
    platform?: SocialPlatform;
    status?: ScheduleStatus;
  }): ScheduledPost[] {
    let posts = Array.from(this.scheduledPosts.values());
    
    if (filters?.userId) {
      posts = posts.filter(p => p.userId === filters.userId);
    }
    if (filters?.platform) {
      posts = posts.filter(p => p.platform === filters.platform);
    }
    if (filters?.status) {
      posts = posts.filter(p => p.status === filters.status);
    }
    
    return posts.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  private startSchedulerDaemon(): void {
    // Run every minute to check for posts to publish
    cron.schedule('* * * * *', async () => {
      const now = new Date();
      const upcomingPosts = this.getScheduledPosts({ status: ScheduleStatus.PENDING })
        .filter(post => {
          const scheduledTime = new Date(post.scheduledTime);
          const timeDiff = scheduledTime.getTime() - now.getTime();
          return timeDiff <= 60000 && timeDiff > -60000; // Within 1 minute window
        });

      for (const post of upcomingPosts) {
        await this.processPost(post.id);
      }
    });
  }

  private async processPost(postId: string): Promise<void> {
    const post = this.scheduledPosts.get(postId);
    if (!post || post.status !== ScheduleStatus.PENDING) return;

    post.status = ScheduleStatus.PROCESSING;
    post.updatedAt = new Date();

    await this.queue.add(async () => {
      try {
        await this.publishPost(post);
        
        post.status = ScheduleStatus.PUBLISHED;
        post.publishedAt = new Date();
        post.updatedAt = new Date();
        
        this.emit('post:published', post);
        
        // Remove from scheduled posts after successful publish
        this.scheduledPosts.delete(postId);
      } catch (error: any) {
        await this.handlePublishError(post, error);
      }
    });
  }

  private async publishPost(post: ScheduledPost): Promise<void> {
    // This method would be overridden by platform-specific implementations
    // or would call the appropriate service method
    this.emit('post:publish', post);
  }

  private async handlePublishError(post: ScheduledPost, error: Error): Promise<void> {
    const attempts = (post as any).attempts || 0;
    
    if (attempts < this.config.retryAttempts!) {
      // Retry after delay
      (post as any).attempts = attempts + 1;
      post.status = ScheduleStatus.PENDING;
      post.updatedAt = new Date();
      
      setTimeout(() => this.processPost(post.id), this.config.retryDelay!);
      
      this.emit('post:retry', { post, attempt: attempts + 1, error });
    } else {
      // Mark as failed after max retries
      post.status = ScheduleStatus.FAILED;
      post.error = error.message;
      post.updatedAt = new Date();
      
      this.emit('post:failed', { post, error });
    }
  }

  async stop(): Promise<void> {
    // Stop all cron jobs
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs.clear();
    
    // Clear the queue
    this.queue.clear();
    await this.queue.onEmpty();
  }
}