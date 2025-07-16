# Identity Verification Module

한국 본인인증 시스템을 지원하는 통합 인증 모듈입니다. PASS 인증, 통신사 인증 등 다양한 인증 수단을 제공합니다.

## 주요 기능

- **PASS 인증**: 통신 3사 PASS 앱을 통한 간편 인증
- **통신사 인증**: SKT, KT, LGU+ 휴대폰 본인인증
- **다양한 인증 수단**: 카카오, 네이버, 토스 등 간편인증 지원
- **실시간 상태 관리**: 인증 진행 상태 실시간 추적
- **보안 검증**: CI/DI 검증 및 데이터 무결성 확인
- **사용자 친화적 UI**: 단계별 안내 및 오류 처리

## 설치

```bash
npm install @modules/identity-verification
```

## 사용법

### 기본 사용 예제

```tsx
import { IdentityVerification } from '@modules/identity-verification';

function MyComponent() {
  const handleSuccess = (identity) => {
    console.log('인증 성공:', identity);
    // identity.ci - 고유 식별자
    // identity.name - 이름
    // identity.birthDate - 생년월일
    // identity.phoneNumber - 휴대폰 번호
  };

  const handleError = (error) => {
    console.error('인증 실패:', error);
  };

  return (
    <IdentityVerification
      onSuccess={handleSuccess}
      onError={handleError}
      availableMethods={['PASS', 'MOBILE_CARRIER']}
    />
  );
}
```

### Hook을 사용한 커스텀 구현

```tsx
import { useVerification, VerificationMethod } from '@modules/identity-verification';

function CustomVerification() {
  const {
    status,
    error,
    identity,
    startVerification,
    cancelVerification,
    reset
  } = useVerification({
    passConfig: {
      serviceId: 'YOUR_SERVICE_ID',
      serviceKey: 'YOUR_SERVICE_KEY',
      apiEndpoint: 'https://api.pass.com',
      callbackUrl: 'https://your-domain.com/callback'
    },
    checkInterval: 3000, // 3초마다 상태 확인
    maxCheckAttempts: 100 // 최대 100번 확인
  });

  const handleVerify = () => {
    startVerification({
      method: VerificationMethod.PASS,
      name: '홍길동',
      birthDate: '19900101',
      phoneNumber: '01012345678',
      gender: 'M',
      nationality: 'korean'
    });
  };

  if (identity) {
    return <div>인증 완료: {identity.name}님</div>;
  }

  return (
    <div>
      <button onClick={handleVerify}>PASS 인증하기</button>
      {status === 'IN_PROGRESS' && <p>인증 진행 중...</p>}
      {error && <p>오류: {error.message}</p>}
    </div>
  );
}
```

### 서비스 직접 사용

```typescript
import { PassAuthService, VerificationMethod } from '@modules/identity-verification';

// PASS 인증 서비스 초기화
const passAuth = new PassAuthService({
  serviceId: 'YOUR_SERVICE_ID',
  serviceKey: 'YOUR_SERVICE_KEY',
  apiEndpoint: 'https://api.pass.com',
  callbackUrl: 'https://your-domain.com/callback',
  timeout: 30,
  maxRetries: 3
});

// 인증 요청
const response = await passAuth.requestVerification({
  method: VerificationMethod.PASS,
  name: '홍길동',
  birthDate: '19900101',
  phoneNumber: '01012345678',
  gender: 'M',
  options: {
    requireAdult: true,
    checkDuplicate: true
  }
});

// 상태 확인
const status = await passAuth.checkStatus(response.verificationId);

// 결과 조회
const result = await passAuth.getResult(
  response.verificationId,
  response.token
);

if (result.success) {
  console.log('CI:', result.identity.ci);
  console.log('DI:', result.identity.di);
}
```

## 인증 수단별 설정

### PASS 인증

```typescript
const passConfig = {
  serviceId: 'YOUR_SERVICE_ID',
  serviceKey: 'YOUR_SERVICE_KEY',
  apiEndpoint: 'https://api.pass.com',
  callbackUrl: 'https://your-domain.com/callback',
  timeout: 30, // 타임아웃 (초)
  maxRetries: 3 // 재시도 횟수
};
```

### 통신사 인증

```typescript
const carrierConfig = {
  skt: {
    endpoint: 'https://api.skt.com',
    apiKey: 'YOUR_SKT_API_KEY'
  },
  kt: {
    endpoint: 'https://api.kt.com',
    apiKey: 'YOUR_KT_API_KEY'
  },
  lgu: {
    endpoint: 'https://api.lguplus.com',
    apiKey: 'YOUR_LGU_API_KEY'
  }
};
```

## 컴포넌트

### IdentityVerification

통합 본인인증 컴포넌트

```tsx
<IdentityVerification
  availableMethods={['PASS', 'MOBILE_CARRIER', 'KAKAO']}
  onSuccess={(identity) => console.log(identity)}
  onError={(error) => console.error(error)}
  onCancel={() => console.log('취소됨')}
  className="custom-class"
/>
```

### VerificationMethodSelector

인증 수단 선택 컴포넌트

```tsx
<VerificationMethodSelector
  availableMethods={[VerificationMethod.PASS, VerificationMethod.KAKAO]}
  onSelect={(method) => console.log('선택:', method)}
  onCancel={() => console.log('취소')}
/>
```

### VerificationForm

인증 정보 입력 폼

```tsx
<VerificationForm
  method={VerificationMethod.PASS}
  data={formData}
  onChange={(data) => setFormData(data)}
  onSubmit={() => startVerification()}
  onBack={() => goBack()}
/>
```

## 타입

### VerificationRequest

```typescript
interface VerificationRequest {
  method: VerificationMethod;
  name: string;
  birthDate: string; // YYYYMMDD
  gender?: 'M' | 'F';
  phoneNumber: string;
  carrier?: MobileCarrier;
  nationality?: 'korean' | 'foreigner';
  returnUrl?: string;
  options?: VerificationOptions;
}
```

### UserIdentity

```typescript
interface UserIdentity {
  ci: string; // 연계정보 (88자리)
  di?: string; // 중복가입확인정보 (64자리)
  name: string;
  birthDate: string;
  gender: 'M' | 'F';
  phoneNumber: string;
  carrier: MobileCarrier;
  nationality: 'korean' | 'foreigner';
  isAdult: boolean;
  verifiedAt: Date;
  verificationMethod: VerificationMethod;
}
```

### VerificationStatus

```typescript
enum VerificationStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}
```

## 유틸리티 함수

### 검증 함수

```typescript
import {
  isValidBirthDate,
  isValidPhoneNumber,
  isAdult,
  validateForm
} from '@modules/identity-verification';

// 생년월일 검증
isValidBirthDate('19900101'); // true

// 휴대폰 번호 검증
isValidPhoneNumber('01012345678'); // true

// 성인 여부 확인
isAdult('19900101'); // true

// 폼 전체 검증
const errors = validateForm(formData);
```

### 포맷팅 함수

```typescript
import {
  formatPhoneNumber,
  formatBirthDate,
  maskPhoneNumber,
  maskName
} from '@modules/identity-verification';

// 휴대폰 번호 포맷팅
formatPhoneNumber('01012345678'); // '010-1234-5678'

// 생년월일 포맷팅
formatBirthDate('19900101'); // '19900101'

// 마스킹
maskPhoneNumber('01012345678'); // '010-****-5678'
maskName('홍길동'); // '홍*동'
```

## 보안 고려사항

1. **CI/DI 보호**: CI와 DI는 개인정보이므로 안전하게 저장하고 전송해야 합니다.
2. **HTTPS 필수**: 모든 인증 통신은 HTTPS를 통해 이루어져야 합니다.
3. **세션 관리**: 인증 세션은 적절한 시간 후 자동으로 만료됩니다.
4. **데이터 검증**: 모든 입력 데이터는 클라이언트와 서버에서 이중으로 검증됩니다.

## 오류 처리

```typescript
import { VerificationErrorCode } from '@modules/identity-verification';

// 오류 코드별 처리
switch (error.code) {
  case VerificationErrorCode.INVALID_PHONE:
    alert('올바른 휴대폰 번호를 입력해주세요.');
    break;
  case VerificationErrorCode.SESSION_EXPIRED:
    alert('인증 시간이 만료되었습니다. 다시 시도해주세요.');
    break;
  case VerificationErrorCode.SERVICE_UNAVAILABLE:
    alert('서비스를 일시적으로 사용할 수 없습니다.');
    break;
  default:
    alert('인증에 실패했습니다.');
}
```

## 주의사항

- 실제 운영 환경에서는 각 인증 서비스 제공업체의 API 키와 설정이 필요합니다.
- 본인인증 결과는 개인정보이므로 관련 법규를 준수하여 처리해야 합니다.
- CI는 서비스 간 회원 연계에 사용되는 고유 식별자입니다.
- DI는 동일 서비스 내 중복가입 확인에 사용됩니다.