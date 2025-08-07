#!/usr/bin/env node

const crypto = require('crypto');

// 강력한 랜덤 시크릿 생성
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64');
}

console.log('🔐 새로운 보안 키 생성\n');
console.log('=== JWT Secrets ===');
console.log(`JWT_SECRET="${generateSecret()}"`);
console.log(`JWT_REFRESH_SECRET="${generateSecret()}"`);

console.log('\n=== Database Password (옵션) ===');
console.log(`DB_PASSWORD="${generateSecret(32)}"`);

console.log('\n=== API Keys (옵션) ===');
console.log(`API_SECRET_KEY="${generateSecret(48)}"`);

console.log('\n⚠️  주의사항:');
console.log('1. 이 값들을 .env.production 파일에 저장하세요');
console.log('2. 절대 Git에 커밋하지 마세요');
console.log('3. Coolify 환경변수에 안전하게 설정하세요');
console.log('4. 프로덕션과 개발 환경의 시크릿을 다르게 사용하세요');