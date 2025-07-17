import { NextRequest, NextResponse } from 'next/server';
import { adminService, verifyUserSchema } from '@/lib/services/admin.service';
import { handleApiError } from '@/lib/utils/errors';

// PATCH /api/admin/users/[id]/verify - 사용자 검증
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
    const validatedData = verifyUserSchema.parse(body);
    
    const result = await adminService.verifyUser(params.id, validatedData);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}