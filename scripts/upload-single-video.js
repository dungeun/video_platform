#!/usr/bin/env node

const Minio = require('minio');
const fs = require('fs');
const path = require('path');

// MinIO 클라이언트 설정
const minioClient = new Minio.Client({
  endPoint: '64.176.226.119',
  port: 9000,
  useSSL: false,
  accessKey: 'videopick',
  secretKey: 'secure_minio_password'
});

const bucketName = 'videopick-videos';

// 업로드할 특정 파일
const fileId = 'f1743314-d0f1-4af8-bd06-1e142c2fe0de';
const fileName = 'f1743314-d0f1-4af8-bd06-1e142c2fe0de_videoplayback (2).webm';
const filePath = path.join(process.cwd(), 'uploads', 'videos', fileName);

async function uploadSingleVideo() {
  try {
    console.log('🚀 단일 비디오 업로드 시작...\n');
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
      process.exit(1);
    }
    
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📤 업로드 중: ${fileName}`);
    console.log(`   ID: ${fileId}`);
    console.log(`   크기: ${fileSizeMB} MB`);
    console.log(`   형식: WebM`);
    
    // MinIO에 파일 업로드
    await minioClient.fPutObject(
      bucketName,
      fileId,  // MinIO에서의 객체 이름 (파일 ID만 사용)
      filePath,
      {
        'Content-Type': 'video/webm',
        'Cache-Control': 'public, max-age=31536000'
      }
    );
    
    console.log(`   ✅ 업로드 완료!\n`);
    console.log(`📌 비디오 URL:`);
    console.log(`http://64.176.226.119:9000/${bucketName}/${fileId}`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
uploadSingleVideo();