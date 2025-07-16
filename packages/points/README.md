# Points Module

한국 이커머스에 최적화된 포인트/리워드 시스템 모듈입니다.

## 주요 기능

- **포인트 적립/사용**: 다양한 사유별 포인트 적립 및 사용
- **잔액 관리**: 실시간 포인트 잔액 추적 및 관리
- **만료 관리**: 자동 만료 처리 및 알림
- **정책 엔진**: 유연한 포인트 정책 설정
- **히스토리 관리**: 상세한 거래 내역 및 통계
- **한국형 특화**: 한국 이커머스 패턴에 최적화

## 설치

```bash
npm install @modules/points
```

## 기본 사용법

### 1. 포인트 서비스 초기화

```typescript
import { 
  PointTransactionService,
  PointBalanceService,
  PointPolicyEngine,
  StorageManager 
} from '@modules/points';

// 서비스 초기화
const storage = new StorageManager();
const balanceService = new PointBalanceService(storage);
const policyEngine = new PointPolicyEngine(storage);
const transactionService = new PointTransactionService(
  storage,
  balanceService,
  policyEngine
);
```

### 2. React Hook 사용

```typescript
import { usePoints } from '@modules/points';

function MyComponent() {
  const { 
    balance, 
    earnPoints, 
    spendPoints, 
    history,
    expiringPoints 
  } = usePoints({
    userId: 'user123',
    autoRefresh: true
  });

  // 포인트 적립
  const handleEarn = async () => {
    await earnPoints({
      amount: 1000,
      reason: PointEarnReason.PURCHASE,
      description: '상품 구매 적립',
      orderId: 'order123',
      metadata: {
        purchaseAmount: 100000,
        category: 'electronics'
      }
    });
  };

  // 포인트 사용
  const handleSpend = async () => {
    await spendPoints({
      amount: 5000,
      reason: PointSpendReason.ORDER_PAYMENT,
      description: '주문 결제',
      orderId: 'order456'
    });
  };

  return (
    <div>
      <PointBalance balance={balance} showDetails />
      <PointHistory transactions={history} />
    </div>
  );
}
```

### 3. 포인트 정책 설정

```typescript
import { usePointPolicy } from '@modules/points';

function PolicyManager() {
  const { activePolicy, createPolicy, updatePolicy } = usePointPolicy();

  // 기본 정책 생성
  const setupDefaultPolicy = async () => {
    await createPolicy({
      name: '기본 포인트 정책',
      description: '한국 이커머스 표준 정책',
      earnRules: {
        baseRate: 1,              // 1% 기본 적립
        maxRate: 5,               // 최대 5% 적립
        minPurchaseAmount: 1000,  // 최소 1,000원
        doublePointDays: [5, 6]   // 금,토 더블포인트
      },
      useRules: {
        minPoints: 1000,          // 최소 1,000P
        unitOfUse: 10,            // 10P 단위
        maxUsageRate: 70          // 결제금액의 70%까지
      },
      expiryRules: {
        defaultExpiryMonths: 12,  // 12개월 유효
        expiryNotificationDays: [30, 7, 1]
      },
      gradeBonus: {
        'VIP': {
          earnRateMultiplier: 2,
          birthdayPoints: 5000
        },
        'GOLD': {
          earnRateMultiplier: 1.5,
          birthdayPoints: 3000
        }
      },
      isActive: true
    });
  };

  return (
    <PointPolicyManager 
      policy={activePolicy}
      onPolicyUpdate={updatePolicy}
      isAdmin
    />
  );
}
```

### 4. 포인트 만료 관리

```typescript
import { usePointExpiry } from '@modules/points';

function ExpiryManager() {
  const { 
    expiringPoints, 
    expirySummary,
    extendExpiry,
    sendNotifications 
  } = usePointExpiry({
    userId: 'user123',
    autoCheck: true
  });

  // 만료 예정 포인트 연장
  const handleExtend = async () => {
    const result = await extendExpiry({
      minAmount: 1000,
      extensionMonths: 6
    });
    console.log(`${result.totalAmount}P 연장 완료`);
  };

  // 만료 알림 발송
  const handleNotify = async () => {
    await sendNotifications([30, 7, 1]); // 30일, 7일, 1일 전
  };

  return (
    <div>
      <h3>만료 예정 포인트</h3>
      <p>30일 내: {expirySummary?.next30Days}P</p>
      <p>올해: {expirySummary?.thisYear}P</p>
      
      {expiringPoints.points.map(expiry => (
        <div key={expiry.expiresAt.toString()}>
          {expiry.points}P - {formatDate(expiry.expiresAt)}
        </div>
      ))}
    </div>
  );
}
```

### 5. 포인트 계산기

```typescript
import { PointEarningCalculator } from '@modules/points';

function Calculator() {
  const handleCalculate = (points: number, details: any) => {
    console.log(`예상 적립: ${points}P`);
    console.log('적용 혜택:', details.appliedRules);
  };

  return (
    <PointEarningCalculator
      policy={activePolicy}
      userGrade="VIP"
      onCalculate={handleCalculate}
    />
  );
}
```

## 고급 기능

### 포인트 통계 및 분석

```typescript
const { statistics, analyzeTransactionPatterns } = usePoints({
  userId: 'user123'
});

// 월간 통계
await loadStatistics('monthly');

// 거래 패턴 분석
const patterns = await analyzeTransactionPatterns('user123');
console.log('가장 활발한 요일:', patterns.mostActiveDay);
console.log('선호 적립 방법:', patterns.preferredEarnMethods);
```

### 포인트 예측

```typescript
const forecast = await historyService.forecastPoints('user123', 90);
console.log('90일 후 예상 잔액:', forecast.expectedBalance);
console.log('예상 만료:', forecast.expectedExpiry);
console.log('추천 액션:', forecast.recommendations);
```

### 상세 리포트

```typescript
const report = await historyService.generateDetailedReport(
  'user123',
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

console.log('기간 요약:', report.summary);
console.log('일별 분석:', report.dailyBreakdown);
console.log('상위 적립 사유:', report.topEarningReasons);
```

## 유틸리티 함수

### 포인트 계산

```typescript
import { 
  calculateTotalPoints,
  calculateAvailablePoints,
  calculateExpiringPoints,
  calculateMaxUsablePoints 
} from '@modules/points';

// 사용 가능 포인트 계산
const available = calculateAvailablePoints(transactions);

// 만료 예정 포인트 (30일)
const expiring = calculateExpiringPoints(transactions, 30);

// 최대 사용 가능 포인트
const maxUsable = calculateMaxUsablePoints(
  orderAmount,
  availablePoints,
  policy.useRules.maxUsageRate
);
```

### 포인트 포맷팅

```typescript
import { 
  formatPoints,
  formatExpiryDate,
  getTransactionTypeLabel 
} from '@modules/points';

// 포인트 표시
formatPoints(12500);        // "12,500 P"
formatPoints(-5000, true);  // "-5,000 P"

// 만료일 표시
const expiry = formatExpiryDate(expiryDate);
// { text: "7일 후 만료", isUrgent: true, daysRemaining: 7 }
```

## 이벤트 처리

```typescript
// 포인트 적립 이벤트
transactionService.on('points:earned', (transaction) => {
  console.log('포인트 적립:', transaction);
});

// 포인트 만료 이벤트
expiryService.on('points:expired', (data) => {
  console.log(`${data.userId}님의 ${data.amount}P 만료`);
});

// 정책 변경 이벤트
policyEngine.on('policy:activated', (policy) => {
  console.log('새 정책 활성화:', policy.name);
});
```

## 타입 정의

주요 타입들:

```typescript
// 포인트 거래
interface PointTransaction {
  id: string;
  userId: string;
  type: PointTransactionType;
  amount: number;
  balance: number;
  reason: string;
  description: string;
  status: PointStatus;
  expiresAt?: Date;
  createdAt: Date;
}

// 포인트 잔액
interface PointBalance {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  pendingPoints: number;
  expiringPoints: number;
}

// 포인트 정책
interface PointPolicy {
  earnRules: {...};
  useRules: {...};
  expiryRules: {...};
  gradeBonus?: {...};
}
```

## 주의사항

1. **포인트 정밀도**: 모든 계산은 `Decimal.js`를 사용하여 정밀도 보장
2. **동시성 처리**: 여러 거래가 동시 발생 시 순서 보장
3. **만료 처리**: 자동 만료는 별도 스케줄러 필요
4. **백업**: 중요 데이터는 정기적 백업 권장

## 라이선스

MIT