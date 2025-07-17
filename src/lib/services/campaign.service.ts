// Temporary enum replacements
const CampaignStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE', 
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
} as const;

const CampaignPlatform = {
  INSTAGRAM: 'INSTAGRAM',
  YOUTUBE: 'YOUTUBE',
  TIKTOK: 'TIKTOK'
} as const;
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';
import { ApiError } from '@/lib/utils/errors';

// 캠페인 생성 스키마
export const createCampaignSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']),
  budget: z.number().positive(),
  targetFollowers: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  requirements: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

// 캠페인 수정 스키마
export const updateCampaignSchema = createCampaignSchema.partial();

// 캠페인 목록 필터 스키마
export const campaignFilterSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']).optional(),
  minBudget: z.number().optional(),
  maxBudget: z.number().optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
});

// 캠페인 지원 스키마
export const applyCampaignSchema = z.object({
  message: z.string().min(10),
  proposedPrice: z.number().positive().optional(),
});

export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;
export type CampaignFilterDto = z.infer<typeof campaignFilterSchema>;
export type ApplyCampaignDto = z.infer<typeof applyCampaignSchema>;

class CampaignService {
  // 캠페인 생성 (비즈니스 전용)
  async createCampaign(userId: string, data: CreateCampaignDto) {
    // 날짜 유효성 검사
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (startDate >= endDate) {
      throw new ApiError('종료일은 시작일보다 나중이어야 합니다.', 400);
    }
    
    if (startDate < new Date()) {
      throw new ApiError('시작일은 현재 시간보다 나중이어야 합니다.', 400);
    }

    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        businessId: userId,
        status: CampaignStatus.DRAFT,
        hashtags: data.hashtags || [],
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // 캐시 무효화
    await this.invalidateCampaignCache();

    return campaign;
  }

  // 캠페인 목록 조회
  async getCampaigns(filters: CampaignFilterDto, userId?: string, userType?: UserType) {
    const { page, limit, ...whereFilters } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...whereFilters,
    };

    // 비즈니스는 자신의 캠페인만 조회
    if (userType === UserType.BUSINESS) {
      where.businessId = userId;
    } else {
      // 인플루언서는 활성 캠페인만 조회
      where.status = CampaignStatus.ACTIVE;
    }

    // 캐시 확인
    const cacheKey = `campaigns:${JSON.stringify({ where, skip, limit })}`;
    const cached = redis ? await redis.get(cacheKey) : null;
    if (cached) {
      return JSON.parse(cached);
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              profile: true,
            }
          },
          _count: {
            select: {
              applications: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.campaign.count({ where })
    ]);

    const result = {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // 캐시 저장 (5분)
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    }

    return result;
  }

  // 캠페인 상세 조회
  async getCampaignById(id: string, userId?: string, userType?: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          }
        },
        applications: {
          where: userType === 'INFLUENCER' ? {
            influencerId: userId
          } : undefined,
          include: {
            influencer: {
              select: {
                id: true,
                name: true,
                profile: true,
              }
            }
          }
        },
        _count: {
          select: {
            applications: true,
          }
        }
      }
    });

    if (!campaign) {
      throw new ApiError('캠페인을 찾을 수 없습니다.', 404);
    }

    // 비즈니스가 아닌 경우 DRAFT 상태 캠페인 접근 불가
    if (campaign.status === CampaignStatus.DRAFT && campaign.businessId !== userId) {
      throw new ApiError('접근 권한이 없습니다.', 403);
    }

    return campaign;
  }

  // 캠페인 수정 (비즈니스 전용)
  async updateCampaign(id: string, userId: string, data: UpdateCampaignDto) {
    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      throw new ApiError('캠페인을 찾을 수 없습니다.', 404);
    }

    if (campaign.businessId !== userId) {
      throw new ApiError('수정 권한이 없습니다.', 403);
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new ApiError('진행 중인 캠페인은 수정할 수 없습니다.', 400);
    }

    const updateData = {
      ...data,
      hashtags: data.hashtags ? JSON.stringify(data.hashtags) : undefined
    };

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // 캐시 무효화
    await this.invalidateCampaignCache();

    return updated;
  }

  // 캠페인 상태 변경
  async updateCampaignStatus(id: string, userId: string, status: typeof CampaignStatus[keyof typeof CampaignStatus]) {
    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      throw new ApiError('캠페인을 찾을 수 없습니다.', 404);
    }

    if (campaign.businessId !== userId) {
      throw new ApiError('권한이 없습니다.', 403);
    }

    // 상태 전환 검증
    const validTransitions: Record<typeof CampaignStatus[keyof typeof CampaignStatus], typeof CampaignStatus[keyof typeof CampaignStatus][]> = {
      [CampaignStatus.DRAFT]: [CampaignStatus.ACTIVE],
      [CampaignStatus.ACTIVE]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED],
      [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED],
      [CampaignStatus.COMPLETED]: [],
    };

    if (!validTransitions[campaign.status].includes(status)) {
      throw new ApiError('유효하지 않은 상태 변경입니다.', 400);
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status }
    });

    // 캐시 무효화
    await this.invalidateCampaignCache();

    return updated;
  }

  // 캠페인 지원 (인플루언서 전용)
  async applyCampaign(campaignId: string, influencerId: string, data: ApplyCampaignDto) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
      throw new ApiError('지원할 수 없는 캠페인입니다.', 400);
    }

    // 이미 지원했는지 확인
    const existing = await prisma.campaignApplication.findUnique({
      where: {
        campaignId_influencerId: {
          campaignId,
          influencerId
        }
      }
    });

    if (existing) {
      throw new ApiError('이미 지원한 캠페인입니다.', 400);
    }

    const application = await prisma.campaignApplication.create({
      data: {
        campaignId,
        influencerId,
        message: data.message,
        proposedPrice: data.proposedPrice,
        status: 'PENDING'
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            businessId: true,
          }
        },
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // TODO: 비즈니스에게 알림 전송

    return application;
  }

  // 캠페인 삭제
  async deleteCampaign(id: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!campaign) {
      throw new ApiError('캠페인을 찾을 수 없습니다.', 404);
    }

    if (campaign.businessId !== userId) {
      throw new ApiError('삭제 권한이 없습니다.', 403);
    }

    if (campaign._count.applications > 0) {
      throw new ApiError('지원자가 있는 캠페인은 삭제할 수 없습니다.', 400);
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new ApiError('진행 중인 캠페인은 삭제할 수 없습니다.', 400);
    }

    await prisma.campaign.delete({
      where: { id }
    });

    // 캐시 무효화
    await this.invalidateCampaignCache();

    return { success: true };
  }

  // 캐시 무효화 헬퍼
  private async invalidateCampaignCache() {
    if (redis) {
      const keys = await redis.keys('campaigns:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  }
}

export const campaignService = new CampaignService();