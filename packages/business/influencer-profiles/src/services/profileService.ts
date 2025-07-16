import { BaseService } from '@revu/core';
import type {
  InfluencerProfile,
  ProfileSearchParams,
  ProfileFilter,
  SocialAccount,
  InfluencerMetrics,
  Portfolio,
  VerificationDocument
} from '../types';

export class ProfileService extends BaseService {
  async createProfile(data: Partial<InfluencerProfile>): Promise<InfluencerProfile> {
    return this.post<InfluencerProfile>('/influencer-profiles', data);
  }

  async getProfile(profileId: string): Promise<InfluencerProfile> {
    return this.get<InfluencerProfile>(`/influencer-profiles/${profileId}`);
  }

  async getProfileByUserId(userId: string): Promise<InfluencerProfile> {
    return this.get<InfluencerProfile>(`/influencer-profiles/user/${userId}`);
  }

  async updateProfile(
    profileId: string,
    data: Partial<InfluencerProfile>
  ): Promise<InfluencerProfile> {
    return this.put<InfluencerProfile>(`/influencer-profiles/${profileId}`, data);
  }

  async deleteProfile(profileId: string): Promise<void> {
    return this.delete(`/influencer-profiles/${profileId}`);
  }

  async searchProfiles(params: ProfileSearchParams): Promise<{
    profiles: InfluencerProfile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.get('/influencer-profiles/search', { params });
  }

  async getRecommendedProfiles(
    campaignId?: string,
    limit: number = 10
  ): Promise<InfluencerProfile[]> {
    return this.get<InfluencerProfile[]>('/influencer-profiles/recommendations', {
      params: { campaignId, limit }
    });
  }

  async updateSocialAccounts(
    profileId: string,
    accounts: SocialAccount[]
  ): Promise<InfluencerProfile> {
    return this.put<InfluencerProfile>(
      `/influencer-profiles/${profileId}/social-accounts`,
      { accounts }
    );
  }

  async syncSocialMetrics(profileId: string): Promise<InfluencerMetrics> {
    return this.post<InfluencerMetrics>(
      `/influencer-profiles/${profileId}/sync-metrics`
    );
  }

  async updatePortfolio(
    profileId: string,
    portfolio: Partial<Portfolio>
  ): Promise<Portfolio> {
    return this.put<Portfolio>(
      `/influencer-profiles/${profileId}/portfolio`,
      portfolio
    );
  }

  async submitVerificationDocuments(
    profileId: string,
    documents: VerificationDocument[]
  ): Promise<void> {
    return this.post(
      `/influencer-profiles/${profileId}/verification/documents`,
      { documents }
    );
  }

  async requestVerification(profileId: string): Promise<void> {
    return this.post(`/influencer-profiles/${profileId}/verification/request`);
  }

  async updateAvailability(
    profileId: string,
    availability: any
  ): Promise<InfluencerProfile> {
    return this.put<InfluencerProfile>(
      `/influencer-profiles/${profileId}/availability`,
      availability
    );
  }

  async getProfileAnalytics(
    profileId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    return this.get(`/influencer-profiles/${profileId}/analytics`, {
      params: dateRange
    });
  }

  async exportProfiles(filter?: ProfileFilter): Promise<Blob> {
    const response = await this.get('/influencer-profiles/export', {
      params: filter,
      responseType: 'blob'
    });
    return response as Blob;
  }

  async bulkUpdateProfiles(
    profileIds: string[],
    updates: Partial<InfluencerProfile>
  ): Promise<void> {
    return this.put('/influencer-profiles/bulk', { profileIds, updates });
  }

  async getProfileComparison(profileIds: string[]): Promise<any> {
    return this.post('/influencer-profiles/compare', { profileIds });
  }
}