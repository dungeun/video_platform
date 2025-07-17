import { NextRequest, NextResponse } from 'next/server';
import { applicationService, updateApplicationStatusSchema } from '@/lib/services/application.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// PATCH /api/campaigns/applications/[id] - 지원 상태 변경 (비즈니스 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.BUSINESS) {
      return NextResponse.json(
        { error: '비즈니스 계정만 상태를 변경할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateApplicationStatusSchema.parse(body);
    
    const application = await applicationService.updateApplicationStatus(
      params.id,
      userId,
      validatedData
    );
    
    return NextResponse.json(application);
  } catch (error) {
    return handleApiError(error);
  }
}