# Report Generator Module

A comprehensive report generation module for LinkPick platform that supports PDF, Excel, and other formats with customizable templates and automated scheduling.

## Features

- **Multiple Output Formats**
  - PDF reports with charts and tables
  - Excel workbooks with multiple sheets
  - CSV exports
  - HTML reports
  - JSON data exports
  
- **Template System**
  - Pre-built templates for common reports
  - Custom template creation
  - Dynamic data binding
  - Chart and visualization support
  
- **Automated Scheduling**
  - Scheduled report generation
  - Email delivery
  - Cloud storage upload
  - Webhook notifications
  
- **Data Sources**
  - Database queries
  - API integrations
  - Real-time data
  - Historical analytics

## Installation

```bash
npm install @modules/report-generator
```

## Usage

### Basic Setup

```typescript
import { ReportGenerator } from '@modules/report-generator';

const reportGenerator = new ReportGenerator({
  storage: {
    provider: 's3',
    bucket: 'reports',
    region: 'us-east-1'
  },
  email: {
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY
  },
  templates: {
    path: './report-templates'
  }
});
```

### Generating Reports

#### Campaign Performance Report

```typescript
// Generate a campaign performance report
const report = await reportGenerator.generate({
  type: 'campaign-performance',
  format: 'pdf',
  data: {
    campaignId: 'campaign123',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31')
  },
  options: {
    includeCharts: true,
    includeDetails: true,
    logo: 'https://example.com/logo.png'
  }
});

console.log('Report generated:', report.url);
```

#### Influencer Analytics Report

```typescript
// Generate influencer analytics report in Excel
const excelReport = await reportGenerator.generate({
  type: 'influencer-analytics',
  format: 'excel',
  data: {
    influencerIds: ['inf1', 'inf2', 'inf3'],
    metrics: ['engagement', 'reach', 'conversions'],
    period: 'last_quarter'
  },
  options: {
    groupBy: 'month',
    includeComparison: true
  }
});

// Download the report
const buffer = await reportGenerator.download(excelReport.id);
```

### Creating Custom Templates

```typescript
// Register a custom template
await reportGenerator.templates.register({
  id: 'custom-monthly-summary',
  name: 'Monthly Summary Report',
  format: 'pdf',
  layout: {
    orientation: 'portrait',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  },
  sections: [
    {
      type: 'header',
      content: {
        title: '{{companyName}} Monthly Report',
        subtitle: '{{monthYear}}',
        logo: '{{logoUrl}}'
      }
    },
    {
      type: 'summary',
      content: {
        metrics: [
          { label: 'Total Campaigns', value: '{{totalCampaigns}}' },
          { label: 'Active Influencers', value: '{{activeInfluencers}}' },
          { label: 'Total Reach', value: '{{totalReach}}' },
          { label: 'Average Engagement', value: '{{avgEngagement}}%' }
        ]
      }
    },
    {
      type: 'chart',
      content: {
        type: 'line',
        title: 'Monthly Performance',
        data: '{{performanceData}}'
      }
    },
    {
      type: 'table',
      content: {
        title: 'Top Performing Campaigns',
        columns: ['Campaign', 'Influencer', 'Reach', 'Engagement', 'ROI'],
        data: '{{campaignTableData}}'
      }
    }
  ]
});

// Use the custom template
const customReport = await reportGenerator.generate({
  templateId: 'custom-monthly-summary',
  format: 'pdf',
  data: {
    companyName: 'ABC Brand',
    monthYear: 'December 2024',
    logoUrl: 'https://example.com/logo.png',
    totalCampaigns: 25,
    activeInfluencers: 150,
    totalReach: '2.5M',
    avgEngagement: 4.8,
    performanceData: { /* chart data */ },
    campaignTableData: [ /* table rows */ ]
  }
});
```

### Scheduled Reports

```typescript
// Schedule a weekly report
const schedule = await reportGenerator.schedules.create({
  name: 'Weekly Performance Report',
  type: 'campaign-performance',
  format: 'pdf',
  schedule: '0 9 * * MON', // Every Monday at 9 AM
  recipients: ['manager@example.com', 'team@example.com'],
  dataQuery: {
    timeRange: 'last_week',
    metrics: ['all']
  },
  options: {
    emailSubject: 'Weekly Performance Report - {{date}}',
    emailBody: 'Please find attached the weekly performance report.',
    attachmentName: 'weekly-report-{{date}}.pdf'
  }
});

// List scheduled reports
const schedules = await reportGenerator.schedules.list();

// Update schedule
await reportGenerator.schedules.update(schedule.id, {
  recipients: ['manager@example.com', 'team@example.com', 'ceo@example.com']
});

// Pause/resume schedule
await reportGenerator.schedules.pause(schedule.id);
await reportGenerator.schedules.resume(schedule.id);

// Delete schedule
await reportGenerator.schedules.delete(schedule.id);
```

### Data Sources

```typescript
// Configure data sources
reportGenerator.dataSources.register({
  id: 'campaign-db',
  type: 'database',
  connection: {
    host: 'localhost',
    database: 'linkpick',
    query: `
      SELECT 
        c.id, c.name, c.start_date, c.end_date,
        COUNT(DISTINCT p.influencer_id) as influencer_count,
        SUM(p.reach) as total_reach,
        AVG(p.engagement_rate) as avg_engagement
      FROM campaigns c
      JOIN participants p ON c.id = p.campaign_id
      WHERE c.status = 'completed'
        AND c.end_date >= :startDate
        AND c.end_date <= :endDate
      GROUP BY c.id
    `
  }
});

// Use data source in report
const dataReport = await reportGenerator.generate({
  type: 'custom',
  format: 'pdf',
  dataSource: 'campaign-db',
  parameters: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  }
});
```

### Batch Report Generation

```typescript
// Generate multiple reports in batch
const batchJob = await reportGenerator.batch.create({
  reports: [
    {
      type: 'influencer-profile',
      format: 'pdf',
      data: { influencerId: 'inf001' }
    },
    {
      type: 'influencer-profile',
      format: 'pdf',
      data: { influencerId: 'inf002' }
    },
    {
      type: 'campaign-summary',
      format: 'excel',
      data: { campaignId: 'camp001' }
    }
  ],
  options: {
    parallel: 3, // Process 3 reports at a time
    outputZip: true,
    notifyOnComplete: 'admin@example.com'
  }
});

// Monitor batch progress
const progress = await reportGenerator.batch.getProgress(batchJob.id);
console.log(`Progress: ${progress.completed}/${progress.total}`);

// Get batch results
const results = await reportGenerator.batch.getResults(batchJob.id);
```

## Report Types

### Built-in Report Types

1. **Campaign Performance Report**
   - Campaign metrics and KPIs
   - Influencer performance breakdown
   - ROI analysis
   - Content performance

2. **Influencer Analytics Report**
   - Profile statistics
   - Historical performance
   - Audience demographics
   - Content analysis

3. **Financial Report**
   - Revenue breakdown
   - Payment summaries
   - Commission calculations
   - Budget vs actual

4. **Engagement Report**
   - Engagement metrics
   - Audience insights
   - Content performance
   - Trend analysis

5. **Executive Summary**
   - High-level KPIs
   - Performance highlights
   - Strategic insights
   - Recommendations

## API Reference

### ReportGenerator Class

```typescript
class ReportGenerator {
  constructor(config: ReportConfig);
  
  // Report generation
  generate(params: GenerateParams): Promise<Report>;
  download(reportId: string): Promise<Buffer>;
  getReport(reportId: string): Promise<Report>;
  deleteReport(reportId: string): Promise<void>;
  
  // Templates
  templates: TemplateManager;
  
  // Scheduling
  schedules: ScheduleManager;
  
  // Data sources
  dataSources: DataSourceManager;
  
  // Batch operations
  batch: BatchManager;
}
```

### Types

```typescript
interface GenerateParams {
  type?: string;
  templateId?: string;
  format: 'pdf' | 'excel' | 'csv' | 'html' | 'json';
  data?: any;
  dataSource?: string;
  parameters?: Record<string, any>;
  options?: ReportOptions;
}

interface Report {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  size?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

interface ReportOptions {
  filename?: string;
  password?: string;
  watermark?: string;
  includeCharts?: boolean;
  includeRawData?: boolean;
  compress?: boolean;
  encryption?: boolean;
}
```

## Configuration

### Environment Variables

```env
# Storage
REPORT_STORAGE_PROVIDER=s3
REPORT_STORAGE_BUCKET=linkpick-reports
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Email
REPORT_EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key

# Database
REPORT_DB_HOST=localhost
REPORT_DB_NAME=linkpick
REPORT_DB_USER=user
REPORT_DB_PASSWORD=password
```

### Chart Configuration

```typescript
reportGenerator.configure({
  charts: {
    defaultColors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
    defaultFont: 'Arial',
    defaultSize: { width: 800, height: 400 }
  }
});
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