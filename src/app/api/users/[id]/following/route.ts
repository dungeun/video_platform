import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/user.service';
import { handleApiError } from '@/lib/utils/errors';

// GET /api/users/[id]/following - 팔로잉 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;

    const result = await userService.getFollowing(params.id, page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}