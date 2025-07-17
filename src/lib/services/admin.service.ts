import { UserType, CampaignStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';
import { ApiError } from '@/lib/utils/errors';

// 사용자 상태 변경 스키마
export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
  reason: z.string().optional(),
});

// 사용자 검증 스키마
export const verifyUserSchema = z.object({
  verified: z.boolean(),
  verificationNotes: z.string().optional(),
});

// 캠페인 승인 스키마
export const approveCampaignSchema = z.object({
  approved: z.boolean(),
  feedback: z.string().optional(),
});

// 대시보드 필터 스키마
export const dashboardFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export type VerifyUserDto = z.infer<typeof verifyUserSchema>;
export type ApproveCampaignDto = z.infer<typeof approveCampaignSchema>;
export type DashboardFilterDto = z.infer<typeof dashboardFilterSchema>;

class AdminService {
  // 관리자 권한 확인
  async checkAdminAccess(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { type: true }
    });

    if (!user || user.type !== UserType.BUSINESS) { // 임시로 BUSINESS를 관리자로 사용
      throw new ApiError('관리자 권한이 필요합니다.', 403);
    }

    return true;
  }

  // 대시보드 통계
  async getDashboardStats(filters?: DashboardFilterDto) {
    const where: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [
      totalUsers,
      totalBusinesses,
      totalInfluencers,
      totalCampaigns,
      activeCampaigns,
      totalApplications,
      pendingVerifications,
      recentUsers,
      recentCampaigns,
      revenue
    ] = await Promise.all([
      // 전체 사용자 수
      prisma.user.count({ where }),
      
      // 비즈니스 계정 수
      prisma.user.count({ 
        where: { ...where, type: UserType.BUSINESS }
      }),
      
      // 인플루언서 수
      prisma.user.count({ 
        where: { ...where, type: UserType.INFLUENCER }
      }),
      
      // 전체 캠페인 수
      prisma.campaign.count({ where }),
      
      // 진행 중인 캠페인 수
      prisma.campaign.count({ 
        where: { ...where, status: CampaignStatus.ACTIVE }
      }),
      
      // 전체 지원 수
      prisma.campaignApplication.count({ where }),
      
      // 검증 대기 중인 사용자 수
      prisma.user.count({
        where: {
          OR: [
            { profile: { avatar: false } },
            { profile: { avatar: false } }
          ]
        }
      }),
      
      // 최근 가입 사용자
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          type: true,
          createdAt: true,
          profile: {
            select: { avatar: true }
          }
        }
      }),
      
      // 최근 캠페인
      prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      }),
      
      // 수익 통계 (예시)
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: where.createdAt
        },
        _sum: {
          amount: true
        }
      })
    ]);

    // 성장률 계산 (이전 기간 대비)
    const previousPeriodUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 60)),
          lt: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    });

    const currentPeriodUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    });

    const growthRate = previousPeriodUsers > 0 
      ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers * 100).toFixed(2)
      : '0';

    return {
      overview: {
        totalUsers,
        totalBusinesses,
        totalInfluencers,
        totalCampaigns,
        activeCampaigns,
        totalApplications,
        pendingVerifications,
        revenue: revenue._sum.amount || 0,
        growthRate: `${growthRate}%`
      },
      recentUsers,
      recentCampaigns,
      charts: {
        userGrowth: await this.getUserGrowthData(),
        campaignStats: await this.getCampaignStatsData(),
        revenueChart: await this.getRevenueData()
      }
    };
  }

  // 사용자 성장 차트 데이터
  private async getUserGrowthData() {
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        type: true
      }
    });

    // 날짜별로 그룹화
    const groupedData = users.reduce((acc: any, user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, business: 0, influencer: 0 };
      }
      if (user.type === UserType.BUSINESS) {
        acc[date].business++;
      } else {
        acc[date].influencer++;
      }
      return acc;
    }, {});

    return Object.values(groupedData);
  }

  // 캠페인 통계 차트 데이터
  private async getCampaignStatsData() {
    const campaigns = await prisma.campaign.groupBy({
      by: ['status'],
      _count: true
    });

    return campaigns.map(item => ({
      status: item.status,
      count: item._count
    }));
  }

  // 수익 차트 데이터
  private async getRevenueData() {
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'COMPLETED'
      },
      select: {
        amount: true,
        createdAt: true
      }
    });

    // 날짜별로 그룹화
    const groupedData = payments.reduce((acc: any, payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, amount: 0 };
      }
      acc[date].amount += payment.amount;
      return acc;
    }, {});

    return Object.values(groupedData);
  }

  // 사용자 목록 (고급 필터링)
  async getUsers(filters: {
    type?: UserType;
    status?: string;
    verified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { 
      type, 
      status, 
      verified, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;
    
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (type) where.type = type;
    if (status) where.status = status;
    
    if (verified !== undefined) {
      where.OR = [
        { profile: { avatar: verified } },
        { profile: { avatar: verified } }
      ];
    }
    
    if (search) {
      where.AND = [
        {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { profile: { phone: { contains: search } } },
            { profile: { companyName: { contains: search, mode: 'insensitive' } } }
          ]
        }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          profile: true,
          _count: {
            select: {
              campaigns: true,
              applications: true,
            }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 사용자 상태 변경
  async updateUserStatus(userId: string, data: UpdateUserStatusDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    // 상태 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: data.status,
        statusReason: data.reason,
        statusUpdatedAt: new Date()
      }
    });

    // 차단된 경우 세션 무효화
    if (data.status === 'BANNED' || data.status === 'SUSPENDED') {
      if (redis) {
        await redis.del(`session:${userId}`);
        await redis.del(`refresh:${userId}`);
      }
    }

    return { success: true };
  }

  // 사용자 검증
  async verifyUser(userId: string, data: VerifyUserDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        profile: true
      }
    });

    if (!user) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    if (user.type === UserType.BUSINESS && user.profile) {
      await prisma.profile.update({
        where: { userId },
        data: {
          avatar: data.verified,
          verificationNotes: data.verificationNotes,
          verifiedAt: data.verified ? new Date() : null
        }
      });
    } else if (user.profile) {
      await prisma.profile.update({
        where: { userId },
        data: {
          avatar: data.verified,
          verificationNotes: data.verificationNotes,
          verifiedAt: data.verified ? new Date() : null
        }
      });
    }

    return { success: true };
  }

  // 캠페인 목록 (관리자용)
  async getCampaigns(filters: {
    status?: CampaignStatus;
    businessId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, businessId, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) where.status = status;
    if (businessId) where.businessId = businessId;
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
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
              email: true,
              profile: true
            }
          },
          _count: {
            select: {
              applications: true,
              payments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.campaign.count({ where })
    ]);

    return {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 캠페인 승인/거절
  async reviewCampaign(campaignId: string, data: ApproveCampaignDto) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new ApiError('캠페인을 찾을 수 없습니다.', 404);
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new ApiError('검토 대기 중인 캠페인만 처리할 수 있습니다.', 400);
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: data.approved ? CampaignStatus.ACTIVE : CampaignStatus.DRAFT,
        reviewFeedback: data.feedback,
        reviewedAt: new Date()
      }
    });

    // 캐시 무효화
    if (redis) {
      const keys = await redis.keys('campaigns:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }

    return { success: true };
  }

  // 시스템 로그 조회
  async getSystemLogs(filters: {
    type?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, userId, startDate, endDate, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (type) where.type = type;
    if (userId) where.userId = userId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // 실제로는 로그 테이블에서 조회
    // 여기서는 예시로 activity 로그 구현
    const logs = await prisma.user.findMany({
      where: userId ? { id: userId } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        type: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return {
      logs: logs.map(user => ({
        id: user.id,
        type: 'USER_CREATED',
        userId: user.id,
        userEmail: user.email,
        description: `새로운 ${user.type} 사용자 가입: ${user.name}`,
        createdAt: user.createdAt
      })),
      pagination: {
        page,
        limit,
        total: await prisma.user.count(),
        totalPages: Math.ceil(await prisma.user.count() / limit)
      }
    };
  }
}

export const adminService = new AdminService();