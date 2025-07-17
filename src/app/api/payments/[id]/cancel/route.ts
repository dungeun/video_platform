import { NextRequest, NextResponse } from 'next/server';
import { paymentService, refundPaymentSchema } from '@/lib/services/payment.service';
import { handleApiError } from '@/lib/utils/errors';

// POST /api/payments/[id]/cancel - 결제 취소/환불
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = refundPaymentSchema.parse(body);
    
    const result = await paymentService.cancelPayment(params.id, userId, validatedData);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}