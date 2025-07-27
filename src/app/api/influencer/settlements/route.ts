import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyJWT } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/influencer/settlements - 인플루언서 정산 내역 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (user.type !== 'INFLUENCER') {
      return NextResponse.json(
        { error: '인플루언서만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 정산 내역 조회
    const settlements = await prisma.settlement.findMany({
      where: {
        influencerId: user.id
      },
      include: {
        items: {
          include: {
            application: {
              include: {
                campaign: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 정산 데이터 형식화
    const formattedSettlements = settlements.map(settlement => ({
      id: settlement.id,
      totalAmount: settlement.totalAmount,
      status: settlement.status,
      createdAt: settlement.createdAt.toISOString(),
      processedAt: settlement.processedAt?.toISOString(),
      items: settlement.items.map(item => ({
        id: item.id,
        campaignTitle: item.campaignTitle,
        amount: item.amount,
        createdAt: item.application.campaign.startDate.toISOString()
      }))
    }));

    return NextResponse.json({
      settlements: formattedSettlements
    });

  } catch (error) {
    console.error('정산 내역 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 내역을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}