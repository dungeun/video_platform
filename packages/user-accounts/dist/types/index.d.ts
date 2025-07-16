import { z } from 'zod';
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
export interface AccountSecuritySettings {
    id: string;
    userId: string;
    requireEmailVerification: boolean;
    passwordExpiryDays?: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireStrongPassword: boolean;
    preventPasswordReuse: number;
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
export declare enum SecurityEventType {
    LOGIN_SUCCESS = "login_success",
    LOGIN_FAILED = "login_failed",
    PASSWORD_CHANGED = "password_changed",
    EMAIL_CHANGED = "email_changed",
    ACCOUNT_LOCKED = "account_locked",
    ACCOUNT_UNLOCKED = "account_unlocked",
    EMAIL_VERIFIED = "email_verified",
    PASSWORD_RESET_REQUESTED = "password_reset_requested",
    PASSWORD_RESET_COMPLETED = "password_reset_completed"
}
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const userAccountCreateSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    emailVerified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    emailVerified: boolean;
    isActive: boolean;
}, {
    email: string;
    password: string;
    emailVerified?: boolean | undefined;
    isActive?: boolean | undefined;
}>;
export declare const userAccountUpdateSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isLocked: z.ZodOptional<z.ZodBoolean>;
    lockReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    isActive?: boolean | undefined;
    isLocked?: boolean | undefined;
    lockReason?: string | undefined;
}, {
    email?: string | undefined;
    isActive?: boolean | undefined;
    isLocked?: boolean | undefined;
    lockReason?: string | undefined;
}>;
export declare const emailChangeSchema: z.ZodObject<{
    newEmail: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newEmail: string;
}, {
    newEmail: string;
}>;
export declare const passwordChangeSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const passwordResetSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const passwordResetConfirmSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    token: string;
}, {
    newPassword: string;
    token: string;
}>;
export type CreateUserAccountInput = z.infer<typeof userAccountCreateSchema>;
export type UpdateUserAccountInput = z.infer<typeof userAccountUpdateSchema>;
export type EmailChangeInput = z.infer<typeof emailChangeSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
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
export declare enum UserAccountErrorCode {
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
    WEAK_PASSWORD = "WEAK_PASSWORD",
    PASSWORD_REUSED = "PASSWORD_REUSED",
    INVALID_RESET_TOKEN = "INVALID_RESET_TOKEN",
    RESET_TOKEN_EXPIRED = "RESET_TOKEN_EXPIRED",
    TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
export declare class UserAccountError extends Error {
    code: UserAccountErrorCode;
    details?: any | undefined;
    constructor(code: UserAccountErrorCode, message: string, details?: any | undefined);
}
//# sourceMappingURL=index.d.ts.map