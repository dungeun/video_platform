import Bull, { Queue, Job, JobOptions } from 'bull';
import {
  NotificationRequest,
  NotificationJob,
  NotificationType,
  NotificationPriority,
  DeliveryStatus
} from '../types';

export interface QueueServiceConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions?: JobOptions;
  maxConcurrency?: number;
}

export class QueueService {
  private queues: Map<NotificationType, Queue>;
  private config: QueueServiceConfig;

  constructor(config: QueueServiceConfig) {
    this.config = config;
    this.queues = new Map();
    this.initializeQueues();
  }

  private initializeQueues(): void {
    // Create separate queues for each notification type
    Object.values(NotificationType).forEach(type => {
      const queue = new Bull(`notification-${type}`, {
        redis: this.config.redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          ...this.config.defaultJobOptions
        }
      });
      
      this.queues.set(type, queue);
    });
  }

  async addNotification(
    request: NotificationRequest,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    }
  ): Promise<string> {
    const queue = this.queues.get(request.type);
    if (!queue) {
      throw new Error(`Queue not found for type: ${request.type}`);
    }

    const jobOptions: JobOptions = {
      delay: options?.delay || (request.scheduledAt ? 
        new Date(request.scheduledAt).getTime() - Date.now() : 0),
      priority: options?.priority || this.getPriorityValue(request.priority),
      attempts: options?.attempts || 3
    };

    const job = await queue.add('send-notification', request, jobOptions);
    return job.id.toString();
  }

  async addBulkNotifications(
    requests: NotificationRequest[],
    options?: JobOptions
  ): Promise<string[]> {
    const jobIds: string[] = [];
    
    // Group by notification type
    const groupedRequests = new Map<NotificationType, NotificationRequest[]>();
    requests.forEach(request => {
      const group = groupedRequests.get(request.type) || [];
      group.push(request);
      groupedRequests.set(request.type, group);
    });

    // Add to respective queues
    for (const [type, typeRequests] of groupedRequests) {
      const queue = this.queues.get(type);
      if (!queue) continue;

      const jobs = typeRequests.map(request => ({
        name: 'send-notification',
        data: request,
        opts: {
          ...options,
          priority: this.getPriorityValue(request.priority)
        }
      }));

      const addedJobs = await queue.addBulk(jobs);
      jobIds.push(...addedJobs.map(job => job.id.toString()));
    }

    return jobIds;
  }

  async getJob(type: NotificationType, jobId: string): Promise<NotificationJob | null> {
    const queue = this.queues.get(type);
    if (!queue) return null;

    const job = await queue.getJob(jobId);
    if (!job) return null;

    return this.mapJobToNotificationJob(job);
  }

  async getJobs(
    type: NotificationType,
    status?: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    limit: number = 20
  ): Promise<NotificationJob[]> {
    const queue = this.queues.get(type);
    if (!queue) return [];

    let jobs: Job[] = [];
    
    switch (status) {
      case 'waiting':
        jobs = await queue.getWaiting(0, limit);
        break;
      case 'active':
        jobs = await queue.getActive(0, limit);
        break;
      case 'completed':
        jobs = await queue.getCompleted(0, limit);
        break;
      case 'failed':
        jobs = await queue.getFailed(0, limit);
        break;
      case 'delayed':
        jobs = await queue.getDelayed(0, limit);
        break;
      default:
        jobs = await queue.getJobs(['waiting', 'active', 'delayed'], 0, limit);
    }

    return jobs.map(job => this.mapJobToNotificationJob(job));
  }

  async retryJob(type: NotificationType, jobId: string): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);

    const job = await queue.getJob(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);

    await job.retry();
  }

  async removeJob(type: NotificationType, jobId: string): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);

    const job = await queue.getJob(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);

    await job.remove();
  }

  async pauseQueue(type: NotificationType): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);

    await queue.pause();
  }

  async resumeQueue(type: NotificationType): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);

    await queue.resume();
  }

  async getQueueStatus(type: NotificationType): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused()
    ]);

    return { waiting, active, completed, failed, delayed, paused };
  }

  async cleanQueue(
    type: NotificationType,
    grace: number = 3600000, // 1 hour
    status: 'completed' | 'failed' = 'completed'
  ): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);

    await queue.clean(grace, status);
  }

  registerProcessor(
    type: NotificationType,
    processor: (job: Job<NotificationRequest>) => Promise<any>
  ): void {
    const queue = this.queues.get(type);
    if (!queue) throw new Error(`Queue not found for type: ${type}`);

    queue.process(
      'send-notification',
      this.config.maxConcurrency || 5,
      processor
    );
  }

  onJobComplete(
    type: NotificationType,
    callback: (job: Job, result: any) => void
  ): void {
    const queue = this.queues.get(type);
    if (!queue) return;

    queue.on('completed', callback);
  }

  onJobFailed(
    type: NotificationType,
    callback: (job: Job, error: Error) => void
  ): void {
    const queue = this.queues.get(type);
    if (!queue) return;

    queue.on('failed', callback);
  }

  private getPriorityValue(priority?: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 1;
      case NotificationPriority.HIGH:
        return 2;
      case NotificationPriority.NORMAL:
        return 3;
      case NotificationPriority.LOW:
        return 4;
      default:
        return 3;
    }
  }

  private mapJobToNotificationJob(job: Job<NotificationRequest>): NotificationJob {
    return {
      id: job.id.toString(),
      type: job.data.type,
      payload: job.data,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts || 3,
      nextAttempt: job.processedOn ? new Date(job.processedOn + (job.opts.backoff?.delay || 2000)) : undefined,
      priority: job.opts.priority || 3,
      createdAt: new Date(job.timestamp)
    };
  }

  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map(queue => queue.close())
    );
  }
}