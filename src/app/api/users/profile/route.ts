import { NextRequest, NextResponse } from 'next/server';
import { userService, updateProfileSchema } from '@/lib/services/user.service';
import { handleApiError } from '@/lib/utils/errors';

// GET /api/users/profile - 내 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const profile = await userService.getUserProfile(userId);
    
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/users/profile - 프로필 업데이트
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
    const validatedData = updateProfileSchema.parse(body);
    
    const profile = await userService.updateProfile(userId, validatedData);
    
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/profile - 계정 삭제
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }
    
    const result = await userService.deleteAccount(userId, password);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}