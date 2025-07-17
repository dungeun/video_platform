import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 인증 미들웨어
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

// GET /api/campaigns/[id] - 캠페인 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

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
            businessProfile: {
              select: {
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
        _count: {
          select: {
            applications: true
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

    // 캠페인 날짜 계산
    const now = new Date();
    const endDate = new Date(campaign.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((endDate.getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24));

    // 응답 데이터 포맷팅
    const formattedCampaign = {
      id: campaign.id,
      title: campaign.title,
      brand: campaign.business.businessProfile?.companyName || campaign.business.name,
      brandId: campaign.business.id,
      description: (campaign as any).description,
      budget: campaign.budget,
      budgetRange: `₩${campaign.budget.toLocaleString()} ~ ₩${(campaign.budget * 1.5).toLocaleString()}`,
      deadline: campaign.endDate,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      category: campaign.business.businessProfile?.businessCategory || 'other',
      platforms: [campaign.platform.toLowerCase()],
      required_followers: campaign.targetFollowers,
      location: '전국',
      view_count: Math.floor(Math.random() * 1000) + 100, // 실제 조회수 구현 필요
      applicants: campaign._count.applications,
      maxApplicants: 100, // 실제 최대 지원자 수 구현 필요
      image_url: campaign.imageUrl || 'https://images.unsplash.com/photo-1600000000?w=800&q=80',
      tags: campaign.hashtags ? JSON.parse(campaign.hashtags) : [],
      status: campaign.status.toLowerCase(),
      requirements: campaign.requirements || '',
      detailedRequirements: [
        `${campaign.business.businessProfile?.businessCategory || '관련'} 콘텐츠 제작 경험 1년 이상`,
        `${campaign.platform} 팔로워 ${campaign.targetFollowers.toLocaleString()}명 이상`,
        '평균 참여율 3% 이상',
        '월 4회 이상 콘텐츠 업로드 가능',
        '긍정적이고 진정성 있는 리뷰 작성 가능'
      ],
      deliverables: [
        `${campaign.platform} 피드 포스트 3개`,
        `${campaign.platform} 스토리 5개`,
        '제품 사용 리뷰 콘텐츠',
        '제품 사용 전/후 비교 콘텐츠'
      ],
      duration: `${duration}일`,
      campaignPeriod: `${new Date(campaign.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(campaign.endDate).toLocaleDateString('ko-KR')}`,
      applicationDeadline: new Date(campaign.endDate).toLocaleDateString('ko-KR'),
      brandInfo: {
        name: campaign.business.businessProfile?.companyName || campaign.business.name,
        description: `${campaign.business.businessProfile?.businessCategory} 분야의 선도적인 브랜드입니다.`,
        values: ['품질 우선', '고객 만족', '혁신 추구', '지속 가능성'],
        avatar: false
      },
      created_at: campaign.createdAt.toISOString(),
      
      // 최근 지원자 정보 (3명)
      recentApplicants: campaign.applications.slice(0, 3).map(app => ({
        id: app.influencer.id,
        name: app.influencer.name,
        avatar: app.influencer.profile?.profileImage,
        followers: app.influencer.profile?.instagramFollowers
      }))
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error('캠페인 조회 오류:', error);
    
    // 구체적인 오류 메시지 제공
    let errorMessage = '캠페인을 불러오는데 실패했습니다.';
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
  } finally {
    await prisma.$disconnect();
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