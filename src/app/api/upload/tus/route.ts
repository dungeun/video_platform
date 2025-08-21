import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// TUS 프로토콜 상수
const TUS_VERSION = '1.0.0';
const TUS_RESUMABLE = 'tus-resumable';
const TUS_MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

// 업로드 디렉토리 설정
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'videos');

// 업로드 디렉토리 생성
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// OPTIONS 요청 - TUS 프로토콜 지원 확인
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Tus-Resumable': TUS_VERSION,
      'Tus-Version': TUS_VERSION,
      'Tus-Max-Size': TUS_MAX_SIZE.toString(),
      'Tus-Extension': 'creation,termination,checksum',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, HEAD, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Tus-Resumable, Upload-Length, Upload-Metadata, Content-Type, Upload-Offset',
      'Access-Control-Expose-Headers': 'Tus-Resumable, Location, Upload-Offset, Upload-Length'
    }
  });
}

// POST 요청 - 새 업로드 생성
export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();

    const tusResumable = request.headers.get('tus-resumable');
    if (tusResumable !== TUS_VERSION) {
      return NextResponse.json(
        { error: 'Unsupported TUS version' },
        { status: 412 }
      );
    }

    const uploadLength = request.headers.get('upload-length');
    if (!uploadLength) {
      return NextResponse.json(
        { error: 'Upload-Length header required' },
        { status: 400 }
      );
    }

    const contentLength = parseInt(uploadLength);
    if (contentLength > TUS_MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 413 }
      );
    }

    // 메타데이터 파싱
    const uploadMetadata = request.headers.get('upload-metadata') || '';
    const metadata: Record<string, string> = {};
    
    uploadMetadata.split(',').forEach(pair => {
      const [key, value] = pair.trim().split(' ');
      if (key && value) {
        metadata[key] = Buffer.from(value, 'base64').toString('utf-8');
      }
    });

    // 고유 파일 ID 생성
    const fileId = uuidv4();
    const filename = metadata.filename || `video_${fileId}`;
    const filePath = path.join(UPLOAD_DIR, `${fileId}_${filename}`);

    // 업로드 정보를 임시 저장 (실제로는 데이터베이스를 사용해야 함)
    const uploadInfo = {
      id: fileId,
      path: filePath,
      length: contentLength,
      offset: 0,
      metadata,
      createdAt: new Date().toISOString()
    };

    // 임시로 메모리에 저장 (실제로는 Redis나 DB 사용)
    global.uploads = global.uploads || new Map();
    global.uploads.set(fileId, uploadInfo);

    // 프로덕션 환경에서는 실제 서버 URL 사용 - x-forwarded 헤더 우선 사용
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    // 서버 사이드 환경 변수 사용 (NEXT_PUBLIC_ 제거)
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const uploadUrl = `${baseUrl}/api/upload/tus/${fileId}`;

    return new NextResponse(null, {
      status: 201,
      headers: {
        'Tus-Resumable': TUS_VERSION,
        'Location': uploadUrl,
        'Upload-Offset': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Tus-Resumable, Location, Upload-Offset'
      }
    });

  } catch (error) {
    console.error('TUS POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create upload' },
      { status: 500 }
    );
  }
}

// HEAD 요청 - 업로드 상태 확인
export async function HEAD(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const fileId = pathParts[pathParts.length - 1];

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
    return NextResponse.json(
      { error: 'Failed to check upload status' },
      { status: 500 }
    );
  }
}

// PATCH 요청 - 파일 청크 업로드
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const fileId = pathParts[pathParts.length - 1];

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
      // 업로드 완료 - 스토리지 서버 URL 생성
      const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://storage.one-q.xyz';
      const finalUrl = `${storageUrl}/${fileId}`;
      
      // 업로드 정보를 완료 상태로 업데이트
      uploadInfo.completed = true;
      uploadInfo.url = finalUrl;
      uploadInfo.completedAt = new Date().toISOString();
      global.uploads.set(fileId, uploadInfo);
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
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const fileId = pathParts[pathParts.length - 1];

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