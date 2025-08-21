#!/usr/bin/env node

// 업로드 기능 테스트 스크립트
const fetch = require('node-fetch');

const SERVER_URL = 'http://localhost:3001';

async function testLogin() {
  console.log('🔐 테스트 로그인 시도...');
  
  const response = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`로그인 실패: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  console.log('✅ 로그인 성공:', data.user.name);
  return data.token;
}

async function testVideoCreation(token) {
  console.log('📹 비디오 생성 테스트...');
  
  const formData = new FormData();
  formData.append('videoUrl', 'https://example.com/test-video.mp4');
  formData.append('title', '테스트 비디오');
  formData.append('description', '업로드 테스트용 비디오입니다.');
  formData.append('category', 'general');
  formData.append('tags', JSON.stringify(['테스트', '업로드']));
  formData.append('visibility', 'public');
  formData.append('language', 'ko');
  formData.append('isCommentsEnabled', 'true');
  formData.append('isRatingsEnabled', 'true');
  formData.append('isMonetizationEnabled', 'false');
  formData.append('ageRestriction', 'false');
  formData.append('license', 'standard');
  
  const response = await fetch(`${SERVER_URL}/api/videos/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`비디오 생성 실패: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  console.log('✅ 비디오 생성 성공:', data.videoId);
  return data;
}

async function runTests() {
  try {
    console.log('🚀 업로드 기능 테스트 시작\n');
    
    // 1. 로그인 테스트
    const token = await testLogin();
    
    // 2. 비디오 생성 테스트
    const videoData = await testVideoCreation(token);
    
    console.log('\n🎉 모든 테스트 통과!');
    console.log('업로드 기능이 정상적으로 작동합니다.');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('\n문제 해결 방법:');
    console.error('1. 개발 서버가 실행 중인지 확인 (npm run dev)');
    console.error('2. 포트 3001에서 서버가 실행 중인지 확인');
    console.error('3. 환경 변수 설정 확인 (.env.local)');
  }
}

if (require.main === module) {
  runTests();
}