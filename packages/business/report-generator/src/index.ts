import { EventEmitter } from 'events';
import {
  ReportConfig,
  Report,
  ReportTemplate,
  ReportSchedule,
  DataSource,
  BatchJob,
  GenerateParams,
  ReportFormat,
  ReportStatus
} from './types';
import { ReportService } from './services/report.service';
import { TemplateService } from './services/template.service';
import { DataSourceService } from './services/data-source.service';
import { StorageService } from './services/storage.service';
import { ScheduleService } from './services/schedule.service';
import { BatchService } from './services/batch.service';

export * from './types';

export class ReportGenerator extends EventEmitter {
  public reports: ReportService;
  public templates: TemplateService;
  public dataSources: DataSourceService;
  public schedules: ScheduleService;
  public batch: BatchService;
  private storageService: StorageService;
  private config: ReportConfig;

  constructor(config: ReportConfig = {}) {
    super();
    this.config = config;

    // Initialize services
    this.storageService = new StorageService(
      config.storage || { provider: 'local', path: './reports' }
    );

    this.templates = new TemplateService(config.templates?.path);
    this.dataSources = new DataSourceService();
    
    this.reports = new ReportService(
      this.templates,
      this.dataSources,
      this.storageService
    );

    this.schedules = new ScheduleService(this.reports);
    this.batch = new BatchService(this.reports);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Forward report events
    this.reports.on('report:created', (report) => {
      this.emit('report:created', report);
    });

    this.reports.on('report:processing', (report) => {
      this.emit('report:processing', report);
    });

    this.reports.on('report:completed', (report) => {
      this.emit('report:completed', report);
    });

    this.reports.on('report:failed', (data) => {
      this.emit('report:failed', data);
    });

    // Forward template events
    this.templates.on('template:registered', (template) => {
      this.emit('template:registered', template);
    });

    this.templates.on('template:updated', (template) => {
      this.emit('template:updated', template);
    });

    // Forward schedule events
    this.schedules.on('schedule:created', (schedule) => {
      this.emit('schedule:created', schedule);
    });

    this.schedules.on('schedule:executed', (data) => {
      this.emit('schedule:executed', data);
    });

    // Forward batch events
    this.batch.on('batch:created', (batch) => {
      this.emit('batch:created', batch);
    });

    this.batch.on('batch:completed', (batch) => {
      this.emit('batch:completed', batch);
    });
  }

  // Convenience methods
  async generate(params: GenerateParams): Promise<Report> {
    return this.reports.generate(params);
  }

  async getReport(reportId: string): Promise<Report> {
    return this.reports.get(reportId);
  }

  async downloadReport(reportId: string): Promise<Buffer> {
    return this.reports.download(reportId);
  }

  async deleteReport(reportId: string): Promise<void> {
    return this.reports.delete(reportId);
  }

  async listReports(filters?: {
    type?: string;
    format?: ReportFormat;
    status?: ReportStatus;
  }): Promise<Report[]> {
    return this.reports.list(filters);
  }

  // Template convenience methods
  async registerTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    return this.templates.register(template);
  }

  async getTemplate(templateId: string): Promise<ReportTemplate> {
    return this.templates.get(templateId);
  }

  async listTemplates(filters?: any): Promise<ReportTemplate[]> {
    return this.templates.list(filters);
  }

  // Data source convenience methods
  async registerDataSource(dataSource: Omit<DataSource, 'id'>): Promise<DataSource> {
    return this.dataSources.register(dataSource);
  }

  async getDataSource(dataSourceId: string): Promise<DataSource> {
    return this.dataSources.get(dataSourceId);
  }

  async testDataSource(dataSourceId: string): Promise<boolean> {
    return this.dataSources.testConnection(dataSourceId);
  }

  // Schedule convenience methods
  async createSchedule(schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportSchedule> {
    return this.schedules.create(schedule);
  }

  async listSchedules(): Promise<ReportSchedule[]> {
    return this.schedules.list();
  }

  async pauseSchedule(scheduleId: string): Promise<void> {
    return this.schedules.pause(scheduleId);
  }

  async resumeSchedule(scheduleId: string): Promise<void> {
    return this.schedules.resume(scheduleId);
  }

  // Batch convenience methods
  async createBatch(reports: any[], options?: any): Promise<BatchJob> {
    return this.batch.create({ reports, options });
  }

  async getBatchProgress(batchId: string): Promise<any> {
    return this.batch.getProgress(batchId);
  }

  async getBatchResults(batchId: string): Promise<any> {
    return this.batch.getResults(batchId);
  }

  // Configuration
  configure(updates: Partial<ReportConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Apply configuration to template engine if chart config is updated
    if (updates.charts) {
      // Chart configuration would be applied here
    }
  }

  // Cleanup
  destroy(): void {
    this.schedules.stop();
    this.removeAllListeners();
  }

  // Built-in report types
  async generateCampaignReport(data: {
    campaignId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Report> {
    return this.generate({
      type: 'campaign-performance',
      format: ReportFormat.PDF,
      data,
      options: {
        includeCharts: true,
        includeDetails: true
      }
    });
  }

  async generateInfluencerReport(data: {
    influencerId: string;
    period?: string;
  }): Promise<Report> {
    return this.generate({
      type: 'influencer-analytics',
      format: ReportFormat.EXCEL,
      data,
      options: {
        includeRawData: true
      }
    });
  }

  async generateFinancialReport(data: {
    startDate: Date;
    endDate: Date;
    includeTransactions?: boolean;
  }): Promise<Report> {
    return this.generate({
      type: 'financial-report',
      format: ReportFormat.PDF,
      data,
      options: {
        includeDetails: data.includeTransactions
      }
    });
  }
}

// Export factory function
export function createReportGenerator(config?: ReportConfig): ReportGenerator {
  return new ReportGenerator(config);
}