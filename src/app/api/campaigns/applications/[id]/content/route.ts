import { NextRequest, NextResponse } from 'next/server';
import { applicationService, submitContentSchema } from '@/lib/services/application.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// POST /api/campaigns/applications/[id]/content - 컨텐츠 제출 (인플루언서 전용)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.INFLUENCER) {
      return NextResponse.json(
        { error: '인플루언서만 컨텐츠를 제출할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = submitContentSchema.parse(body);
    
    const content = await applicationService.submitContent(
      params.id,
      userId,
      validatedData
    );
    
    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}