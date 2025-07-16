import { TokenResponse } from '../types';
import crypto from 'crypto';

interface StoredToken extends TokenResponse {
  expiresAt: Date;
  encryptedRefreshToken?: string;
}

export class TokenManager {
  private tokens: Map<string, StoredToken> = new Map();
  private platform: string;
  private encryptionKey: string;

  constructor(platform: string) {
    this.platform = platform;
    this.encryptionKey = process.env.SOCIAL_MEDIA_ENCRYPTION_KEY || 'default-encryption-key';
  }

  async saveToken(userId: string, token: TokenResponse): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + token.expiresIn);

    const storedToken: StoredToken = {
      ...token,
      expiresAt,
      encryptedRefreshToken: token.refreshToken 
        ? this.encrypt(token.refreshToken)
        : undefined
    };

    // Remove plain refresh token
    delete storedToken.refreshToken;

    this.tokens.set(this.getKey(userId), storedToken);
    
    // In production, this would persist to a database
    await this.persistToken(userId, storedToken);
  }

  async getToken(userId: string): Promise<TokenResponse | null> {
    let token = this.tokens.get(this.getKey(userId));
    
    if (!token) {
      // Try to load from persistent storage
      token = await this.loadToken(userId);
      if (token) {
        this.tokens.set(this.getKey(userId), token);
      }
    }

    if (!token) return null;

    // Check if token is expired
    if (new Date() >= token.expiresAt) {
      return null;
    }

    // Decrypt refresh token if exists
    const refreshToken = token.encryptedRefreshToken
      ? this.decrypt(token.encryptedRefreshToken)
      : undefined;

    return {
      ...token,
      refreshToken
    };
  }

  async deleteToken(userId: string): Promise<void> {
    this.tokens.delete(this.getKey(userId));
    await this.removePersistedToken(userId);
  }

  async isTokenValid(userId: string): Promise<boolean> {
    const token = await this.getToken(userId);
    return token !== null;
  }

  private getKey(userId: string): string {
    return `${this.platform}:${userId}`;
  }

  private encrypt(text: string): string {
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
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Persistence methods (would connect to database in production)
  private async persistToken(userId: string, token: StoredToken): Promise<void> {
    // In production, save to database
    // For now, we'll use in-memory storage
  }

  private async loadToken(userId: string): Promise<StoredToken | null> {
    // In production, load from database
    return null;
  }

  private async removePersistedToken(userId: string): Promise<void> {
    // In production, remove from database
  }
}