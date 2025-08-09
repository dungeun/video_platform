#!/usr/bin/env node

/**
 * 보안 시크릿 생성 스크립트
 * 강력한 랜덤 시크릿을 생성하여 환경 변수 파일을 업데이트합니다.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 강력한 랜덤 시크릿 생성
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// 강력한 비밀번호 생성 (특수문자 포함)
function generateSecurePassword(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

// 새로운 시크릿 생성
const newSecrets = {
  JWT_SECRET: generateSecureSecret(64),
  JWT_REFRESH_SECRET: generateSecureSecret(64),
  DATABASE_PASSWORD: generateSecurePassword(32),
  ENCRYPTION_KEY: generateSecureSecret(32),
  SESSION_SECRET: generateSecureSecret(48),
  API_SECRET_KEY: generateSecureSecret(32),
};

// .env.production.secure 파일 생성
const envContent = `# ============================================
# 보안 환경 변수 - ${new Date().toISOString()}에 생성됨
# ============================================
# 이 파일을 안전하게 보관하고 절대 Git에 커밋하지 마세요!
# ============================================

# JWT 보안 키 (64자 랜덤)
JWT_SECRET="${newSecrets.JWT_SECRET}"
JWT_REFRESH_SECRET="${newSecrets.JWT_REFRESH_SECRET}"

# 데이터베이스 비밀번호 (32자 랜덤, 특수문자 포함)
# Coolify나 프로덕션 데이터베이스에서 이 비밀번호로 업데이트 필요
DATABASE_PASSWORD="${newSecrets.DATABASE_PASSWORD}"

# 암호화 키 (민감한 데이터 암호화용)
ENCRYPTION_KEY="${newSecrets.ENCRYPTION_KEY}"

# 세션 시크릿
SESSION_SECRET="${newSecrets.SESSION_SECRET}"

# API 시크릿 키
API_SECRET_KEY="${newSecrets.API_SECRET_KEY}"

# ============================================
# 기존 설정 (변경 불필요)
# ============================================
NODE_ENV=production
NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
DATABASE_URL="postgresql://\${POSTGRES_USER}:\${DATABASE_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}"

# ============================================
# 외부 서비스 (실제 프로덕션 키로 교체 필요)
# ============================================
# Toss Payments - 실제 프로덕션 키로 교체하세요
TOSS_SECRET_KEY="실제_프로덕션_시크릿_키_입력"
NEXT_PUBLIC_TOSS_CLIENT_KEY="실제_프로덕션_클라이언트_키_입력"

# AWS S3 (필요시)
# AWS_ACCESS_KEY_ID="your-aws-access-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
# AWS_REGION="ap-northeast-2"
# S3_BUCKET_NAME="your-bucket-name"

# 이메일 서비스 (필요시)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASSWORD="your-app-password"
`;

// 파일 저장
const outputPath = path.join(__dirname, '..', '.env.production.secure');
fs.writeFileSync(outputPath, envContent, 'utf8');

// .env.example 업데이트
const exampleContent = `# ============================================
# 환경 변수 예제 파일
# ============================================
# 이 파일을 복사하여 .env.local 또는 .env.production을 만드세요
# 실제 값을 입력한 파일은 절대 Git에 커밋하지 마세요!
# ============================================

# 환경 설정
NODE_ENV=development

# 데이터베이스 (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/videopick"
DATABASE_PASSWORD="generate-strong-password-here"

# JWT 시크릿 (scripts/generate-secure-secrets.js로 생성)
JWT_SECRET="generate-using-script"
JWT_REFRESH_SECRET="generate-using-script"

# 암호화 키
ENCRYPTION_KEY="generate-using-script"
SESSION_SECRET="generate-using-script"
API_SECRET_KEY="generate-using-script"

# API URL
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Toss Payments
TOSS_SECRET_KEY="your-toss-secret-key"
NEXT_PUBLIC_TOSS_CLIENT_KEY="your-toss-client-key"

# 포트 설정
PORT=3000

# 로깅
LOG_LEVEL=info
DEBUG=false

# 보안 설정
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

const examplePath = path.join(__dirname, '..', '.env.example');
fs.writeFileSync(examplePath, exampleContent, 'utf8');

// 보안 정보 출력
console.log('✅ 새로운 보안 시크릿이 생성되었습니다!\n');
console.log('📁 생성된 파일:');
console.log(`   - ${outputPath}`);
console.log(`   - ${examplePath}\n`);
console.log('⚠️  중요 지시사항:');
console.log('1. .env.production.secure 파일을 안전한 곳에 백업하세요');
console.log('2. 이 파일을 절대 Git에 커밋하지 마세요');
console.log('3. Coolify/프로덕션 서버의 환경 변수를 업데이트하세요');
console.log('4. 데이터베이스 비밀번호를 변경하세요');
console.log('5. Toss Payments 프로덕션 키를 입력하세요\n');
console.log('🔐 생성된 시크릿 (백업용):');
console.log(JSON.stringify(newSecrets, null, 2));