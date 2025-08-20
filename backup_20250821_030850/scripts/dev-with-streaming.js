#!/usr/bin/env node

/**
 * 개발 환경용 통합 서버 시작 스크립트
 * Next.js 개발 서버와 스트리밍 서비스들을 동시에 실행합니다.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Video Platform in Development Mode...\n');

// 환경 변수 설정
process.env.NODE_ENV = 'development';

const processes = [];

function spawnProcess(name, command, args, options = {}) {
  console.log(`Starting ${name}...`);
  
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: process.platform === 'win32',
    ...options
  });

  proc.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      console.log(`[${name}] ${message}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message && !message.includes('ExperimentalWarning')) {
      console.error(`[${name}] ${message}`);
    }
  });

  proc.on('error', (error) => {
    console.error(`[${name}] Process error:`, error);
  });

  proc.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] Process exited with code ${code} and signal ${signal}`);
    } else {
      console.log(`[${name}] Process exited gracefully`);
    }
  });

  processes.push({ name, proc });
  return proc;
}

async function startDevelopment() {
  console.log('🎬 Starting all services...\n');

  // 1. 스트리밍 서비스들 시작 (백그라운드)
  const streamingServices = spawnProcess(
    'Streaming Services',
    'node',
    [path.join(__dirname, 'start-streaming-services.js')],
    { cwd: process.cwd() }
  );

  // 스트리밍 서비스가 시작될 때까지 잠시 대기
  console.log('⏳ Waiting for streaming services to initialize...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 2. Next.js 개발 서버 시작
  const nextDev = spawnProcess(
    'Next.js Dev',
    'npm',
    ['run', 'dev'],
    { cwd: process.cwd() }
  );

  console.log('\n✨ Development environment is starting up...');
  console.log('   • Next.js will be available at http://localhost:3000');
  console.log('   • Streaming services are running in background');
  console.log('   • Press Ctrl+C to stop all services');
  console.log();

  // 프로세스 모니터링
  let servicesReady = false;
  
  streamingServices.stdout.on('data', (data) => {
    const message = data.toString();
    if (message.includes('All streaming services are ready') && !servicesReady) {
      servicesReady = true;
      console.log('🎉 All services are now ready for development!\n');
      
      console.log('🔧 Development Tools:');
      console.log('   • Frontend:        http://localhost:3000');
      console.log('   • API Routes:      http://localhost:3000/api/');
      console.log('   • RTMP Server:     rtmp://localhost:1935/live');
      console.log('   • Upload Server:   http://localhost:3001');
      console.log('   • Chat Server:     ws://localhost:3002');
      console.log();
      
      console.log('🎯 Quick Start:');
      console.log('   1. Open http://localhost:3000 in your browser');
      console.log('   2. Login and create a stream key');
      console.log('   3. Use the RTMP URL in OBS or streaming software');
      console.log('   4. Test large file uploads (up to 10GB)');
      console.log('   5. Try the live chat features');
      console.log();
    }
  });
}

// 정리 함수
function cleanup() {
  console.log('\n🛑 Shutting down all services...');
  
  processes.forEach(({ name, proc }) => {
    if (proc && !proc.killed) {
      console.log(`   Stopping ${name}...`);
      proc.kill('SIGTERM');
    }
  });

  // 강제 종료를 위한 타이머
  setTimeout(() => {
    processes.forEach(({ name, proc }) => {
      if (proc && !proc.killed) {
        console.log(`   Force killing ${name}...`);
        proc.kill('SIGKILL');
      }
    });
    process.exit(0);
  }, 5000);
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

// 개발 환경 시작
startDevelopment().catch(error => {
  console.error('❌ Failed to start development environment:', error);
  cleanup();
});