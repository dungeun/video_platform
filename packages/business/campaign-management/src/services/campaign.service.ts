/**
 * @repo/campaign-management - Campaign Service
 */

import { EventBus } from '@repo/core';
import { ApiClient } from '@repo/utils';
import { 
  Campaign, 
  CreateCampaignRequest, 
  UpdateCampaignRequest, 
  CampaignFilters,
  CampaignStatus,
  CampaignAction,
  CampaignActionRequest,
  CampaignEvent,
  CampaignEventType,
  Participant,
  ParticipantStatus,
  ContentStatus,
  ApplicantFilters,
  ID
} from '../types';

export interface CampaignServiceConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
}

export class CampaignService {
  private apiClient: ApiClient;
  private eventBus: EventBus;
  private config: CampaignServiceConfig;

  constructor(config: CampaignServiceConfig) {
    this.config = config;
    this.apiClient = new ApiClient({
      baseURL: config.apiUrl,
      headers: config.apiKey ? { 'X-API-Key': config.apiKey } : {},
      timeout: config.timeout || 30000
    });
    this.eventBus = EventBus.getInstance();
  }

  // ===== Campaign CRUD Operations =====
  
  async createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
    try {
      const campaign = await this.apiClient.post<Campaign>('/campaigns', data);
      
      this.emitEvent(CampaignEventType.CREATED, campaign.id, campaign);
      
      return campaign;
    } catch (error) {
      throw this.handleError('Failed to create campaign', error);
    }
  }

  async updateCampaign(data: UpdateCampaignRequest): Promise<Campaign> {
    try {
      const { id, ...updateData } = data;
      const campaign = await this.apiClient.put<Campaign>(`/campaigns/${id}`, updateData);
      
      this.emitEvent(CampaignEventType.UPDATED, campaign.id, campaign);
      
      return campaign;
    } catch (error) {
      throw this.handleError('Failed to update campaign', error);
    }
  }

  async deleteCampaign(id: ID): Promise<void> {
    try {
      await this.apiClient.delete(`/campaigns/${id}`);
    } catch (error) {
      throw this.handleError('Failed to delete campaign', error);
    }
  }

  async getCampaign(id: ID): Promise<Campaign> {
    try {
      return await this.apiClient.get<Campaign>(`/campaigns/${id}`);
    } catch (error) {
      throw this.handleError('Failed to get campaign', error);
    }
  }

  async listCampaigns(filters?: CampaignFilters): Promise<{
    campaigns: Campaign[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const params = this.buildFilterParams(filters);
      return await this.apiClient.get('/campaigns', { params });
    } catch (error) {
      throw this.handleError('Failed to list campaigns', error);
    }
  }

  async cloneCampaign(id: ID): Promise<Campaign> {
    try {
      const campaign = await this.apiClient.post<Campaign>(`/campaigns/${id}/clone`);
      
      this.emitEvent(CampaignEventType.CREATED, campaign.id, {
        ...campaign,
        clonedFrom: id
      });
      
      return campaign;
    } catch (error) {
      throw this.handleError('Failed to clone campaign', error);
    }
  }

  // ===== Campaign Status Management =====

  async updateCampaignStatus(id: ID, status: CampaignStatus): Promise<Campaign> {
    try {
      const campaign = await this.apiClient.patch<Campaign>(`/campaigns/${id}/status`, { status });
      
      this.emitEvent(CampaignEventType.STATUS_CHANGED, id, {
        oldStatus: campaign.status,
        newStatus: status
      });
      
      return campaign;
    } catch (error) {
      throw this.handleError('Failed to update campaign status', error);
    }
  }

  async performAction(request: CampaignActionRequest): Promise<Campaign> {
    try {
      const { campaignId, action, reason, data } = request;
      
      switch (action) {
        case CampaignAction.PUBLISH:
          return await this.updateCampaignStatus(campaignId, CampaignStatus.RECRUITING);
          
        case CampaignAction.PAUSE:
          return await this.updateCampaignStatus(campaignId, CampaignStatus.PAUSED);
          
        case CampaignAction.RESUME:
          const campaign = await this.getCampaign(campaignId);
          const newStatus = this.determineResumeStatus(campaign);
          return await this.updateCampaignStatus(campaignId, newStatus);
          
        case CampaignAction.CANCEL:
          return await this.apiClient.post<Campaign>(`/campaigns/${campaignId}/cancel`, { reason });
          
        case CampaignAction.COMPLETE:
          return await this.updateCampaignStatus(campaignId, CampaignStatus.COMPLETED);
          
        case CampaignAction.SETTLE:
          return await this.apiClient.post<Campaign>(`/campaigns/${campaignId}/settle`, data);
          
        case CampaignAction.CLONE:
          return await this.cloneCampaign(campaignId);
          
        default:
          throw new Error(`Unknown campaign action: ${action}`);
      }
    } catch (error) {
      throw this.handleError('Failed to perform campaign action', error);
    }
  }

  // ===== Participant Management =====

  async getApplicants(filters: ApplicantFilters): Promise<{
    applicants: Participant[];
    total: number;
  }> {
    try {
      const { campaignId, ...params } = filters;
      return await this.apiClient.get(`/campaigns/${campaignId}/applicants`, { params });
    } catch (error) {
      throw this.handleError('Failed to get applicants', error);
    }
  }

  async approveApplicant(campaignId: ID, applicantId: ID, budget?: number): Promise<void> {
    try {
      await this.apiClient.post(`/campaigns/${campaignId}/applicants/${applicantId}/approve`, { budget });
      
      this.emitEvent(CampaignEventType.PARTICIPANT_APPROVED, campaignId, { applicantId });
    } catch (error) {
      throw this.handleError('Failed to approve applicant', error);
    }
  }

  async rejectApplicant(campaignId: ID, applicantId: ID, reason?: string): Promise<void> {
    try {
      await this.apiClient.post(`/campaigns/${campaignId}/applicants/${applicantId}/reject`, { reason });
      
      this.emitEvent(CampaignEventType.PARTICIPANT_REJECTED, campaignId, { applicantId, reason });
    } catch (error) {
      throw this.handleError('Failed to reject applicant', error);
    }
  }

  async removeParticipant(campaignId: ID, participantId: ID, reason?: string): Promise<void> {
    try {
      await this.apiClient.delete(`/campaigns/${campaignId}/participants/${participantId}`, {
        data: { reason }
      });
    } catch (error) {
      throw this.handleError('Failed to remove participant', error);
    }
  }

  async updateParticipantBudget(campaignId: ID, participantId: ID, budget: number): Promise<void> {
    try {
      await this.apiClient.patch(`/campaigns/${campaignId}/participants/${participantId}/budget`, { budget });
      
      this.emitEvent(CampaignEventType.BUDGET_UPDATED, campaignId, { participantId, budget });
    } catch (error) {
      throw this.handleError('Failed to update participant budget', error);
    }
  }

  // ===== Content Management =====

  async approveContent(campaignId: ID, participantId: ID, contentId: ID): Promise<void> {
    try {
      await this.apiClient.post(
        `/campaigns/${campaignId}/participants/${participantId}/content/${contentId}/approve`
      );
      
      this.emitEvent(CampaignEventType.CONTENT_APPROVED, campaignId, { participantId, contentId });
    } catch (error) {
      throw this.handleError('Failed to approve content', error);
    }
  }

  async rejectContent(
    campaignId: ID, 
    participantId: ID, 
    contentId: ID, 
    feedback: string
  ): Promise<void> {
    try {
      await this.apiClient.post(
        `/campaigns/${campaignId}/participants/${participantId}/content/${contentId}/reject`,
        { feedback }
      );
      
      this.emitEvent(CampaignEventType.CONTENT_REJECTED, campaignId, { 
        participantId, 
        contentId, 
        feedback 
      });
    } catch (error) {
      throw this.handleError('Failed to reject content', error);
    }
  }

  async updateContentMetrics(
    campaignId: ID,
    participantId: ID,
    contentId: ID,
    metrics: any
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `/campaigns/${campaignId}/participants/${participantId}/content/${contentId}/metrics`,
        metrics
      );
      
      this.emitEvent(CampaignEventType.METRICS_UPDATED, campaignId, {
        participantId,
        contentId,
        metrics
      });
    } catch (error) {
      throw this.handleError('Failed to update content metrics', error);
    }
  }

  // ===== Budget Management =====

  async getBudgetAllocation(campaignId: ID): Promise<{
    total: number;
    allocated: number;
    spent: number;
    remaining: number;
    participants: Array<{
      participantId: ID;
      allocated: number;
      spent: number;
      status: PaymentStatus;
    }>;
  }> {
    try {
      return await this.apiClient.get(`/campaigns/${campaignId}/budget`);
    } catch (error) {
      throw this.handleError('Failed to get budget allocation', error);
    }
  }

  async updateBudget(campaignId: ID, budget: Partial<CampaignBudget>): Promise<void> {
    try {
      await this.apiClient.patch(`/campaigns/${campaignId}/budget`, budget);
      
      this.emitEvent(CampaignEventType.BUDGET_UPDATED, campaignId, budget);
    } catch (error) {
      throw this.handleError('Failed to update budget', error);
    }
  }

  // ===== Analytics =====

  async getCampaignMetrics(campaignId: ID): Promise<CampaignMetrics> {
    try {
      return await this.apiClient.get(`/campaigns/${campaignId}/metrics`);
    } catch (error) {
      throw this.handleError('Failed to get campaign metrics', error);
    }
  }

  async exportCampaignReport(campaignId: ID, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    try {
      return await this.apiClient.get(`/campaigns/${campaignId}/export`, {
        params: { format },
        responseType: 'blob'
      });
    } catch (error) {
      throw this.handleError('Failed to export campaign report', error);
    }
  }

  // ===== Helper Methods =====

  private buildFilterParams(filters?: CampaignFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.status?.length) {
      params.status = filters.status.join(',');
    }
    
    if (filters.brandId) {
      params.brandId = filters.brandId;
    }
    
    if (filters.category?.length) {
      params.category = filters.category.join(',');
    }
    
    if (filters.minBudget !== undefined) {
      params.minBudget = filters.minBudget;
    }
    
    if (filters.maxBudget !== undefined) {
      params.maxBudget = filters.maxBudget;
    }
    
    if (filters.dateRange) {
      params.startDate = filters.dateRange.start.toISOString();
      params.endDate = filters.dateRange.end.toISOString();
    }
    
    if (filters.search) {
      params.search = filters.search;
    }

    return params;
  }

  private determineResumeStatus(campaign: Campaign): CampaignStatus {
    const now = new Date();
    
    if (now < campaign.period.recruitStart) {
      return CampaignStatus.PENDING;
    } else if (now >= campaign.period.recruitStart && now < campaign.period.recruitEnd) {
      return CampaignStatus.RECRUITING;
    } else if (now >= campaign.period.campaignStart && now < campaign.period.campaignEnd) {
      return CampaignStatus.ACTIVE;
    } else {
      return CampaignStatus.COMPLETED;
    }
  }

  private emitEvent(type: CampaignEventType, campaignId: ID, data: any): void {
    const event: CampaignEvent = {
      type,
      campaignId,
      data,
      timestamp: new Date(),
      userId: 'system' // Should be replaced with actual user ID from auth context
    };
    
    this.eventBus.emit(type, event);
  }

  private handleError(message: string, error: any): Error {
    console.error(`[CampaignService] ${message}:`, error);
    
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    return new Error(message);
  }
}

// ===== Type imports for service =====
import { CampaignBudget, CampaignMetrics, PaymentStatus } from '../types';