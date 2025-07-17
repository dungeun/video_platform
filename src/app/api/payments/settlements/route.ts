import { NextRequest, NextResponse } from 'next/server';
import { paymentService, requestSettlementSchema } from '@/lib/services/payment.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// GET /api/payments/settlements - 정산 내역 조회 (인플루언서)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.INFLUENCER) {
      return NextResponse.json(
        { error: '인플루언서만 조회할 수 있습니다.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;

    const settlements = await paymentService.getSettlements(userId, status);
    
    return NextResponse.json(settlements);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/payments/settlements - 정산 요청 (인플루언서)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.INFLUENCER) {
      return NextResponse.json(
        { error: '인플루언서만 정산을 요청할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = requestSettlementSchema.parse(body);
    
    const settlement = await paymentService.requestSettlement(userId, validatedData);
    
    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}