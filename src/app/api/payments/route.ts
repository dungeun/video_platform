import { NextRequest, NextResponse } from 'next/server';
import { paymentService, createPaymentSchema } from '@/lib/services/payment.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// POST /api/payments - 결제 요청 생성 (비즈니스 전용)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.BUSINESS) {
      return NextResponse.json(
        { error: '비즈니스 계정만 결제를 생성할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);
    
    const result = await paymentService.createPayment(userId, validatedData);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}