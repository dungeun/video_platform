import { DatabaseAdapter } from '../adapters';
import { AccountSecuritySettings, SecurityEvent, SecurityEventType, ServiceResponse } from '../types';
export declare class SecurityManager {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseAdapter);
    getSecuritySettings(userId: string): Promise<ServiceResponse<AccountSecuritySettings>>;
    updateSecuritySettings(userId: string, updates: Partial<AccountSecuritySettings>): Promise<ServiceResponse<AccountSecuritySettings>>;
    logSecurityEvent(userId: string, eventType: SecurityEventType, description: string, metadata?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<ServiceResponse<SecurityEvent>>;
    getSecurityEvents(userId: string, options?: {
        limit?: number;
        offset?: number;
        eventTypes?: SecurityEventType[];
        fromDate?: Date;
        toDate?: Date;
    }): Promise<ServiceResponse<{
        events: SecurityEvent[];
        total: number;
    }>>;
    checkSuspiciousActivity(userId: string): Promise<ServiceResponse<{
        isSuspicious: boolean;
        reasons: string[];
        riskScore: number;
    }>>;
    enforceSecurityPolicy(userId: string): Promise<ServiceResponse<{
        actions: string[];
        locked: boolean;
    }>>;
    private findSecuritySettings;
    private createDefaultSecuritySettings;
    private saveSecuritySettings;
    private saveSecurityEvent;
    private countRecentEvents;
    private getRecentLoginEvents;
    private findUserById;
    private checkUserExists;
    private lockAccountForSuspiciousActivity;
    private lockAccountForFailedAttempts;
}
//# sourceMappingURL=SecurityManager.d.ts.map