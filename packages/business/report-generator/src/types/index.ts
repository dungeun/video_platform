export interface ReportConfig {
  storage?: StorageConfig;
  email?: EmailConfig;
  templates?: TemplateConfig;
  charts?: ChartConfig;
  database?: DatabaseConfig;
}

export interface StorageConfig {
  provider: 'local' | 's3' | 'azure' | 'gcs';
  bucket?: string;
  region?: string;
  path?: string;
}

export interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'smtp';
  apiKey?: string;
  from?: string;
  replyTo?: string;
}

export interface TemplateConfig {
  path?: string;
  cache?: boolean;
  customHelpers?: Record<string, Function>;
}

export interface ChartConfig {
  defaultColors?: string[];
  defaultFont?: string;
  defaultSize?: { width: number; height: number };
}

export interface DatabaseConfig {
  host: string;
  port?: number;
  database: string;
  user: string;
  password: string;
}

// Report Types
export interface Report {
  id: string;
  type: string;
  format: ReportFormat;
  status: ReportStatus;
  url?: string;
  size?: number;
  pages?: number;
  createdAt: Date;
  createdBy?: string;
  completedAt?: Date;
  expiresAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  HTML = 'html',
  JSON = 'json'
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface GenerateParams {
  type?: string;
  templateId?: string;
  format: ReportFormat;
  data?: any;
  dataSource?: string;
  parameters?: Record<string, any>;
  options?: ReportOptions;
}

export interface ReportOptions {
  filename?: string;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  password?: string;
  watermark?: WatermarkOptions;
  includeCharts?: boolean;
  includeRawData?: boolean;
  includeTableOfContents?: boolean;
  compress?: boolean;
  encryption?: boolean;
  locale?: string;
  timezone?: string;
}

export interface WatermarkOptions {
  text?: string;
  image?: string;
  opacity?: number;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  rotation?: number;
}

// Template Types
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  format: ReportFormat;
  category?: string;
  layout?: LayoutOptions;
  sections: TemplateSection[];
  styles?: StyleOptions;
  dataSchema?: DataSchema;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LayoutOptions {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'Letter' | 'Legal' | [number, number];
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header?: HeaderFooterOptions;
  footer?: HeaderFooterOptions;
}

export interface HeaderFooterOptions {
  height: number;
  content: string | TemplateContent;
}

export interface TemplateSection {
  id: string;
  type: SectionType;
  title?: string;
  content: TemplateContent;
  condition?: string;
  repeat?: string;
  pageBreak?: 'before' | 'after' | 'avoid';
  style?: SectionStyle;
}

export enum SectionType {
  HEADER = 'header',
  SUMMARY = 'summary',
  CHART = 'chart',
  TABLE = 'table',
  TEXT = 'text',
  IMAGE = 'image',
  PAGE_BREAK = 'page_break',
  CUSTOM = 'custom'
}

export interface TemplateContent {
  [key: string]: any;
}

export interface SectionStyle {
  backgroundColor?: string;
  padding?: number | [number, number, number, number];
  border?: BorderStyle;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface BorderStyle {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface StyleOptions {
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts?: {
    heading: string;
    body: string;
    monospace: string;
  };
  spacing?: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface DataSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  description?: string;
  format?: string;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
}

// Schedule Types
export interface ReportSchedule {
  id: string;
  name: string;
  type: string;
  templateId?: string;
  format: ReportFormat;
  schedule: string; // Cron expression
  recipients: string[];
  dataQuery?: DataQuery;
  options?: ReportOptions;
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataQuery {
  source?: string;
  timeRange?: 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_quarter' | 'custom';
  startDate?: Date;
  endDate?: Date;
  filters?: Record<string, any>;
  groupBy?: string[];
  orderBy?: string[];
  limit?: number;
}

// Data Source Types
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connection: DataSourceConnection;
  schema?: DataSchema;
  isActive: boolean;
}

export enum DataSourceType {
  DATABASE = 'database',
  API = 'api',
  FILE = 'file',
  CUSTOM = 'custom'
}

export interface DataSourceConnection {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  url?: string;
  headers?: Record<string, string>;
  query?: string;
  method?: 'GET' | 'POST';
}

// Batch Types
export interface BatchJob {
  id: string;
  reports: BatchReport[];
  status: BatchStatus;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  options?: BatchOptions;
  startedAt?: Date;
  completedAt?: Date;
  results?: BatchResult[];
}

export interface BatchReport {
  type: string;
  format: ReportFormat;
  data: any;
  options?: ReportOptions;
}

export enum BatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface BatchOptions {
  parallel?: number;
  outputZip?: boolean;
  outputPath?: string;
  notifyOnComplete?: string | string[];
  continueOnError?: boolean;
}

export interface BatchResult {
  index: number;
  reportId?: string;
  status: 'success' | 'failed';
  error?: string;
}

// Chart Types
export interface ChartData {
  type: ChartType;
  title?: string;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options?: ChartOptions;
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  RADAR = 'radar',
  SCATTER = 'scatter',
  BUBBLE = 'bubble'
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
  };
  scales?: {
    x?: AxisOptions;
    y?: AxisOptions;
  };
}

export interface AxisOptions {
  display?: boolean;
  title?: {
    display?: boolean;
    text?: string;
  };
  ticks?: {
    beginAtZero?: boolean;
    min?: number;
    max?: number;
  };
}

// Error Types
export class ReportError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ReportError';
  }
}

export class TemplateError extends ReportError {
  constructor(message: string) {
    super(message, 'TEMPLATE_ERROR');
    this.name = 'TemplateError';
  }
}

export class DataSourceError extends ReportError {
  constructor(message: string) {
    super(message, 'DATA_SOURCE_ERROR');
    this.name = 'DataSourceError';
  }
}

export class GenerationError extends ReportError {
  constructor(message: string) {
    super(message, 'GENERATION_ERROR');
    this.name = 'GenerationError';
  }
}