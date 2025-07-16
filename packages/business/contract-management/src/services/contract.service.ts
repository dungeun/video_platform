import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  Contract,
  ContractStatus,
  CreateContractParams,
  UpdateContractParams,
  SendOptions,
  SignContractParams,
  SearchFilters,
  ExpiringParams,
  SigningStatus,
  AuditEntry,
  AuditAction,
  Signature,
  Party,
  ContractError,
  SignatureError,
  ValidationError
} from '../types';
import { TemplateService } from './template.service';
import { SignatureService } from './signature.service';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';
import { AuditService } from './audit.service';
import { PDFGenerator } from '../utils/pdf-generator';
import { ContractValidator } from '../utils/validator';

export class ContractService extends EventEmitter {
  private contracts: Map<string, Contract> = new Map();
  private templateService: TemplateService;
  private signatureService: SignatureService;
  private notificationService: NotificationService;
  private storageService: StorageService;
  private auditService: AuditService;
  private pdfGenerator: PDFGenerator;
  private validator: ContractValidator;

  constructor(
    templateService: TemplateService,
    signatureService: SignatureService,
    notificationService: NotificationService,
    storageService: StorageService,
    auditService: AuditService
  ) {
    super();
    this.templateService = templateService;
    this.signatureService = signatureService;
    this.notificationService = notificationService;
    this.storageService = storageService;
    this.auditService = auditService;
    this.pdfGenerator = new PDFGenerator();
    this.validator = new ContractValidator();
  }

  async create(params: CreateContractParams): Promise<Contract> {
    // Validate parameters
    this.validator.validateCreateParams(params);

    let content = params.content || '';
    let title = params.title || 'Untitled Contract';

    // If using template
    if (params.templateId) {
      const template = await this.templateService.get(params.templateId);
      content = await this.templateService.renderTemplate(template, params.variables || {});
      title = template.name;
    }

    // Create contract
    const contract: Contract = {
      id: uuidv4(),
      templateId: params.templateId,
      title,
      content,
      contentHtml: this.generateHtmlContent(content),
      parties: params.parties.map(party => ({
        ...party,
        id: uuidv4(),
        remindersSent: 0
      })),
      status: ContractStatus.DRAFT,
      signatures: [],
      variables: params.variables || {},
      metadata: params.metadata || {},
      tags: params.tags || [],
      version: 1,
      createdBy: 'system', // Should come from auth context
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: []
    };

    // Set expiry if specified
    if (params.expiresIn) {
      contract.expiresAt = new Date();
      contract.expiresAt.setDate(contract.expiresAt.getDate() + params.expiresIn);
    }

    // Store contract
    this.contracts.set(contract.id, contract);
    await this.storageService.saveContract(contract);

    // Create audit entry
    await this.auditService.log({
      contractId: contract.id,
      action: AuditAction.CREATED,
      performedBy: contract.createdBy,
      details: { params }
    });

    // Emit event
    this.emit('contract:created', contract);

    return contract;
  }

  async get(contractId: string): Promise<Contract> {
    let contract = this.contracts.get(contractId);
    
    if (!contract) {
      contract = await this.storageService.getContract(contractId);
      if (!contract) {
        throw new ContractError(`Contract ${contractId} not found`);
      }
      this.contracts.set(contractId, contract);
    }

    return contract;
  }

  async update(contractId: string, updates: UpdateContractParams): Promise<Contract> {
    const contract = await this.get(contractId);

    // Validate updates
    this.validator.validateUpdateParams(updates, contract);

    // Apply updates
    const updatedContract: Contract = {
      ...contract,
      ...updates,
      updatedAt: new Date(),
      version: contract.version + 1
    };

    // Re-render content if variables changed
    if (updates.variables && contract.templateId) {
      const template = await this.templateService.get(contract.templateId);
      updatedContract.content = await this.templateService.renderTemplate(
        template,
        { ...contract.variables, ...updates.variables }
      );
      updatedContract.contentHtml = this.generateHtmlContent(updatedContract.content);
    }

    // Store updated contract
    this.contracts.set(contractId, updatedContract);
    await this.storageService.saveContract(updatedContract);

    // Create audit entry
    await this.auditService.log({
      contractId,
      action: AuditAction.UPDATED,
      performedBy: 'system',
      details: { updates }
    });

    // Emit event
    this.emit('contract:updated', updatedContract);

    return updatedContract;
  }

  async delete(contractId: string): Promise<void> {
    const contract = await this.get(contractId);

    // Only allow deletion of draft contracts
    if (contract.status !== ContractStatus.DRAFT) {
      throw new ContractError('Only draft contracts can be deleted');
    }

    // Delete from storage
    await this.storageService.deleteContract(contractId);
    this.contracts.delete(contractId);

    // Create audit entry
    await this.auditService.log({
      contractId,
      action: AuditAction.DELETED,
      performedBy: 'system',
      details: {}
    });

    // Emit event
    this.emit('contract:deleted', { contractId });
  }

  async send(contractId: string, options: SendOptions): Promise<void> {
    const contract = await this.get(contractId);

    // Validate contract is ready to send
    if (contract.status !== ContractStatus.DRAFT && contract.status !== ContractStatus.APPROVED) {
      throw new ContractError('Contract must be in draft or approved status to send');
    }

    // Update contract status
    await this.update(contractId, {
      status: ContractStatus.SENT
    });

    // Mark as sent
    contract.sentAt = new Date();

    // Send to each party
    for (const party of contract.parties) {
      if (party.role === 'client' || party.role === 'contractor') {
        await this.notificationService.sendContractNotification({
          type: 'contract_sent',
          contractId,
          recipientEmail: party.email,
          subject: options.subject || `Contract: ${contract.title}`,
          message: options.message || 'You have a new contract to review and sign.',
          attachments: options.attachments
        });
      }
    }

    // Schedule reminders
    if (options.reminderDays) {
      for (const days of options.reminderDays) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + days);
        await this.notificationService.scheduleReminder(contractId, reminderDate);
      }
    }

    // Create audit entry
    await this.auditService.log({
      contractId,
      action: AuditAction.SENT,
      performedBy: 'system',
      details: { options }
    });

    // Emit event
    this.emit('contract:sent', contract);
  }

  async sign(params: SignContractParams): Promise<Contract> {
    const contract = await this.get(params.contractId);

    // Find the party
    const party = contract.parties.find(p => p.email === params.signerEmail);
    if (!party) {
      throw new SignatureError('Signer is not a party to this contract');
    }

    // Validate contract can be signed
    if (![ContractStatus.SENT, ContractStatus.VIEWED, ContractStatus.PARTIALLY_SIGNED].includes(contract.status)) {
      throw new SignatureError('Contract is not available for signing');
    }

    // Create and verify signature
    const signature: Signature = {
      id: uuidv4(),
      partyId: party.id,
      type: params.signature.type,
      data: params.signature.data,
      timestamp: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      location: params.location,
      verified: await this.signatureService.verifySignature(params.signature)
    };

    // Add signature to contract
    contract.signatures.push(signature);
    party.signedAt = new Date();

    // Update contract status
    const allPartiesSigned = contract.parties
      .filter(p => p.role === 'client' || p.role === 'contractor')
      .every(p => contract.signatures.some(s => s.partyId === p.id));

    if (allPartiesSigned) {
      contract.status = ContractStatus.SIGNED;
      contract.completedAt = new Date();
    } else {
      contract.status = ContractStatus.PARTIALLY_SIGNED;
    }

    // Save updated contract
    await this.storageService.saveContract(contract);

    // Generate signed PDF
    if (contract.status === ContractStatus.SIGNED) {
      const pdf = await this.generatePDF(contract);
      await this.storageService.saveSignedPDF(contract.id, pdf);
    }

    // Send notifications
    await this.notificationService.sendContractNotification({
      type: 'contract_signed',
      contractId: contract.id,
      recipientEmail: params.signerEmail,
      subject: `Contract Signed: ${contract.title}`,
      message: 'Thank you for signing the contract.'
    });

    // Create audit entry
    await this.auditService.log({
      contractId: contract.id,
      action: AuditAction.SIGNED,
      performedBy: params.signerEmail,
      details: {
        signature: { type: signature.type, verified: signature.verified },
        location: params.location
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });

    // Emit events
    this.emit('contract:signed', { contract, signerEmail: params.signerEmail });
    
    if (contract.status === ContractStatus.SIGNED) {
      this.emit('contract:completed', contract);
    }

    return contract;
  }

  async search(filters: SearchFilters): Promise<Contract[]> {
    // In production, this would query a database
    let contracts = Array.from(this.contracts.values());

    // Apply filters
    if (filters.status) {
      contracts = contracts.filter(c => filters.status!.includes(c.status));
    }

    if (filters.parties) {
      contracts = contracts.filter(c => {
        return c.parties.some(p => {
          if (filters.parties!.email && p.email !== filters.parties!.email) return false;
          if (filters.parties!.type && p.type !== filters.parties!.type) return false;
          if (filters.parties!.name && !p.name.includes(filters.parties!.name)) return false;
          return true;
        });
      });
    }

    if (filters.dateRange) {
      const field = filters.dateRange.field || 'created';
      contracts = contracts.filter(c => {
        let date: Date | undefined;
        switch (field) {
          case 'created': date = c.createdAt; break;
          case 'sent': date = c.sentAt; break;
          case 'signed': date = c.completedAt; break;
          case 'expires': date = c.expiresAt; break;
        }
        if (!date) return false;
        return date >= filters.dateRange!.start && date <= filters.dateRange!.end;
      });
    }

    if (filters.templateId) {
      contracts = contracts.filter(c => c.templateId === filters.templateId);
    }

    if (filters.tags && filters.tags.length > 0) {
      contracts = contracts.filter(c => 
        filters.tags!.some(tag => c.tags?.includes(tag))
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      contracts = contracts.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.content.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (filters.sort) {
      contracts.sort((a, b) => {
        const aVal = (a as any)[filters.sort!.field];
        const bVal = (b as any)[filters.sort!.field];
        const order = filters.sort!.order === 'asc' ? 1 : -1;
        return aVal > bVal ? order : -order;
      });
    }

    // Paginate
    if (filters.offset !== undefined || filters.limit !== undefined) {
      const offset = filters.offset || 0;
      const limit = filters.limit || 10;
      contracts = contracts.slice(offset, offset + limit);
    }

    return contracts;
  }

  async getExpiring(params: ExpiringParams): Promise<Contract[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + params.days);

    const contracts = await this.search({
      status: params.status || [ContractStatus.ACTIVE, ContractStatus.SIGNED],
      dateRange: {
        field: 'expires',
        start: new Date(),
        end: cutoffDate
      }
    });

    if (params.includeRenewable) {
      // Include contracts with renewal dates
      const renewableContracts = Array.from(this.contracts.values())
        .filter(c => {
          if (!c.renewalDate) return false;
          return c.renewalDate >= new Date() && c.renewalDate <= cutoffDate;
        });
      
      contracts.push(...renewableContracts);
    }

    return contracts;
  }

  async getSigningStatus(contractId: string): Promise<SigningStatus> {
    const contract = await this.get(contractId);
    const status: SigningStatus = {};

    for (const party of contract.parties) {
      const signature = contract.signatures.find(s => s.partyId === party.id);
      
      status[party.email] = {
        signed: !!signature,
        sentAt: contract.sentAt,
        viewedAt: party.viewedAt,
        signedAt: signature?.timestamp,
        remindersSent: party.remindersSent || 0,
        lastReminderAt: party.lastReminderAt
      };
    }

    return status;
  }

  async downloadPDF(contractId: string): Promise<Buffer> {
    const contract = await this.get(contractId);

    // Check if signed PDF exists
    if (contract.status === ContractStatus.SIGNED) {
      const signedPDF = await this.storageService.getSignedPDF(contractId);
      if (signedPDF) return signedPDF;
    }

    // Generate PDF on demand
    return this.generatePDF(contract);
  }

  async getAuditTrail(contractId: string): Promise<AuditEntry[]> {
    return this.auditService.getContractAuditTrail(contractId);
  }

  private async generatePDF(contract: Contract): Promise<Buffer> {
    return this.pdfGenerator.generateContractPDF(contract);
  }

  private generateHtmlContent(content: string): string {
    // Convert markdown or plain text to HTML
    // This is a simplified version
    return content
      .split('\n\n')
      .map(paragraph => `<p>${paragraph}</p>`)
      .join('\n');
  }

  // Background tasks
  async checkExpiredContracts(): Promise<void> {
    const now = new Date();
    const contracts = await this.search({
      status: [ContractStatus.SENT, ContractStatus.VIEWED, ContractStatus.PARTIALLY_SIGNED]
    });

    for (const contract of contracts) {
      if (contract.expiresAt && contract.expiresAt < now) {
        await this.update(contract.id, { status: ContractStatus.EXPIRED });
        
        await this.auditService.log({
          contractId: contract.id,
          action: AuditAction.EXPIRED,
          performedBy: 'system',
          details: {}
        });

        this.emit('contract:expired', contract);
      }
    }
  }
}