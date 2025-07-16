# @company/auth-core

엔터프라이즈급 인증/인가 모듈 - Zero Error Architecture 기반

## 📋 개요

`@company/auth-core`는 현대적인 웹 애플리케이션을 위한 완전한 인증/인가 솔루션입니다. React 애플리케이션에서 사용자 인증, 권한 관리, 세션 관리를 쉽고 안전하게 처리할 수 있습니다.

## ✨ 주요 기능

### 🔐 인증 (Authentication)
- 이메일/비밀번호 로그인
- 소셜 로그인 지원 (Google, Facebook, Naver, Kakao, Apple)
- 2FA/MFA 지원
- JWT 토큰 관리
- 자동 토큰 갱신
- 세션 관리

### 🛡️ 인가 (Authorization)
- 역할 기반 접근 제어 (RBAC)
- 권한 기반 접근 제어 (PBAC)
- 조건부 권한
- 리소스별 권한 관리

### 🔧 개발자 경험
- TypeScript 완전 지원
- React 훅 제공
- Zero Error Architecture
- 포괄적인 테스트
- 상세한 문서화

## 📦 설치

```bash
npm install @company/auth-core
# 또는
pnpm add @company/auth-core
```

### 의존성

```bash
npm install @company/core @company/types @company/utils react zustand js-cookie
```

## 🚀 빠른 시작

### 1. AuthProvider 설정

```tsx
import { AuthProvider, createAuthConfig } from '@company/auth-core';

const authConfig = createAuthConfig({
  apiUrl: 'http://localhost:3000/api',
  enableSocialLogin: true,
  socialProviders: [
    {
      provider: 'google',
      clientId: 'your-google-client-id',
      redirectUri: 'http://localhost:3000/auth/google/callback'
    }
  ]
});

function App() {
  return (
    <AuthProvider config={authConfig}>
      <YourApp />
    </AuthProvider>
  );
}
```

### 2. 로그인 폼 사용

```tsx
import { LoginForm } from '@company/auth-core';

function LoginPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1>로그인</h1>
      <LoginForm
        onSuccess={() => {
          console.log('로그인 성공!');
          // 리다이렉트 로직
        }}
        onError={(error) => {
          console.error('로그인 실패:', error);
        }}
      />
    </div>
  );
}
```

### 3. 인증 상태 사용

```tsx
import { useAuth } from '@company/auth-core';

function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <div>
      <h1>안녕하세요, {user?.name}님!</h1>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
```

### 4. 보호된 라우트

```tsx
import { ProtectedRoute } from '@company/auth-core';

function AdminPage() {
  return (
    <ProtectedRoute
      requiredRoles={['admin']}
      fallback={<div>관리자 권한이 필요합니다.</div>}
    >
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

### 5. 권한 확인

```tsx
import { usePermission } from '@company/auth-core';

function UserActions() {
  const { hasPermission, checkPermission } = usePermission();

  return (
    <div>
      {hasPermission('user.edit') && (
        <button>사용자 편집</button>
      )}
      
      {checkPermission('posts', 'create') && (
        <button>게시글 작성</button>
      )}
    </div>
  );
}
```

## 📚 주요 API

### 훅 (Hooks)

#### useAuth()
```tsx
const {
  // 상태
  user,
  session,
  status,
  isLoading,
  isAuthenticated,
  error,

  // 메소드
  login,
  logout,
  signup,
  refreshToken,
  updateProfile,
  changePassword,

  // 권한
  hasPermission,
  hasRole,

  // 유틸리티
  clearError
} = useAuth();
```

#### usePermission()
```tsx
const {
  hasPermission,
  hasRole,
  hasAnyPermission,
  hasAllPermissions,
  checkPermission
} = usePermission();
```

### 컴포넌트

#### AuthProvider
```tsx
<AuthProvider config={authConfig}>
  {children}
</AuthProvider>
```

#### LoginForm
```tsx
<LoginForm
  onSuccess={() => {}}
  onError={(error) => {}}
  showRememberMe={true}
  disabled={false}
/>
```

#### ProtectedRoute
```tsx
<ProtectedRoute
  requireAuth={true}
  requiredPermissions={['user.read']}
  requiredRoles={['user']}
  requireAllPermissions={true}
  resource="posts"
  action="create"
  customCheck={() => true}
  fallback={<div>권한이 없습니다</div>}
  unauthorizedComponent={<UnauthorizedPage />}
  loadingComponent={<LoadingSpinner />}
>
  {children}
</ProtectedRoute>
```

## 🔧 설정

### AuthConfig

```typescript
interface AuthConfig {
  apiUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
  sessionTimeout: number; // minutes
  rememberMeDuration: number; // days
  passwordPolicy: PasswordPolicy;
  socialProviders: SocialLoginConfig[];
  enableTwoFactor: boolean;
  enableSocialLogin: boolean;
  enableRememberMe: boolean;
  autoRefreshToken: boolean;
  logoutOnWindowClose: boolean;
}
```

### 비밀번호 정책

```typescript
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
  historyCount: number;
}
```

## 🔐 보안 기능

### JWT 토큰 관리
- 자동 토큰 갱신
- 안전한 토큰 저장 (HttpOnly 쿠키 권장)
- 토큰 만료 감지
- XSS/CSRF 방어

### 세션 관리
- 자동 세션 연장
- 사용자 활동 추적
- 세션 타임아웃
- 멀티탭 지원

### 권한 시스템
- 역할 기반 접근 제어
- 리소스별 권한
- 조건부 권한
- 권한 캐싱

## 🧪 테스트

```bash
# 테스트 실행
pnpm test

# 커버리지 확인
pnpm test:coverage
```

## 📖 고급 사용법

### 커스텀 AuthService

```typescript
import { AuthService, createAuthConfig } from '@company/auth-core';

class CustomAuthService extends AuthService {
  async customLogin(customData: any) {
    // 커스텀 로그인 로직
    return super.login(customData);
  }
}

const authService = new CustomAuthService(
  createAuthConfig({ apiUrl: '/api' })
);
```

### 이벤트 리스너

```typescript
import { EventBus } from '@company/core';

// 로그인 이벤트 구독
EventBus.on('auth:login', (event) => {
  console.log('사용자 로그인:', event.payload.user);
});

// 로그아웃 이벤트 구독
EventBus.on('auth:logout', (event) => {
  console.log('사용자 로그아웃:', event.payload.user);
});
```

### 소셜 로그인

```typescript
import { SocialProvider } from '@company/auth-core';

// 소셜 로그인 URL 생성
const { authService } = useAuthContext();
const loginUrl = authService.generateSocialLoginUrl(SocialProvider.GOOGLE);

// 콜백 처리
const result = await authService.handleSocialCallback(
  SocialProvider.GOOGLE,
  code
);
```

## 🔧 문제 해결

### 일반적인 문제

1. **토큰이 자동으로 갱신되지 않음**
   - `autoRefreshToken: true` 설정 확인
   - 네트워크 연결 상태 확인

2. **권한 확인이 작동하지 않음**
   - 사용자가 로그인되어 있는지 확인
   - 권한 데이터가 올바르게 로드되었는지 확인

3. **세션이 예상보다 빨리 만료됨**
   - `sessionTimeout` 설정 확인
   - 사용자 활동이 올바르게 추적되는지 확인

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 지원

- 이슈: [GitHub Issues](https://github.com/company/enterprise-modules/issues)
- 문서: [Documentation](https://docs.company.com/auth-core)
- 이메일: support@company.com