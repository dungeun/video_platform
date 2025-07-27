import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, createAuthResponse, createErrorResponse } from '@/lib/auth-middleware';
import { validateRequest, paginationSchema, formatValidationErrors } from '@/lib/validation';
import { z } from 'zod';
import { CAMPAIGN_FIELD_DEFAULTS } from '@/lib/db/campaign-fields';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/campaigns - 캠페인 목록 조회
// GET /api/campaigns - 캠페인 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate pagination params
    const paginationResult = await validateRequest(
      {
        page: searchParams.get('page'),
        limit: searchParams.get('limit')
      },
      paginationSchema
    );
    
    if (!paginationResult.success) {
      return createErrorResponse('Invalid pagination parameters', 400, formatValidationErrors(paginationResult.errors));
    }
    
    const { page, limit } = paginationResult.data;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const offset = (page - 1) * limit;

    // 필터 조건 구성
    const where: any = {};
    
    // 기본적으로 ACTIVE 상태인 캠페인만 표시 (관리자가 승인한 캠페인)
    if (status) {
      where.status = status.toUpperCase();
    } else {
      // status 파라미터가 없으면 ACTIVE 캠페인만 표시
      where.status = 'ACTIVE';
    }
    
    if (category && category !== 'all') {
      where.business = {
        businessProfile: {
          businessCategory: category
        }
      };
    }
    
    if (platform && platform !== 'all') {
      where.platform = platform.toUpperCase();
    }

    // DB에서 캠페인 데이터 조회
    const campaigns = await prisma.campaign.findMany({
      where,
      select: {
        id: true,
        businessId: true,
        title: true,
        description: true,
        platform: true,
        budget: true,
        targetFollowers: true,
        startDate: true,
        endDate: true,
        requirements: true,
        hashtags: true,
        imageUrl: true,
        imageId: true,
        status: true,
        isPaid: true,
        // Temporarily exclude missing fields
        // maxApplicants: true,
        // rewardAmount: true,
        createdAt: true,
        updatedAt: true,
        business: {
          select: {
            id: true,
            name: true,
            businessProfile: {
              select: {
                companyName: true,
                businessCategory: true
              }
            }
          }
        },
        applications: {
          select: {
            id: true,
            status: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // 총 개수 조회
    const total = await prisma.campaign.count({ where });

    // 응답 데이터 포맷팅
    const formattedCampaigns = campaigns.map((campaign, index) => ({
      id: campaign.id,
      title: campaign.title,
      brand_name: campaign.business.businessProfile?.companyName || campaign.business.name,
      description: campaign.description || '',
      budget: campaign.budget,
      deadline: campaign.endDate,
      category: campaign.business.businessProfile?.businessCategory || 'other',
      platforms: [campaign.platform.toLowerCase()],
      required_followers: campaign.targetFollowers,
      location: '전국',
      view_count: 0,
      applicant_count: campaign._count.applications,
      maxApplicants: CAMPAIGN_FIELD_DEFAULTS.maxApplicants,
      rewardAmount: CAMPAIGN_FIELD_DEFAULTS.rewardAmount,
      image_url: campaign.imageUrl || '/images/campaigns/default.jpg',
      tags: (() => {
        if (!campaign.hashtags) return [];
        try {
          if (campaign.hashtags.startsWith('[')) {
            return JSON.parse(campaign.hashtags);
          } else {
            return campaign.hashtags.split(' ').filter(tag => tag.startsWith('#'));
          }
        } catch (e) {
          console.warn('Failed to parse hashtags:', campaign.hashtags);
          return campaign.hashtags.split(' ').filter(tag => tag.startsWith('#'));
        }
      })(),
      status: campaign.status.toLowerCase(),
      created_at: campaign.createdAt.toISOString(),
      start_date: campaign.startDate,
      end_date: campaign.endDate,
      requirements: campaign.requirements || '',
      application_deadline: campaign.endDate // 실제 지원 마감일이 있다면 해당 필드 사용
    }));
    
    // 카테고리별 카운트 조회 (최적화된 쿼리)
    const categoryStats = await prisma.campaign.groupBy({
      by: ['status'],
      where: { status: 'ACTIVE' },
      _count: true
    });
    
    // 카테고리별 통계를 위한 별도 쿼리
    const campaignsByCategory = await prisma.businessProfile.groupBy({
      by: ['businessCategory'],
      _count: {
        userId: true
      },
      where: {
        user: {
          campaigns: {
            some: {
              status: 'ACTIVE'
            }
          }
        }
      }
    });
    
    const categoryStats2: Record<string, number> = {};
    campaignsByCategory.forEach(stat => {
      const category = stat.businessCategory || 'other';
      categoryStats2[category] = stat._count.userId;
    });

    const response = {
      campaigns: formattedCampaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      categoryStats: categoryStats2
    };

    return createAuthResponse(response);
  } catch (error) {
    console.error('캠페인 목록 조회 오류:', error);
    return createErrorResponse(
      '캠페인 목록을 불러오는데 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// Campaign creation schema
const campaignCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'NAVERBLOG']),
  budget: z.number().positive(),
  targetFollowers: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  requirements: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  maxApplicants: z.number().int().positive().default(100),
  rewardAmount: z.number().positive().default(0),
  location: z.string().default('전국'),
});

// POST /api/campaigns - 새 캠페인 생성
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request, ['BUSINESS']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const body = await request.json();
    
    // Map the incoming data to our schema
    const campaignData = {
      title: body.title,
      description: body.description,
      platform: body.platform || 'INSTAGRAM',
      budget: body.budget,
      targetFollowers: body.min_followers || 1000,
      startDate: body.campaign_start_date || new Date().toISOString(),
      endDate: body.campaign_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: body.requirements,
      hashtags: body.hashtags,
      maxApplicants: body.max_applicants,
      rewardAmount: body.reward_amount || body.budget * 0.8,
      location: body.location || '전국'
    };
    
    // Validate the data
    const validationResult = await validateRequest(campaignData, campaignCreateSchema);
    
    if (!validationResult.success) {
      return createErrorResponse(
        'Invalid campaign data',
        400,
        formatValidationErrors(validationResult.errors)
      );
    }
    
    const validatedData = validationResult.data;

    // Create campaign with validated data
    const campaign = await prisma.campaign.create({
      data: {
        businessId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        platform: validatedData.platform,
        budget: validatedData.budget,
        targetFollowers: validatedData.targetFollowers,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        requirements: validatedData.requirements,
        hashtags: validatedData.hashtags ? JSON.stringify(validatedData.hashtags) : null,
        maxApplicants: validatedData.maxApplicants,
        rewardAmount: validatedData.rewardAmount,
        location: validatedData.location,
        status: 'DRAFT',
        isPaid: false
      }
    });

    return createAuthResponse(
      {
        message: '캠페인이 성공적으로 생성되었습니다.',
        campaign
      },
      201
    );
  } catch (error) {
    console.error('캠페인 생성 오류:', error);
    return createErrorResponse(
      '캠페인 생성에 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}