import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/user.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// GET /api/users - 사용자 목록 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    const userType = request.headers.get('x-user-type');

    // 관리자 권한 체크 (임시로 비즈니스 계정도 허용)
    if (userType !== UserType.BUSINESS) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      type: searchParams.get('type') as UserType | undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    const result = await userService.getUsers(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}