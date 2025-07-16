import { BaseService } from '@revu/core';
import type {
  ContentBrief,
  ContentRequirement,
  BrandGuideline,
  Deliverable,
  Timeline
} from '../types';

export class BriefService extends BaseService {
  async createBrief(data: Partial<ContentBrief>): Promise<ContentBrief> {
    return this.post<ContentBrief>('/content-briefs', data);
  }

  async getBrief(briefId: string): Promise<ContentBrief> {
    return this.get<ContentBrief>(`/content-briefs/${briefId}`);
  }

  async getBriefByCampaign(campaignId: string): Promise<ContentBrief> {
    return this.get<ContentBrief>(`/content-briefs/campaign/${campaignId}`);
  }

  async updateBrief(
    briefId: string,
    updates: Partial<ContentBrief>
  ): Promise<ContentBrief> {
    return this.put<ContentBrief>(`/content-briefs/${briefId}`, updates);
  }

  async deleteBrief(briefId: string): Promise<void> {
    return this.delete(`/content-briefs/${briefId}`);
  }

  async listBriefs(filter?: {
    campaignId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    briefs: ContentBrief[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.get('/content-briefs', { params: filter });
  }

  async addRequirement(
    briefId: string,
    requirement: ContentRequirement
  ): Promise<ContentBrief> {
    return this.post<ContentBrief>(
      `/content-briefs/${briefId}/requirements`,
      requirement
    );
  }

  async updateRequirement(
    briefId: string,
    requirementIndex: number,
    updates: Partial<ContentRequirement>
  ): Promise<ContentBrief> {
    return this.put<ContentBrief>(
      `/content-briefs/${briefId}/requirements/${requirementIndex}`,
      updates
    );
  }

  async deleteRequirement(
    briefId: string,
    requirementIndex: number
  ): Promise<ContentBrief> {
    return this.delete<ContentBrief>(
      `/content-briefs/${briefId}/requirements/${requirementIndex}`
    );
  }

  async addGuideline(
    briefId: string,
    guideline: BrandGuideline
  ): Promise<ContentBrief> {
    return this.post<ContentBrief>(
      `/content-briefs/${briefId}/guidelines`,
      guideline
    );
  }

  async updateTimeline(
    briefId: string,
    timeline: Timeline[]
  ): Promise<ContentBrief> {
    return this.put<ContentBrief>(
      `/content-briefs/${briefId}/timeline`,
      { timeline }
    );
  }

  async updateDeliverable(
    briefId: string,
    deliverableId: string,
    updates: Partial<Deliverable>
  ): Promise<ContentBrief> {
    return this.put<ContentBrief>(
      `/content-briefs/${briefId}/deliverables/${deliverableId}`,
      updates
    );
  }

  async duplicateBrief(briefId: string): Promise<ContentBrief> {
    return this.post<ContentBrief>(`/content-briefs/${briefId}/duplicate`);
  }

  async generateBriefFromCampaign(
    campaignId: string
  ): Promise<ContentBrief> {
    return this.post<ContentBrief>('/content-briefs/generate', {
      campaignId
    });
  }

  async exportBrief(briefId: string, format: 'pdf' | 'docx'): Promise<Blob> {
    const response = await this.get(`/content-briefs/${briefId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response as Blob;
  }

  async shareBrief(
    briefId: string,
    recipients: string[]
  ): Promise<{ shareUrl: string }> {
    return this.post(`/content-briefs/${briefId}/share`, { recipients });
  }
}