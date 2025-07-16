# @repo/config

🔧 **엔터프라이즈 설정 관리 모듈**  
다양한 환경별 설정을 통합 관리하는 설정 모듈

## 🚀 주요 기능

### ✨ 멀티 소스 지원
- **환경변수** (.env 파일 포함)
- **JSON/YAML 파일**
- **JavaScript/TypeScript 모듈**
- **원격 설정** (확장 가능)

### 🔍 스키마 기반 검증
- **Zod 스키마** 기반 타입 안전 검증
- **환경별 특화 검증** (production, development, test)
- **실시간 검증 오류** 리포팅

### ⚡ Hot Reload
- **실시간 설정 변경 감지**
- **무중단 설정 업데이트**
- **변경 이벤트 알림**

### 🛡️ Zero Error Architecture
- **Result 패턴** 사용
- **타입 안전성** 보장
- **예외 없는 오류 처리**

## 📦 설치

```bash
npm install @repo/config
```

## 🎯 빠른 시작

### 1. 기본 사용법

```typescript
import { initializeGlobalConfig, getConfig } from '@repo/config';

// 설정 초기화
const result = await initializeGlobalConfig();
if (result.isFailure) {
  console.error('설정 로드 실패:', result.message);
  process.exit(1);
}

// 설정 사용
const dbConfig = getConfig('database');
const serverPort = getConfig('server').port;

console.log('DB 호스트:', dbConfig.host);
console.log('서버 포트:', serverPort);
```

### 2. 커스텀 설정 소스

```typescript
import { createConfigManager } from '@repo/config';

const manager = createConfigManager({
  sources: [
    { type: 'env', priority: 100 },
    { type: 'file', path: '.env.local', priority: 90 },
    { type: 'file', path: 'config.json', priority: 80 },
    { type: 'file', path: 'config.yaml', priority: 70 }
  ],
  hotReload: true,
  validateOnLoad: true
});

const result = await manager.load();
```

### 3. 설정 변경 감지

```typescript
import { getGlobalConfig } from '@repo/config';

const manager = getGlobalConfig();
manager.watch((newConfig) => {
  console.log('설정이 변경되었습니다:', newConfig.name);
  
  // 서버 재시작 또는 설정 적용 로직
  if (newConfig.server.port !== currentPort) {
    restartServer(newConfig.server.port);
  }
});
```

## 📋 설정 스키마

### 전체 설정 구조

```typescript
interface AppConfig {
  // 애플리케이션 기본 설정
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production' | 'test';
  debug: boolean;
  
  // 서버 설정
  server: {
    host: string;
    port: number;
    cors: {
      enabled: boolean;
      origins: string[];
      credentials: boolean;
    };
  };
  
  // 데이터베이스 설정
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    maxConnections: number;
    timeout: number;
  };
  
  // 인증 설정
  auth: {
    jwtSecret: string;
    jwtExpiry: string;
    bcryptRounds: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  
  // 스토리지 설정
  storage: {
    provider: 'local' | 'aws-s3' | 'gcp-storage' | 'azure-blob';
    basePath: string;
    maxFileSize: number;
    allowedMimeTypes: string[];
    cdn?: {
      enabled: boolean;
      url: string;
      cacheTtl: number;
    };
  };
  
  // 이메일 설정
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    apiKey?: string;
    from: string;
    replyTo?: string;
  };
  
  // 캐시 설정
  cache: {
    provider: 'memory' | 'redis' | 'memcached';
    host?: string;
    port?: number;
    password?: string;
    ttl: number;
    maxSize: number;
    compression: boolean;
  };
  
  // 결제 설정
  payment: {
    providers: {
      stripe?: {
        enabled: boolean;
        publishableKey?: string;
        secretKey?: string;
        webhookSecret?: string;
      };
      paypal?: {
        enabled: boolean;
        clientId?: string;
        clientSecret?: string;
        sandbox: boolean;
      };
    };
    currency: string;
    taxRate: number;
  };
  
  // 기능 플래그
  features: {
    registration: boolean;
    socialLogin: boolean;
    twoFactorAuth: boolean;
    analytics: boolean;
    maintenance: boolean;
  };
}
```

## 🔧 환경변수 매핑

### 기본 환경변수

```bash
# .env 파일 예시

# 애플리케이션
APP_NAME=my-awesome-app
APP_VERSION=1.0.0
NODE_ENV=development
DEBUG=true

# 서버
SERVER_HOST=localhost
SERVER_PORT=3000
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=myapp
DB_PASSWORD=secret123
DB_DATABASE=myapp_development
DB_SSL=false

# 인증
JWT_SECRET=your-super-secret-jwt-key-32-characters-long
JWT_EXPIRY=24h
BCRYPT_ROUNDS=12

# 스토리지
STORAGE_PROVIDER=local
STORAGE_BASE_PATH=./uploads
STORAGE_MAX_FILE_SIZE=10485760

# 이메일
EMAIL_PROVIDER=smtp
EMAIL_HOST=localhost
EMAIL_PORT=587
EMAIL_FROM=noreply@example.com

# 캐시
CACHE_PROVIDER=memory
CACHE_TTL=3600

# 결제
STRIPE_ENABLED=false
PAYPAL_ENABLED=false
PAYMENT_CURRENCY=USD

# 기능 플래그
FEATURE_REGISTRATION=true
FEATURE_SOCIAL_LOGIN=false
FEATURE_2FA=false
```

## 📁 설정 파일 형식

### JSON 설정 파일

```json
// config.json
{
  "name": "my-app",
  "server": {
    "port": 3000
  },
  "database": {
    "host": "localhost",
    "port": 5432
  }
}
```

### YAML 설정 파일

```yaml
# config.yaml
name: my-app
server:
  port: 3000
database:
  host: localhost
  port: 5432
```

### JavaScript 설정 파일

```javascript
// config.js
module.exports = {
  name: 'my-app',
  server: {
    port: process.env.NODE_ENV === 'production' ? 80 : 3000
  },
  database: {
    host: process.env.DB_HOST || 'localhost'
  }
};
```

## 🏗️ 고급 사용법

### 1. 환경별 검증

```typescript
import { ConfigValidator } from '@repo/config';

const validator = new ConfigValidator();

// 프로덕션 환경 특화 검증
const result = validator.validateEnvironmentConfig('production', config);
if (result.isFailure) {
  console.error('프로덕션 설정 검증 실패:', result.message);
}
```

### 2. 커스텀 로더

```typescript
import { ConfigLoader, Result } from '@repo/config';

class RemoteConfigLoader implements ConfigLoader {
  readonly priority = 50;
  
  async load(): Promise<Result<Partial<AppConfig>>> {
    try {
      const response = await fetch('https://config-api.example.com/config');
      const config = await response.json();
      return Result.success(config);
    } catch (error) {
      return Result.failure('REMOTE_LOAD_FAILED', error.message);
    }
  }
}

// 커스텀 로더 사용
const manager = createConfigManager();
manager.addLoader('remote', new RemoteConfigLoader());
```

### 3. 설정 값 마스킹

```typescript
import { maskEnvValue, dumpEnvConfig } from '@repo/config';

// 민감한 값 마스킹
const maskedSecret = maskEnvValue('JWT_SECRET', 'super-secret-key');
console.log(maskedSecret); // "su**********ey"

// 전체 환경변수 덤프 (마스킹된 상태)
const envDump = dumpEnvConfig('APP');
console.log(envDump);
```

## 🔒 보안 고려사항

### 1. 민감한 정보 보호
- JWT 시크릿, 데이터베이스 비밀번호 등은 환경변수로만 설정
- 설정 파일에 민감한 정보 저장 금지
- 프로덕션에서 debug 모드 비활성화

### 2. 설정 파일 권한
```bash
# 설정 파일 권한 설정
chmod 600 .env
chmod 600 config.json
```

### 3. Git 보안
```bash
# .gitignore
.env
.env.local
.env.production
config.local.json
```

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 커버리지 확인
npm run test:coverage
```

## 📊 성능

- **로드 시간**: < 10ms (평균)
- **메모리 사용량**: < 5MB
- **Hot reload**: < 50ms
- **검증 시간**: < 5ms

## 🔄 마이그레이션

### v0.x에서 v1.0으로

```typescript
// 이전 버전
import config from '@repo/config';
const dbHost = config.database.host;

// 새 버전
import { getConfig } from '@repo/config';
const dbHost = getConfig('database').host;
```

## 🛠️ 개발 가이드

### 빌드
```bash
npm run build
```

### 개발 모드
```bash
npm run dev
```

### 린트
```bash
npm run lint
npm run lint:fix
```

## 🤝 기여하기

1. Fork the repo
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License

---

**🎯 다음 단계**: [@repo/database](../database) 모듈과 함께 사용하여 완전한 설정 기반 데이터베이스 연결을 구성하세요!