import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment.service';
import { handleApiError } from '@/lib/utils/errors';
import { PaymentStatus, PaymentType } from '@/lib/types';

// GET /api/payments/history - 결제 내역 조회
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      ...(searchParams.get('type') && { type: searchParams.get('type') as PaymentType }),
      ...(searchParams.get('status') && { status: searchParams.get('status') as PaymentStatus }),
      ...(searchParams.get('startDate') && { startDate: new Date(searchParams.get('startDate')!) }),
      ...(searchParams.get('endDate') && { endDate: new Date(searchParams.get('endDate')!) }),
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    const result = await paymentService.getPaymentHistory(userId, filters);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}