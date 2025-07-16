# Enterprise AI Modules

## 모듈 계층 구조

### Layer 1: Foundation (기반)
- `@company/core` - 모든 모듈의 기반이 되는 핵심 기능
- `@company/types` - 공통 타입 정의
- `@company/utils` - 공통 유틸리티

### Layer 2: Infrastructure (인프라)
- `@company/auth-core` - 인증/인가 핵심
- `@company/api-client` - API 통신 클라이언트
- `@company/storage` - 저장소 추상화
- `@company/event-bus` - 모듈 간 이벤트 통신

### Layer 3: Business (비즈니스)
- `@company/user-management` - 사용자 관리
- `@company/board-engine` - 게시판 엔진
- `@company/payment-gateway` - 결제 게이트웨이
- `@company/notification` - 알림 시스템
- `@company/file-manager` - 파일 관리

### Layer 4: UI Components (UI)
- `@company/ui-kit` - 기본 UI 컴포넌트
- `@company/form-builder` - 폼 빌더
- `@company/data-table` - 데이터 테이블
- `@company/dashboard-widgets` - 대시보드 위젯

### Layer 5: Templates (템플릿)
- `@company/admin-template` - 관리자 템플릿
- `@company/starter-kits` - 스타터 키트
- `@company/layouts` - 레이아웃 모음

## 개발 순서

1. **@company/core** (최우선)
2. **@company/types** 
3. **@company/utils**
4. **@company/event-bus**
5. 그 후 상위 계층 순서대로...

## 개발 원칙

- **Zero Error Architecture**: 절대 throw하지 않는 안전한 모듈
- **Ultra Modular**: 한 모듈 = 한 기능
- **AI First**: AI가 이해하고 사용하기 쉽게