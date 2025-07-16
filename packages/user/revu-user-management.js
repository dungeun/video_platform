/**
 * Revu Platform User Management Module
 * Extends user-management module for business-influencer platform
 */

const mongoose = require('mongoose');
const validator = require('validator');
const axios = require('axios');

class RevuUserManagement {
  constructor(config) {
    this.config = config;
    this.storageClient = config.storage; // S3 or similar
    this.analyticsClient = config.analytics;
  }

  // 비즈니스 사용자 관리
  async createBusinessProfile(data) {
    try {
      const businessProfile = {
        type: 'business',
        companyName: data.companyName,
        industry: data.industry,
        website: data.website,
        description: data.description,
        location: {
          country: data.location.country,
          city: data.location.city,
          address: data.location.address,
          coordinates: data.location.coordinates
        },
        contact: {
          phone: data.contact.phone,
          email: data.contact.email,
          contactPerson: data.contact.contactPerson
        },
        logo: data.logo,
        settings: {
          campaignApprovalRequired: true,
          autoPaymentEnabled: false,
          notificationPreferences: this.getDefaultNotificationPrefs('business')
        },
        verification: {
          status: 'pending',
          documents: [],
          verifiedAt: null
        },
        stats: {
          campaignsCreated: 0,
          totalSpent: 0,
          avgCampaignBudget: 0,
          collaboratedInfluencers: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 프로필 검증
      this.validateBusinessProfile(businessProfile);

      // 저장 (실제로는 DB에)
      const savedProfile = await this.saveBusinessProfile(businessProfile);

      this.emit('business.profileCreated', { businessId: savedProfile.id, profile: savedProfile });

      return savedProfile;
    } catch (error) {
      throw new Error(`Business profile creation failed: ${error.message}`);
    }
  }

  async updateBusinessProfile(id, data) {
    try {
      const existingProfile = await this.getBusinessProfile(id);
      if (!existingProfile) {
        throw new Error('Business profile not found');
      }

      const updatedData = {
        ...existingProfile,
        ...data,
        updatedAt: new Date()
      };

      this.validateBusinessProfile(updatedData);
      const updatedProfile = await this.saveBusinessProfile(updatedData);

      this.emit('business.profileUpdated', { businessId: id, changes: data });

      return updatedProfile;
    } catch (error) {
      throw new Error(`Business profile update failed: ${error.message}`);
    }
  }

  async verifyBusiness(id, documents) {
    try {
      const verificationResult = await this.processBusinessVerification(documents);
      
      const verificationData = {
        'verification.status': verificationResult.approved ? 'verified' : 'rejected',
        'verification.documents': documents,
        'verification.verifiedAt': verificationResult.approved ? new Date() : null,
        'verification.rejectionReason': verificationResult.rejectionReason,
        updatedAt: new Date()
      };

      await this.updateBusinessProfile(id, verificationData);

      if (verificationResult.approved) {
        // 검증된 비즈니스 권한 부여
        await this.assignBusinessBenefits(id);
        this.emit('business.verified', { businessId: id });
      } else {
        this.emit('business.verificationRejected', { businessId: id, reason: verificationResult.rejectionReason });
      }

      return verificationResult;
    } catch (error) {
      throw new Error(`Business verification failed: ${error.message}`);
    }
  }

  // 인플루언서 사용자 관리
  async createInfluencerProfile(data) {
    try {
      const influencerProfile = {
        type: 'influencer',
        displayName: data.displayName,
        bio: data.bio,
        categories: data.categories || [],
        location: {
          country: data.location.country,
          city: data.location.city,
          timezone: data.location.timezone
        },
        avatar: data.avatar,
        demographics: {
          ageRange: data.demographics.ageRange,
          gender: data.demographics.gender,
          interests: data.demographics.interests || []
        },
        platforms: [], // 나중에 연결
        rates: {
          post: data.rates?.post || 0,
          story: data.rates?.story || 0,
          video: data.rates?.video || 0,
          reel: data.rates?.reel || 0,
          custom: data.rates?.custom || {}
        },
        portfolio: [],
        availability: {
          status: 'available', // available, busy, unavailable
          calendar: [],
          workingHours: data.workingHours || { start: '09:00', end: '18:00' }
        },
        stats: {
          totalFollowers: 0,
          avgEngagementRate: 0,
          completedCampaigns: 0,
          rating: 0,
          responseRate: 100,
          onTimeDelivery: 100
        },
        verification: {
          status: 'pending',
          badges: [],
          verifiedAt: null
        },
        settings: {
          profileVisibility: 'public',
          contactPreferences: data.contactPreferences || 'email',
          notificationPreferences: this.getDefaultNotificationPrefs('influencer')
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.validateInfluencerProfile(influencerProfile);
      const savedProfile = await this.saveInfluencerProfile(influencerProfile);

      this.emit('influencer.profileCreated', { influencerId: savedProfile.id, profile: savedProfile });

      return savedProfile;
    } catch (error) {
      throw new Error(`Influencer profile creation failed: ${error.message}`);
    }
  }

  async connectPlatform(influencerId, platformData) {
    try {
      const { type, handle, accessToken } = platformData;
      
      // 플랫폼별 데이터 가져오기
      const platformStats = await this.fetchPlatformStats(type, handle, accessToken);
      
      const platformConnection = {
        type,
        handle,
        url: this.generatePlatformURL(type, handle),
        accessToken,
        refreshToken: platformData.refreshToken,
        stats: platformStats,
        isVerified: true,
        connectedAt: new Date(),
        lastSyncAt: new Date()
      };

      // 인플루언서 프로필에 플랫폼 정보 추가
      const influencer = await this.getInfluencerProfile(influencerId);
      
      // 기존 플랫폼 연결 확인
      const existingPlatformIndex = influencer.platforms.findIndex(p => p.type === type);
      
      if (existingPlatformIndex >= 0) {
        influencer.platforms[existingPlatformIndex] = platformConnection;
      } else {
        influencer.platforms.push(platformConnection);
      }

      // 전체 통계 업데이트
      influencer.stats = this.calculateOverallStats(influencer.platforms);
      influencer.updatedAt = new Date();

      await this.saveInfluencerProfile(influencer);

      this.emit('platform.connected', { 
        influencerId, 
        platform: type, 
        stats: platformStats 
      });

      return platformConnection;
    } catch (error) {
      throw new Error(`Platform connection failed: ${error.message}`);
    }
  }

  async updateInfluencerStats(influencerId, statsData) {
    try {
      const influencer = await this.getInfluencerProfile(influencerId);
      
      // 플랫폼별 통계 업데이트
      if (statsData.platformStats) {
        for (const [platformType, stats] of Object.entries(statsData.platformStats)) {
          const platformIndex = influencer.platforms.findIndex(p => p.type === platformType);
          if (platformIndex >= 0) {
            influencer.platforms[platformIndex].stats = {
              ...influencer.platforms[platformIndex].stats,
              ...stats
            };
            influencer.platforms[platformIndex].lastSyncAt = new Date();
          }
        }
      }

      // 전체 통계 업데이트
      if (statsData.overallStats) {
        influencer.stats = {
          ...influencer.stats,
          ...statsData.overallStats
        };
      }

      // 성과 기반 통계 업데이트
      if (statsData.performanceStats) {
        influencer.stats.completedCampaigns = statsData.performanceStats.completedCampaigns || influencer.stats.completedCampaigns;
        influencer.stats.rating = statsData.performanceStats.rating || influencer.stats.rating;
        influencer.stats.responseRate = statsData.performanceStats.responseRate || influencer.stats.responseRate;
        influencer.stats.onTimeDelivery = statsData.performanceStats.onTimeDelivery || influencer.stats.onTimeDelivery;
      }

      influencer.updatedAt = new Date();
      await this.saveInfluencerProfile(influencer);

      this.emit('influencer.statsUpdated', { influencerId, stats: influencer.stats });

      return influencer.stats;
    } catch (error) {
      throw new Error(`Stats update failed: ${error.message}`);
    }
  }

  // 포트폴리오 관리
  async addPortfolioItem(influencerId, itemData) {
    try {
      const portfolioItem = {
        id: this.generateId(),
        type: itemData.type, // 'campaign', 'personal', 'collaboration'
        title: itemData.title,
        description: itemData.description,
        media: itemData.media, // URLs to images/videos
        platform: itemData.platform,
        metrics: itemData.metrics, // likes, comments, views, etc.
        campaignId: itemData.campaignId, // if related to a campaign
        tags: itemData.tags || [],
        createdAt: new Date(),
        isVisible: itemData.isVisible !== false
      };

      const influencer = await this.getInfluencerProfile(influencerId);
      influencer.portfolio.push(portfolioItem);
      influencer.updatedAt = new Date();

      await this.saveInfluencerProfile(influencer);

      this.emit('portfolio.itemAdded', { influencerId, item: portfolioItem });

      return portfolioItem;
    } catch (error) {
      throw new Error(`Portfolio item addition failed: ${error.message}`);
    }
  }

  // 검색 및 필터링
  async searchInfluencers(filters) {
    try {
      const searchQuery = this.buildInfluencerSearchQuery(filters);
      const results = await this.executeSearchQuery(searchQuery);

      // 결과에 점수 계산 추가
      const scoredResults = results.map(influencer => ({
        ...influencer,
        matchScore: this.calculateMatchScore(influencer, filters)
      }));

      // 점수순으로 정렬
      scoredResults.sort((a, b) => b.matchScore - a.matchScore);

      return {
        influencers: scoredResults,
        total: scoredResults.length,
        filters: filters,
        searchId: this.generateSearchId()
      };
    } catch (error) {
      throw new Error(`Influencer search failed: ${error.message}`);
    }
  }

  async getInfluencerRecommendations(businessId, campaignType) {
    try {
      const business = await this.getBusinessProfile(businessId);
      const pastCampaigns = await this.getBusinessCampaigns(businessId);

      // AI 기반 추천 로직
      const recommendationCriteria = {
        industry: business.industry,
        pastCollaborations: pastCampaigns,
        campaignType,
        budget: this.estimateBudgetRange(pastCampaigns),
        preferences: business.preferences || {}
      };

      const recommendations = await this.generateAIRecommendations(recommendationCriteria);

      this.emit('recommendations.generated', { businessId, count: recommendations.length });

      return recommendations;
    } catch (error) {
      throw new Error(`Recommendation generation failed: ${error.message}`);
    }
  }

  // 유틸리티 메서드
  async fetchPlatformStats(platformType, handle, accessToken) {
    try {
      switch (platformType) {
        case 'instagram':
          return await this.fetchInstagramStats(handle, accessToken);
        case 'youtube':
          return await this.fetchYouTubeStats(handle, accessToken);
        case 'tiktok':
          return await this.fetchTikTokStats(handle, accessToken);
        case 'blog':
          return await this.fetchBlogStats(handle);
        default:
          throw new Error(`Unsupported platform: ${platformType}`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch ${platformType} stats: ${error.message}`);
    }
  }

  async fetchInstagramStats(handle, accessToken) {
    const response = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'account_type,media_count,followers_count',
        access_token: accessToken
      }
    });

    const mediaResponse = await axios.get(`https://graph.instagram.com/me/media`, {
      params: {
        fields: 'like_count,comments_count,timestamp',
        limit: 20,
        access_token: accessToken
      }
    });

    const engagement = this.calculateEngagementRate(mediaResponse.data.data, response.data.followers_count);

    return {
      followers: response.data.followers_count,
      posts: response.data.media_count,
      engagementRate: engagement,
      avgLikes: engagement.avgLikes,
      avgComments: engagement.avgComments,
      lastUpdated: new Date()
    };
  }

  calculateEngagementRate(posts, followers) {
    if (!posts.length || !followers) return { rate: 0, avgLikes: 0, avgComments: 0 };

    const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
    const avgLikes = totalLikes / posts.length;
    const avgComments = totalComments / posts.length;
    const engagementRate = ((avgLikes + avgComments) / followers * 100).toFixed(2);

    return {
      rate: parseFloat(engagementRate),
      avgLikes: Math.round(avgLikes),
      avgComments: Math.round(avgComments)
    };
  }

  calculateOverallStats(platforms) {
    const totalFollowers = platforms.reduce((sum, platform) => sum + (platform.stats.followers || 0), 0);
    const avgEngagement = platforms.reduce((sum, platform) => sum + (platform.stats.engagementRate || 0), 0) / platforms.length;

    return {
      totalFollowers,
      avgEngagementRate: parseFloat(avgEngagement.toFixed(2)),
      platformCount: platforms.length,
      dominantPlatform: this.findDominantPlatform(platforms)
    };
  }

  calculateMatchScore(influencer, filters) {
    let score = 0;

    // 팔로워 수 매칭
    if (filters.minFollowers && influencer.stats.totalFollowers >= filters.minFollowers) {
      score += 20;
    }

    // 참여율 매칭
    if (filters.minEngagement && influencer.stats.avgEngagementRate >= filters.minEngagement) {
      score += 25;
    }

    // 카테고리 매칭
    if (filters.categories) {
      const matchingCategories = influencer.categories.filter(cat => 
        filters.categories.includes(cat)
      ).length;
      score += (matchingCategories / filters.categories.length) * 30;
    }

    // 위치 매칭
    if (filters.location && influencer.location.country === filters.location.country) {
      score += 15;
    }

    // 플랫폼 매칭
    if (filters.platforms) {
      const matchingPlatforms = influencer.platforms.filter(platform => 
        filters.platforms.includes(platform.type)
      ).length;
      score += (matchingPlatforms / filters.platforms.length) * 10;
    }

    return Math.round(score);
  }

  validateBusinessProfile(profile) {
    if (!profile.companyName || profile.companyName.length < 2) {
      throw new Error('Company name is required and must be at least 2 characters');
    }
    
    if (!profile.industry) {
      throw new Error('Industry is required');
    }

    if (profile.website && !validator.isURL(profile.website)) {
      throw new Error('Invalid website URL');
    }

    if (!profile.contact.email || !validator.isEmail(profile.contact.email)) {
      throw new Error('Valid email is required');
    }
  }

  validateInfluencerProfile(profile) {
    if (!profile.displayName || profile.displayName.length < 2) {
      throw new Error('Display name is required and must be at least 2 characters');
    }

    if (!profile.bio || profile.bio.length < 10) {
      throw new Error('Bio is required and must be at least 10 characters');
    }

    if (!profile.categories || profile.categories.length === 0) {
      throw new Error('At least one category is required');
    }
  }

  getDefaultNotificationPrefs(userType) {
    const commonPrefs = {
      email: true,
      push: true,
      sms: false
    };

    if (userType === 'business') {
      return {
        ...commonPrefs,
        campaignUpdates: true,
        applicationReceived: true,
        contentSubmitted: true,
        paymentReminders: true
      };
    } else {
      return {
        ...commonPrefs,
        newCampaigns: true,
        applicationStatus: true,
        paymentReceived: true,
        ratingReceived: true
      };
    }
  }

  // 이벤트 시스템
  emit(eventName, data) {
    console.log(`Event emitted: ${eventName}`, data);
  }

  // 데이터베이스 상호작용 (실제 구현 필요)
  async saveBusinessProfile(profile) {
    // MongoDB 저장 로직
    return { ...profile, id: this.generateId() };
  }

  async saveInfluencerProfile(profile) {
    // MongoDB 저장 로직
    return { ...profile, id: this.generateId() };
  }

  async getBusinessProfile(id) {
    // MongoDB 조회 로직
  }

  async getInfluencerProfile(id) {
    // MongoDB 조회 로직
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

module.exports = RevuUserManagement;