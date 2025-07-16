import { DatabaseAdapter } from '../adapters';
import { UserAccount, UpdateUserAccountInput, ServiceResponse } from '../types';
export declare class UserAccountUpdater {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseAdapter);
    update(id: string, input: UpdateUserAccountInput): Promise<ServiceResponse<UserAccount>>;
    incrementLoginAttempts(id: string): Promise<ServiceResponse<UserAccount>>;
    resetLoginAttempts(id: string): Promise<ServiceResponse<UserAccount>>;
    lockAccount(id: string, reason?: string, durationMinutes?: number): Promise<ServiceResponse<UserAccount>>;
    unlockAccount(id: string): Promise<ServiceResponse<UserAccount>>;
    private findById;
    private checkEmailExists;
}
//# sourceMappingURL=UserAccountUpdater.d.ts.map