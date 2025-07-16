import { Contract, Template, ContractError } from '../types';
import crypto from 'crypto';

interface StorageProvider {
  save(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class StorageService {
  private provider: StorageProvider;
  private encryptionKey?: string;

  constructor(provider: StorageProvider, encryptionKey?: string) {
    this.provider = provider;
    this.encryptionKey = encryptionKey;
  }

  async saveContract(contract: Contract): Promise<void> {
    const key = this.getContractKey(contract.id);
    const data = JSON.stringify(contract);
    const buffer = Buffer.from(this.encrypt(data), 'utf8');
    
    await this.provider.save(key, buffer);
  }

  async getContract(contractId: string): Promise<Contract | null> {
    const key = this.getContractKey(contractId);
    const buffer = await this.provider.get(key);
    
    if (!buffer) return null;
    
    const data = this.decrypt(buffer.toString('utf8'));
    return JSON.parse(data);
  }

  async deleteContract(contractId: string): Promise<void> {
    const key = this.getContractKey(contractId);
    await this.provider.delete(key);
  }

  async saveTemplate(template: Template): Promise<void> {
    const key = this.getTemplateKey(template.id);
    const data = JSON.stringify(template);
    const buffer = Buffer.from(data, 'utf8');
    
    await this.provider.save(key, buffer);
  }

  async getTemplate(templateId: string): Promise<Template | null> {
    const key = this.getTemplateKey(templateId);
    const buffer = await this.provider.get(key);
    
    if (!buffer) return null;
    
    return JSON.parse(buffer.toString('utf8'));
  }

  async saveSignedPDF(contractId: string, pdf: Buffer): Promise<void> {
    const key = this.getSignedPDFKey(contractId);
    await this.provider.save(key, pdf);
  }

  async getSignedPDF(contractId: string): Promise<Buffer | null> {
    const key = this.getSignedPDFKey(contractId);
    return this.provider.get(key);
  }

  async saveAttachment(contractId: string, attachmentId: string, data: Buffer): Promise<void> {
    const key = this.getAttachmentKey(contractId, attachmentId);
    await this.provider.save(key, data);
  }

  async getAttachment(contractId: string, attachmentId: string): Promise<Buffer | null> {
    const key = this.getAttachmentKey(contractId, attachmentId);
    return this.provider.get(key);
  }

  private getContractKey(contractId: string): string {
    return `contracts/${contractId}/contract.json`;
  }

  private getTemplateKey(templateId: string): string {
    return `templates/${templateId}/template.json`;
  }

  private getSignedPDFKey(contractId: string): string {
    return `contracts/${contractId}/signed.pdf`;
  }

  private getAttachmentKey(contractId: string, attachmentId: string): string {
    return `contracts/${contractId}/attachments/${attachmentId}`;
  }

  private encrypt(text: string): string {
    if (!this.encryptionKey) return text;

    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedData: string): string {
    if (!this.encryptionKey) return encryptedData;

    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData; // Not encrypted
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// In-memory storage provider for development
export class InMemoryStorageProvider implements StorageProvider {
  private storage: Map<string, Buffer> = new Map();

  async save(key: string, data: Buffer): Promise<void> {
    this.storage.set(key, data);
  }

  async get(key: string): Promise<Buffer | null> {
    return this.storage.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }
}