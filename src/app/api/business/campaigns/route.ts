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

// POST /api/business/campaigns - 새 캠페인 생성
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const userType = user.type?.toLowerCase();
    if (userType !== 'business' && userType !== 'admin') {
      return NextResponse.json(
        { error: '비즈니스 계정만 캠페인을 생성할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      platform,
      platforms,
      budget,
      targetFollowers,
      maxApplicants,
      rewardAmount,
      startDate,
      endDate,
      requirements,
      hashtags,
      imageUrl,
      detailImages,
      youtubeUrl
    } = body;

    // 유효성 검사
    if (!title || !description || (!platform && (!platforms || platforms.length === 0)) || !budget || !targetFollowers || !maxApplicants || !rewardAmount || !startDate || !endDate) {
      return NextResponse.json(
        { error: '필수 필드를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 날짜 유효성 검사
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj < today) {
      return NextResponse.json(
        { error: '시작일은 오늘 날짜 이후여야 합니다.' },
        { status: 400 }
      );
    }

    if (endDateObj <= startDateObj) {
      return NextResponse.json(
        { error: '종료일은 시작일 이후여야 합니다.' },
        { status: 400 }
      );
    }

    // 캠페인 생성
    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        platform: platform || (platforms && platforms[0]) || 'INSTAGRAM',
        platforms: platforms ? JSON.stringify(platforms) : null,
        budget,
        targetFollowers,
        maxApplicants: maxApplicants || 100,
        rewardAmount: rewardAmount || 0,
        startDate: startDateObj,
        endDate: endDateObj,
        requirements: requirements || '',
        hashtags: hashtags ? JSON.stringify(hashtags) : '[]',
        imageUrl: imageUrl || null,
        detailImages: detailImages ? JSON.stringify(detailImages) : null,
        status: 'ACTIVE',
        businessId: user.userId || user.id
      }
    });

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
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/business/campaigns - 비즈니스 계정의 캠페인 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const userType = user.type?.toLowerCase();
    if (userType !== 'business' && userType !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 비즈니스 계정의 캠페인 목록 조회
    const campaigns = await prisma.campaign.findMany({
      where: {
        businessId: user.userId || user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    // 캠페인 데이터 형식 변환
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      description: (campaign as any).description,
      platform: (campaign as any).category,
      budget: campaign.budget,
      targetFollowers: (campaign as any).targetFollowers,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status.toLowerCase(),
      applications: campaign._count.applications,
      imageUrl: campaign.imageUrl,
      createdAt: campaign.createdAt
    }));

    return NextResponse.json({
      campaigns: formattedCampaigns
    });
  } catch (error) {
    console.error('캠페인 조회 오류:', error);
    return NextResponse.json(
      { error: '캠페인 조회에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}