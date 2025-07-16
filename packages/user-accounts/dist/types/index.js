import { z } from 'zod';
export var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["LOGIN_SUCCESS"] = "login_success";
    SecurityEventType["LOGIN_FAILED"] = "login_failed";
    SecurityEventType["PASSWORD_CHANGED"] = "password_changed";
    SecurityEventType["EMAIL_CHANGED"] = "email_changed";
    SecurityEventType["ACCOUNT_LOCKED"] = "account_locked";
    SecurityEventType["ACCOUNT_UNLOCKED"] = "account_unlocked";
    SecurityEventType["EMAIL_VERIFIED"] = "email_verified";
    SecurityEventType["PASSWORD_RESET_REQUESTED"] = "password_reset_requested";
    SecurityEventType["PASSWORD_RESET_COMPLETED"] = "password_reset_completed";
})(SecurityEventType || (SecurityEventType = {}));
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
// Error Types
export var UserAccountErrorCode;
(function (UserAccountErrorCode) {
    UserAccountErrorCode["EMAIL_ALREADY_EXISTS"] = "EMAIL_ALREADY_EXISTS";
    UserAccountErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    UserAccountErrorCode["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    UserAccountErrorCode["ACCOUNT_INACTIVE"] = "ACCOUNT_INACTIVE";
    UserAccountErrorCode["EMAIL_NOT_VERIFIED"] = "EMAIL_NOT_VERIFIED";
    UserAccountErrorCode["WEAK_PASSWORD"] = "WEAK_PASSWORD";
    UserAccountErrorCode["PASSWORD_REUSED"] = "PASSWORD_REUSED";
    UserAccountErrorCode["INVALID_RESET_TOKEN"] = "INVALID_RESET_TOKEN";
    UserAccountErrorCode["RESET_TOKEN_EXPIRED"] = "RESET_TOKEN_EXPIRED";
    UserAccountErrorCode["TOO_MANY_ATTEMPTS"] = "TOO_MANY_ATTEMPTS";
    UserAccountErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    UserAccountErrorCode["NOT_FOUND"] = "NOT_FOUND";
    UserAccountErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(UserAccountErrorCode || (UserAccountErrorCode = {}));
export class UserAccountError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'UserAccountError';
    }
}
//# sourceMappingURL=index.js.map