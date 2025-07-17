import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { handleApiError } from '@/lib/utils/errors';

// GET /api/files/[id] - 파일 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const file = await uploadService.getFile(params.id);
    
    return NextResponse.json(file);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/files/[id] - 파일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const result = await uploadService.deleteFile(params.id, userId);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}