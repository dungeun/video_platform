import { DatabaseAdapter } from '../adapters';
import { UserAccount, ServiceResponse } from '../types';
export declare class UserAccountDeleter {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseAdapter);
    softDelete(id: string): Promise<ServiceResponse<boolean>>;
    restore(id: string): Promise<ServiceResponse<UserAccount>>;
    hardDelete(id: string): Promise<ServiceResponse<boolean>>;
    bulkSoftDelete(ids: string[]): Promise<ServiceResponse<{
        deleted: number;
        failed: string[];
    }>>;
    purgeOldDeleted(olderThanDays?: number): Promise<ServiceResponse<number>>;
    private findById;
    private findDeletedById;
    private findByIdIncludingDeleted;
    private checkEmailExistsInActive;
    private deleteRelatedData;
}
//# sourceMappingURL=UserAccountDeleter.d.ts.map