import { NextRequest, NextResponse } from 'next/server';
import { applicationService } from '@/lib/services/application.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// GET /api/campaigns/applications - 내 지원 목록 조회 (인플루언서 전용)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.INFLUENCER) {
      return NextResponse.json(
        { error: '인플루언서만 조회할 수 있습니다.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;

    const applications = await applicationService.getMyApplications(userId, status);
    
    return NextResponse.json(applications);
  } catch (error) {
    return handleApiError(error);
  }
}