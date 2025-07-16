import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  Report,
  ReportStatus,
  ReportFormat,
  GenerateParams,
  ReportTemplate,
  ReportError,
  GenerationError
} from '../types';
import { TemplateService } from './template.service';
import { DataSourceService } from './data-source.service';
import { StorageService } from './storage.service';
import { PDFGenerator } from '../generators/pdf.generator';
import { ExcelGenerator } from '../generators/excel.generator';
import { CSVGenerator } from '../generators/csv.generator';
import { HTMLGenerator } from '../generators/html.generator';
import { JSONGenerator } from '../generators/json.generator';

export class ReportService extends EventEmitter {
  private reports: Map<string, Report> = new Map();
  private templateService: TemplateService;
  private dataSourceService: DataSourceService;
  private storageService: StorageService;
  private generators: Map<ReportFormat, any>;

  constructor(
    templateService: TemplateService,
    dataSourceService: DataSourceService,
    storageService: StorageService
  ) {
    super();
    this.templateService = templateService;
    this.dataSourceService = dataSourceService;
    this.storageService = storageService;

    // Initialize generators
    this.generators = new Map([
      [ReportFormat.PDF, new PDFGenerator()],
      [ReportFormat.EXCEL, new ExcelGenerator()],
      [ReportFormat.CSV, new CSVGenerator()],
      [ReportFormat.HTML, new HTMLGenerator()],
      [ReportFormat.JSON, new JSONGenerator()]
    ]);
  }

  async generate(params: GenerateParams): Promise<Report> {
    // Create report record
    const report: Report = {
      id: uuidv4(),
      type: params.type || params.templateId || 'custom',
      format: params.format,
      status: ReportStatus.PENDING,
      createdAt: new Date(),
      metadata: params.options
    };

    // Store report
    this.reports.set(report.id, report);
    this.emit('report:created', report);

    // Process report asynchronously
    this.processReport(report, params).catch(error => {
      console.error('Report generation failed:', error);
    });

    return report;
  }

  private async processReport(report: Report, params: GenerateParams): Promise<void> {
    try {
      // Update status
      report.status = ReportStatus.PROCESSING;
      this.emit('report:processing', report);

      // Get template
      let template: ReportTemplate;
      if (params.templateId) {
        template = await this.templateService.get(params.templateId);
      } else {
        template = await this.templateService.getDefaultTemplate(params.type || 'basic', params.format);
      }

      // Get data
      let data = params.data;
      if (params.dataSource) {
        data = await this.dataSourceService.fetchData(
          params.dataSource,
          params.parameters
        );
      }

      // Validate data against schema
      if (template.dataSchema) {
        this.validateData(data, template.dataSchema);
      }

      // Generate report
      const generator = this.generators.get(params.format);
      if (!generator) {
        throw new GenerationError(`Unsupported format: ${params.format}`);
      }

      const buffer = await generator.generate(template, data, params.options);

      // Save report
      const filename = this.generateFilename(report, params.options?.filename);
      const url = await this.storageService.save(filename, buffer);

      // Update report
      report.status = ReportStatus.COMPLETED;
      report.url = url;
      report.size = buffer.length;
      report.completedAt = new Date();

      // Set expiration if configured
      if (params.options?.compress) {
        report.expiresAt = new Date();
        report.expiresAt.setDate(report.expiresAt.getDate() + 7); // 7 days
      }

      this.emit('report:completed', report);
    } catch (error: any) {
      report.status = ReportStatus.FAILED;
      report.error = error.message;
      this.emit('report:failed', { report, error });
      throw error;
    }
  }

  async get(reportId: string): Promise<Report> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new ReportError(`Report ${reportId} not found`);
    }
    return report;
  }

  async download(reportId: string): Promise<Buffer> {
    const report = await this.get(reportId);
    
    if (report.status !== ReportStatus.COMPLETED) {
      throw new ReportError('Report is not ready for download');
    }

    if (!report.url) {
      throw new ReportError('Report file not found');
    }

    return this.storageService.download(report.url);
  }

  async delete(reportId: string): Promise<void> {
    const report = await this.get(reportId);
    
    // Delete file if exists
    if (report.url) {
      await this.storageService.delete(report.url);
    }

    // Remove from memory
    this.reports.delete(reportId);
    
    this.emit('report:deleted', { reportId });
  }

  async list(filters?: {
    type?: string;
    format?: ReportFormat;
    status?: ReportStatus;
    createdAfter?: Date;
    createdBefore?: Date;
  }): Promise<Report[]> {
    let reports = Array.from(this.reports.values());

    if (filters) {
      if (filters.type) {
        reports = reports.filter(r => r.type === filters.type);
      }
      if (filters.format) {
        reports = reports.filter(r => r.format === filters.format);
      }
      if (filters.status) {
        reports = reports.filter(r => r.status === filters.status);
      }
      if (filters.createdAfter) {
        reports = reports.filter(r => r.createdAt >= filters.createdAfter!);
      }
      if (filters.createdBefore) {
        reports = reports.filter(r => r.createdAt <= filters.createdBefore!);
      }
    }

    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private validateData(data: any, schema: any): void {
    // Simple validation - in production use a proper schema validator
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          throw new GenerationError(`Required field missing: ${field}`);
        }
      }
    }
  }

  private generateFilename(report: Report, customName?: string): string {
    if (customName) {
      return customName;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = this.getFileExtension(report.format);
    return `${report.type}-${timestamp}.${extension}`;
  }

  private getFileExtension(format: ReportFormat): string {
    const extensions: Record<ReportFormat, string> = {
      [ReportFormat.PDF]: 'pdf',
      [ReportFormat.EXCEL]: 'xlsx',
      [ReportFormat.CSV]: 'csv',
      [ReportFormat.HTML]: 'html',
      [ReportFormat.JSON]: 'json'
    };
    return extensions[format];
  }

  // Cleanup old reports
  async cleanup(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    const reports = await this.list({ createdBefore: cutoffDate });

    for (const report of reports) {
      try {
        await this.delete(report.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete report ${report.id}:`, error);
      }
    }

    return deletedCount;
  }
}