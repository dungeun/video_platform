# @company/payment-toss

토스페이먼츠 결제 모듈 - 국내 결제 통합 솔루션

## 설치

```bash
npm install @company/payment-toss
```

## 기능

- 💳 **다양한 결제 수단**
  - 신용/체크카드
  - 가상계좌
  - 계좌이체
  - 휴대폰 결제
  - 문화상품권
  - 간편결제 (카카오페이, 네이버페이, 토스페이)

- 🔄 **결제 관리**
  - 결제 승인/취소
  - 부분 취소
  - 결제 상태 조회
  - 주문별 결제 조회

- 📱 **빌링/정기결제**
  - 빌링키 발급
  - 자동결제 실행
  - 빌링키 관리

- 🔔 **웹훅 지원**
  - 결제 상태 변경 알림
  - 서명 검증
  - 이벤트별 핸들러

- 🎨 **UI 컴포넌트**
  - 결제 위젯
  - 테마 커스터마이징
  - 반응형 디자인

## 빠른 시작

### 1. 설정

```typescript
import { TossPaymentProvider } from '@company/payment-toss'

const config = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  secretKey: process.env.TOSS_SECRET_KEY,
  webhook: {
    endpoint: '/api/payments/webhook',
    secret: process.env.TOSS_WEBHOOK_SECRET
  }
}

function App() {
  return (
    <TossPaymentProvider config={config}>
      <YourApp />
    </TossPaymentProvider>
  )
}
```

### 2. 결제 위젯 사용

```tsx
import { PaymentWidget } from '@company/payment-toss'

function CheckoutPage() {
  return (
    <PaymentWidget
      amount={50000}
      orderId="ORDER_123"
      orderName="테스트 상품 외 2건"
      onSuccess={(payment) => {
        console.log('결제 성공:', payment)
      }}
      onFail={(error) => {
        console.error('결제 실패:', error)
      }}
      paymentMethods={['CARD', 'VIRTUAL_ACCOUNT', 'KAKAO_PAY']}
    />
  )
}
```

### 3. Hook을 이용한 결제 처리

```typescript
import { useTossPayment } from '@company/payment-toss'

function PaymentManager() {
  const { requestPayment, confirmPayment, cancelPayment, isLoading } = useTossPayment(service)

  const handlePayment = async () => {
    const result = await requestPayment({
      amount: 100000,
      orderId: 'ORDER_456',
      orderName: '프리미엄 상품',
      successUrl: '/payment/success',
      failUrl: '/payment/fail'
    })

    if (result.success) {
      // 결제창 호출
    }
  }
}
```

## 고급 사용법

### 서버사이드 결제 처리

```typescript
import { TossPaymentService } from '@company/payment-toss'

const paymentService = new TossPaymentService({
  clientKey: process.env.TOSS_CLIENT_KEY,
  secretKey: process.env.TOSS_SECRET_KEY
})

// 결제 승인
const payment = await paymentService.confirmPayment({
  paymentKey: 'payment-key-from-client',
  orderId: 'ORDER_789',
  amount: 50000
})

// 결제 취소
const cancelledPayment = await paymentService.cancelPayment({
  paymentKey: payment.data.paymentKey,
  cancelReason: '고객 요청'
})
```

### 웹훅 처리

```typescript
import { WebhookHandler } from '@company/payment-toss'

const webhookHandler = new WebhookHandler(paymentService, {
  onPaymentCompleted: async (payment) => {
    // 결제 완료 시 처리
    await updateOrderStatus(payment.orderId, 'PAID')
  },
  onPaymentCanceled: async (payment) => {
    // 결제 취소 시 처리
    await restoreInventory(payment.orderId)
  },
  onVirtualAccountIssued: async (payment) => {
    // 가상계좌 발급 시 처리
    await sendDepositInfo(payment)
  }
})

// Next.js API Route
export async function POST(request: Request) {
  const signature = request.headers.get('toss-signature')
  const body = await request.text()
  
  const result = await webhookHandler.handleWebhook(signature, body)
  
  return new Response(
    JSON.stringify({ success: result.success }), 
    { status: result.success ? 200 : 400 }
  )
}
```

### 정기결제 (빌링)

```typescript
// 빌링키 발급
const billingKey = await paymentService.issueBillingKey(
  'customer-123',
  'auth-key'
)

// 자동결제 실행
const subscription = await paymentService.requestBillingPayment({
  billingKey: billingKey.data.billingKey,
  amount: 9900,
  orderId: 'SUB_001',
  orderName: '월간 구독'
})
```

## 유틸리티 함수

```typescript
import { PaymentUtils } from '@company/payment-toss'

// 주문 ID 생성
const orderId = PaymentUtils.generateOrderId('ORDER')

// 금액 포맷팅
PaymentUtils.formatCurrency(50000) // "50,000원"

// 카드번호 마스킹
PaymentUtils.maskCardNumber('1234567890123456') // "1234-****-****-3456"

// 은행명 조회
PaymentUtils.getBankName('88') // "신협"

// 결제 상태 텍스트
PaymentUtils.getStatusText('DONE') // "결제 완료"

// VAT 계산
PaymentUtils.calculateVAT(11000) // { supplyAmount: 10000, vat: 1000 }
```

## 타입 정의

```typescript
interface PaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
  successUrl: string
  failUrl: string
  paymentMethod?: PaymentMethod
}

interface Payment {
  paymentKey: string
  orderId: string
  orderName: string
  status: PaymentStatus
  totalAmount: number
  method: PaymentMethod
  approvedAt?: string
  // ... 기타 필드
}

type PaymentMethod = 
  | 'CARD' 
  | 'VIRTUAL_ACCOUNT' 
  | 'TRANSFER'
  | 'MOBILE'
  | 'KAKAO_PAY'
  | 'NAVER_PAY'
  | 'TOSS_PAY'

type PaymentStatus = 
  | 'READY'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_DEPOSIT'
  | 'DONE'
  | 'CANCELED'
  | 'PARTIAL_CANCELED'
  | 'ABORTED'
  | 'EXPIRED'
```

## 관리자 설정

관리자 패널에서 다음 항목들을 설정할 수 있습니다:

- **API 키 설정**: 클라이언트 키, 시크릿 키
- **운영 모드**: 테스트/실제 모드
- **결제 수단**: 사용할 결제 수단 선택
- **웹훅 설정**: 엔드포인트, 시크릿 키
- **UI 커스터마이징**: 테마, 색상, 언어
- **결제 옵션**: 할부, 현금영수증, 에스크로 등

## 에러 처리

```typescript
import { TOSS_ERROR_CODES } from '@company/payment-toss'

try {
  const result = await paymentService.confirmPayment(confirmRequest)
  if (!result.success) {
    switch (result.error) {
      case TOSS_ERROR_CODES.ALREADY_PROCESSED_PAYMENT:
        // 이미 처리된 결제
        break
      case TOSS_ERROR_CODES.INVALID_CARD_COMPANY:
        // 지원하지 않는 카드사
        break
      default:
        // 기타 에러
    }
  }
} catch (error) {
  console.error('결제 처리 중 오류:', error)
}
```

## 테스트

테스트 모드에서는 다음 테스트 카드를 사용할 수 있습니다:

- 정상 승인: 4330000000000001
- 잔액 부족: 4330000000000002
- 한도 초과: 4330000000000003

## 환경 변수

```env
# 토스페이먼츠 API 키
TOSS_CLIENT_KEY=test_ck_xxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxx

# 웹훅 비밀키
TOSS_WEBHOOK_SECRET=your_webhook_secret

# Next.js 클라이언트용 (public)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxxxxx
```

## 보안 고려사항

1. **API 키 보안**: 서버 환경에서만 시크릿 키 사용
2. **웹훅 검증**: 서명 검증을 통한 요청 무결성 확인
3. **HTTPS 필수**: 프로덕션에서 반드시 HTTPS 사용
4. **금액 검증**: 클라이언트와 서버 양쪽에서 금액 검증

## 지원

- 문서: [https://docs.tosspayments.com](https://docs.tosspayments.com)
- 이슈 리포트: [GitHub Issues](https://github.com/company/payment-toss/issues)
- 이메일: support@company.com

## 라이선스

MIT