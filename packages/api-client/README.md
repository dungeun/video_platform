# @company/api-client

엔터프라이즈급 HTTP 클라이언트 모듈

## 특징

- 🔄 자동 재시도 및 지수 백오프
- 💾 응답 캐싱 시스템
- 🔐 인증 인터셉터 (토큰 자동 갱신)
- 📊 상세한 요청/응답 로깅
- ⚡ TypeScript 완벽 지원
- 🛡️ Zero Error Architecture

## 설치

```bash
pnpm add @company/api-client
```

## 기본 사용법

```typescript
import { createHttpClient } from '@company/api-client';

// 기본 클라이언트 생성
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  headers: {
    'X-API-Version': '1.0'
  }
});

// GET 요청
const response = await client.get('/users');

// POST 요청
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

## 인터셉터 설정

```typescript
import { createHttpClientWithInterceptors } from '@company/api-client';

const client = createHttpClientWithInterceptors(
  {
    baseURL: 'https://api.example.com'
  },
  {
    // 인증 인터셉터
    auth: {
      getToken: () => localStorage.getItem('accessToken'),
      refreshToken: async () => {
        const response = await fetch('/auth/refresh');
        const data = await response.json();
        return data.accessToken;
      },
      onAuthError: (error) => {
        // 로그아웃 처리
        window.location.href = '/login';
      }
    },
    
    // 로깅 인터셉터
    logging: {
      logRequest: true,
      logResponse: true,
      logHeaders: false,
      logBody: true
    },
    
    // 에러 인터셉터
    error: {
      onNetworkError: (error) => {
        console.error('네트워크 오류:', error);
      },
      errorMessages: {
        404: '페이지를 찾을 수 없습니다',
        500: '서버 오류가 발생했습니다'
      }
    }
  }
);
```

## 재시도 설정

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error, attempt) => {
      // 5xx 에러만 재시도
      return error.response?.status >= 500;
    }
  }
});
```

## 캐싱

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5분
    shouldCache: (response) => {
      // 성공 응답만 캐시
      return response.status === 200;
    }
  }
});
```

## 파일 업로드

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('description', '프로필 이미지');

const response = await client.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(`업로드 진행률: ${percentCompleted}%`);
  }
});
```

## 요청 취소

```typescript
// 취소 토큰 생성
const source = axios.CancelToken.source();

// 요청 시작
client.get('/data', {
  cancelToken: source.token
}).catch(error => {
  if (axios.isCancel(error)) {
    console.log('요청이 취소되었습니다');
  }
});

// 요청 취소
source.cancel('사용자가 요청을 취소했습니다');
```

## 고급 사용법

### 커스텀 인터셉터

```typescript
// 요청 인터셉터
client.addRequestInterceptor({
  onFulfilled: (config) => {
    // 타임스탬프 추가
    config.headers['X-Request-Time'] = Date.now();
    return config;
  },
  onRejected: (error) => {
    return Promise.reject(error);
  }
});

// 응답 인터셉터
client.addResponseInterceptor({
  onFulfilled: (response) => {
    // 응답 시간 계산
    const requestTime = response.config.headers['X-Request-Time'];
    const responseTime = Date.now() - requestTime;
    console.log(`응답 시간: ${responseTime}ms`);
    return response;
  },
  onRejected: (error) => {
    return Promise.reject(error);
  }
});
```

### 프록시 설정

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  proxy: {
    host: 'proxy.example.com',
    port: 8080,
    auth: {
      username: 'user',
      password: 'pass'
    }
  }
});
```

## API 레퍼런스

### HttpClient 메소드

- `get(url, config?)` - GET 요청
- `post(url, data?, config?)` - POST 요청
- `put(url, data?, config?)` - PUT 요청
- `delete(url, config?)` - DELETE 요청
- `patch(url, data?, config?)` - PATCH 요청
- `head(url, config?)` - HEAD 요청
- `options(url, config?)` - OPTIONS 요청
- `request(config)` - 커스텀 요청

### 설정 옵션

```typescript
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retry?: RetryConfig;
  cache?: CacheConfig;
  withCredentials?: boolean;
  validateStatus?: (status: number) => boolean;
}
```