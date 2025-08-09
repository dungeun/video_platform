#!/usr/bin/env node

/**
 * console.log 제거 스크립트
 * 모든 소스 파일에서 console.log를 logger로 대체합니다.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 파일 패턴
const filePatterns = [
  'src/**/*.{ts,tsx,js,jsx}',
  'app/**/*.{ts,tsx,js,jsx}',
  'pages/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}',
];

// console 메서드 패턴
const consolePatterns = [
  /console\.(log|debug|info|warn|error)\(/g,
  /console\.(trace|dir|table|group|groupEnd)\(/g,
];

// 제외할 파일
const excludeFiles = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/logger.ts',
  '**/logger.js',
  '**/lib/logger.js',
];

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

// logger import 문 추가
function addLoggerImport(content, fileExt) {
  const importStatement = fileExt === '.ts' || fileExt === '.tsx' 
    ? "import logger from '@/lib/logger';\n"
    : "const logger = require('@/lib/logger').default;\n";
  
  // 이미 logger를 import하고 있는지 확인
  if (content.includes("from '@/lib/logger'") || content.includes("require('@/lib/logger')")) {
    return content;
  }
  
  // 첫 번째 import 문 찾기
  const importMatch = content.match(/^(import|const|let|var)\s+.*?(from|require)/m);
  if (importMatch) {
    const insertPosition = content.indexOf(importMatch[0]);
    return content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
  }
  
  // import 문이 없으면 파일 시작 부분에 추가
  return importStatement + content;
}

// console 메서드를 logger로 대체
function replaceConsoleLogs(content) {
  let replacedContent = content;
  let replacements = 0;
  
  // console.log → logger.debug
  replacedContent = replacedContent.replace(/console\.log\(/g, () => {
    replacements++;
    return 'logger.debug(';
  });
  
  // console.debug → logger.debug
  replacedContent = replacedContent.replace(/console\.debug\(/g, () => {
    replacements++;
    return 'logger.debug(';
  });
  
  // console.info → logger.info
  replacedContent = replacedContent.replace(/console\.info\(/g, () => {
    replacements++;
    return 'logger.info(';
  });
  
  // console.warn → logger.warn
  replacedContent = replacedContent.replace(/console\.warn\(/g, () => {
    replacements++;
    return 'logger.warn(';
  });
  
  // console.error → logger.error
  replacedContent = replacedContent.replace(/console\.error\(/g, () => {
    replacements++;
    return 'logger.error(';
  });
  
  // console.trace, console.dir 등은 제거
  replacedContent = replacedContent.replace(/console\.(trace|dir|table|group|groupEnd)\([^)]*\);?\n?/g, '');
  
  return { content: replacedContent, count: replacements };
}

// 파일 처리
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileExt = path.extname(filePath);
    
    // console 사용 여부 확인
    const hasConsole = consolePatterns.some(pattern => pattern.test(content));
    
    if (!hasConsole) {
      return;
    }
    
    totalFiles++;
    
    // console을 logger로 대체
    const { content: replacedContent, count } = replaceConsoleLogs(content);
    
    if (count > 0) {
      // logger import 추가
      const finalContent = addLoggerImport(replacedContent, fileExt);
      
      // 파일 저장
      fs.writeFileSync(filePath, finalContent, 'utf8');
      
      modifiedFiles++;
      totalReplacements += count;
      
      console.log(`✅ ${filePath}: ${count}개 대체됨`);
    }
  } catch (error) {
    console.error(`❌ 파일 처리 실패: ${filePath}`, error.message);
  }
}

// 메인 실행
function main() {
  console.log('🔍 console.log 제거 작업 시작...\n');
  
  // 모든 파일 패턴에 대해 처리
  filePatterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: excludeFiles,
      nodir: true,
    });
    
    files.forEach(processFile);
  });
  
  // 결과 출력
  console.log('\n' + '='.repeat(50));
  console.log('✨ console.log 제거 완료!');
  console.log('='.repeat(50));
  console.log(`📊 통계:`);
  console.log(`   - 검사한 파일: ${totalFiles}개`);
  console.log(`   - 수정한 파일: ${modifiedFiles}개`);
  console.log(`   - 대체한 console: ${totalReplacements}개`);
  console.log('='.repeat(50));
  
  if (modifiedFiles > 0) {
    console.log('\n⚠️  다음 단계:');
    console.log('1. 변경사항을 검토하세요');
    console.log('2. 테스트를 실행하여 정상 동작을 확인하세요');
    console.log('3. logger 설정을 환경에 맞게 조정하세요');
  }
}

// glob 패키지 설치 확인
try {
  require('glob');
} catch (error) {
  console.error('❌ glob 패키지가 필요합니다. 다음 명령어를 실행하세요:');
  console.error('   npm install glob');
  process.exit(1);
}

main();