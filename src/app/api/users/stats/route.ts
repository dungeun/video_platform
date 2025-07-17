import { NextRequest, NextResponse } from 'next/server';
import { userService, influencerStatsSchema } from '@/lib/services/user.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// POST /api/users/stats - 인플루언서 통계 업데이트
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.INFLUENCER) {
      return NextResponse.json(
        { error: '인플루언서만 이용할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = influencerStatsSchema.parse(body);
    
    const profile = await userService.updateInfluencerStats(userId, validatedData);
    
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}