import { NextRequest, NextResponse } from 'next/server';

// GET /api/payments/callback/fail - Toss 결제 실패 콜백
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  // 결제 실패 페이지로 리다이렉트
  return NextResponse.redirect(
    new URL(
      `/payment/error?code=${code}&message=${encodeURIComponent(message || '결제에 실패했습니다')}&orderId=${orderId}`,
      request.url
    )
  );
}