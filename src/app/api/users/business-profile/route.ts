import { NextRequest, NextResponse } from 'next/server';
import { userService, profileSchema } from '@/lib/services/user.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// POST /api/users/business-profile - 비즈니스 프로필 생성/업데이트
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.BUSINESS) {
      return NextResponse.json(
        { error: '비즈니스 계정만 이용할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = profileSchema.parse(body);
    
    const profile = await userService.updateBusinessProfile(userId, validatedData);
    
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}