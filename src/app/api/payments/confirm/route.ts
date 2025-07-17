import { NextRequest, NextResponse } from 'next/server';
import { paymentService, confirmPaymentSchema } from '@/lib/services/payment.service';
import { handleApiError } from '@/lib/utils/errors';

// POST /api/payments/confirm - 결제 승인 (공개 - Toss 콜백용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = confirmPaymentSchema.parse(body);
    
    const payment = await paymentService.confirmPayment(validatedData);
    
    return NextResponse.json(payment);
  } catch (error) {
    return handleApiError(error);
  }
}