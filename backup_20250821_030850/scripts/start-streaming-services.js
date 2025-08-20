#!/usr/bin/env node

/**
 * 스트리밍 서비스 시작 스크립트
 * Node Media Server, TUS Upload Server, Socket.io Chat Server를 초기화하고 시작합니다.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 필요한 클래스들 가져오기
const StreamingServer = require('../src/lib/streaming/media-server');
const UploadServer = require('../src/lib/streaming/upload-server');
const ChatServer = require('../src/lib/streaming/chat-server');

console.log('🎬 Starting Video Platform Streaming Services...\n');

// 환경 변수 확인
const requiredEnv = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const missingEnv = requiredEnv.filter(env => !process.env[env]);
if (missingEnv.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnv.forEach(env => console.error(`   - ${env}`));
  console.error('\nPlease check your .env file');
  process.exit(1);
}

// 필요한 디렉토리 생성
const requiredDirs = [
  './media',
  './uploads/temp',
  './uploads/videos', 
  './uploads/hls',
  './uploads/thumbnails',
  './recordings',
  './thumbnails',
  './hls',
  './logs'
];

async function createDirectories() {
  console.log('📁 Creating required directories...');
  
  for (const dir of requiredDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created: ${dir}`);
      } else {
        console.log(`   ✓ Exists: ${dir}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to create ${dir}:`, error.message);
    }
  }
  console.log();
}

// 스트리밍 서버 인스턴스들
let streamingServer;
let uploadServer;
let chatServer;

// 서비스 시작 함수
async function startServices() {
  try {
    // 필요한 디렉토리 생성
    await createDirectories();

    // 1. Node Media Server 시작
    console.log('🎥 Starting Node Media Server...');
    streamingServer = new StreamingServer();
    streamingServer.start();
    console.log('   ✅ Node Media Server started\n');

    // 2. TUS Upload Server 시작  
    console.log('📤 Starting TUS Upload Server...');
    uploadServer = new UploadServer();
    
    // TUS 서버를 별도 포트(3001)에서 실행
    const express = require('express');
    const app = express();
    
    // CORS 설정
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'POST, GET, HEAD, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Upload-Offset, Upload-Length, Upload-Metadata, Tus-Resumable, Content-Type, Authorization');
      res.header('Access-Control-Expose-Headers', 'Upload-Offset, Upload-Length, Upload-Metadata, Tus-Resumable, Location');
      res.header('Tus-Resumable', '1.0.0');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // TUS 서버 미들웨어 연결
    const middleware = uploadServer.getMiddleware();
    app.all('/api/upload/video/tus*', middleware.upload);
    app.get('/api/upload/status/:uploadId', middleware.getUploadStatus);
    
    const uploadServerInstance = app.listen(3001, () => {
      console.log('   ✅ TUS Upload Server started on port 3001\n');
    });

    // 3. Socket.io Chat Server 시작
    console.log('💬 Starting Socket.io Chat Server...');
    chatServer = new ChatServer();
    await chatServer.start();
    console.log('   ✅ Socket.io Chat Server started\n');

    // 전역 참조 설정 (업로드 진행률 브로드캐스트용)
    global.io = chatServer.io;

    console.log('🚀 All streaming services are ready!\n');
    console.log('📋 Service URLs:');
    console.log('   • RTMP Server:     rtmp://localhost:1935/live');
    console.log('   • HLS Playback:    http://localhost:8000/live/[stream_key]/index.m3u8');
    console.log('   • FLV Playback:    http://localhost:8000/live/[stream_key].flv');
    console.log('   • Upload Server:   http://localhost:3001/api/upload/video/tus');
    console.log('   • Chat Server:     ws://localhost:3002');
    console.log();
    
    console.log('📖 Usage Instructions:');
    console.log('   1. Create stream key via: POST /api/streaming/keys');
    console.log('   2. Start stream via: POST /api/streaming/start');
    console.log('   3. Use RTMP URL in OBS/streaming software');
    console.log('   4. Upload large files to TUS endpoint');
    console.log('   5. Connect to chat WebSocket for live chat');
    console.log();

  } catch (error) {
    console.error('❌ Failed to start streaming services:', error);
    process.exit(1);
  }
}

// 정리 함수
function cleanup() {
  console.log('\n🛑 Stopping streaming services...');
  
  if (streamingServer) {
    streamingServer.stop();
    console.log('   ✅ Node Media Server stopped');
  }
  
  if (chatServer) {
    chatServer.stop();
    console.log('   ✅ Socket.io Chat Server stopped');
  }
  
  console.log('   ✅ All services stopped');
  process.exit(0);
}

// 시그널 핸들러 등록
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 에러 핸들러
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup();
});

// 서비스 시작
startServices().catch(error => {
  console.error('❌ Failed to start services:', error);
  process.exit(1);
});