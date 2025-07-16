# @repo/core

Enterprise AI Module System의 핵심 기반 라이브러리

## 🎯 목적

모든 엔터프라이즈 모듈의 기반이 되는 Zero Error Architecture 기반 핵심 시스템

## ✨ 주요 기능

### 🏗️ ModuleBase
모든 모듈이 상속받아야 하는 추상 기반 클래스
```typescript
class MyModule extends ModuleBase {
  protected async onInitialize(): Promise<Result<void>> {
    // 초기화 로직
    return { success: true };
  }
  
  protected async onDestroy(): Promise<Result<void>> {
    // 정리 로직  
    return { success: true };
  }
  
  public async healthCheck(): Promise<Result<boolean>> {
    // 헬스체크 로직
    return { success: true, data: true };
  }
}
```

### 📡 EventBus
모듈 간 이벤트 기반 통신
```typescript
import { EventBus } from '@repo/core';

// 이벤트 구독
const subscriptionId = EventBus.on('user:login', (event) => {
  console.log('사용자 로그인:', event.payload);
});

// 이벤트 발행
EventBus.emitModuleEvent('auth-module', 'user:login', { userId: '123' });

// 구독 해제
EventBus.off(subscriptionId);
```

### 🚨 ErrorHandler
Zero Error Architecture를 위한 안전한 에러 처리
```typescript
import { ErrorHandler } from '@repo/core';

const errorHandler = new ErrorHandler('my-module');

try {
  // 위험한 작업
  await riskyOperation();
} catch (error) {
  // 안전한 에러 처리
  const moduleError = errorHandler.handle(error);
  
  if (errorHandler.isRecoverable(moduleError)) {
    // 복구 시도
    await attemptRecovery();
  }
}
```

### 📝 Logger
구조화된 로깅 시스템
```typescript
import { Logger } from '@repo/core';

const logger = new Logger('my-module');

logger.info('모듈 시작됨', { version: '1.0.0' });
logger.warn('경고 상황 발생', { details: '...' });
logger.error('에러 발생', error, { context: '...' });

// 사용자 액션 로깅
logger.logUserAction('user123', 'purchase', 'product456');

// 성능 로깅
logger.logPerformance('database-query', 150);
```

### 📋 ModuleRegistry
모듈 등록 및 관리
```typescript
import { moduleRegistry } from '@repo/core';

// 모듈 등록
await moduleRegistry.register(myModule, [
  { name: '@repo/auth-core', version: '1.0.0' }
]);

// 모듈 검색
const authModule = moduleRegistry.get('@repo/auth-core');

// 모든 모듈 상태 확인
const healthStatus = await moduleRegistry.healthCheck();
```

### 🛠️ Utility Functions
Zero Error 기반 유틸리티
```typescript
import { safeJsonParse, retry, withTimeout } from '@repo/core';

// 안전한 JSON 파싱
const parseResult = safeJsonParse<User>('{"name": "John"}');
if (parseResult.success) {
  console.log(parseResult.data.name);
}

// 재시도 로직
const retryResult = await retry(
  () => fetchUserData(userId),
  { maxAttempts: 3, delay: 1000 }
);

// 타임아웃 처리
const timeoutResult = await withTimeout(
  longRunningOperation(),
  5000
);
```

## 📦 설치

```bash
npm install @repo/core
```

## 🏗️ 기본 사용법

### 1. 모듈 생성
```typescript
import { ModuleBase, type ModuleConfig, type Result } from '@repo/core';

const config: ModuleConfig = {
  name: 'my-awesome-module',
  version: '1.0.0',
  description: '멋진 모듈입니다'
};

class MyAwesomeModule extends ModuleBase {
  protected async onInitialize(): Promise<Result<void>> {
    this.logger.info('모듈 초기화 중...');
    
    // 초기화 로직
    await this.setupDatabase();
    await this.registerEventHandlers();
    
    this.logger.info('모듈 초기화 완료');
    return { success: true };
  }
  
  protected async onDestroy(): Promise<Result<void>> {
    this.logger.info('모듈 정리 중...');
    
    // 정리 로직
    await this.closeDatabase();
    
    this.logger.info('모듈 정리 완료');
    return { success: true };
  }
  
  public async healthCheck(): Promise<Result<boolean>> {
    const isDatabaseConnected = await this.checkDatabase();
    return { success: true, data: isDatabaseConnected };
  }
  
  private async setupDatabase() {
    // 데이터베이스 설정
  }
  
  private async registerEventHandlers() {
    // 이벤트 핸들러 등록
  }
  
  private async closeDatabase() {
    // 데이터베이스 연결 종료
  }
  
  private async checkDatabase(): Promise<boolean> {
    // 데이터베이스 상태 확인
    return true;
  }
}

// 모듈 인스턴스 생성
const myModule = new MyAwesomeModule(config);
```

### 2. 모듈 등록
```typescript
import { moduleRegistry } from '@repo/core';

// 의존성과 함께 등록
const registerResult = await moduleRegistry.register(myModule, [
  { name: '@repo/auth-core' },
  { name: '@repo/database', version: '2.0.0' }
]);

if (registerResult.success) {
  console.log('모듈 등록 성공!');
} else {
  console.error('모듈 등록 실패:', registerResult.error);
}
```

### 3. 이벤트 통신
```typescript
// 다른 모듈의 이벤트 구독
EventBus.on('user:profile-updated', async (event) => {
  await myModule.handleUserProfileUpdate(event.payload);
});

// 이벤트 발행
EventBus.emitModuleEvent(
  'my-awesome-module',
  'data:processed',
  { recordId: '123', status: 'completed' }
);
```

## 🧪 테스트

```bash
npm test
```

## 📚 API 문서

자세한 API 문서는 [여기](./docs/api.md)를 참조하세요.

## 🔧 개발

```bash
# 개발 모드
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint
```

## 📋 요구사항

- Node.js 20+
- TypeScript 5+

## 🤝 기여

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License