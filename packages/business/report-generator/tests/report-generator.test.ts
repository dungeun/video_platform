import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReportGenerator,
  ReportFormat,
  ReportStatus,
  SectionType,
  DataSourceType
} from '../src';

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;

  beforeEach(() => {
    reportGenerator = new ReportGenerator({
      storage: {
        provider: 'local',
        path: './test-reports'
      }
    });
  });

  describe('Report Generation', () => {
    it('should generate a PDF report', async () => {
      const report = await reportGenerator.generate({
        type: 'campaign-performance',
        format: ReportFormat.PDF,
        data: {
          campaignName: 'Test Campaign',
          metrics: {
            totalReach: '1.2M',
            engagementRate: '4.5',
            conversions: 1250,
            roi: 125
          }
        }
      });

      expect(report.id).toBeDefined();
      expect(report.format).toBe(ReportFormat.PDF);
      expect(report.status).toBe(ReportStatus.PENDING);
    });

    it('should generate an Excel report', async () => {
      const report = await reportGenerator.generate({
        type: 'influencer-analytics',
        format: ReportFormat.EXCEL,
        data: {
          influencers: [
            { name: 'John Doe', followers: 125000, engagement: 4.8 },
            { name: 'Jane Smith', followers: 250000, engagement: 5.2 }
          ]
        }
      });

      expect(report.format).toBe(ReportFormat.EXCEL);
      expect(report.type).toBe('influencer-analytics');
    });

    it('should generate a CSV report', async () => {
      const report = await reportGenerator.generate({
        format: ReportFormat.CSV,
        data: {
          columns: ['Name', 'Revenue', 'Costs'],
          data: [
            ['Q1 2024', 100000, 75000],
            ['Q2 2024', 120000, 80000],
            ['Q3 2024', 135000, 85000]
          ]
        }
      });

      expect(report.format).toBe(ReportFormat.CSV);
    });
  });

  describe('Template Management', () => {
    it('should register a custom template', async () => {
      const template = await reportGenerator.registerTemplate({
        name: 'Custom Report',
        format: ReportFormat.PDF,
        sections: [
          {
            id: 'header',
            type: SectionType.HEADER,
            content: {
              title: 'Custom Report Title'
            }
          },
          {
            id: 'summary',
            type: SectionType.SUMMARY,
            content: {
              metrics: [
                { label: 'Total Users', value: '{{totalUsers}}' },
                { label: 'Revenue', value: '{{revenue}}' }
              ]
            }
          }
        ],
        isActive: true,
        version: 1
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('Custom Report');
      expect(template.sections).toHaveLength(2);
    });

    it('should list available templates', async () => {
      const templates = await reportGenerator.listTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.id === 'campaign-performance')).toBe(true);
    });

    it('should get a specific template', async () => {
      const template = await reportGenerator.getTemplate('campaign-performance');
      
      expect(template.name).toBe('Campaign Performance Report');
      expect(template.format).toBe(ReportFormat.PDF);
    });
  });

  describe('Data Sources', () => {
    it('should register a data source', async () => {
      const dataSource = await reportGenerator.registerDataSource({
        name: 'Test Database',
        type: DataSourceType.DATABASE,
        connection: {
          host: 'localhost',
          database: 'testdb',
          user: 'test',
          password: 'test'
        },
        isActive: true
      });

      expect(dataSource.id).toBeDefined();
      expect(dataSource.name).toBe('Test Database');
      expect(dataSource.type).toBe(DataSourceType.DATABASE);
    });

    it('should register an API data source', async () => {
      const dataSource = await reportGenerator.registerDataSource({
        name: 'Test API',
        type: DataSourceType.API,
        connection: {
          url: 'https://api.example.com/data',
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token'
          }
        },
        isActive: true
      });

      expect(dataSource.type).toBe(DataSourceType.API);
      expect(dataSource.connection.url).toBe('https://api.example.com/data');
    });

    it('should test data source connection', async () => {
      const dataSource = await reportGenerator.registerDataSource({
        name: 'Test DB',
        type: DataSourceType.DATABASE,
        connection: {
          host: 'localhost',
          database: 'test'
        },
        isActive: true
      });

      const isConnected = await reportGenerator.testDataSource(dataSource.id);
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('Scheduled Reports', () => {
    it('should create a scheduled report', async () => {
      const schedule = await reportGenerator.createSchedule({
        name: 'Weekly Performance Report',
        type: 'campaign-performance',
        format: ReportFormat.PDF,
        schedule: '0 9 * * MON',
        recipients: ['test@example.com'],
        isActive: true
      });

      expect(schedule.id).toBeDefined();
      expect(schedule.name).toBe('Weekly Performance Report');
      expect(schedule.schedule).toBe('0 9 * * MON');
    });

    it('should list scheduled reports', async () => {
      await reportGenerator.createSchedule({
        name: 'Daily Report',
        type: 'summary',
        format: ReportFormat.CSV,
        schedule: '0 8 * * *',
        recipients: ['daily@example.com'],
        isActive: true
      });

      const schedules = await reportGenerator.listSchedules();
      expect(schedules.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Reports', () => {
    it('should create a batch job', async () => {
      const batch = await reportGenerator.createBatch([
        {
          type: 'campaign-performance',
          format: ReportFormat.PDF,
          data: { campaignId: 'camp1' }
        },
        {
          type: 'influencer-analytics',
          format: ReportFormat.EXCEL,
          data: { influencerId: 'inf1' }
        }
      ]);

      expect(batch.id).toBeDefined();
      expect(batch.reports).toHaveLength(2);
      expect(batch.progress.total).toBe(2);
    });

    it('should track batch progress', async () => {
      const batch = await reportGenerator.createBatch([
        {
          type: 'test',
          format: ReportFormat.JSON,
          data: { test: true }
        }
      ]);

      const progress = await reportGenerator.getBatchProgress(batch.id);
      expect(progress.total).toBe(1);
      expect(progress.percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Built-in Report Types', () => {
    it('should generate campaign report', async () => {
      const report = await reportGenerator.generateCampaignReport({
        campaignId: 'camp123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });

      expect(report.type).toBe('campaign-performance');
      expect(report.format).toBe(ReportFormat.PDF);
    });

    it('should generate influencer report', async () => {
      const report = await reportGenerator.generateInfluencerReport({
        influencerId: 'inf123',
        period: 'last_quarter'
      });

      expect(report.type).toBe('influencer-analytics');
      expect(report.format).toBe(ReportFormat.EXCEL);
    });

    it('should generate financial report', async () => {
      const report = await reportGenerator.generateFinancialReport({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        includeTransactions: true
      });

      expect(report.type).toBe('financial-report');
      expect(report.format).toBe(ReportFormat.PDF);
    });
  });

  describe('Report Operations', () => {
    it('should list reports with filters', async () => {
      await reportGenerator.generate({
        type: 'test',
        format: ReportFormat.JSON,
        data: { test: true }
      });

      const reports = await reportGenerator.listReports({
        format: ReportFormat.JSON
      });

      expect(reports.every(r => r.format === ReportFormat.JSON)).toBe(true);
    });

    it('should get a specific report', async () => {
      const generatedReport = await reportGenerator.generate({
        type: 'test',
        format: ReportFormat.JSON,
        data: { test: true }
      });

      const report = await reportGenerator.getReport(generatedReport.id);
      expect(report.id).toBe(generatedReport.id);
    });
  });
});