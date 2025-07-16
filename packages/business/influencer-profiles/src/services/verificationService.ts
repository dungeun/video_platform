import { BaseService } from '@revu/core';
import type {
  VerificationStatus,
  VerificationDocument,
  VerificationLevel,
  DocumentType
} from '../types';

export interface VerificationRequest {
  profileId: string;
  documents: VerificationDocument[];
  additionalInfo?: Record<string, any>;
}

export interface VerificationResult {
  status: 'approved' | 'rejected' | 'pending';
  level: VerificationLevel;
  feedback?: string;
  nextSteps?: string[];
  expiresAt?: Date;
}

export interface VerificationRequirements {
  level: VerificationLevel;
  requiredDocuments: DocumentRequirement[];
  optionalDocuments: DocumentRequirement[];
  criteria: string[];
}

export interface DocumentRequirement {
  type: DocumentType;
  description: string;
  examples: string[];
  maxSizeKB: number;
  acceptedFormats: string[];
}

export class VerificationService extends BaseService {
  async getVerificationStatus(profileId: string): Promise<VerificationStatus> {
    return this.get<VerificationStatus>(
      `/influencer-profiles/${profileId}/verification`
    );
  }

  async submitVerification(
    request: VerificationRequest
  ): Promise<VerificationResult> {
    return this.post<VerificationResult>('/verification/submit', request);
  }

  async uploadDocument(
    profileId: string,
    documentType: DocumentType,
    file: File
  ): Promise<VerificationDocument> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);

    return this.post<VerificationDocument>(
      `/influencer-profiles/${profileId}/verification/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }

  async getVerificationRequirements(
    targetLevel: VerificationLevel
  ): Promise<VerificationRequirements> {
    return this.get<VerificationRequirements>(
      `/verification/requirements/${targetLevel}`
    );
  }

  async getVerificationHistory(profileId: string): Promise<{
    submissions: VerificationSubmission[];
    currentLevel: VerificationLevel;
    levelHistory: LevelChange[];
  }> {
    return this.get(`/influencer-profiles/${profileId}/verification/history`);
  }

  async requestManualReview(
    profileId: string,
    reason: string
  ): Promise<void> {
    return this.post(
      `/influencer-profiles/${profileId}/verification/manual-review`,
      { reason }
    );
  }

  async getVerificationBadges(
    level: VerificationLevel
  ): Promise<{
    badge: string;
    benefits: string[];
    requirements: string[];
  }> {
    return this.get(`/verification/badges/${level}`);
  }

  async checkDocumentStatus(
    profileId: string,
    documentId: string
  ): Promise<VerificationDocument> {
    return this.get<VerificationDocument>(
      `/influencer-profiles/${profileId}/verification/documents/${documentId}`
    );
  }

  async deleteDocument(
    profileId: string,
    documentId: string
  ): Promise<void> {
    return this.delete(
      `/influencer-profiles/${profileId}/verification/documents/${documentId}`
    );
  }

  async getVerificationStats(): Promise<{
    totalVerified: number;
    byLevel: Record<VerificationLevel, number>;
    pendingReviews: number;
    averageProcessingTime: number;
  }> {
    return this.get('/verification/stats');
  }
}

interface VerificationSubmission {
  id: string;
  submittedAt: Date;
  reviewedAt?: Date;
  status: 'approved' | 'rejected' | 'pending';
  reviewer?: string;
  feedback?: string;
  documents: VerificationDocument[];
}

interface LevelChange {
  from: VerificationLevel;
  to: VerificationLevel;
  changedAt: Date;
  reason: string;
}