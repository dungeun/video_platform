// Playwright MCP 전체 페이지 QA 스크립트
// 사용법: claude code --persona-qa --play "@playwright_qa_script.js"

const qaPages = [
  // 🏠 핵심 공개 페이지 
  { url: '/', name: '메인페이지', priority: 'critical' },
  { url: '/videos', name: '비디오 목록', priority: 'critical' },
  { url: '/live', name: '라이브 스트리밍', priority: 'high' },
  { url: '/community', name: '커뮤니티', priority: 'high' },
  
  // 🔐 인증 관련
  { url: '/login', name: '로그인', priority: 'critical' },
  { url: '/register', name: '회원가입', priority: 'critical' },
  { url: '/forgot-password', name: '비밀번호 찾기', priority: 'medium' },
  
  // 📱 콘텐츠 탐색
  { url: '/trending', name: '인기 영상', priority: 'high' },
  { url: '/new', name: '신규 영상', priority: 'medium' },
  { url: '/categories', name: '카테고리', priority: 'medium' },
  { url: '/ranking', name: '랭킹', priority: 'medium' },
  
  // 🏷️ 카테고리별 페이지
  { url: '/category/realestate', name: '부동산 카테고리', priority: 'high' },
  { url: '/category/stock', name: '주식 카테고리', priority: 'high' },
  { url: '/category/food', name: '음식 카테고리', priority: 'medium' },
  { url: '/category/travel', name: '여행 카테고리', priority: 'medium' },
  
  // 👤 사용자 페이지
  { url: '/dashboard', name: '대시보드', priority: 'high' },
  { url: '/mypage', name: '마이페이지', priority: 'medium' },
  { url: '/settings', name: '설정', priority: 'medium' },
  { url: '/studio/dashboard', name: '스튜디오', priority: 'high' },
  
  // ℹ️ 정보 페이지
  { url: '/about', name: '회사소개', priority: 'low' },
  { url: '/pricing', name: '요금제', priority: 'medium' },
  { url: '/help', name: '도움말', priority: 'low' },
  { url: '/contact', name: '문의하기', priority: 'low' },
  { url: '/terms', name: '이용약관', priority: 'low' },
  { url: '/privacy', name: '개인정보처리방침', priority: 'low' }
]

const qaChecklist = {
  // 📱 반응형 디자인
  responsiveBreakpoints: [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1440, height: 900, name: 'Desktop' }
  ],
  
  // ⚡ 성능 기준
  performance: {
    loadTime: 3000,      // 3초 이내
    firstPaint: 1500,    // 1.5초 이내
    interactive: 5000    // 5초 이내
  },
  
  // ♿ 접근성 기준
  accessibility: {
    colorContrast: 4.5,  // WCAG AA 기준
    keyboardNav: true,   // 키보드 네비게이션
    altText: true,       // 이미지 alt 텍스트
    headingStructure: true // 제목 구조
  },
  
  // 🔍 SEO 기준
  seo: {
    titleTag: true,      // 제목 태그 존재
    metaDescription: true, // 메타 설명 존재
    headingStructure: true // H1-H6 구조
  }
}

// QA 실행 플로우
const qaSteps = [
  '1. 페이지 로딩 확인',
  '2. 반응형 레이아웃 검증',
  '3. 네비게이션 링크 테스트', 
  '4. 폼 입력 및 유효성 검사',
  '5. 에러 상태 처리 확인',
  '6. 성능 메트릭 측정',
  '7. 접근성 준수 검증',
  '8. 브라우저 호환성 테스트'
]

console.log('🚀 Playwright MCP QA 스크립트 로드 완료')
console.log(`📊 테스트 대상: ${qaPages.length}개 페이지`)
console.log(`✅ QA 체크리스트: ${qaSteps.length}개 항목`)