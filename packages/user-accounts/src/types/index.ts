import { z } from 'zod';

// Core User Account Types
export interface UserAccount {
  id: string;
  email: string;
  emailVerified: boolean;
  passwordHash: string;
  passwordUpdatedAt: Date;
  isActive: boolean;
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: Date;
  lockExpiresAt?: Date;
  loginAttempts: number;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Email Management Types
export interface EmailChangeRequest {
  id: string;
  userId: string;
  currentEmail: string;
  newEmail: string;
  verificationToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface EmailVerification {
  id: string;
  email: string;
  token: string;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
  verifiedAt?: Date;
}

// Password Management Types
export interface PasswordHistory {
  id: string;
  userId: string;
  passwordHash: string;
  createdAt: Date;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  token: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

// Security Types
export interface AccountSecuritySettings {
  id: string;
  userId: string;
  requireEmailVerification: boolean;
  passwordExpiryDays?: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  requireStrongPassword: boolean;
  preventPasswordReuse: number; // number of previous passwords to check
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: SecurityEventType;
  description: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  metadata?: Record<string, any> | undefined;
  createdAt: Date;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_CHANGED = 'email_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  EMAIL_VERIFIED = 'email_verified',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed'
}

// Validation Schemas
export const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const userAccountCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  emailVerified: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true)
});

export const userAccountUpdateSchema = z.object({
  email: emailSchema.optional(),
  isActive: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  lockReason: z.string().optional()
});

export const emailChangeSchema = z.object({
  newEmail: emailSchema
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

export const passwordResetSchema = z.object({
  email: emailSchema
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema
});

// Input/Output Types
export type CreateUserAccountInput = z.infer<typeof userAccountCreateSchema>;
export type UpdateUserAccountInput = z.infer<typeof userAccountUpdateSchema>;
export type EmailChangeInput = z.infer<typeof emailChangeSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Hook Types
export interface UseUserAccountsOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface UseUserAccountResult {
  account: UserAccount | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseUserAccountsResult {
  accounts: UserAccount[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  refetch: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
}

// Component Props Types
export interface UserAccountFormProps {
  initialData?: Partial<CreateUserAccountInput>;
  onSubmit: (data: CreateUserAccountInput) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface UserAccountListProps {
  onSelect?: (account: UserAccount) => void;
  onEdit?: (account: UserAccount) => void;
  onDelete?: (account: UserAccount) => void;
  filters?: UseUserAccountsOptions;
}

export interface EmailChangeFormProps {
  onSubmit: (data: EmailChangeInput) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface PasswordChangeFormProps {
  onSubmit: (data: PasswordChangeInput) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface PasswordResetFormProps {
  onSubmit: (data: PasswordResetInput) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface SecuritySettingsFormProps {
  initialData?: Partial<AccountSecuritySettings>;
  onSubmit: (data: Partial<AccountSecuritySettings>) => Promise<void>;
  loading?: boolean;
  error?: string;
}

// Error Types
export enum UserAccountErrorCode {
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_REUSED = 'PASSWORD_REUSED',
  INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN',
  RESET_TOKEN_EXPIRED = 'RESET_TOKEN_EXPIRED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class UserAccountError extends Error {
  constructor(
    public code: UserAccountErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'UserAccountError';
  }
}