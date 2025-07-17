import { NextRequest, NextResponse } from 'next/server';
import { adminService, approveCampaignSchema } from '@/lib/services/admin.service';
import { handleApiError } from '@/lib/utils/errors';

// PATCH /api/admin/campaigns/[id]/review - 캠페인 승인/거절
export async function PATCH(
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
    const validatedData = approveCampaignSchema.parse(body);
    
    const result = await adminService.reviewCampaign(params.id, validatedData);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}