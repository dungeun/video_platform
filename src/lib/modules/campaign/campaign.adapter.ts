/**
 * Campaign Module Adapter
 * 프론트엔드 Campaign 모듈과 백엔드를 연결하는 어댑터
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from '../../core/DatabaseManager';
import { RedisManager } from '../../core/RedisManager';
import { PrismaClient } from '@prisma/client';

interface AdapterDeps {
  db: DatabaseManager;
  redis: RedisManager;
  eventBus: EventEmitter;
}

export class CampaignModuleAdapter {
  private db: PrismaClient;
  private redis: RedisManager;
  private eventBus: EventEmitter;

  constructor(deps: AdapterDeps) {
    this.db = deps.db.getClient();
    this.redis = deps.redis;
    this.eventBus = deps.eventBus;
  }

  /**
   * 캠페인 생성
   */
  async createCampaign(businessId: string, data: any) {
    try {
      const campaign = await this.db.campaign.create({
        data: {
          businessId,
          title: data.basic.title,
          description: data.basic.description,
          category: data.basic.category,
          objectives: data.basic.objectives,
          startDate: new Date(data.basic.startDate),
          endDate: new Date(data.basic.endDate),
          status: 'DRAFT',
          budget: {
            create: {
              total: data.budget.totalBudget,
              spent: 0,
              paymentType: data.budget.paymentType,
              fixedAmount: data.budget.fixedAmount,
              performanceMetric: data.budget.performanceMetric,
              performanceRate: data.budget.performanceRate,
              maxParticipants: data.budget.maxParticipants,
              paymentTerms: data.budget.paymentTerms
            }
          },
          target: {
            create: {
              minFollowers: data.target.minFollowers,
              maxFollowers: data.target.maxFollowers,
              locations: data.target.locations,
              categories: data.target.categories,
              platforms: data.target.platforms,
              engagementRate: data.target.engagementRate
            }
          },
          content: {
            create: {
              types: data.content.contentType,
              requirements: data.content.requirements,
              guidelines: data.content.guidelines,
              hashtags: data.content.hashtags,
              mentions: data.content.mentions,
              deliverables: data.content.deliverables
            }
          }
        },
        include: {
          budget: true,
          target: true,
          content: true,
          business: {
            select: {
              id: true,
              name: true,
              profile: true
            }
          }
        }
      });

      // 캐시 저장
      await this.redis.set(
        `campaign:${campaign.id}`,
        JSON.stringify(campaign),
        3600 // 1시간
      );

      // 이벤트 발행
      this.eventBus.emit('campaign.created', {
        campaignId: campaign.id,
        businessId,
        title: campaign.title
      });

      return {
        success: true,
        data: campaign
      };
    } catch (error) {
      console.error('Create campaign error:', error);
      return {
        success: false,
        error: 'Failed to create campaign'
      };
    }
  }

  /**
   * 캠페인 목록 조회
   */
  async getCampaigns(filters: {
    status?: string;
    category?: string;
    businessId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.businessId) {
        where.businessId = filters.businessId;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [total, campaigns] = await Promise.all([
        this.db.campaign.count({ where }),
        this.db.campaign.findMany({
          where,
          include: {
            business: {
              select: {
                id: true,
                name: true,
                profile: true
              }
            },
            budget: true,
            _count: {
              select: {
                applications: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        })
      ]);

      return {
        success: true,
        data: {
          items: campaigns,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get campaigns error:', error);
      return {
        success: false,
        error: 'Failed to get campaigns'
      };
    }
  }

  /**
   * 캠페인 상세 조회
   */
  async getCampaignDetail(campaignId: string) {
    try {
      // 캐시 확인
      const cached = await this.redis.get(`campaign:${campaignId}`);
      if (cached) {
        return {
          success: true,
          data: JSON.parse(cached)
        };
      }

      const campaign = await this.db.campaign.findUnique({
        where: { id: campaignId },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              profile: true
            }
          },
          budget: true,
          target: true,
          content: true,
          applications: {
            include: {
              influencer: {
                select: {
                  id: true,
                  name: true,
                  profile: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      });

      if (!campaign) {
        return {
          success: false,
          error: 'Campaign not found'
        };
      }

      // 캐시 저장
      await this.redis.setWithExpiry(
        `campaign:${campaignId}`,
        JSON.stringify(campaign),
        3600
      );

      return {
        success: true,
        data: campaign
      };
    } catch (error) {
      console.error('Get campaign detail error:', error);
      return {
        success: false,
        error: 'Failed to get campaign'
      };
    }
  }

  /**
   * 캠페인 수정
   */
  async updateCampaign(campaignId: string, businessId: string, data: any) {
    try {
      // 권한 확인
      const campaign = await this.db.campaign.findFirst({
        where: {
          id: campaignId,
          businessId
        }
      });

      if (!campaign) {
        return {
          success: false,
          error: 'Campaign not found or unauthorized'
        };
      }

      // 업데이트
      const updated = await this.db.campaign.update({
        where: { id: campaignId },
        data: {
          title: data.basic?.title,
          description: data.basic?.description,
          category: data.basic?.category,
          objectives: data.basic?.objectives,
          startDate: data.basic?.startDate ? new Date(data.basic.startDate) : undefined,
          endDate: data.basic?.endDate ? new Date(data.basic.endDate) : undefined,
          status: data.status,
          budget: data.budget ? {
            update: {
              total: data.budget.totalBudget,
              paymentType: data.budget.paymentType,
              fixedAmount: data.budget.fixedAmount,
              maxParticipants: data.budget.maxParticipants
            }
          } : undefined
        },
        include: {
          budget: true,
          target: true,
          content: true
        }
      });

      // 캐시 무효화
      await this.redis.del(`campaign:${campaignId}`);

      // 이벤트 발행
      this.eventBus.emit('campaign.updated', {
        campaignId,
        businessId,
        changes: data
      });

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      console.error('Update campaign error:', error);
      return {
        success: false,
        error: 'Failed to update campaign'
      };
    }
  }

  /**
   * 캠페인 지원
   */
  async applyCampaign(campaignId: string, influencerId: string, message?: string) {
    try {
      // 중복 지원 확인
      const existing = await this.db.campaignApplication.findFirst({
        where: {
          campaignId,
          influencerId
        }
      });

      if (existing) {
        return {
          success: false,
          error: 'Already applied to this campaign'
        };
      }

      // 캠페인 조건 확인
      const campaign = await this.db.campaign.findUnique({
        where: { id: campaignId },
        include: {
          target: true,
          budget: true,
          _count: {
            select: {
              applications: { where: { status: 'APPROVED' } }
            }
          }
        }
      });

      if (!campaign || campaign.status !== 'ACTIVE') {
        return {
          success: false,
          error: 'Campaign not available'
        };
      }

      // 최대 참여자 수 확인
      if (campaign._count.applications >= campaign.budget!.maxParticipants) {
        return {
          success: false,
          error: 'Campaign is full'
        };
      }

      // 인플루언서 조건 확인
      const influencer = await this.db.user.findUnique({
        where: { id: influencerId },
        include: { profile: true }
      });

      if (!influencer?.profile) {
        return {
          success: false,
          error: 'Influencer profile not found'
        };
      }

      // 팔로워 수 확인
      const followerCount = influencer.profile.followerCount || 0;
      if (
        followerCount < campaign.target!.minFollowers ||
        followerCount > campaign.target!.maxFollowers
      ) {
        return {
          success: false,
          error: 'Does not meet follower requirements'
        };
      }

      // 지원 생성
      const application = await this.db.campaignApplication.create({
        data: {
          campaignId,
          influencerId,
          status: 'PENDING',
          message
        }
      });

      // 이벤트 발행
      this.eventBus.emit('campaign.applied', {
        campaignId,
        influencerId,
        applicationId: application.id
      });

      return {
        success: true,
        data: application
      };
    } catch (error) {
      console.error('Apply campaign error:', error);
      return {
        success: false,
        error: 'Failed to apply to campaign'
      };
    }
  }

  /**
   * 지원자 승인/거절
   */
  async updateApplicationStatus(
    applicationId: string,
    businessId: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ) {
    try {
      // 권한 확인
      const application = await this.db.campaignApplication.findFirst({
        where: {
          id: applicationId,
          campaign: {
            businessId
          }
        },
        include: {
          campaign: true
        }
      });

      if (!application) {
        return {
          success: false,
          error: 'Application not found or unauthorized'
        };
      }

      // 상태 업데이트
      const updated = await this.db.campaignApplication.update({
        where: { id: applicationId },
        data: {
          status,
          reviewedAt: new Date(),
          reviewNote: reason
        }
      });

      // 이벤트 발행
      this.eventBus.emit('application.status.changed', {
        applicationId,
        campaignId: application.campaignId,
        influencerId: application.influencerId,
        status,
        reason
      });

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      console.error('Update application status error:', error);
      return {
        success: false,
        error: 'Failed to update application status'
      };
    }
  }

  /**
   * 캠페인 통계
   */
  async getCampaignStats(campaignId: string, businessId: string) {
    try {
      // 권한 확인
      const campaign = await this.db.campaign.findFirst({
        where: {
          id: campaignId,
          businessId
        }
      });

      if (!campaign) {
        return {
          success: false,
          error: 'Campaign not found or unauthorized'
        };
      }

      // 통계 집계
      const [
        applications,
        approved,
        completed,
        contents
      ] = await Promise.all([
        // 전체 지원자
        this.db.campaignApplication.count({
          where: { campaignId }
        }),
        // 승인된 지원자
        this.db.campaignApplication.count({
          where: { campaignId, status: 'APPROVED' }
        }),
        // 완료된 콘텐츠
        this.db.campaignApplication.count({
          where: { campaignId, status: 'COMPLETED' }
        }),
        // 제출된 콘텐츠
        this.db.content.findMany({
          where: { campaignId },
          include: {
            metrics: true
          }
        })
      ]);

      // 성과 집계
      const totalReach = contents.reduce((sum, c) => sum + (c.metrics?.reach || 0), 0);
      const totalEngagement = contents.reduce((sum, c) => sum + (c.metrics?.engagement || 0), 0);
      const totalConversions = contents.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);

      return {
        success: true,
        data: {
          applications,
          approved,
          completed,
          totalReach,
          totalEngagement,
          totalConversions,
          contents: contents.length
        }
      };
    } catch (error) {
      console.error('Get campaign stats error:', error);
      return {
        success: false,
        error: 'Failed to get campaign stats'
      };
    }
  }

  /**
   * 콘텐츠 제출
   */
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
    try {
      // 지원 상태 확인
      const application = await this.db.campaignApplication.findFirst({
        where: {
          campaignId,
          influencerId,
          status: 'APPROVED'
        }
      });

      if (!application) {
        return {
          success: false,
          error: 'Not approved for this campaign'
        };
      }

      // 콘텐츠 생성
      const content = await this.db.content.create({
        data: {
          campaignId,
          influencerId,
          applicationId: application.id,
          platform: data.platform,
          url: data.url,
          type: data.type,
          caption: data.caption,
          status: 'PENDING_REVIEW'
        }
      });

      // 이벤트 발행
      this.eventBus.emit('content.submitted', {
        contentId: content.id,
        campaignId,
        influencerId
      });

      return {
        success: true,
        data: content
      };
    } catch (error) {
      console.error('Submit content error:', error);
      return {
        success: false,
        error: 'Failed to submit content'
      };
    }
  }

  /**
   * 콘텐츠 승인/거절
   */
  async reviewContent(
    contentId: string,
    businessId: string,
    status: 'APPROVED' | 'REJECTED',
    feedback?: string
  ) {
    try {
      // 권한 확인
      const content = await this.db.content.findFirst({
        where: {
          id: contentId,
          campaign: {
            businessId
          }
        },
        include: {
          campaign: {
            include: {
              budget: true
            }
          },
          application: true
        }
      });

      if (!content) {
        return {
          success: false,
          error: 'Content not found or unauthorized'
        };
      }

      // 콘텐츠 상태 업데이트
      const updated = await this.db.content.update({
        where: { id: contentId },
        data: {
          status,
          reviewedAt: new Date(),
          feedback
        }
      });

      // 승인된 경우 지급 처리 준비
      if (status === 'APPROVED') {
        // 지원 상태를 완료로 변경
        await this.db.campaignApplication.update({
          where: { id: content.applicationId },
          data: { status: 'COMPLETED' }
        });

        // 지급 레코드 생성
        if (content.campaign.budget?.paymentType === 'fixed') {
          await this.db.payment.create({
            data: {
              userId: content.influencerId,
              campaignId: content.campaignId,
              contentId: content.id,
              amount: content.campaign.budget.fixedAmount || 0,
              type: 'CAMPAIGN_REWARD',
              status: 'PENDING',
              orderId: `ORDER_${content.campaignId}_${content.id}_${Date.now()}`
            }
          });
        }
      }

      // 이벤트 발행
      this.eventBus.emit('content.reviewed', {
        contentId,
        status,
        campaignId: content.campaignId,
        influencerId: content.influencerId
      });

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      console.error('Review content error:', error);
      return {
        success: false,
        error: 'Failed to review content'
      };
    }
  }

  /**
   * 인플루언서의 캠페인 목록
   */
  async getInfluencerCampaigns(influencerId: string, status?: string) {
    try {
      const where: any = {
        influencerId
      };

      if (status) {
        where.status = status;
      }

      const applications = await this.db.campaignApplication.findMany({
        where,
        include: {
          campaign: {
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                  profile: true
                }
              },
              budget: true
            }
          },
          contents: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        data: applications
      };
    } catch (error) {
      console.error('Get influencer campaigns error:', error);
      return {
        success: false,
        error: 'Failed to get campaigns'
      };
    }
  }
}