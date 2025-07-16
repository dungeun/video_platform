import { DatabaseAdapter } from '../adapters';
import { EmailVerification, EmailChangeRequest, EmailChangeInput, ServiceResponse } from '../types';
export declare class EmailManager {
    private readonly db;
    private readonly logger;
    private readonly tokenExpiryHours;
    constructor(db: DatabaseAdapter);
    requestEmailChange(userId: string, input: EmailChangeInput): Promise<ServiceResponse<EmailChangeRequest>>;
    confirmEmailChange(token: string): Promise<ServiceResponse<boolean>>;
    sendEmailVerification(userId: string): Promise<ServiceResponse<EmailVerification>>;
    verifyEmail(token: string): Promise<ServiceResponse<boolean>>;
    private generateVerificationToken;
    private findUserById;
    private findUserByEmail;
    private checkEmailExists;
    private saveEmailChangeRequest;
    private findEmailChangeRequest;
    private deleteEmailChangeRequest;
    private cancelPendingEmailChangeRequests;
    private updateUserEmail;
    private saveEmailVerification;
    private findEmailVerification;
    private deleteEmailVerification;
    private cancelPendingEmailVerifications;
    private markEmailVerified;
    private markVerificationUsed;
    private logSecurityEvent;
}
//# sourceMappingURL=EmailManager.d.ts.map