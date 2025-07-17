import { NextRequest, NextResponse } from 'next/server';
import { adminService, dashboardFilterSchema } from '@/lib/services/admin.service';
import { handleApiError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/admin/dashboard - 관리자 대시보드 통계
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    await adminService.checkAdminAccess(userId);

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validatedFilters = filters.startDate || filters.endDate 
      ? dashboardFilterSchema.parse(filters)
      : undefined;

    const stats = await adminService.getDashboardStats(validatedFilters);
    
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}