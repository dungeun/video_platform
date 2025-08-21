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
const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');

async function uploadVideosToMinio() {
  try {
    console.log('🚀 MinIO 업로드 시작...\n');
    
    // 업로드 폴더의 모든 파일 읽기
    const files = fs.readdirSync(uploadsDir);
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    
    console.log(`📁 ${videoFiles.length}개 비디오 파일 발견\n`);
    
    for (const file of videoFiles) {
      // 파일 ID 추출 (파일명의 첫 부분)
      const fileId = file.split('_')[0];
      const filePath = path.join(uploadsDir, file);
      const fileStats = fs.statSync(filePath);
      const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`📤 업로드 중: ${file}`);
      console.log(`   ID: ${fileId}`);
      console.log(`   크기: ${fileSizeMB} MB`);
      
      try {
        // MinIO에 파일 업로드
        await minioClient.fPutObject(
          bucketName,
          fileId,  // MinIO에서의 객체 이름 (파일 ID만 사용)
          filePath,
          {
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=31536000'
          }
        );
        
        console.log(`   ✅ 업로드 완료\n`);
        
      } catch (uploadError) {
        console.log(`   ❌ 업로드 실패: ${uploadError.message}\n`);
      }
    }
    
    console.log('✅ 모든 업로드 완료!');
    console.log('\n📌 비디오 URL 형식:');
    console.log(`http://64.176.226.119:9000/${bucketName}/[file-id]`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
uploadVideosToMinio();