import { z } from 'zod';

// Notification types
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced'
}

// Provider configurations
export interface EmailProvider {
  type: 'ses' | 'sendgrid' | 'smtp';
  config: Record<string, any>;
}

export interface SMSProvider {
  type: 'aligo' | 'solutionbox' | 'twilio';
  config: {
    apiKey?: string;
    userId?: string;
    senderId?: string;
    apiUrl?: string;
    [key: string]: any;
  };
}

// Template management
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string; // For email
  content: string;
  language: string;
  variables: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

// Notification request
export interface NotificationRequest {
  id?: string;
  type: NotificationType;
  recipient: NotificationRecipient;
  templateId?: string;
  content?: NotificationContent;
  variables?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  userId?: string;
  deviceToken?: string;
  locale?: string;
}

export interface NotificationContent {
  subject?: string;
  body: string;
  html?: string;
  attachments?: NotificationAttachment[];
}

export interface NotificationAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
}

// Delivery tracking
export interface NotificationDelivery {
  id: string;
  notificationId: string;
  type: NotificationType;
  recipient: string;
  status: DeliveryStatus;
  provider: string;
  providerResponse?: any;
  attempts: number;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

// User preferences
export interface NotificationPreferences {
  userId: string;
  channels: {
    email: ChannelPreference;
    sms: ChannelPreference;
    push: ChannelPreference;
    inApp: ChannelPreference;
  };
  quiet: QuietHours;
  locale: string;
  timezone: string;
}

export interface ChannelPreference {
  enabled: boolean;
  categories: Record<string, boolean>;
  frequency?: 'instant' | 'daily' | 'weekly';
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm format
  end: string; // HH:mm format
  timezone: string;
}

// Queue management
export interface NotificationJob {
  id: string;
  type: NotificationType;
  payload: NotificationRequest;
  attempts: number;
  maxAttempts: number;
  nextAttempt?: Date;
  priority: number;
  createdAt: Date;
}

// Validation schemas
export const NotificationRequestSchema = z.object({
  type: z.nativeEnum(NotificationType),
  recipient: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    userId: z.string().optional(),
    deviceToken: z.string().optional(),
    locale: z.string().optional()
  }),
  templateId: z.string().optional(),
  content: z.object({
    subject: z.string().optional(),
    body: z.string(),
    html: z.string().optional()
  }).optional(),
  variables: z.record(z.any()).optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.any()).optional()
});

export const TemplateSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(NotificationType),
  subject: z.string().optional(),
  content: z.string().min(1),
  language: z.string().default('ko'),
  variables: z.array(z.string()).default([])
});

// Korean SMS specific types
export interface KoreanSMSRequest {
  receiver: string; // 수신자 번호
  sender: string; // 발신자 번호
  message: string; // 메시지 내용
  title?: string; // LMS/MMS 제목
  testmode?: boolean; // 테스트 모드
}

export interface AligoSMSResponse {
  result_code: string;
  message: string;
  msg_id?: string;
  success_cnt?: number;
  error_cnt?: number;
  msg_type?: string;
}

export interface SolutionBoxSMSResponse {
  code: string;
  message: string;
  messageId?: string;
  remainPoint?: number;
}