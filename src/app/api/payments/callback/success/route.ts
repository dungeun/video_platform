import { NextRequest, NextResponse } from 'next/server';

// GET /api/payments/callback/success - Toss 결제 성공 콜백
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(
      new URL('/payment/error?message=결제 정보가 올바르지 않습니다', request.url)
    );
  }

  // 결제 완료 페이지로 리다이렉트
  return NextResponse.redirect(
    new URL(
      `/payment/complete?paymentKey=${paymentKey}&orderId=${orderId}&amount=${amount}`,
      request.url
    )
  );
}