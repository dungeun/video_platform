import { v4 as uuidv4 } from 'uuid';
import { AuditEntry, AuditAction } from '../types';

export class AuditService {
  private auditEntries: Map<string, AuditEntry[]> = new Map();

  async log(params: {
    contractId: string;
    action: AuditAction;
    performedBy: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const entry: AuditEntry = {
      id: uuidv4(),
      contractId: params.contractId,
      action: params.action,
      performedBy: params.performedBy,
      performedAt: new Date(),
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    };

    const entries = this.auditEntries.get(params.contractId) || [];
    entries.push(entry);
    this.auditEntries.set(params.contractId, entries);

    // In production, this would persist to a database
    await this.persistAuditEntry(entry);
  }

  async getContractAuditTrail(contractId: string): Promise<AuditEntry[]> {
    const entries = this.auditEntries.get(contractId) || [];
    return entries.sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());
  }

  async getAuditEntriesByUser(userId: string): Promise<AuditEntry[]> {
    const allEntries: AuditEntry[] = [];
    
    for (const entries of this.auditEntries.values()) {
      allEntries.push(...entries.filter(e => e.performedBy === userId));
    }

    return allEntries.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  }

  async getAuditEntriesByAction(action: AuditAction): Promise<AuditEntry[]> {
    const allEntries: AuditEntry[] = [];
    
    for (const entries of this.auditEntries.values()) {
      allEntries.push(...entries.filter(e => e.action === action));
    }

    return allEntries.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  }

  async getAuditEntriesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<AuditEntry[]> {
    const allEntries: AuditEntry[] = [];
    
    for (const entries of this.auditEntries.values()) {
      allEntries.push(...entries.filter(e => 
        e.performedAt >= startDate && e.performedAt <= endDate
      ));
    }

    return allEntries.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  }

  private async persistAuditEntry(entry: AuditEntry): Promise<void> {
    // In production, save to database
    // For now, just log
    console.log('Audit entry:', {
      ...entry,
      details: JSON.stringify(entry.details)
    });
  }

  generateAuditReport(entries: AuditEntry[]): string {
    const report = entries.map(entry => {
      return `${entry.performedAt.toISOString()} - ${entry.action} by ${entry.performedBy}`;
    }).join('\n');

    return `Audit Report\n${'='.repeat(50)}\n${report}`;
  }
}