import { DatabaseAdapter } from '../adapters';
import { UserAccount, CreateUserAccountInput, ServiceResponse } from '../types';
export declare class UserAccountCreator {
    private readonly db;
    private readonly logger;
    private readonly saltRounds;
    constructor(db: DatabaseAdapter);
    create(input: CreateUserAccountInput): Promise<ServiceResponse<UserAccount>>;
    private findByEmail;
    private hashPassword;
    private saveUserAccount;
}
//# sourceMappingURL=UserAccountCreator.d.ts.map