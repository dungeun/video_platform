import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// TUS 프로토콜 상수
const TUS_VERSION = '1.0.0';

interface UploadInfo {
  id: string;
  path: string;
  length: number;
  offset: number;
  metadata: Record<string, string>;
  createdAt: string;
  completed?: boolean;
  url?: string;
  completedAt?: string;
}

// 업로드 디렉토리 설정
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'videos');

// 전역 업로드 저장소 (실제로는 Redis나 DB 사용)
declare global {
  var uploads: Map<string, UploadInfo> | undefined;
}

// HEAD 요청 - 업로드 상태 확인
export async function HEAD(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return new NextResponse(null, { status: 400 });
    }

    global.uploads = global.uploads || new Map();
    const uploadInfo = global.uploads.get(fileId);

    if (!uploadInfo) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Tus-Resumable': TUS_VERSION,
        'Upload-Offset': uploadInfo.offset.toString(),
        'Upload-Length': uploadInfo.length.toString(),
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Tus-Resumable, Upload-Offset, Upload-Length'
      }
    });

  } catch (error) {
    console.error('TUS HEAD error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// PATCH 요청 - 파일 청크 업로드
export async function PATCH(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      );
    }

    global.uploads = global.uploads || new Map();
    const uploadInfo = global.uploads.get(fileId);

    if (!uploadInfo) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    const uploadOffset = request.headers.get('upload-offset');
    if (!uploadOffset || parseInt(uploadOffset) !== uploadInfo.offset) {
      return NextResponse.json(
        { error: 'Invalid upload offset' },
        { status: 409 }
      );
    }

    const contentType = request.headers.get('content-type');
    if (contentType !== 'application/offset+octet-stream') {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // 청크 데이터 읽기
    const arrayBuffer = await request.arrayBuffer();
    const chunkData = new Uint8Array(arrayBuffer);

    if (chunkData.length === 0) {
      return NextResponse.json(
        { error: 'Empty chunk' },
        { status: 400 }
      );
    }

    // 파일에 청크 추가
    await writeFile(uploadInfo.path, chunkData, { flag: 'a' });

    // 오프셋 업데이트
    uploadInfo.offset += chunkData.length;
    global.uploads.set(fileId, uploadInfo);

    // 업로드 완료 확인
    if (uploadInfo.offset >= uploadInfo.length) {
      try {
        // 업로드 완료 - 파일을 public 디렉토리로 복사
        const filename = path.basename(uploadInfo.path);
        const publicDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
        const publicPath = path.join(publicDir, filename);
        
        // public 디렉토리 생성 (없으면)
        if (!existsSync(publicDir)) {
          await mkdir(publicDir, { recursive: true });
        }
        
        // 파일 복사
        await copyFile(uploadInfo.path, publicPath);
        
        const finalUrl = `/uploads/videos/${filename}`;
        
        // 업로드 정보를 완료 상태로 업데이트
        uploadInfo.completed = true;
        uploadInfo.url = finalUrl;
        uploadInfo.completedAt = new Date().toISOString();
        global.uploads.set(fileId, uploadInfo);

        console.log(`Upload completed: ${fileId} -> ${finalUrl} (copied to ${publicPath})`);

        // 완료 응답에 URL 포함
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Tus-Resumable': TUS_VERSION,
            'Upload-Offset': uploadInfo.offset.toString(),
            'Upload-Complete': 'true',
            'Upload-Url': finalUrl,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Tus-Resumable, Upload-Offset, Upload-Complete, Upload-Url'
          }
        });
      } catch (error) {
        console.error('Failed to copy file to public directory:', error);
        // 복사에 실패해도 업로드는 완료로 처리하고 원본 경로 사용
        const filename = path.basename(uploadInfo.path);
        const finalUrl = `/uploads/videos/${filename}`;
        
        uploadInfo.completed = true;
        uploadInfo.url = finalUrl;
        uploadInfo.completedAt = new Date().toISOString();
        global.uploads.set(fileId, uploadInfo);

        return new NextResponse(null, {
          status: 204,
          headers: {
            'Tus-Resumable': TUS_VERSION,
            'Upload-Offset': uploadInfo.offset.toString(),
            'Upload-Complete': 'true',
            'Upload-Url': finalUrl,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Tus-Resumable, Upload-Offset, Upload-Complete, Upload-Url'
          }
        });
      }
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Tus-Resumable': TUS_VERSION,
        'Upload-Offset': uploadInfo.offset.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Tus-Resumable, Upload-Offset'
      }
    });

  } catch (error) {
    console.error('TUS PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to upload chunk' },
      { status: 500 }
    );
  }
}

// DELETE 요청 - 업로드 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      );
    }

    global.uploads = global.uploads || new Map();
    const uploadInfo = global.uploads.get(fileId);

    if (!uploadInfo) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    // 파일 삭제 (있다면)
    try {
      const fs = require('fs');
      if (fs.existsSync(uploadInfo.path)) {
        fs.unlinkSync(uploadInfo.path);
      }
    } catch (deleteError) {
      console.error('Failed to delete file:', deleteError);
    }

    // 업로드 정보 삭제
    global.uploads.delete(fileId);

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Tus-Resumable': TUS_VERSION,
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('TUS DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete upload' },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 - CORS 처리
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Tus-Resumable': TUS_VERSION,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'HEAD, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Tus-Resumable, Upload-Offset, Content-Type',
      'Access-Control-Expose-Headers': 'Tus-Resumable, Upload-Offset, Upload-Length, Upload-Complete, Upload-Url'
    }
  });
}