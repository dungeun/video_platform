export interface ContractManagementConfig {
  storage: StorageConfig;
  signing?: SigningConfig;
  notifications?: NotificationConfig;
  encryption?: EncryptionConfig;
}

export interface StorageConfig {
  provider: 'local' | 's3' | 'azure' | 'gcs';
  bucket?: string;
  region?: string;
  path?: string;
}

export interface SigningConfig {
  provider: 'internal' | 'docusign' | 'hellosign' | 'adobe';
  certificatePath?: string;
  certificatePassword?: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface NotificationConfig {
  emailProvider?: 'sendgrid' | 'ses' | 'smtp';
  smsProvider?: 'twilio' | 'nexmo';
  webhookUrl?: string;
}

export interface EncryptionConfig {
  algorithm: string;
  key: string;
}

// Contract Types
export interface Contract {
  id: string;
  templateId?: string;
  title: string;
  content: string;
  contentHtml?: string;
  parties: Party[];
  status: ContractStatus;
  signatures: Signature[];
  variables: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  version: number;
  parentId?: string; // For contract amendments
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  renewalDate?: Date;
  attachments?: Attachment[];
}

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: PartyRole;
  signingOrder?: number;
  signedAt?: Date;
  viewedAt?: Date;
  remindersSent?: number;
  lastReminderAt?: Date;
}

export enum PartyType {
  BRAND = 'brand',
  INFLUENCER = 'influencer',
  AGENCY = 'agency',
  VENDOR = 'vendor',
  OTHER = 'other'
}

export enum PartyRole {
  CLIENT = 'client',
  CONTRACTOR = 'contractor',
  WITNESS = 'witness',
  APPROVER = 'approver'
}

export interface Signature {
  id: string;
  partyId: string;
  type: SignatureType;
  data: string; // Base64 encoded signature image or text
  certificate?: string; // Digital certificate
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  verified: boolean;
  verificationMethod?: string;
}

export enum SignatureType {
  DRAWN = 'drawn',
  TYPED = 'typed',
  UPLOADED = 'uploaded',
  DIGITAL = 'digital'
}

export enum ContractStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SENT = 'sent',
  VIEWED = 'viewed',
  PARTIALLY_SIGNED = 'partially_signed',
  SIGNED = 'signed',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  TERMINATED = 'terminated'
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  content: string;
  contentHtml?: string;
  variables: TemplateVariable[];
  clauses?: Clause[];
  signingOrder?: PartyRole[];
  defaultExpiry?: number; // Days
  tags?: string[];
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TemplateCategory {
  INFLUENCER = 'influencer',
  SPONSORSHIP = 'sponsorship',
  SERVICE = 'service',
  NDA = 'nda',
  LICENSE = 'license',
  PARTNERSHIP = 'partnership',
  CUSTOM = 'custom'
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  TEXT = 'text',
  ARRAY = 'array',
  OBJECT = 'object'
}

export interface Clause {
  id: string;
  title: string;
  content: string;
  optional: boolean;
  order: number;
}

// Operation Types
export interface CreateContractParams {
  templateId?: string;
  title?: string;
  content?: string;
  parties: Omit<Party, 'id' | 'signedAt' | 'viewedAt' | 'remindersSent' | 'lastReminderAt'>[];
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  expiresIn?: number; // Days
  attachments?: File[];
}

export interface UpdateContractParams {
  title?: string;
  content?: string;
  parties?: Party[];
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  status?: ContractStatus;
}

export interface SendOptions {
  message?: string;
  subject?: string;
  reminderDays?: number[];
  expiresIn?: number;
  attachments?: string[];
  sendCopy?: boolean;
}

export interface SignContractParams {
  contractId: string;
  signerEmail: string;
  signature: {
    type: SignatureType;
    data: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  ipAddress: string;
  userAgent: string;
}

export interface SearchFilters {
  status?: ContractStatus[];
  parties?: {
    email?: string;
    type?: PartyType;
    name?: string;
  };
  dateRange?: {
    field?: 'created' | 'sent' | 'signed' | 'expires';
    start: Date;
    end: Date;
  };
  templateId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface ExpiringParams {
  days: number;
  status?: ContractStatus[];
  includeRenewable?: boolean;
}

export interface SigningStatus {
  [partyEmail: string]: {
    signed: boolean;
    sentAt?: Date;
    viewedAt?: Date;
    signedAt?: Date;
    remindersSent: number;
    lastReminderAt?: Date;
  };
}

export interface AuditEntry {
  id: string;
  contractId: string;
  action: AuditAction;
  performedBy: string;
  performedAt: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export enum AuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  SENT = 'sent',
  VIEWED = 'viewed',
  SIGNED = 'signed',
  DOWNLOADED = 'downloaded',
  REMINDER_SENT = 'reminder_sent',
  EXPIRED = 'expired',
  RENEWED = 'renewed',
  TERMINATED = 'terminated',
  DELETED = 'deleted'
}

// Template Operations
export interface CreateTemplateParams {
  name: string;
  description?: string;
  category: TemplateCategory;
  content: string;
  variables: Omit<TemplateVariable, 'id'>[];
  clauses?: Omit<Clause, 'id'>[];
  signingOrder?: PartyRole[];
  defaultExpiry?: number;
  tags?: string[];
}

export interface TemplateFilters {
  category?: TemplateCategory;
  isActive?: boolean;
  tags?: string[];
  search?: string;
}

// Notification Types
export interface ContractNotification {
  type: NotificationType;
  contractId: string;
  recipientEmail: string;
  subject: string;
  message: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export enum NotificationType {
  CONTRACT_SENT = 'contract_sent',
  CONTRACT_VIEWED = 'contract_viewed',
  CONTRACT_SIGNED = 'contract_signed',
  CONTRACT_COMPLETED = 'contract_completed',
  REMINDER = 'reminder',
  EXPIRY_WARNING = 'expiry_warning',
  CONTRACT_EXPIRED = 'contract_expired'
}

// Error Types
export class ContractError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ContractError';
  }
}

export class TemplateError extends ContractError {
  constructor(message: string) {
    super(message, 'TEMPLATE_ERROR');
    this.name = 'TemplateError';
  }
}

export class SignatureError extends ContractError {
  constructor(message: string) {
    super(message, 'SIGNATURE_ERROR');
    this.name = 'SignatureError';
  }
}

export class ValidationError extends ContractError {
  constructor(message: string, public fields?: string[]) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}