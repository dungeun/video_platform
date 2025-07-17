import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment.service';
import { handleApiError } from '@/lib/utils/errors';
import { adminService } from '@/lib/services/admin.service';

// POST /api/payments/settlements/[id]/process - 정산 처리 (관리자)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = request.headers.get('x-user-id');

    if (!adminId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    await adminService.checkAdminAccess(adminId);

    const body = await request.json();
    const { approved, adminNotes } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'approved 값이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const settlement = await paymentService.processSettlement(
      params.id,
      approved,
      adminNotes
    );
    
    return NextResponse.json(settlement);
  } catch (error) {
    return handleApiError(error);
  }
}