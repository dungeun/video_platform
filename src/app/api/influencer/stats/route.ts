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

// GET /api/influencer/stats - 인플루언서 통계 조회
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user || user.type !== 'influencer') {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 인플루언서 정보 조회
    const influencer = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        campaignApplications: {
          include: {
            campaign: {
              include: {
                business: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!influencer) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 통계 계산
    const applications = influencer.campaignApplications || [];
    const completedCampaigns = applications.filter(app => app.status === 'COMPLETED');
    const activeCampaigns = applications.filter(app => 
      app.status === 'ACCEPTED' || app.status === 'IN_PROGRESS'
    );

    // 총 수익 계산
    const totalEarnings = completedCampaigns.reduce((sum, app) => {
      return sum + (app.campaign?.budget || 0);
    }, 0);

    // 평균 평점 계산 (실제로는 리뷰 테이블에서 계산)
    const averageRating = 4.8; // TODO: 실제 리뷰 데이터에서 계산

    // 총 조회수 (임시)
    const totalViews = Math.floor(Math.random() * 100000) + 50000;

    // 팔로워 수
    const followers = influencer.profile?.followerCount || 0;

    // 활동 중인 캠페인 데이터
    const activeCampaignData = activeCampaigns.map(app => ({
      id: app.campaign.id,
      title: app.campaign.title,
      brand: app.campaign.business.profile?.companyName || app.campaign.business.name,
      deadline: app.campaign.endDate,
      reward: app.campaign.budget,
      progress: Math.floor(Math.random() * 100), // TODO: 실제 진행률 계산
      status: app.status === 'ACCEPTED' ? 'pending' : 'in_progress'
    }));

    // 최근 수익 내역
    const recentEarnings = completedCampaigns.slice(0, 5).map(app => ({
      id: app.id,
      campaignTitle: app.campaign.title,
      amount: app.campaign.budget,
      date: app.updatedAt.toISOString().split('T')[0],
      status: 'paid'
    }));

    return NextResponse.json({
      stats: {
        totalCampaigns: applications.length,
        activeCampaigns: activeCampaigns.length,
        totalEarnings,
        averageRating,
        totalViews,
        followers
      },
      activeCampaigns: activeCampaignData,
      recentEarnings
    });
  } catch (error) {
    console.error('인플루언서 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}