import { SecurityEventType } from '../types';
/**
 * Check if an account is in a valid state for operations
 */
export function isAccountValid(account) {
    return account.isActive && !account.isLocked && !account.deletedAt;
}
/**
 * Check if an account can be used for login
 */
export function canAccountLogin(account) {
    return isAccountValid(account);
}
/**
 * Check if an account is temporarily locked (with expiry)
 */
export function isAccountTemporarilyLocked(account) {
    if (!account.isLocked)
        return false;
    if (!account.lockExpiresAt)
        return true; // Permanent lock
    return new Date() < account.lockExpiresAt;
}
/**
 * Check if an account lock has expired
 */
export function hasAccountLockExpired(account) {
    if (!account.isLocked)
        return false;
    if (!account.lockExpiresAt)
        return false; // Permanent lock
    return new Date() >= account.lockExpiresAt;
}
/**
 * Get account status display text
 */
export function getAccountStatusText(account) {
    if (account.deletedAt)
        return 'Deleted';
    if (account.isLocked) {
        if (hasAccountLockExpired(account)) {
            return 'Lock Expired';
        }
        return `Locked${account.lockReason ? ` (${account.lockReason})` : ''}`;
    }
    if (!account.isActive)
        return 'Inactive';
    if (!account.emailVerified)
        return 'Unverified';
    return 'Active';
}
/**
 * Get account status type for styling
 */
export function getAccountStatusType(account) {
    if (account.deletedAt)
        return 'deleted';
    if (account.isLocked)
        return 'locked';
    if (!account.isActive)
        return 'inactive';
    if (!account.emailVerified)
        return 'unverified';
    return 'active';
}
/**
 * Check if account has excessive failed login attempts
 */
export function hasExcessiveFailedAttempts(account, threshold = 5) {
    return account.loginAttempts >= threshold;
}
/**
 * Calculate account age in days
 */
export function getAccountAgeDays(account) {
    const now = new Date();
    const created = new Date(account.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Check if account is newly created (within specified days)
 */
export function isNewAccount(account, days = 7) {
    return getAccountAgeDays(account) <= days;
}
/**
 * Calculate time since last login
 */
export function getTimeSinceLastLogin(account) {
    if (!account.lastLoginAt)
        return null;
    const now = new Date();
    const lastLogin = new Date(account.lastLoginAt);
    const diffMs = now.getTime() - lastLogin.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0)
        return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0)
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0)
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}
/**
 * Get time until lock expires
 */
export function getTimeUntilLockExpiry(account) {
    if (!account.isLocked || !account.lockExpiresAt)
        return null;
    const now = new Date();
    const expiry = new Date(account.lockExpiresAt);
    if (now >= expiry)
        return 'Expired';
    const diffMs = expiry.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0)
        return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
/**
 * Format security event type for display
 */
export function formatSecurityEventType(eventType) {
    const eventTypeMap = {
        [SecurityEventType.LOGIN_SUCCESS]: 'Login Success',
        [SecurityEventType.LOGIN_FAILED]: 'Login Failed',
        [SecurityEventType.PASSWORD_CHANGED]: 'Password Changed',
        [SecurityEventType.EMAIL_CHANGED]: 'Email Changed',
        [SecurityEventType.ACCOUNT_LOCKED]: 'Account Locked',
        [SecurityEventType.ACCOUNT_UNLOCKED]: 'Account Unlocked',
        [SecurityEventType.EMAIL_VERIFIED]: 'Email Verified',
        [SecurityEventType.PASSWORD_RESET_REQUESTED]: 'Password Reset Requested',
        [SecurityEventType.PASSWORD_RESET_COMPLETED]: 'Password Reset Completed'
    };
    return eventTypeMap[eventType] || eventType;
}
/**
 * Get severity level for security event type
 */
export function getSecurityEventSeverity(eventType) {
    const highSeverityEvents = [
        SecurityEventType.LOGIN_FAILED,
        SecurityEventType.ACCOUNT_LOCKED,
        SecurityEventType.PASSWORD_RESET_REQUESTED
    ];
    const mediumSeverityEvents = [
        SecurityEventType.PASSWORD_CHANGED,
        SecurityEventType.EMAIL_CHANGED,
        SecurityEventType.PASSWORD_RESET_COMPLETED
    ];
    if (highSeverityEvents.includes(eventType))
        return 'high';
    if (mediumSeverityEvents.includes(eventType))
        return 'medium';
    return 'low';
}
/**
 * Sanitize account data for display (remove sensitive information)
 */
export function sanitizeAccountForDisplay(account) {
    const { passwordHash, ...sanitizedAccount } = account;
    return sanitizedAccount;
}
/**
 * Generate initials from email
 */
export function getAccountInitials(account) {
    const email = account.email;
    const parts = email.split('@')[0]?.split(/[.\-_]/);
    if (parts && parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
}
/**
 * Check if password update is required based on security settings
 */
export function isPasswordUpdateRequired(account, passwordExpiryDays) {
    if (!passwordExpiryDays)
        return false;
    const now = new Date();
    const passwordUpdated = new Date(account.passwordUpdatedAt);
    const diffMs = now.getTime() - passwordUpdated.getTime();
    const daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return daysSinceUpdate >= passwordExpiryDays;
}
/**
 * Calculate account risk score based on various factors
 */
export function calculateAccountRiskScore(account) {
    let score = 0;
    const factors = [];
    // Failed login attempts
    if (account.loginAttempts >= 3) {
        score += account.loginAttempts * 5;
        factors.push(`${account.loginAttempts} failed login attempts`);
    }
    // Account age
    const ageDays = getAccountAgeDays(account);
    if (ageDays < 1) {
        score += 20;
        factors.push('Very new account');
    }
    else if (ageDays < 7) {
        score += 10;
        factors.push('New account');
    }
    // Email verification
    if (!account.emailVerified) {
        score += 15;
        factors.push('Unverified email');
    }
    // Account status
    if (account.isLocked) {
        score += 30;
        factors.push('Account is locked');
    }
    if (!account.isActive) {
        score += 25;
        factors.push('Account is inactive');
    }
    // Last login time
    if (account.lastLoginAt) {
        const daysSinceLogin = Math.floor((new Date().getTime() - new Date(account.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLogin > 90) {
            score += 10;
            factors.push('No recent login activity');
        }
    }
    else {
        score += 5;
        factors.push('Never logged in');
    }
    return { score: Math.min(score, 100), factors };
}
//# sourceMappingURL=accountHelpers.js.map