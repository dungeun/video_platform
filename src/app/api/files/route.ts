import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { handleApiError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/files - 파일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      type: searchParams.get('type') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    const result = await uploadService.getFiles(userId, filters);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}