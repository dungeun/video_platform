import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/upload.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// POST /api/upload/campaign/[id] - 캠페인 이미지 업로드
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.BUSINESS) {
      return NextResponse.json(
        { error: '비즈니스 계정만 업로드할 수 있습니다.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    const uploadedFile = await uploadService.uploadCampaignImage(
      params.id,
      userId,
      file
    );
    
    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}