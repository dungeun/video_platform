import { DatabaseAdapter } from '../adapters';
import { UserAccount, ServiceResponse } from '../types';
export declare class AccountValidator {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseAdapter);
    validateEmailUniqueness(email: string, excludeUserId?: string): Promise<ServiceResponse<boolean>>;
    validatePasswordStrength(password: string): Promise<ServiceResponse<{
        isValid: boolean;
        errors: string[];
    }>>;
    validateAccountStatus(userId: string): Promise<ServiceResponse<{
        isValid: boolean;
        issues: string[];
        account: UserAccount | null;
    }>>;
    validateEmailFormat(email: string): Promise<ServiceResponse<boolean>>;
    validateUserExists(userId: string): Promise<ServiceResponse<UserAccount>>;
    validateBulkEmails(emails: string[]): Promise<ServiceResponse<{
        valid: string[];
        invalid: Array<{
            email: string;
            error: string;
        }>;
        duplicates: string[];
        existing: string[];
    }>>;
    validateAccountForLogin(identifier: string): Promise<ServiceResponse<{
        canLogin: boolean;
        account: UserAccount | null;
        reason?: string;
    }>>;
    private findUserById;
    private findUserByEmail;
    private autoUnlockExpiredAccount;
}
//# sourceMappingURL=AccountValidator.d.ts.map