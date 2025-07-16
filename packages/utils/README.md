# @repo/utils

Enterprise AI Module System의 공통 유틸리티 함수 라이브러리입니다.

## 개요

이 모듈은 전체 엔터프라이즈 AI 모듈 시스템에서 사용하는 모든 공통 유틸리티 함수들을 제공합니다. Zero Error Architecture를 기반으로 모든 함수는 예외를 던지지 않고 Result 타입을 반환합니다.

## 주요 기능

- **암호화/해시**: MD5, SHA, AES, Base64, UUID 생성 등
- **날짜/시간**: 날짜 포맷팅, 파싱, 연산, 검증 등
- **문자열 처리**: 케이스 변환, 검증, 조작, 마스킹 등
- **배열 처리**: 필터링, 변환, 집합 연산, 통계 등
- **객체 처리**: 복사, 병합, 변환, 중첩 접근 등
- **검증**: 타입 검증, 형식 검증, 복합 검증 등
- **비동기 처리**: 재시도, 타임아웃, 배치 처리, 캐시 등
- **포맷팅**: 숫자, 통화, 날짜, 파일 크기, 마스킹 등
- **HTTP 요청**: 클라이언트, 인터셉터, URL 빌더 등
- **파일 처리**: 읽기/쓰기, 복사/이동, 디렉토리 관리 등

## 설치

```bash
pnpm add @repo/utils
```

## 사용법

### 전체 import

```typescript
import * as utils from '@repo/utils';

// 사용 예
const hashResult = utils.sha256('hello world');
if (hashResult.success) {
  console.log('Hash:', hashResult.data);
}
```

### 카테고리별 import

```typescript
// 암호화/해시
import { sha256, aesEncrypt, generateUuid } from '@repo/utils/crypto';

// 날짜/시간
import { formatDate, addDays, isValidDate } from '@repo/utils/date';

// 문자열 처리
import { toCamelCase, isEmail, truncate } from '@repo/utils/string';

// 배열 처리
import { removeDuplicates, chunk, intersection } from '@repo/utils/array';

// 객체 처리
import { deepClone, merge, pick } from '@repo/utils/object';

// 검증
import { isString, isEmail, validateAll } from '@repo/utils/validation';

// 비동기 처리
import { delay, retry, withTimeout } from '@repo/utils/async';

// 포맷팅
import { formatCurrency, formatFileSize, maskEmail } from '@repo/utils/format';

// HTTP 요청
import { HttpClient, UrlBuilder } from '@repo/utils/http';

// 파일 처리 (Node.js 환경)
import { readTextFile, writeJsonFile, exists } from '@repo/utils/file';
```

## 카테고리별 사용 예제

### 1. 암호화/해시

```typescript
import { sha256, aesEncrypt, aesDecrypt, generateUuid } from '@repo/utils/crypto';

// 해시 생성
const hashResult = sha256('password123');
if (hashResult.success) {
  console.log('Hash:', hashResult.data);
}

// AES 암호화
const encryptResult = aesEncrypt('sensitive data', 'my-secret-key');
if (encryptResult.success) {
  const decryptResult = aesDecrypt(encryptResult.data, 'my-secret-key');
  if (decryptResult.success) {
    console.log('Decrypted:', decryptResult.data);
  }
}

// UUID 생성
const uuidResult = generateUuid();
if (uuidResult.success) {
  console.log('UUID:', uuidResult.data);
}
```

### 2. 날짜/시간

```typescript
import { formatDate, addDays, getDaysDifference, formatRelativeTime } from '@repo/utils/date';

const now = new Date();

// 날짜 포맷팅
const formatResult = formatDate(now, 'YYYY-MM-DD HH:mm:ss');
if (formatResult.success) {
  console.log('Formatted:', formatResult.data);
}

// 날짜 연산
const futureResult = addDays(now, 7);
if (futureResult.success) {
  console.log('Next week:', futureResult.data);
}

// 상대적 시간
const relativeResult = formatRelativeTime(new Date('2023-01-01'));
if (relativeResult.success) {
  console.log('Relative time:', relativeResult.data); // "1년 전"
}
```

### 3. 문자열 처리

```typescript
import { toCamelCase, isEmail, truncate, generateSlug } from '@repo/utils/string';

// 케이스 변환
const camelResult = toCamelCase('hello-world');
if (camelResult.success) {
  console.log('CamelCase:', camelResult.data); // "helloWorld"
}

// 이메일 검증
const emailResult = isEmail('user@example.com');
if (emailResult.success && emailResult.data) {
  console.log('Valid email');
}

// 문자열 자르기
const truncateResult = truncate('Long text here', 10);
if (truncateResult.success) {
  console.log('Truncated:', truncateResult.data); // "Long te..."
}

// 슬러그 생성
const slugResult = generateSlug('Hello World! 123');
if (slugResult.success) {
  console.log('Slug:', slugResult.data); // "hello-world-123"
}
```

### 4. 배열 처리

```typescript
import { removeDuplicates, chunk, intersection, groupBy } from '@repo/utils/array';

// 중복 제거
const uniqueResult = removeDuplicates([1, 2, 2, 3, 3, 4]);
if (uniqueResult.success) {
  console.log('Unique:', uniqueResult.data); // [1, 2, 3, 4]
}

// 청크 분할
const chunkResult = chunk([1, 2, 3, 4, 5], 2);
if (chunkResult.success) {
  console.log('Chunks:', chunkResult.data); // [[1, 2], [3, 4], [5]]
}

// 교집합
const intersectionResult = intersection([1, 2, 3], [2, 3, 4]);
if (intersectionResult.success) {
  console.log('Intersection:', intersectionResult.data); // [2, 3]
}

// 그룹화
const items = [
  { category: 'A', value: 1 },
  { category: 'B', value: 2 },
  { category: 'A', value: 3 }
];
const groupResult = groupBy(items, 'category');
if (groupResult.success) {
  console.log('Grouped:', groupResult.data);
  // { A: [{ category: 'A', value: 1 }, { category: 'A', value: 3 }], B: [...] }
}
```

### 5. 객체 처리

```typescript
import { deepClone, merge, pick, get, set } from '@repo/utils/object';

const original = { a: 1, b: { c: 2, d: 3 } };

// 깊은 복사
const cloneResult = deepClone(original);
if (cloneResult.success) {
  console.log('Cloned:', cloneResult.data);
}

// 객체 병합
const mergeResult = merge({ a: 1 }, { b: 2, c: 3 });
if (mergeResult.success) {
  console.log('Merged:', mergeResult.data); // { a: 1, b: 2, c: 3 }
}

// 키 선택
const pickResult = pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
if (pickResult.success) {
  console.log('Picked:', pickResult.data); // { a: 1, c: 3 }
}

// 중첩 접근
const getResult = get(original, 'b.c');
if (getResult.success) {
  console.log('Nested value:', getResult.data); // 2
}
```

### 6. 비동기 처리

```typescript
import { delay, retry, withTimeout, processInChunks } from '@repo/utils/async';

// 지연
await delay(1000); // 1초 대기

// 재시도
const retryResult = await retry(
  async () => {
    // 실패할 수 있는 비동기 작업
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error('Network error');
    }
    return Result.success(await response.json());
  },
  { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
);

// 타임아웃
const timeoutResult = await withTimeout(
  fetch('/api/slow-endpoint'),
  5000,
  'Request timeout'
);

// 배치 처리
const items = [1, 2, 3, 4, 5];
const batchResult = await processInChunks(
  items,
  async (item) => Result.success(item * 2),
  2 // 청크 크기
);
```

### 7. HTTP 요청

```typescript
import { HttpClient, UrlBuilder, createBearerAuthHeader } from '@repo/utils/http';

// HTTP 클라이언트
const client = new HttpClient({
  baseURL: 'https://api.example.com',
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// GET 요청
const getResult = await client.get('/users');
if (getResult.success) {
  console.log('Users:', getResult.data.data);
}

// POST 요청
const postResult = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// URL 빌더
const url = new UrlBuilder('https://api.example.com')
  .path('users')
  .path('123')
  .query('include', 'profile')
  .query('fields', 'name,email')
  .build();
// https://api.example.com/users/123?include=profile&fields=name%2Cemail

// 인증 헤더
const authResult = createBearerAuthHeader('your-jwt-token');
if (authResult.success) {
  const headers = { Authorization: authResult.data };
}
```

### 8. 포맷팅

```typescript
import { 
  formatCurrency, 
  formatFileSize, 
  formatPercentage,
  maskEmail,
  formatKoreanPhoneNumber 
} from '@repo/utils/format';

// 통화 포맷팅
const currencyResult = formatCurrency(1234567, 'USD');
if (currencyResult.success) {
  console.log('Currency:', currencyResult.data); // "$1,234,567.00"
}

// 파일 크기 포맷팅
const sizeResult = formatFileSize(1024 * 1024 * 1.5);
if (sizeResult.success) {
  console.log('File size:', sizeResult.data); // "1.50 MB"
}

// 백분율 포맷팅
const percentResult = formatPercentage(0.1234, 2);
if (percentResult.success) {
  console.log('Percentage:', percentResult.data); // "12.34%"
}

// 이메일 마스킹
const maskResult = maskEmail('john.doe@example.com');
if (maskResult.success) {
  console.log('Masked:', maskResult.data); // "jo****e@example.com"
}

// 전화번호 포맷팅
const phoneResult = formatKoreanPhoneNumber('01012345678');
if (phoneResult.success) {
  console.log('Phone:', phoneResult.data); // "010-1234-5678"
}
```

## 환경별 지원

### 브라우저 환경
- crypto, date, string, array, object, validation, async, format, http 모듈 지원
- file 모듈은 Node.js 환경에서만 사용 가능

### Node.js 환경
- 모든 모듈 지원

## Zero Error Architecture

모든 유틸리티 함수는 예외를 던지지 않고 `Result<T>` 타입을 반환합니다:

```typescript
import { Result } from '@repo/core';

const result = someUtilityFunction(input);

if (result.success) {
  // 성공 시 result.data 사용
  console.log('Success:', result.data);
} else {
  // 실패 시 result.code와 result.message 사용
  console.error('Error:', result.code, result.message);
}
```

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

## 의존성

- `@repo/core`: 기본 Result 타입과 에러 처리
- `@repo/types`: 공통 타입 정의
- `zod`: 런타임 검증
- `crypto-js`: 암호화 기능

## 라이선스

MIT License