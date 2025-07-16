import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import {
  ReportSchedule,
  ReportError
} from '../types';
import { ReportService } from './report.service';

export class ScheduleService extends EventEmitter {
  private schedules: Map<string, ReportSchedule> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private reportService: ReportService;

  constructor(reportService: ReportService) {
    super();
    this.reportService = reportService;
  }

  async create(
    scheduleData: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReportSchedule> {
    const schedule: ReportSchedule = {
      ...scheduleData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      nextRun: this.calculateNextRun(scheduleData.schedule)
    };

    this.validateSchedule(schedule);
    this.schedules.set(schedule.id, schedule);
    
    if (schedule.isActive) {
      this.startCronJob(schedule);
    }

    this.emit('schedule:created', schedule);
    return schedule;
  }

  async get(scheduleId: string): Promise<ReportSchedule> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new ReportError(`Schedule ${scheduleId} not found`);
    }
    return schedule;
  }

  async list(filters?: { isActive?: boolean }): Promise<ReportSchedule[]> {
    let schedules = Array.from(this.schedules.values());

    if (filters?.isActive !== undefined) {
      schedules = schedules.filter(s => s.isActive === filters.isActive);
    }

    return schedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async update(
    scheduleId: string,
    updates: Partial<ReportSchedule>
  ): Promise<ReportSchedule> {
    const schedule = await this.get(scheduleId);
    
    const updatedSchedule: ReportSchedule = {
      ...schedule,
      ...updates,
      id: schedule.id,
      updatedAt: new Date()
    };

    // Recalculate next run if schedule changed
    if (updates.schedule) {
      updatedSchedule.nextRun = this.calculateNextRun(updates.schedule);
    }

    this.validateSchedule(updatedSchedule);
    this.schedules.set(scheduleId, updatedSchedule);

    // Restart cron job if active
    this.stopCronJob(scheduleId);
    if (updatedSchedule.isActive) {
      this.startCronJob(updatedSchedule);
    }

    this.emit('schedule:updated', updatedSchedule);
    return updatedSchedule;
  }

  async delete(scheduleId: string): Promise<void> {
    const schedule = await this.get(scheduleId);
    
    this.stopCronJob(scheduleId);
    this.schedules.delete(scheduleId);
    
    this.emit('schedule:deleted', { scheduleId });
  }

  async pause(scheduleId: string): Promise<void> {
    await this.update(scheduleId, { isActive: false });
  }

  async resume(scheduleId: string): Promise<void> {
    await this.update(scheduleId, { isActive: true });
  }

  async executeNow(scheduleId: string): Promise<void> {
    const schedule = await this.get(scheduleId);
    await this.executeSchedule(schedule);
  }

  private startCronJob(schedule: ReportSchedule): void {
    try {
      const task = cron.schedule(schedule.schedule, async () => {
        await this.executeSchedule(schedule);
      }, {
        scheduled: true,
        timezone: 'UTC'
      });

      this.cronJobs.set(schedule.id, task);
    } catch (error: any) {
      console.error(`Failed to start cron job for schedule ${schedule.id}:`, error);
    }
  }

  private stopCronJob(scheduleId: string): void {
    const task = this.cronJobs.get(scheduleId);
    if (task) {
      task.stop();
      this.cronJobs.delete(scheduleId);
    }
  }

  private async executeSchedule(schedule: ReportSchedule): Promise<void> {
    try {
      this.emit('schedule:executing', { scheduleId: schedule.id });

      // Generate report
      const report = await this.reportService.generate({
        type: schedule.type,
        templateId: schedule.templateId,
        format: schedule.format,
        dataSource: schedule.dataQuery?.source,
        parameters: this.buildQueryParameters(schedule.dataQuery),
        options: schedule.options
      });

      // Update last run time
      schedule.lastRun = new Date();
      schedule.nextRun = this.calculateNextRun(schedule.schedule);
      this.schedules.set(schedule.id, schedule);

      // Send notifications (simplified - in production would integrate with email service)
      if (schedule.recipients.length > 0) {
        await this.sendReportNotifications(schedule, report);
      }

      this.emit('schedule:executed', {
        scheduleId: schedule.id,
        reportId: report.id,
        recipients: schedule.recipients
      });

    } catch (error: any) {
      console.error(`Failed to execute schedule ${schedule.id}:`, error);
      
      this.emit('schedule:failed', {
        scheduleId: schedule.id,
        error: error.message
      });
    }
  }

  private async sendReportNotifications(
    schedule: ReportSchedule,
    report: any
  ): Promise<void> {
    // This would integrate with an email service
    console.log(`Sending report ${report.id} to:`, schedule.recipients);
    
    // Mock email sending
    for (const recipient of schedule.recipients) {
      console.log(`📧 Sent ${schedule.name} to ${recipient}`);
    }
  }

  private buildQueryParameters(dataQuery?: any): Record<string, any> | undefined {
    if (!dataQuery) return undefined;

    const params: Record<string, any> = {};

    // Handle time ranges
    if (dataQuery.timeRange) {
      const now = new Date();
      
      switch (dataQuery.timeRange) {
        case 'today':
          params.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          params.endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          params.startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          params.endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
          break;
        case 'last_week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          params.startDate = weekAgo;
          params.endDate = now;
          break;
        case 'last_month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          params.startDate = monthAgo;
          params.endDate = now;
          break;
        case 'last_quarter':
          const quarterAgo = new Date(now);
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          params.startDate = quarterAgo;
          params.endDate = now;
          break;
        case 'custom':
          if (dataQuery.startDate) params.startDate = dataQuery.startDate;
          if (dataQuery.endDate) params.endDate = dataQuery.endDate;
          break;
      }
    }

    // Add other filters
    if (dataQuery.filters) {
      Object.assign(params, dataQuery.filters);
    }

    return params;
  }

  private calculateNextRun(cronExpression: string): Date {
    try {
      // Parse cron expression and calculate next execution
      // This is a simplified version - in production use a proper cron parser
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setHours(nextRun.getHours() + 1); // Simplified: next hour
      return nextRun;
    } catch (error) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // Default: 24 hours from now
    }
  }

  private validateSchedule(schedule: ReportSchedule): void {
    if (!schedule.name) {
      throw new ReportError('Schedule name is required');
    }

    if (!schedule.type && !schedule.templateId) {
      throw new ReportError('Either type or templateId is required');
    }

    if (!schedule.format) {
      throw new ReportError('Format is required');
    }

    if (!schedule.schedule) {
      throw new ReportError('Cron schedule is required');
    }

    // Validate cron expression
    if (!cron.validate(schedule.schedule)) {
      throw new ReportError('Invalid cron expression');
    }

    if (!schedule.recipients || schedule.recipients.length === 0) {
      throw new ReportError('At least one recipient is required');
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of schedule.recipients) {
      if (!emailRegex.test(recipient)) {
        throw new ReportError(`Invalid email address: ${recipient}`);
      }
    }
  }

  stop(): void {
    // Stop all cron jobs
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs.clear();
  }
}