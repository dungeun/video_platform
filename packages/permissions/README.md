# @company/permissions

Ultra-fine-grained permission checking and access control module

## 개요

`@company/permissions`는 auth-core에서 분리된 순수한 권한 관리 모듈입니다. 고성능 캐싱, 조건부 권한 평가, React 통합을 제공합니다.

## 주요 기능

### 🔐 권한 확인
- 기본 권한 확인 (`hasPermission`)
- 역할 기반 확인 (`hasRole`)
- 여러 권한 확인 (`hasAnyPermission`, `hasAllPermissions`)
- 리소스별 액션 확인 (`checkPermission`)

### 📊 고급 평가
- 조건부 권한 처리
- 스코프 기반 제한
- 상세한 평가 결과 제공
- 컨텍스트 기반 동적 평가

### ⚡ 고성능 캐싱
- LRU 캐시 전략
- TTL 기반 만료
- 사용자별 캐시 관리
- 캐시 통계 및 모니터링

### ⚛️ React 통합
- `usePermission` 훅
- `ProtectedComponent` 컴포넌트
- `PermissionGate` HOC
- 개발용 디버거

## 설치

```bash
npm install @company/permissions
# 또는
yarn add @company/permissions
# 또는
pnpm add @company/permissions
```

## 기본 사용법

### 1. Provider 설정

```tsx
import { PermissionProvider } from '@company/permissions';

function App() {
  return (
    <PermissionProvider 
      userId="current-user-id"
      config={{
        cacheEnabled: true,
        cacheTtl: 300, // 5분
        enableDebugMode: true
      }}
    >
      <MyApp />
    </PermissionProvider>
  );
}
```

### 2. 권한 확인 훅

```tsx
import { usePermission } from '@company/permissions';

function UserProfile() {
  const { hasPermission, hasRole, checkPermission } = usePermission();

  const canEdit = hasPermission('profile.update');
  const isAdmin = hasRole('admin');
  const canManageUsers = checkPermission('users', 'manage');

  return (
    <div>
      {canEdit && <EditButton />}
      {isAdmin && <AdminPanel />}
      {canManageUsers && <UserManagement />}
    </div>
  );
}
```

### 3. 보호된 컴포넌트

```tsx
import { ProtectedComponent } from '@company/permissions';

function SecretContent() {
  return (
    <ProtectedComponent 
      permission="secret.read"
      fallback={<div>접근 권한이 없습니다</div>}
    >
      <div>비밀 내용</div>
    </ProtectedComponent>
  );
}
```

### 4. 권한 게이트

```tsx
import { PermissionGate, withPermissions } from '@company/permissions';

// 컴포넌트 래핑
function AdminButton() {
  return <button>관리자 기능</button>;
}

const ProtectedAdminButton = withPermissions(AdminButton, {
  role: 'admin',
  fallback: <div>관리자만 접근 가능</div>
});

// 또는 직접 사용
function Dashboard() {
  return (
    <PermissionGate permissions={['dashboard.read', 'analytics.view']} requireAll>
      <DashboardContent />
    </PermissionGate>
  );
}
```

## 고급 사용법

### 조건부 권한

```tsx
import { usePermission, PermissionContext } from '@company/permissions';

function DocumentEditor({ document }) {
  const { evaluatePermission } = usePermission();

  const context: PermissionContext = {
    userId: 'current-user',
    resource: document,
    metadata: {
      organizationId: document.organizationId,
      departmentId: document.departmentId
    }
  };

  const result = evaluatePermission('document.edit', context, {
    includeReasons: true
  });

  if (!result.granted) {
    return <div>편집 권한이 없습니다: {result.reason}</div>;
  }

  return <Editor document={document} />;
}
```

### 캐시 관리

```tsx
import { usePermissionCache } from '@company/permissions';

function CacheManager() {
  const { clearCache, getCacheStats, warmupCache } = usePermissionCache();

  const stats = getCacheStats();

  const handleWarmup = async () => {
    await warmupCache([
      'profile.read',
      'profile.update',
      'documents.list',
      'documents.create'
    ]);
  };

  return (
    <div>
      <p>캐시 크기: {stats.size}</p>
      <p>적중률: {(stats.hitRate * 100).toFixed(1)}%</p>
      <button onClick={clearCache}>캐시 초기화</button>
      <button onClick={handleWarmup}>캐시 워밍업</button>
    </div>
  );
}
```

### 개발 도구

```tsx
import { PermissionDebugger } from '@company/permissions';

function App() {
  return (
    <div>
      <MyApp />
      
      {/* 개발 환경에서만 표시 */}
      <PermissionDebugger 
        permissions={[
          'profile.read',
          'profile.update',
          'users.manage',
          'admin.access'
        ]}
        showCacheStats
        showPermissionSummary
      />
    </div>
  );
}
```

## 권한 정의

### 권한 구조

```typescript
interface Permission {
  id: string;
  name: string;          // 예: "users.read"
  resource: string;      // 예: "users"
  action: PermissionAction;  // READ, WRITE, DELETE 등
  conditions?: PermissionCondition[];
  scope?: PermissionScope;
}
```

### 조건 정의

```typescript
interface PermissionCondition {
  field: string;         // 예: "userId", "metadata.organizationId"
  operator: ConditionOperator;  // EQ, NE, IN, GT 등
  value: any;
  logicalOperator?: LogicalOperator;  // AND, OR, NOT
}
```

### 스코프 정의

```typescript
interface PermissionScope {
  type: ScopeType;       // USER, ORGANIZATION, PROJECT 등
  values: string[];      // 허용된 값들
  excludes?: string[];   // 제외할 값들
}
```

## API 레퍼런스

### PermissionManager

```typescript
class PermissionManager {
  // 권한 로드
  loadUserPermissions(userId: string): Promise<void>;
  clearUserPermissions(userId: string): void;

  // 권한 확인
  hasPermission(userId: string, permission: string, context?: PermissionContext): boolean;
  hasRole(userId: string, role: string): boolean;
  hasAnyPermission(userId: string, permissions: string[], context?: PermissionContext): boolean;
  hasAllPermissions(userId: string, permissions: string[], context?: PermissionContext): boolean;
  checkPermission(userId: string, resource: string, action: PermissionAction, context?: PermissionContext): boolean;

  // 고급 평가
  evaluatePermission(userId: string, permission: string, context?: PermissionContext, options?: PermissionEvaluationOptions): PermissionEvaluationResult;
  
  // 정보 조회
  getPermissionSummary(userId: string): PermissionSummary | null;
  getCacheInfo(): CacheInfo;

  // 관리 기능
  isAdmin(userId: string): boolean;
  isSystemUser(userId: string): boolean;
  clearCache(): void;
  clearUserCache(userId: string): void;
}
```

### 훅

```typescript
// usePermission
interface UsePermissionReturn {
  hasPermission: (permission: string, context?: PermissionContext) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[], context?: PermissionContext) => boolean;
  hasAllPermissions: (permissions: string[], context?: PermissionContext) => boolean;
  checkPermission: (resource: string, action: PermissionAction, context?: PermissionContext) => boolean;
  evaluatePermission: (permission: string, context?: PermissionContext, options?: PermissionEvaluationOptions) => PermissionEvaluationResult;
  getPermissionSummary: () => PermissionSummary | null;
  isLoading: boolean;
  error: string | null;
}

// usePermissionCache
interface UsePermissionCacheReturn {
  clearCache: () => void;
  getCacheStats: () => CacheInfo;
  warmupCache: (permissions: string[]) => Promise<void>;
  preloadPermissions: (userId: string) => Promise<void>;
}
```

## 설정

### PermissionManagerConfig

```typescript
interface PermissionManagerConfig {
  cacheEnabled: boolean;          // 기본값: true
  cacheTtl: number;              // 기본값: 300 (5분)
  maxCacheSize: number;          // 기본값: 1000
  strictMode: boolean;           // 기본값: false
  enableDebugMode: boolean;      // 기본값: development 환경에서 true
  defaultScope: ScopeType;       // 기본값: USER
}
```

## 성능 최적화

### 캐싱 전략

```typescript
import { 
  DefaultCacheStrategy,
  AggressiveCacheStrategy,
  ConservativeCacheStrategy 
} from '@company/permissions';

// 기본 전략 (권한별 다른 TTL)
const defaultStrategy = new DefaultCacheStrategy();

// 적극적 캐싱 (긴 TTL)
const aggressiveStrategy = new AggressiveCacheStrategy();

// 보수적 캐싱 (허용된 권한만 캐싱)
const conservativeStrategy = new ConservativeCacheStrategy();

const cache = new PermissionCache({
  strategy: aggressiveStrategy
});
```

### 캐시 워밍업

```typescript
// 앱 시작 시 자주 사용되는 권한들을 미리 로드
await permissionManager.loadUserPermissions(userId);

const { warmupCache } = usePermissionCache();
await warmupCache([
  'profile.read',
  'profile.update',
  'documents.list',
  'notifications.read'
]);
```

## 테스트

```bash
# 테스트 실행
npm run test

# 커버리지 포함 테스트
npm run test:coverage

# 감시 모드 테스트
npm run test:watch
```

## 타입 안전성

이 모듈은 완전한 TypeScript 지원을 제공합니다:

```typescript
import type {
  Permission,
  Role,
  PermissionAction,
  PermissionContext,
  PermissionEvaluationResult,
  UsePermissionReturn
} from '@company/permissions';
```

## 라이센스

MIT

## 기여

이슈와 풀 리퀘스트를 환영합니다.

## 변경 로그

### 1.0.0
- 초기 릴리스
- auth-core에서 권한 관리 기능 분리
- 고성능 캐싱 시스템 구현
- React 통합 컴포넌트 및 훅 제공
- 조건부 권한 평가 지원
- 개발 도구 제공