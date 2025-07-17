import { NextRequest, NextResponse } from 'next/server';
import { userService, changePasswordSchema } from '@/lib/services/user.service';
import { handleApiError } from '@/lib/utils/errors';

// PATCH /api/users/password - 비밀번호 변경
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);
    
    const result = await userService.changePassword(userId, validatedData);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}