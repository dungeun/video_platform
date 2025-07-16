import { UserAccount, SecurityEventType } from '../types';
/**
 * Check if an account is in a valid state for operations
 */
export declare function isAccountValid(account: UserAccount): boolean;
/**
 * Check if an account can be used for login
 */
export declare function canAccountLogin(account: UserAccount): boolean;
/**
 * Check if an account is temporarily locked (with expiry)
 */
export declare function isAccountTemporarilyLocked(account: UserAccount): boolean;
/**
 * Check if an account lock has expired
 */
export declare function hasAccountLockExpired(account: UserAccount): boolean;
/**
 * Get account status display text
 */
export declare function getAccountStatusText(account: UserAccount): string;
/**
 * Get account status type for styling
 */
export declare function getAccountStatusType(account: UserAccount): 'active' | 'inactive' | 'locked' | 'deleted' | 'unverified';
/**
 * Check if account has excessive failed login attempts
 */
export declare function hasExcessiveFailedAttempts(account: UserAccount, threshold?: number): boolean;
/**
 * Calculate account age in days
 */
export declare function getAccountAgeDays(account: UserAccount): number;
/**
 * Check if account is newly created (within specified days)
 */
export declare function isNewAccount(account: UserAccount, days?: number): boolean;
/**
 * Calculate time since last login
 */
export declare function getTimeSinceLastLogin(account: UserAccount): string | null;
/**
 * Get time until lock expires
 */
export declare function getTimeUntilLockExpiry(account: UserAccount): string | null;
/**
 * Format security event type for display
 */
export declare function formatSecurityEventType(eventType: SecurityEventType): string;
/**
 * Get severity level for security event type
 */
export declare function getSecurityEventSeverity(eventType: SecurityEventType): 'low' | 'medium' | 'high';
/**
 * Sanitize account data for display (remove sensitive information)
 */
export declare function sanitizeAccountForDisplay(account: UserAccount): Omit<UserAccount, 'passwordHash'>;
/**
 * Generate initials from email
 */
export declare function getAccountInitials(account: UserAccount): string;
/**
 * Check if password update is required based on security settings
 */
export declare function isPasswordUpdateRequired(account: UserAccount, passwordExpiryDays?: number): boolean;
/**
 * Calculate account risk score based on various factors
 */
export declare function calculateAccountRiskScore(account: UserAccount): {
    score: number;
    factors: string[];
};
//# sourceMappingURL=accountHelpers.d.ts.map