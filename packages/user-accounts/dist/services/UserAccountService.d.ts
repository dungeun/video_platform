import { DatabaseAdapter } from '../adapters';
import { UserAccount, CreateUserAccountInput, UpdateUserAccountInput, EmailChangeInput, PasswordChangeInput, PasswordResetInput, PasswordResetConfirmInput, ServiceResponse, PaginatedResponse, UseUserAccountsOptions, AccountSecuritySettings, SecurityEvent, SecurityEventType } from '../types';
export declare class UserAccountService {
    private readonly db;
    private readonly logger;
    private readonly creator;
    private readonly reader;
    private readonly updater;
    private readonly deleter;
    private readonly emailManager;
    private readonly passwordManager;
    private readonly validator;
    private readonly securityManager;
    constructor(db: DatabaseAdapter);
    createAccount(input: CreateUserAccountInput): Promise<ServiceResponse<UserAccount>>;
    getAccount(id: string): Promise<ServiceResponse<UserAccount>>;
    getAccountByEmail(email: string): Promise<ServiceResponse<UserAccount>>;
    getAccounts(options?: UseUserAccountsOptions): Promise<ServiceResponse<PaginatedResponse<UserAccount>>>;
    updateAccount(id: string, input: UpdateUserAccountInput): Promise<ServiceResponse<UserAccount>>;
    deleteAccount(id: string): Promise<ServiceResponse<boolean>>;
    restoreAccount(id: string): Promise<ServiceResponse<UserAccount>>;
    permanentlyDeleteAccount(id: string): Promise<ServiceResponse<boolean>>;
    requestEmailChange(userId: string, input: EmailChangeInput): Promise<ServiceResponse<any>>;
    confirmEmailChange(token: string): Promise<ServiceResponse<boolean>>;
    sendEmailVerification(userId: string): Promise<ServiceResponse<any>>;
    verifyEmail(token: string): Promise<ServiceResponse<boolean>>;
    changePassword(userId: string, input: PasswordChangeInput): Promise<ServiceResponse<boolean>>;
    requestPasswordReset(input: PasswordResetInput): Promise<ServiceResponse<any>>;
    resetPassword(input: PasswordResetConfirmInput): Promise<ServiceResponse<boolean>>;
    validatePasswordStrength(password: string): Promise<ServiceResponse<any>>;
    validateEmailUniqueness(email: string, excludeUserId?: string): Promise<ServiceResponse<boolean>>;
    validateAccountStatus(userId: string): Promise<ServiceResponse<any>>;
    validateAccountForLogin(identifier: string): Promise<ServiceResponse<any>>;
    getSecuritySettings(userId: string): Promise<ServiceResponse<AccountSecuritySettings>>;
    updateSecuritySettings(userId: string, updates: Partial<AccountSecuritySettings>): Promise<ServiceResponse<AccountSecuritySettings>>;
    logSecurityEvent(userId: string, eventType: SecurityEventType, description: string, metadata?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<ServiceResponse<SecurityEvent>>;
    getSecurityEvents(userId: string, options?: any): Promise<ServiceResponse<any>>;
    checkSuspiciousActivity(userId: string): Promise<ServiceResponse<any>>;
    enforceSecurityPolicy(userId: string): Promise<ServiceResponse<any>>;
    lockAccount(id: string, reason?: string, durationMinutes?: number): Promise<ServiceResponse<UserAccount>>;
    unlockAccount(id: string): Promise<ServiceResponse<UserAccount>>;
    incrementLoginAttempts(id: string): Promise<ServiceResponse<UserAccount>>;
    resetLoginAttempts(id: string): Promise<ServiceResponse<UserAccount>>;
    bulkDeleteAccounts(ids: string[]): Promise<ServiceResponse<any>>;
    validateBulkEmails(emails: string[]): Promise<ServiceResponse<any>>;
    purgeOldDeletedAccounts(olderThanDays?: number): Promise<ServiceResponse<number>>;
    getAccountStats(): Promise<ServiceResponse<{
        total: number;
        active: number;
        locked: number;
        unverified: number;
        recentlyCreated: number;
    }>>;
    healthCheck(): Promise<ServiceResponse<{
        status: string;
        timestamp: Date;
    }>>;
}
//# sourceMappingURL=UserAccountService.d.ts.map