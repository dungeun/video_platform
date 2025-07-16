"use strict";
/**
 * Campaign Service
 * 캠페인 관련 비즈니스 로직 처리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
class CampaignService {
    adapter;
    constructor(adapter, eventBus) {
        this.adapter = adapter;
    }
    async createCampaign(businessId, data) {
        return this.adapter.createCampaign(businessId, data);
    }
    async getCampaigns(filters) {
        return this.adapter.getCampaigns(filters);
    }
    async getCampaignDetail(campaignId) {
        return this.adapter.getCampaignDetail(campaignId);
    }
    async updateCampaign(campaignId, businessId, data) {
        return this.adapter.updateCampaign(campaignId, businessId, data);
    }
    async applyCampaign(campaignId, influencerId, message) {
        return this.adapter.applyCampaign(campaignId, influencerId, message);
    }
    async updateApplicationStatus(applicationId, businessId, status, reason) {
        return this.adapter.updateApplicationStatus(applicationId, businessId, status, reason);
    }
    async getCampaignStats(campaignId, businessId) {
        return this.adapter.getCampaignStats(campaignId, businessId);
    }
    async submitContent(campaignId, influencerId, data) {
        return this.adapter.submitContent(campaignId, influencerId, data);
    }
    async reviewContent(contentId, businessId, status, feedback) {
        return this.adapter.reviewContent(contentId, businessId, status, feedback);
    }
    async getInfluencerCampaigns(influencerId, status) {
        return this.adapter.getInfluencerCampaigns(influencerId, status);
    }
}
exports.CampaignService = CampaignService;
