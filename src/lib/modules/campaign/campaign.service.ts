/**
 * Campaign Service
 * 캠페인 관련 비즈니스 로직 처리
 */

import { EventEmitter } from 'events';
import { CampaignModuleAdapter } from './campaign.adapter';

export class CampaignService {
  constructor(
    private adapter: CampaignModuleAdapter,
    _eventBus: EventEmitter
  ) {}

  async createCampaign(businessId: string, data: any) {
    return this.adapter.createCampaign(businessId, data);
  }

  async getCampaigns(filters: any) {
    return this.adapter.getCampaigns(filters);
  }

  async getCampaignDetail(campaignId: string) {
    return this.adapter.getCampaignDetail(campaignId);
  }

  async updateCampaign(campaignId: string, businessId: string, data: any) {
    return this.adapter.updateCampaign(campaignId, businessId, data);
  }

  async applyCampaign(campaignId: string, influencerId: string, message?: string) {
    return this.adapter.applyCampaign(campaignId, influencerId, message);
  }

  async updateApplicationStatus(
    applicationId: string,
    businessId: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ) {
    return this.adapter.updateApplicationStatus(applicationId, businessId, status, reason);
  }

  async getCampaignStats(campaignId: string, businessId: string) {
    return this.adapter.getCampaignStats(campaignId, businessId);
  }

  async submitContent(
    campaignId: string,
    influencerId: string,
    data: {
      platform: string;
      url: string;
      type: string;
      caption?: string;
    }
  ) {
    return this.adapter.submitContent(campaignId, influencerId, data);
  }

  async reviewContent(
    contentId: string,
    businessId: string,
    status: 'APPROVED' | 'REJECTED',
    feedback?: string
  ) {
    return this.adapter.reviewContent(contentId, businessId, status, feedback);
  }

  async getInfluencerCampaigns(influencerId: string, status?: string) {
    return this.adapter.getInfluencerCampaigns(influencerId, status);
  }
}