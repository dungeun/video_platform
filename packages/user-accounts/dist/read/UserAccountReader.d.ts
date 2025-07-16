import { DatabaseAdapter } from '../adapters';
import { UserAccount, ServiceResponse, PaginatedResponse, UseUserAccountsOptions } from '../types';
export declare class UserAccountReader {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseAdapter);
    findById(id: string): Promise<ServiceResponse<UserAccount>>;
    findByEmail(email: string): Promise<ServiceResponse<UserAccount>>;
    findMany(options?: UseUserAccountsOptions): Promise<ServiceResponse<PaginatedResponse<UserAccount>>>;
    exists(email: string): Promise<boolean>;
    countActive(): Promise<number>;
    countLocked(): Promise<number>;
    findRecentlyCreated(days?: number): Promise<ServiceResponse<UserAccount[]>>;
}
//# sourceMappingURL=UserAccountReader.d.ts.map