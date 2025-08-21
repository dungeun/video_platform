#!/usr/bin/env node

// MinIO 버킷 설정 스크립트
// MinIO Client SDK를 사용하여 버킷 정책 설정

const Minio = require('minio');

// MinIO 클라이언트 설정
const minioClient = new Minio.Client({
  endPoint: '64.176.226.119',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'videopick',
  secretKey: process.env.MINIO_SECRET_KEY || 'secure_minio_password'
});

const bucketName = 'videopick-videos';

// 버킷의 public 읽기 정책
const publicPolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": [`arn:aws:s3:::${bucketName}/*`]
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [`arn:aws:s3:::${bucketName}`]
    }
  ]
};

async function setupMinioBucket() {
  try {
    console.log('🔧 MinIO 버킷 설정 시작...\n');
    
    // 버킷 존재 확인
    const bucketExists = await minioClient.bucketExists(bucketName);
    
    if (!bucketExists) {
      console.log(`📦 버킷 '${bucketName}' 생성 중...`);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ 버킷 생성 완료`);
    } else {
      console.log(`✅ 버킷 '${bucketName}'이 이미 존재합니다`);
    }
    
    // 버킷 정책 설정 (public 읽기)
    console.log('\n🔓 버킷을 public으로 설정 중...');
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(publicPolicy));
    console.log('✅ 버킷 정책 설정 완료');
    
    // CORS 설정 (MinIO에서는 서버 설정으로 처리)
    console.log('\n📌 CORS 설정 안내:');
    console.log('MinIO 서버에서 CORS를 활성화하려면:');
    console.log('1. MinIO 서버 환경변수에 추가:');
    console.log('   MINIO_BROWSER=on');
    console.log('   MINIO_CORS_ALLOW_ORIGIN=*');
    console.log('2. 또는 MinIO 설정 파일에서 CORS 설정');
    
    // 현재 버킷 정책 확인
    const currentPolicy = await minioClient.getBucketPolicy(bucketName);
    console.log('\n📋 현재 버킷 정책:');
    console.log(JSON.parse(currentPolicy));
    
    console.log('\n✅ MinIO 버킷 설정 완료!');
    console.log('\n테스트 URL 예시:');
    console.log(`http://64.176.226.119:9000/${bucketName}/[file-id]`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    
    if (error.code === 'InvalidAccessKeyId') {
      console.error('\n⚠️ MinIO 액세스 키가 잘못되었습니다.');
      console.error('.env.local 파일에서 MINIO_ACCESS_KEY를 확인하세요.');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error('\n⚠️ MinIO 시크릿 키가 잘못되었습니다.');
      console.error('.env.local 파일에서 MINIO_SECRET_KEY를 확인하세요.');
    }
    
    process.exit(1);
  }
}

// 스크립트 실행
setupMinioBucket();