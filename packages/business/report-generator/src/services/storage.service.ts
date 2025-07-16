import { StorageConfig, ReportError } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

interface StorageProvider {
  save(key: string, data: Buffer): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
}

export class StorageService {
  private provider: StorageProvider;

  constructor(config: StorageConfig) {
    this.provider = this.createProvider(config);
  }

  async save(filename: string, data: Buffer): Promise<string> {
    const key = this.generateKey(filename);
    await this.provider.save(key, data);
    return this.provider.getUrl(key);
  }

  async download(url: string): Promise<Buffer> {
    const key = this.extractKeyFromUrl(url);
    return this.provider.download(key);
  }

  async delete(url: string): Promise<void> {
    const key = this.extractKeyFromUrl(url);
    await this.provider.delete(key);
  }

  async exists(url: string): Promise<boolean> {
    const key = this.extractKeyFromUrl(url);
    return this.provider.exists(key);
  }

  private createProvider(config: StorageConfig): StorageProvider {
    switch (config.provider) {
      case 'local':
        return new LocalStorageProvider(config.path || './reports');
      case 's3':
        // In production, this would use AWS SDK
        return new MockS3Provider(config);
      case 'azure':
        // In production, this would use Azure SDK
        return new MockAzureProvider(config);
      case 'gcs':
        // In production, this would use Google Cloud SDK
        return new MockGCSProvider(config);
      default:
        throw new ReportError(`Unsupported storage provider: ${config.provider}`);
    }
  }

  private generateKey(filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `reports/${year}/${month}/${day}/${filename}`;
  }

  private extractKeyFromUrl(url: string): string {
    // Extract key from URL based on provider format
    const match = url.match(/reports\/.*$/);
    return match ? match[0] : url;
  }
}

// Local file system storage provider
class LocalStorageProvider implements StorageProvider {
  constructor(private basePath: string) {}

  async save(key: string, data: Buffer): Promise<string> {
    const fullPath = path.join(this.basePath, key);
    const dir = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });
    
    // Save file
    await fs.writeFile(fullPath, data);
    
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, key);
    
    try {
      return await fs.readFile(fullPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new ReportError('Report file not found');
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, key);
    
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    // In production, this would return a proper URL
    return `file://${path.join(this.basePath, key)}`;
  }
}

// Mock S3 provider for development
class MockS3Provider implements StorageProvider {
  private storage: Map<string, Buffer> = new Map();
  private bucket: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket || 'reports';
  }

  async save(key: string, data: Buffer): Promise<string> {
    this.storage.set(key, data);
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const data = this.storage.get(key);
    if (!data) {
      throw new ReportError('Report file not found');
    }
    return data;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  getUrl(key: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}

// Mock Azure provider for development
class MockAzureProvider implements StorageProvider {
  private storage: Map<string, Buffer> = new Map();

  constructor(private config: StorageConfig) {}

  async save(key: string, data: Buffer): Promise<string> {
    this.storage.set(key, data);
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const data = this.storage.get(key);
    if (!data) {
      throw new ReportError('Report file not found');
    }
    return data;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  getUrl(key: string): string {
    return `https://storage.azure.com/${key}`;
  }
}

// Mock Google Cloud Storage provider for development
class MockGCSProvider implements StorageProvider {
  private storage: Map<string, Buffer> = new Map();

  constructor(private config: StorageConfig) {}

  async save(key: string, data: Buffer): Promise<string> {
    this.storage.set(key, data);
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const data = this.storage.get(key);
    if (!data) {
      throw new ReportError('Report file not found');
    }
    return data;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  getUrl(key: string): string {
    return `https://storage.googleapis.com/${key}`;
  }
}