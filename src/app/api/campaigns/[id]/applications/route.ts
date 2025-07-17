import { NextRequest, NextResponse } from 'next/server';
import { applicationService } from '@/lib/services/application.service';
import { handleApiError } from '@/lib/utils/errors';

// GET /api/campaigns/[id]/applications - 캠페인 지원자 목록 조회 (비즈니스 전용)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== 'BUSINESS') {
      return NextResponse.json(
        { error: '비즈니스 계정만 조회할 수 있습니다.' },
        { status: 403 }
      );
    }

    const applications = await applicationService.getApplications(params.id, userId);
    
    return NextResponse.json(applications);
  } catch (error) {
    return handleApiError(error);
  }
}