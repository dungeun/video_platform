# @company/auth

**순수 인증 모듈 - 로그인/로그아웃 기능만 제공**

Ultra-Fine-Grained Module로 설계된 초세분화 인증 모듈입니다. 복잡한 `@company/auth-core`에서 핵심 로그인/로그아웃 기능만을 분리하여 순수한 인증 기능만을 제공합니다.

## 🎯 모듈 목적

- **순수 인증**: 로그인, 로그아웃, 세션 관리만 제공
- **초세분화**: 권한 관리, 2FA, 소셜 로그인 등은 별도 모듈로 분리
- **경량화**: 최소한의 의존성으로 빠른 로딩
- **재사용성**: 다양한 프로젝트에서 기본 인증 기능 제공

## 📦 설치

```bash
pnpm add @company/auth
```

## 🚀 기본 사용법

### 1. AuthProvider 설정

```tsx
import React from 'react';
import { AuthProvider } from '@company/auth';

// 간단한 설정
function App() {
  return (
    <AuthProvider 
      config={{
        apiUrl: '/api',
        tokenStorageKey: 'auth-token',
        refreshTokenKey: 'refresh-token',
        sessionTimeout: 120, // 2시간
        autoRefreshToken: true
      }}
    >
      <YourApp />
    </AuthProvider>
  );
}

// 더 간단한 설정
function App() {
  return (
    <SimpleAuthProvider apiUrl="/api">
      <YourApp />
    </SimpleAuthProvider>
  );
}
```

### 2. useAuth 훅 사용

```tsx
import React from 'react';
import { useAuth } from '@company/auth';

function LoginPage() {
  const { login, logout, user, isAuthenticated, isLoading, error } = useAuth();

  const handleLogin = async (credentials) => {
    const result = await login(credentials);
    if (result.success) {
      console.log('로그인 성공');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>환영합니다, {user?.name}님!</p>
          <button onClick={handleLogout}>로그아웃</button>
        </div>
      ) : (
        <LoginForm onLoginSuccess={() => console.log('로그인됨')} />
      )}
    </div>
  );
}
```

### 3. 내장 컴포넌트 사용

```tsx
import React from 'react';
import { LoginForm, LogoutButton, AuthStatus } from '@company/auth';

function AuthPage() {
  return (
    <div>
      <LoginForm 
        onLoginSuccess={() => console.log('로그인 성공')}
        showRememberMe={true}
      />
      
      <LogoutButton 
        variant="danger"
        onLogoutSuccess={() => console.log('로그아웃 성공')}
      >
        로그아웃
      </LogoutButton>
      
      <AuthStatus 
        showUserInfo={true}
        showSessionInfo={true}
      />
    </div>
  );
}
```

## 🔧 API 참조

### AuthService

핵심 인증 서비스 클래스입니다.

```typescript
const authService = new AuthService(config);

// 로그인
const result = await authService.login({
  email: 'user@example.com',
  password: 'password',
  rememberMe: true
});

// 로그아웃
await authService.logout();

// 토큰 갱신
await authService.refreshToken();

// 상태 조회
const user = authService.getCurrentUser();
const session = authService.getCurrentSession();
const isAuth = authService.isAuthenticated();
const tokenInfo = authService.getTokenInfo();
```

### 훅들

```typescript
// 메인 훅
const auth = useAuth();

// 개별 상태 훅
const user = useAuthUser();
const status = useAuthStatus();
const isAuth = useIsAuthenticated();
const session = useAuthSession();
const error = useAuthError();
const loading = useAuthLoading();
```

### 상태 관리

Zustand 기반의 상태 관리를 제공합니다.

```typescript
import { useAuthStore, authActions } from '@company/auth';

// 스토어 직접 사용
const { user, status, session } = useAuthStore();

// 액션 디스패치
authActions.setUser(user);
authActions.setStatus(AuthStatus.AUTHENTICATED);
authActions.clearAuth();

// 구독
const unsubscribe = subscribeToUser((user) => {
  console.log('사용자 변경:', user);
});
```

## 🏗️ 구조

```
src/
├── auth/
│   ├── AuthService.ts      # 핵심 인증 서비스
│   ├── TokenManager.ts     # 토큰 관리
│   └── SessionManager.ts   # 세션 관리
├── hooks/
│   └── useAuth.ts         # React 훅
├── providers/
│   ├── AuthProvider.tsx   # Context Provider
│   └── AuthStore.ts       # Zustand 스토어
├── components/
│   ├── LoginForm.tsx      # 로그인 폼
│   ├── LogoutButton.tsx   # 로그아웃 버튼
│   └── AuthStatus.tsx     # 인증 상태 표시
├── types/
│   └── index.ts           # 타입 정의
└── index.ts               # 메인 export
```

## 🔐 보안

- JWT 토큰 자동 갱신
- 세션 만료 자동 감지
- 안전한 토큰 저장 (localStorage)
- XSS 방지를 위한 토큰 검증

## 🧪 테스트

```bash
# 테스트 실행
pnpm test

# 커버리지 포함 테스트
pnpm test:coverage
```

## 📊 타입 정의

### 주요 타입

```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
}

interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
  issuedAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}
```

## 🔄 다른 모듈과의 관계

- **@company/auth-core**: 복합 인증 기능 (권한, 2FA, 소셜 로그인 포함)
- **@company/permissions**: 권한 관리 전용 모듈
- **@company/api-client**: HTTP 클라이언트 모듈
- **@company/core**: 기본 모듈 시스템

## 📈 성능

- **번들 크기**: ~15KB (gzipped)
- **의존성**: 최소한 (core, api-client, zustand)
- **로딩 시간**: < 100ms
- **메모리 사용량**: < 5MB

## 🛠️ 개발

```bash
# 개발 모드
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm type-check
```

## 📝 라이센스

MIT

---

**@company/auth** - 순수하고 경량화된 인증 모듈 🔐