import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import PQueue from 'p-queue';
import {
  BatchJob,
  BatchReport,
  BatchStatus,
  BatchOptions,
  BatchResult,
  ReportError
} from '../types';
import { ReportService } from './report.service';

export class BatchService extends EventEmitter {
  private batchJobs: Map<string, BatchJob> = new Map();
  private reportService: ReportService;
  private queue: PQueue;

  constructor(reportService: ReportService) {
    super();
    this.reportService = reportService;
    this.queue = new PQueue({ concurrency: 3 }); // Default concurrency
  }

  async create(params: {
    reports: BatchReport[];
    options?: BatchOptions;
  }): Promise<BatchJob> {
    const batchJob: BatchJob = {
      id: uuidv4(),
      reports: params.reports,
      status: BatchStatus.PENDING,
      progress: {
        total: params.reports.length,
        completed: 0,
        failed: 0
      },
      options: params.options,
      results: []
    };

    this.batchJobs.set(batchJob.id, batchJob);
    this.emit('batch:created', batchJob);

    // Process batch asynchronously
    this.processBatch(batchJob);

    return batchJob;
  }

  async get(batchId: string): Promise<BatchJob> {
    const batch = this.batchJobs.get(batchId);
    if (!batch) {
      throw new ReportError(`Batch job ${batchId} not found`);
    }
    return batch;
  }

  async list(filters?: { status?: BatchStatus }): Promise<BatchJob[]> {
    let batches = Array.from(this.batchJobs.values());

    if (filters?.status) {
      batches = batches.filter(b => b.status === filters.status);
    }

    return batches.sort((a, b) => b.startedAt!.getTime() - a.startedAt!.getTime());
  }

  async getProgress(batchId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    percentage: number;
    status: BatchStatus;
  }> {
    const batch = await this.get(batchId);
    
    return {
      ...batch.progress,
      percentage: Math.round((batch.progress.completed / batch.progress.total) * 100),
      status: batch.status
    };
  }

  async getResults(batchId: string): Promise<BatchResult[]> {
    const batch = await this.get(batchId);
    return batch.results || [];
  }

  async cancel(batchId: string): Promise<void> {
    const batch = await this.get(batchId);
    
    if (batch.status === BatchStatus.PROCESSING) {
      batch.status = BatchStatus.CANCELLED;
      this.emit('batch:cancelled', batch);
    }
  }

  private async processBatch(batch: BatchJob): Promise<void> {
    try {
      batch.status = BatchStatus.PROCESSING;
      batch.startedAt = new Date();
      
      this.emit('batch:processing', batch);

      // Set up queue with custom concurrency if specified
      const queue = new PQueue({
        concurrency: batch.options?.parallel || 3
      });

      // Process each report
      const promises = batch.reports.map((report, index) => 
        queue.add(() => this.processReport(batch, report, index))
      );

      // Wait for all reports to complete
      const results = await Promise.allSettled(promises);

      // Update final status
      batch.status = batch.progress.failed > 0 ? BatchStatus.FAILED : BatchStatus.COMPLETED;
      batch.completedAt = new Date();

      // Create ZIP file if requested
      if (batch.options?.outputZip && batch.progress.completed > 0) {
        await this.createZipOutput(batch);
      }

      // Send completion notification
      if (batch.options?.notifyOnComplete) {
        await this.sendCompletionNotification(batch);
      }

      this.emit('batch:completed', batch);

    } catch (error: any) {
      batch.status = BatchStatus.FAILED;
      batch.completedAt = new Date();
      
      this.emit('batch:failed', { batch, error });
    }
  }

  private async processReport(
    batch: BatchJob,
    report: BatchReport,
    index: number
  ): Promise<void> {
    try {
      // Check if batch was cancelled
      if (batch.status === BatchStatus.CANCELLED) {
        return;
      }

      // Generate report
      const generatedReport = await this.reportService.generate({
        type: report.type,
        format: report.format,
        data: report.data,
        options: report.options
      });

      // Record success
      batch.results!.push({
        index,
        reportId: generatedReport.id,
        status: 'success'
      });

      batch.progress.completed++;
      this.emit('batch:progress', {
        batchId: batch.id,
        progress: batch.progress
      });

    } catch (error: any) {
      // Record failure
      batch.results!.push({
        index,
        status: 'failed',
        error: error.message
      });

      batch.progress.failed++;

      // Stop processing if continueOnError is false
      if (!batch.options?.continueOnError) {
        batch.status = BatchStatus.FAILED;
        throw error;
      }

      this.emit('batch:progress', {
        batchId: batch.id,
        progress: batch.progress
      });
    }
  }

  private async createZipOutput(batch: BatchJob): Promise<void> {
    // In a real implementation, this would:
    // 1. Collect all successful report files
    // 2. Create a ZIP archive
    // 3. Upload to storage
    // 4. Update batch with ZIP URL
    
    console.log(`Creating ZIP output for batch ${batch.id}`);
    
    // Mock ZIP creation
    batch.results!.push({
      index: -1,
      reportId: `zip-${batch.id}`,
      status: 'success'
    });
  }

  private async sendCompletionNotification(batch: BatchJob): Promise<void> {
    const recipients = Array.isArray(batch.options?.notifyOnComplete)
      ? batch.options.notifyOnComplete
      : [batch.options?.notifyOnComplete];

    for (const recipient of recipients) {
      if (recipient) {
        // Mock notification sending
        console.log(`📧 Batch ${batch.id} completed - notifying ${recipient}`);
        console.log(`   Total: ${batch.progress.total}`);
        console.log(`   Completed: ${batch.progress.completed}`);
        console.log(`   Failed: ${batch.progress.failed}`);
      }
    }
  }

  // Cleanup old batch jobs
  async cleanup(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    for (const [batchId, batch] of this.batchJobs.entries()) {
      if (batch.completedAt && batch.completedAt < cutoffDate) {
        this.batchJobs.delete(batchId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Get batch statistics
  getStatistics(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const batches = Array.from(this.batchJobs.values());
    
    return {
      total: batches.length,
      pending: batches.filter(b => b.status === BatchStatus.PENDING).length,
      processing: batches.filter(b => b.status === BatchStatus.PROCESSING).length,
      completed: batches.filter(b => b.status === BatchStatus.COMPLETED).length,
      failed: batches.filter(b => b.status === BatchStatus.FAILED).length,
      cancelled: batches.filter(b => b.status === BatchStatus.CANCELLED).length
    };
  }
}