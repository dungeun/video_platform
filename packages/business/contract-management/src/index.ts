import { EventEmitter } from 'events';
import {
  ContractManagementConfig,
  Contract,
  Template,
  CreateContractParams,
  UpdateContractParams,
  SendOptions,
  SignContractParams,
  SearchFilters,
  ExpiringParams,
  SigningStatus,
  AuditEntry,
  CreateTemplateParams,
  TemplateFilters
} from './types';
import { ContractService } from './services/contract.service';
import { TemplateService } from './services/template.service';
import { SignatureService } from './services/signature.service';
import { NotificationService } from './services/notification.service';
import { StorageService, InMemoryStorageProvider } from './services/storage.service';
import { AuditService } from './services/audit.service';

export * from './types';

export class ContractManagement extends EventEmitter {
  public contracts: ContractService;
  public templates: TemplateService;
  private signatureService: SignatureService;
  private notificationService: NotificationService;
  private storageService: StorageService;
  private auditService: AuditService;
  private config: ContractManagementConfig;

  constructor(config: ContractManagementConfig) {
    super();
    this.config = config;

    // Initialize services
    this.storageService = new StorageService(
      new InMemoryStorageProvider(), // In production, use proper storage provider
      config.encryption?.key
    );

    this.signatureService = new SignatureService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();

    this.templates = new TemplateService(this.storageService);
    this.contracts = new ContractService(
      this.templates,
      this.signatureService,
      this.notificationService,
      this.storageService,
      this.auditService
    );

    this.setupEventListeners();
    this.startBackgroundTasks();
  }

  private setupEventListeners(): void {
    // Forward contract events
    this.contracts.on('contract:created', (contract) => {
      this.emit('contract:created', contract);
    });

    this.contracts.on('contract:updated', (contract) => {
      this.emit('contract:updated', contract);
    });

    this.contracts.on('contract:sent', (contract) => {
      this.emit('contract:sent', contract);
    });

    this.contracts.on('contract:signed', (data) => {
      this.emit('contract:signed', data);
    });

    this.contracts.on('contract:completed', (contract) => {
      this.emit('contract:completed', contract);
    });

    this.contracts.on('contract:expired', (contract) => {
      this.emit('contract:expired', contract);
    });

    // Forward template events
    this.templates.on('template:created', (template) => {
      this.emit('template:created', template);
    });

    this.templates.on('template:updated', (template) => {
      this.emit('template:updated', template);
    });

    // Forward notification events
    this.notificationService.on('notification:sent', (notification) => {
      this.emit('notification:sent', notification);
    });

    this.notificationService.on('notification:error', (error) => {
      this.emit('notification:error', error);
    });
  }

  private startBackgroundTasks(): void {
    // Check for expired contracts every hour
    setInterval(async () => {
      try {
        await this.contracts.checkExpiredContracts();
      } catch (error) {
        console.error('Error checking expired contracts:', error);
      }
    }, 60 * 60 * 1000);

    // Check for contracts expiring soon (daily)
    setInterval(async () => {
      try {
        const expiringContracts = await this.contracts.getExpiring({
          days: 7,
          status: ['active', 'signed'] as any
        });

        for (const contract of expiringContracts) {
          this.emit('contract:expiring_soon', contract);
        }
      } catch (error) {
        console.error('Error checking expiring contracts:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  // Convenience methods
  async createContract(params: CreateContractParams): Promise<Contract> {
    return this.contracts.create(params);
  }

  async getContract(contractId: string): Promise<Contract> {
    return this.contracts.get(contractId);
  }

  async updateContract(contractId: string, updates: UpdateContractParams): Promise<Contract> {
    return this.contracts.update(contractId, updates);
  }

  async sendContract(contractId: string, options: SendOptions): Promise<void> {
    return this.contracts.send(contractId, options);
  }

  async signContract(params: SignContractParams): Promise<Contract> {
    return this.contracts.sign(params);
  }

  async searchContracts(filters: SearchFilters): Promise<Contract[]> {
    return this.contracts.search(filters);
  }

  async getExpiringContracts(params: ExpiringParams): Promise<Contract[]> {
    return this.contracts.getExpiring(params);
  }

  async getContractSigningStatus(contractId: string): Promise<SigningStatus> {
    return this.contracts.getSigningStatus(contractId);
  }

  async downloadContractPDF(contractId: string): Promise<Buffer> {
    return this.contracts.downloadPDF(contractId);
  }

  async getContractAuditTrail(contractId: string): Promise<AuditEntry[]> {
    return this.contracts.getAuditTrail(contractId);
  }

  // Template convenience methods
  async createTemplate(params: CreateTemplateParams): Promise<Template> {
    return this.templates.create(params);
  }

  async getTemplate(templateId: string): Promise<Template> {
    return this.templates.get(templateId);
  }

  async listTemplates(filters?: TemplateFilters): Promise<Template[]> {
    return this.templates.list(filters);
  }

  async previewTemplate(templateId: string, variables: Record<string, any>): Promise<string> {
    return this.templates.preview(templateId, variables);
  }

  async duplicateTemplate(templateId: string, name: string): Promise<Template> {
    return this.templates.duplicate(templateId, name);
  }

  // Signature methods
  async generateDigitalCertificate(userId: string): Promise<string> {
    return this.signatureService.generateCertificate(userId);
  }

  async validateSignature(signature: { type: string; data: string }): Promise<boolean> {
    return this.signatureService.verifySignature(signature as any);
  }

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    // Clear intervals
  }
}

// Export factory function
export function createContractManagement(config: ContractManagementConfig): ContractManagement {
  return new ContractManagement(config);
}