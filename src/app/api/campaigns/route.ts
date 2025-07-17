import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getRedis } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 인증 미들웨어 (POST 요청용)
async function authenticate(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/campaigns - 캠페인 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const offset = (page - 1) * limit;

    // 캐시 기능 비활성화 (개발 환경)

    // 필터 조건 구성
    const where: any = {};
    
    if (status) {
      where.status = status.toUpperCase();
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
      include: {
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
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      brand_name: campaign.business.businessProfile?.companyName || campaign.business.name,
      description: (campaign as any).description,
      budget: campaign.budget,
      deadline: campaign.endDate,
      category: campaign.business.businessProfile?.businessCategory || 'other',
      platforms: [campaign.platform.toLowerCase()],
      required_followers: campaign.targetFollowers,
      location: '전국',
      view_count: Math.floor(Math.random() * 1000) + 100, // 실제 조회수 구현 필요
      applicant_count: campaign._count.applications,
      image_url: campaign.imageUrl || '/images/campaigns/default.jpg',
      tags: campaign.hashtags ? JSON.parse(campaign.hashtags) : [],
      status: campaign.status.toLowerCase(),
      created_at: campaign.createdAt.toISOString(),
      start_date: campaign.startDate,
      end_date: campaign.endDate,
      requirements: campaign.requirements || '',
      application_deadline: campaign.endDate // 실제 지원 마감일이 있다면 해당 필드 사용
    }));
    
    // 카테고리별 카운트 조회를 위해 모든 캠페인을 한번 더 조회
    const allCampaigns = await prisma.campaign.findMany({
      include: {
        business: {
          select: {
            businessProfile: {
              select: {
                businessCategory: true
              }
            }
          }
        }
      }
    });

    const categoryStats2: Record<string, number> = {};
    allCampaigns.forEach(campaign => {
      const category = campaign.business.businessProfile?.businessCategory || 'other';
      categoryStats2[category] = (categoryStats2[category] || 0) + 1;
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

    // 캐시 저장 기능 비활성화 (개발 환경)

    return NextResponse.json(response);
  } catch (error) {
    console.error('캠페인 목록 조회 오류:', error);
    
    // 구체적인 오류 메시지 제공
    let errorMessage = '캠페인 목록을 불러오는데 실패했습니다.';
    if (error instanceof Error) {
      errorMessage = `DB 오류: ${error.message}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - 새 캠페인 생성
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user || user.type !== 'business') {
      return NextResponse.json(
        { error: '비즈니스 계정만 캠페인을 생성할 수 있습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      objectives,
      platforms,
      target_gender,
      target_age_min,
      target_age_max,
      target_regions,
      min_followers,
      requirements,
      hashtags,
      mention_accounts,
      do_list,
      dont_list,
      budget,
      payment_type,
      application_deadline,
      content_deadline,
      campaign_start_date,
      campaign_end_date,
      reference_urls
    } = body;

    // 유효성 검사
    if (!title || !description || !category || !budget) {
      return NextResponse.json(
        { error: '필수 필드를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 캠페인 생성
    const campaign = await prisma.$transaction(async (prisma) => {
      return await prisma.campaign.create({
        data: {
          business: { connect: { id: user.id } },
          title,
          description,
          category,
          objectives,
          startDate: new Date(campaign_start_date),
          endDate: new Date(campaign_end_date),
          status: 'DRAFT',
          budget: {
            create: {
              total: budget,
              paymentType: payment_type,
              maxParticipants: 100, // 예시 값, 필요시 수정
            }
          },
          target: {
            create: {
              minFollowers: min_followers || 0,
              maxFollowers: 1000000, // 예시 값, 필요시 수정
              locations: target_regions || [],
              categories: [category],
              platforms: platforms || [],
            }
          },
          content: {
            create: {
              types: ['post'], // 예시 값, 필요시 수정
              requirements: requirements || [],
              guidelines: [],
              hashtags: hashtags || [],
              mentions: mention_accounts || [],
              deliverables: {},
            }
          }
        }
      });
    });

    // 캐시 무효화 기능 비활성화 (개발 환경)

    return NextResponse.json({
      message: '캠페인이 성공적으로 생성되었습니다.',
      campaign
    }, { status: 201 });
  } catch (error) {
    console.error('캠페인 생성 오류:', error);
    return NextResponse.json(
      { error: '캠페인 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}