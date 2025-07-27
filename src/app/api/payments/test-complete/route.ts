import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyJWT } from '@/lib/auth/jwt';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 테스트 결제 완료 스키마
const testCompleteSchema = z.object({
  orderId: z.string(),
  paymentKey: z.string(),
  amount: z.number().positive()
});

// POST /api/payments/test-complete - 테스트 결제 완료 (현금 결제)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (user.type !== 'BUSINESS') {
      return NextResponse.json(
        { error: '비즈니스 계정만 결제를 완료할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, paymentKey, amount } = testCompleteSchema.parse(body);

    // 결제 정보 조회
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        campaign: true
      }
    });

    if (!payment) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (payment.userId !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json({ error: '이미 처리된 결제입니다.' }, { status: 400 });
    }

    if (payment.amount !== amount) {
      return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
    }

    // 트랜잭션으로 결제 완료 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 결제 상태 업데이트
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'APPROVED',
          paymentKey: paymentKey,
          approvedAt: new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            testPayment: true,
            paymentMethod: 'CASH'
          })
        }
      });

      // 2. 캠페인 상태를 결제 완료로 업데이트
      const updatedCampaign = await tx.campaign.update({
        where: { id: payment.campaignId! },
        data: {
          isPaid: true,
          status: 'PENDING' // 관리자 승인 대기 상태로 변경
        }
      });

      return { payment: updatedPayment, campaign: updatedCampaign };
    });

    return NextResponse.json({
      success: true,
      payment: {
        ...result.payment,
        status: result.payment.status.toLowerCase()
      },
      campaign: {
        ...result.campaign,
        status: result.campaign.status.toLowerCase()
      }
    });

  } catch (error) {
    console.error('테스트 결제 완료 오류:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '잘못된 요청 데이터입니다.', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '결제 완료 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}