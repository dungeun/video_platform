#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 환경 변수 설정
process.env.NODE_ENV = 'development';

console.log('Starting VideoPick development server...');

// Next.js 개발 서버 시작
const nextDev = spawn('npx', ['next', 'dev'], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env },
  stdio: 'inherit'
});

nextDev.on('close', (code) => {
  console.log(`Development server exited with code ${code}`);
  process.exit(code);
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\nShutting down development server...');
  nextDev.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextDev.kill();
  process.exit(0);
});