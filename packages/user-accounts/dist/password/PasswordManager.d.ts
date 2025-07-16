import { DatabaseAdapter } from '../adapters';
import { PasswordResetRequest, PasswordChangeInput, PasswordResetInput, PasswordResetConfirmInput, ServiceResponse } from '../types';
export declare class PasswordManager {
    private readonly db;
    private readonly logger;
    private readonly saltRounds;
    private readonly resetTokenExpiryHours;
    private readonly maxPasswordHistory;
    constructor(db: DatabaseAdapter);
    changePassword(userId: string, input: PasswordChangeInput): Promise<ServiceResponse<boolean>>;
    requestPasswordReset(input: PasswordResetInput): Promise<ServiceResponse<PasswordResetRequest>>;
    resetPassword(input: PasswordResetConfirmInput): Promise<ServiceResponse<boolean>>;
    validatePasswordStrength(password: string): Promise<ServiceResponse<{
        score: number;
        feedback: string[];
    }>>;
    private hashPassword;
    private verifyPassword;
    private generateResetToken;
    private findUserById;
    private findUserByEmail;
    private isPasswordReused;
    private savePasswordToHistory;
    private updateUserPassword;
    private cleanupPasswordHistory;
    private savePasswordResetRequest;
    private findPasswordResetRequest;
    private deletePasswordResetRequest;
    private cancelPendingResetRequests;
    private markResetRequestUsed;
    private resetLoginAttemptsAndUnlock;
    private logSecurityEvent;
}
//# sourceMappingURL=PasswordManager.d.ts.map