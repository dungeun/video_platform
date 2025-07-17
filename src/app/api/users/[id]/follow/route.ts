import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/user.service';
import { handleApiError } from '@/lib/utils/errors';

// POST /api/users/[id]/follow - 사용자 팔로우
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const followerId = request.headers.get('x-user-id');

    if (!followerId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const result = await userService.followUser(followerId, params.id);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/[id]/follow - 언팔로우
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const followerId = request.headers.get('x-user-id');

    if (!followerId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const result = await userService.unfollowUser(followerId, params.id);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}