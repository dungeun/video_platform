import React, { useState } from 'react'
import {
  TossPaymentProvider,
  TossPaymentService,
  PaymentWidget,
  useTossPayment,
  WebhookHandler,
  PaymentRequest,
  Payment,
  PaymentFailure,
  formatCurrency,
  formatPaymentStatus,
  PaymentUtils
} from '@repo/payment-toss'

/**
 * 토스페이먼츠 결제 모듈 사용 예제
 */

// 1. 설정 초기화
const tossConfig = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
  secretKey: process.env.TOSS_SECRET_KEY!,
  webhook: {
    endpoint: '/api/payments/webhook',
    secret: process.env.TOSS_WEBHOOK_SECRET!
  }
}

// 2. 서비스 인스턴스 생성
const paymentService = new TossPaymentService(tossConfig)

// 3. 결제 페이지 컴포넌트
export function PaymentPage() {
  const [orderInfo] = useState({
    orderId: PaymentUtils.generateOrderId(),
    orderName: '테스트 상품 외 2건',
    amount: 50000
  })

  const handlePaymentSuccess = (payment: Payment) => {
    console.log('결제 성공:', payment)
    // 주문 완료 페이지로 이동
    window.location.href = `/order/complete?orderId=${payment.orderId}`
  }

  const handlePaymentFail = (error: PaymentFailure) => {
    console.error('결제 실패:', error)
    alert(error.message)
  }

  return (
    <TossPaymentProvider config={tossConfig}>
      <div className="payment-page">
        <h1>결제하기</h1>
        
        <PaymentWidget
          amount={orderInfo.amount}
          orderId={orderInfo.orderId}
          orderName={orderInfo.orderName}
          onSuccess={handlePaymentSuccess}
          onFail={handlePaymentFail}
          customerEmail="customer@example.com"
          customerName="홍길동"
          paymentMethods={['CARD', 'VIRTUAL_ACCOUNT', 'KAKAO_PAY']}
          theme="light"
        />
      </div>
    </TossPaymentProvider>
  )
}

// 4. 결제 관리 페이지 (Hook 사용 예제)
export function PaymentManagement() {
  const { getPayment, cancelPayment, isLoading, error } = useTossPayment(paymentService)
  const [paymentKey, setPaymentKey] = useState('')
  const [paymentInfo, setPaymentInfo] = useState<Payment | null>(null)

  const handleSearch = async () => {
    const result = await getPayment(paymentKey)
    if (result.success) {
      setPaymentInfo(result.data)
    }
  }

  const handleCancel = async () => {
    if (!paymentInfo) return

    const result = await cancelPayment({
      paymentKey: paymentInfo.paymentKey,
      cancelReason: '고객 요청으로 인한 취소'
    })

    if (result.success) {
      alert('결제가 취소되었습니다.')
      setPaymentInfo(result.data)
    }
  }

  return (
    <div className="payment-management">
      <h2>결제 조회 및 관리</h2>
      
      <div className="search-section">
        <input
          type="text"
          placeholder="Payment Key 입력"
          value={paymentKey}
          onChange={(e) => setPaymentKey(e.target.value)}
        />
        <button onClick={handleSearch} disabled={isLoading}>
          조회
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {paymentInfo && (
        <div className="payment-info">
          <h3>결제 정보</h3>
          <dl>
            <dt>주문번호</dt>
            <dd>{paymentInfo.orderId}</dd>
            
            <dt>결제금액</dt>
            <dd>{formatCurrency(paymentInfo.totalAmount)}</dd>
            
            <dt>결제상태</dt>
            <dd>{formatPaymentStatus(paymentInfo.status)}</dd>
            
            <dt>결제수단</dt>
            <dd>{PaymentUtils.getMethodText(paymentInfo.method)}</dd>
            
            <dt>결제일시</dt>
            <dd>{paymentInfo.approvedAt}</dd>
          </dl>

          {paymentInfo.status === 'DONE' && (
            <button onClick={handleCancel} disabled={isLoading}>
              결제 취소
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// 5. 서버사이드 결제 처리 예제
export async function processPaymentOnServer() {
  // 결제 요청 데이터
  const paymentRequest: PaymentRequest = {
    amount: 100000,
    orderId: PaymentUtils.generateOrderId(),
    orderName: '맥북 프로 16인치',
    customerEmail: 'customer@example.com',
    customerName: '홍길동',
    customerMobilePhone: '010-1234-5678',
    successUrl: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
    failUrl: `${process.env.NEXT_PUBLIC_URL}/payment/fail`,
    paymentMethod: 'CARD',
    validHours: 24
  }

  // 결제 준비
  const prepareResult = await paymentService.requestPayment(paymentRequest)
  if (!prepareResult.success) {
    console.error('결제 준비 실패:', prepareResult.error)
    return
  }

  // 클라이언트에서 결제창 호출 후 성공 시 confirm 호출
  const confirmResult = await paymentService.confirmPayment({
    paymentKey: 'received-payment-key',
    orderId: paymentRequest.orderId,
    amount: paymentRequest.amount
  })

  if (confirmResult.success) {
    console.log('결제 승인 완료:', confirmResult.data)
  }
}

// 6. 웹훅 핸들러 설정 (Next.js API Route)
export async function POST(request: Request) {
  const signature = request.headers.get('toss-signature') || ''
  const body = await request.text()

  const webhookHandler = new WebhookHandler(paymentService, {
    onPaymentCompleted: async (payment) => {
      // 결제 완료 처리
      console.log('결제 완료 웹훅:', payment)
      // 주문 상태 업데이트, 재고 차감 등
    },
    onPaymentCanceled: async (payment) => {
      // 결제 취소 처리
      console.log('결제 취소 웹훅:', payment)
      // 주문 취소, 재고 복원 등
    },
    onVirtualAccountIssued: async (payment) => {
      // 가상계좌 발급 처리
      console.log('가상계좌 발급:', payment)
      // 입금 안내 메일/SMS 발송
    }
  })

  const result = await webhookHandler.handleWebhook(signature, body)
  
  if (result.success) {
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } else {
    return new Response(JSON.stringify({ error: result.error }), { status: 400 })
  }
}

// 7. 정기결제 (빌링) 예제
export async function setupBilling() {
  // 빌링키 발급
  const billingResult = await paymentService.issueBillingKey(
    'customer-unique-key',
    'auth-key-from-client'
  )

  if (billingResult.success) {
    const billingKey = billingResult.data.billingKey
    
    // 자동결제 실행
    const paymentResult = await paymentService.requestBillingPayment({
      billingKey: billingKey,
      amount: 9900,
      orderId: PaymentUtils.generateOrderId('SUB'),
      orderName: '프리미엄 구독 - 1개월',
      customerEmail: 'subscriber@example.com',
      customerName: '구독자'
    })

    if (paymentResult.success) {
      console.log('정기결제 성공:', paymentResult.data)
    }
  }
}

// 8. 부분 취소 예제
export async function partialRefund() {
  const cancelResult = await paymentService.cancelPayment({
    paymentKey: 'payment-key-to-cancel',
    cancelReason: '상품 일부 반품',
    cancelAmount: 10000, // 부분 취소 금액
    refundReceiveAccount: {
      bankCode: '88',
      accountNumber: '123456789012',
      holderName: '홍길동'
    }
  })

  if (cancelResult.success) {
    console.log('부분 취소 완료:', cancelResult.data)
  }
}

// 9. 결제 상태 체크 예제
export async function checkPaymentStatus() {
  const paymentKey = 'payment-key-to-check'
  
  // 결제 상태 확인
  const statusResult = await paymentService.checkPaymentStatus(paymentKey)
  if (statusResult.success) {
    console.log('결제 완료 여부:', statusResult.data)
  }

  // 취소 가능 금액 조회
  const cancellableResult = await paymentService.getCancellableAmount(paymentKey)
  if (cancellableResult.success) {
    console.log('취소 가능 금액:', formatCurrency(cancellableResult.data))
  }
}

// 10. 유틸리티 함수 사용 예제
export function utilityExamples() {
  // 금액 포맷팅
  console.log(PaymentUtils.formatCurrency(50000)) // 50,000원

  // 카드번호 마스킹
  console.log(PaymentUtils.maskCardNumber('1234567890123456')) // 1234-****-****-3456

  // 은행명 변환
  console.log(PaymentUtils.getBankName('88')) // 신협

  // 결제 상태 텍스트
  console.log(PaymentUtils.getStatusText('DONE')) // 결제 완료

  // 할부 옵션 생성
  console.log(PaymentUtils.getInstallmentOptions(100000)) // [0, 2, 3, 6]

  // VAT 계산
  console.log(PaymentUtils.calculateVAT(11000)) // { supplyAmount: 10000, vat: 1000 }
}