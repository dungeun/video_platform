import { NextRequest, NextResponse } from 'next/server';
import { applicationService, reviewContentSchema } from '@/lib/services/application.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// PATCH /api/campaigns/content/[id]/review - 컨텐츠 리뷰 (비즈니스 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.BUSINESS) {
      return NextResponse.json(
        { error: '비즈니스 계정만 컨텐츠를 리뷰할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = reviewContentSchema.parse(body);
    
    const content = await applicationService.reviewContent(
      params.id,
      userId,
      validatedData
    );
    
    return NextResponse.json(content);
  } catch (error) {
    return handleApiError(error);
  }
}