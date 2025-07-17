import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { handleApiError } from '@/lib/utils/errors';

// GET /api/files/stats - 파일 사용량 통계
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const stats = await uploadService.getStorageStats(userId);
    
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}