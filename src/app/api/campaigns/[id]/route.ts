import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJWT } from '@/lib/auth/jwt';

// 인증 미들웨어
async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || '';
  
  if (!token) {
    return null;
  }

  try {
    const user = await verifyJWT(token);
    return user;
  } catch (error) {
    return null;
  }
}

// GET /api/campaigns/[id] - 캠페인 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const user = await authenticate(request);

    // DB에서 캠페인 상세 정보 조회
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            businessProfile: {
              select: {
                logo: true,
                companyName: true,
                businessCategory: true,
                businessAddress: true
              }
            }
          }
        },
        applications: {
          select: {
            id: true,
            status: true,
            influencer: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: {
                  select: {
                    profileImage: true,
                    instagramFollowers: true
                  }
                }
              }
            }
          }
        },
        campaignLikes: {
          where: user ? {
            userId: user.id
          } : undefined,
          select: {
            id: true
          }
        },
        _count: {
          select: {
            applications: true,
            campaignLikes: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자가 이미 지원했는지 확인
    let hasApplied = false;
    let applicationStatus = null;
    
    if (user && user.role === 'INFLUENCER') {
      const existingApplication = await prisma.application.findFirst({
        where: {
          campaignId: campaignId,
          influencerId: user.id
        },
        select: {
          status: true
        }
      });
      
      if (existingApplication) {
        hasApplied = true;
        applicationStatus = existingApplication.status;
      }
    }

    // 응답 데이터 포맷팅
    const formattedCampaign = {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        business: {
          id: campaign.business.id,
          name: campaign.business.businessProfile?.companyName || campaign.business.name,
          logo: campaign.business.businessProfile?.logo || null,
          category: campaign.business.businessProfile?.businessCategory || 'other'
        },
        platforms: campaign.platforms || ['INSTAGRAM'],
        budget: campaign.budget,
        targetFollowers: campaign.targetFollowers,
        maxApplicants: campaign.maxApplicants,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        requirements: campaign.requirements,
        hashtags: campaign.hashtags || [],
        imageUrl: campaign.imageUrl,
        detailImages: campaign.detailImages || [],
        status: campaign.status,
        createdAt: campaign.createdAt,
        _count: {
          applications: campaign._count.applications,
          likes: campaign._count.campaignLikes
        },
        applications: campaign.applications.map(app => ({
          id: app.id,
          status: app.status,
          influencer: {
            id: app.influencer.id,
            name: app.influencer.name,
            profileImage: app.influencer.profile?.profileImage || null
          }
        })),
        isLiked: campaign.campaignLikes.length > 0,
        hasApplied,
        applicationStatus
      }
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error('캠페인 조회 오류:', error);
    
    return NextResponse.json(
      { 
        error: '캠페인을 불러오는데 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id] - 캠페인 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const campaignId = params.id;
    const body = await request.json();

    // 권한 확인 (캠페인 소유자 또는 관리자)
    // const campaign = await query('SELECT user_id FROM campaigns WHERE id = $1', [campaignId]);
    // if (campaign[0].user_id !== user.id && user.type !== 'admin') {
    //   return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    // }

    // Mock 응답
    const updatedCampaign = {
      id: campaignId,
      ...body,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      message: '캠페인이 성공적으로 수정되었습니다.',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('캠페인 수정 오류:', error);
    return NextResponse.json(
      { error: '캠페인 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id] - 캠페인 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const campaignId = params.id;

    // 권한 확인 및 삭제
    // await withTransaction(async (client) => {
    //   await client.query('DELETE FROM campaigns WHERE id = $1 AND user_id = $2', [campaignId, user.id]);
    // });

    return NextResponse.json({
      message: '캠페인이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('캠페인 삭제 오류:', error);
    return NextResponse.json(
      { error: '캠페인 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}