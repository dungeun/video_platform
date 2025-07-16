# @repo/types

Enterprise AI Module System의 공통 타입 정의 라이브러리입니다.

## 개요

이 모듈은 전체 엔터프라이즈 AI 모듈 시스템에서 사용하는 모든 공통 타입들을 정의하고 관리합니다. TypeScript의 강력한 타입 시스템과 Zod 검증 라이브러리를 활용하여 런타임 타입 안전성을 보장합니다.

## 주요 기능

- **공통 기본 타입**: Response, Pagination, Search, Filter 등
- **인증/인가 타입**: User, Role, Permission, Session 등
- **비즈니스 도메인 타입**: Product, Order, Customer, Cart 등
- **UI/UX 타입**: Theme, Layout, Form, Dashboard 등
- **Zod 검증 스키마**: 모든 타입에 대한 런타임 검증
- **타입 가드 유틸리티**: 타입 안전성을 위한 헬퍼 함수들
- **변환 유틸리티**: 안전한 타입 변환 함수들

## 설치

```bash
pnpm add @repo/types
```

## 사용법

### 기본 타입 사용

```typescript
import { ID, Response, PaginationParams } from '@repo/types';

// API 응답 타입
const apiResponse: Response<User[]> = {
  success: true,
  data: users,
  meta: {
    version: '1.0.0',
    requestId: 'req-123',
    duration: 150
  }
};

// 페이지네이션 파라미터
const pagination: PaginationParams = {
  page: 1,
  limit: 20,
  sort: 'createdAt',
  order: 'desc'
};
```

### 인증 타입 사용

```typescript
import { User, LoginCredentials, UserSession } from '@repo/types';

const credentials: LoginCredentials = {
  email: 'user@example.com',
  password: 'securePassword123',
  rememberMe: true
};

const user: User = {
  id: 'user-123',
  email: 'user@example.com',
  displayName: 'John Doe',
  status: 'active',
  // ... other fields
};
```

### 비즈니스 타입 사용

```typescript
import { Product, Order, Customer } from '@repo/types';

const product: Product = {
  id: 'product-123',
  sku: 'SKU-001',
  name: 'Amazing Product',
  price: { amount: 99.99, currency: 'USD' },
  status: 'active',
  // ... other fields
};

const order: Order = {
  id: 'order-123',
  orderNumber: 'ORD-001',
  customerId: 'customer-123',
  status: 'pending',
  items: [/* order items */],
  total: { amount: 199.98, currency: 'USD' },
  // ... other fields
};
```

### Zod 스키마 검증

```typescript
import { UserSchema, ProductSchema, validate } from '@repo/types';

// 사용자 데이터 검증
const userData = { /* user data */ };
const userResult = validate(UserSchema, userData);

if (userResult.success) {
  console.log('Valid user:', userResult.data);
} else {
  console.error('Validation errors:', userResult.errors);
}

// 비동기 검증
import { validateAsync } from '@repo/types';

const productResult = await validateAsync(ProductSchema, productData);
```

### 타입 가드 사용

```typescript
import { 
  isString, 
  isNumber, 
  isEmail, 
  isNotNull, 
  isArrayOf 
} from '@repo/types';

function processValue(value: unknown) {
  if (isString(value)) {
    // value는 이제 string 타입으로 추론됩니다
    console.log(value.toUpperCase());
  }
  
  if (isEmail(value)) {
    // value는 유효한 이메일 형식의 string입니다
    console.log('Valid email:', value);
  }
  
  if (isArrayOf(value, isNumber)) {
    // value는 number[] 타입입니다
    const sum = value.reduce((a, b) => a + b, 0);
  }
}
```

### 변환 유틸리티 사용

```typescript
import { 
  toString, 
  toNumber, 
  toBoolean, 
  toDate,
  deepClone,
  removeNullish 
} from '@repo/types';

// 안전한 타입 변환
const str = toString(123); // "123"
const num = toNumber("42"); // 42 or null if invalid
const bool = toBoolean("true"); // true
const date = toDate("2023-01-01"); // Date object or null

// 객체 유틸리티
const original = { a: 1, b: { c: 2 } };
const cloned = deepClone(original); // 깊은 복사

const dirty = { a: 1, b: null, c: undefined, d: "test" };
const clean = removeNullish(dirty); // { a: 1, d: "test" }
```

## 모듈 구조

```
src/
├── common.ts      # 기본 공통 타입
├── auth.ts        # 인증/인가 타입
├── business.ts    # 비즈니스 도메인 타입
├── ui.ts          # UI/UX 타입
├── schemas.ts     # Zod 검증 스키마
├── index.ts       # 메인 export 파일
└── __tests__/     # 테스트 파일
```

## 서브 모듈 import

필요한 타입만 선택적으로 import할 수 있습니다:

```typescript
// 전체 import
import { User, Product } from '@repo/types';

// 서브모듈 import
import { User } from '@repo/types/auth';
import { Product } from '@repo/types/business';
import { Theme } from '@repo/types/ui';
import { UserSchema } from '@repo/types/schemas';
```

## 타입 확장

새로운 타입을 추가하거나 기존 타입을 확장할 때는 다음 원칙을 따라주세요:

1. **Zero Error Architecture**: 모든 함수는 예외를 던지지 않고 안전한 반환값을 제공해야 합니다
2. **Type Safety**: TypeScript의 strict 모드에서 완벽하게 동작해야 합니다
3. **Validation**: 모든 타입에 대응하는 Zod 스키마를 제공해야 합니다
4. **Testing**: 새로운 타입과 함수에 대한 테스트를 작성해야 합니다

## 개발 명령어

```bash
# 빌드
pnpm build

# 개발 모드 (watch)
pnpm dev

# 테스트
pnpm test

# 테스트 (watch)
pnpm test:watch

# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 클린
pnpm clean
```

## 라이선스

MIT License