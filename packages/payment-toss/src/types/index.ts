import { Result } from '@company/core'

// 결제 방법 타입
export type PaymentMethod = 
  | 'CARD'           // 카드
  | 'VIRTUAL_ACCOUNT' // 가상계좌
  | 'TRANSFER'       // 계좌이체
  | 'MOBILE'         // 휴대폰
  | 'CULTURE_GIFT_CERTIFICATE' // 문화상품권
  | 'KAKAO_PAY'      // 카카오페이
  | 'NAVER_PAY'      // 네이버페이
  | 'TOSS_PAY'       // 토스페이

// 결제 상태
export type PaymentStatus = 
  | 'READY'          // 결제 대기
  | 'IN_PROGRESS'    // 결제 진행 중
  | 'WAITING_FOR_DEPOSIT' // 입금 대기 (가상계좌)
  | 'DONE'           // 결제 완료
  | 'CANCELED'       // 결제 취소
  | 'PARTIAL_CANCELED' // 부분 취소
  | 'ABORTED'        // 결제 중단
  | 'EXPIRED'        // 결제 만료

// 결제 요청 데이터
export interface PaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
  customerMobilePhone?: string
  successUrl: string
  failUrl: string
  paymentMethod?: PaymentMethod
  validHours?: number
  cashReceipt?: CashReceiptConfig
  escrow?: boolean
  productType?: 'PHYSICAL' | 'DIGITAL'
}

// 현금영수증 설정
export interface CashReceiptConfig {
  type: 'PERSONAL' | 'CORPORATE'
  registrationNumber: string // 휴대폰번호 또는 사업자등록번호
}

// 결제 정보
export interface Payment {
  paymentKey: string
  type: PaymentMethod
  orderId: string
  orderName: string
  mId: string
  currency: string
  method: PaymentMethod
  totalAmount: number
  balanceAmount: number
  status: PaymentStatus
  requestedAt: string
  approvedAt?: string
  useEscrow: boolean
  lastTransactionKey?: string
  suppliedAmount: number
  vat: number
  isPartialCancelable: boolean
  card?: CardPayment
  virtualAccount?: VirtualAccount
  transfer?: TransferPayment
  mobilePhone?: MobilePayment
  giftCertificate?: GiftCertificate
  cashReceipt?: CashReceipt
  cashReceipts?: CashReceipt[]
  discount?: PaymentDiscount
  cancels?: PaymentCancel[]
  secret?: string
  failure?: PaymentFailure
  receipt?: PaymentReceipt
  checkout?: PaymentCheckout
}

// 카드 결제 정보
export interface CardPayment {
  amount: number
  issuerCode: string
  acquirerCode?: string
  number: string
  installmentPlanMonths: number
  approveNo: string
  useCardPoint: boolean
  cardType: 'CREDIT' | 'DEBIT' | 'GIFT'
  ownerType: 'PERSONAL' | 'CORPORATE'
  acquireStatus: 'READY' | 'REQUESTED' | 'COMPLETED' | 'CANCEL_REQUESTED' | 'CANCELED'
  isInterestFree: boolean
  interestPayer?: 'BUYER' | 'CARD_COMPANY' | 'MERCHANT'
}

// 가상계좌 정보
export interface VirtualAccount {
  accountType: 'FIXED' | 'NORMAL'
  accountNumber: string
  bankCode: string
  customerName: string
  dueDate: string
  refundStatus: 'NONE' | 'PENDING' | 'FAILED' | 'PARTIAL_FAILED' | 'COMPLETED'
  expired: boolean
  settlementStatus: 'INCOMPLETED' | 'COMPLETED'
  refundReceiveAccount?: RefundReceiveAccount
}

// 환불 계좌 정보
export interface RefundReceiveAccount {
  bankCode: string
  accountNumber: string
  holderName: string
}

// 계좌이체 정보
export interface TransferPayment {
  bankCode: string
  settlementStatus: 'INCOMPLETED' | 'COMPLETED'
}

// 휴대폰 결제 정보
export interface MobilePayment {
  customerMobilePhone: string
  settlementStatus: 'INCOMPLETED' | 'COMPLETED'
  receiptUrl: string
}

// 상품권 결제 정보
export interface GiftCertificate {
  approveNo: string
  settlementStatus: 'INCOMPLETED' | 'COMPLETED'
}

// 현금영수증 정보
export interface CashReceipt {
  type: 'PERSONAL' | 'CORPORATE'
  receiptKey: string
  issueNumber: string
  receiptUrl: string
  amount: number
  taxFreeAmount: number
}

// 할인 정보
export interface PaymentDiscount {
  amount: number
}

// 취소 정보
export interface PaymentCancel {
  cancelAmount: number
  cancelReason: string
  taxFreeAmount: number
  taxExemptionAmount: number
  refundableAmount: number
  easyPayDiscountAmount: number
  canceledAt: string
  transactionKey: string
  receiptKey?: string
}

// 결제 실패 정보
export interface PaymentFailure {
  code: string
  message: string
}

// 영수증 정보
export interface PaymentReceipt {
  url: string
}

// 결제창 정보
export interface PaymentCheckout {
  url: string
}

// 취소 요청
export interface CancelRequest {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number
  refundReceiveAccount?: RefundReceiveAccount
  taxFreeAmount?: number
  taxExemptionAmount?: number
}

// 결제 확인 요청
export interface ConfirmRequest {
  paymentKey: string
  orderId: string
  amount: number
}

// 빌링키 (자동결제)
export interface BillingKey {
  billingKey: string
  customerKey: string
  authenticatedAt: string
  method: PaymentMethod
  card?: BillingKeyCard
}

export interface BillingKeyCard {
  issuerCode: string
  acquirerCode?: string
  number: string
  cardType: 'CREDIT' | 'DEBIT'
  ownerType: 'PERSONAL' | 'CORPORATE'
}

// 자동결제 요청
export interface BillingPaymentRequest {
  billingKey: string
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
  taxFreeAmount?: number
}

// 웹훅 이벤트
export interface WebhookEvent {
  eventType: 'PAYMENT_STATUS_CHANGED'
  createdAt: string
  data: Payment
}

// 토스페이먼츠 설정
export interface TossPaymentsConfig {
  clientKey: string
  secretKey: string
  baseUrl?: string
  webhook?: {
    endpoint: string
    secret: string
  }
}

// 결제 서비스 인터페이스
export interface PaymentService {
  // 결제 요청
  requestPayment(request: PaymentRequest): Promise<Result<Payment>>
  
  // 결제 확인
  confirmPayment(confirm: ConfirmRequest): Promise<Result<Payment>>
  
  // 결제 조회
  getPayment(paymentKey: string): Promise<Result<Payment>>
  
  // 주문 ID로 결제 조회
  getPaymentByOrderId(orderId: string): Promise<Result<Payment>>
  
  // 결제 취소
  cancelPayment(cancel: CancelRequest): Promise<Result<Payment>>
  
  // 빌링키 발급
  issueBillingKey(customerKey: string, authKey: string): Promise<Result<BillingKey>>
  
  // 자동결제
  requestBillingPayment(billing: BillingPaymentRequest): Promise<Result<Payment>>
  
  // 빌링키 조회
  getBillingKey(billingKey: string): Promise<Result<BillingKey>>
  
  // 빌링키 삭제
  deleteBillingKey(billingKey: string): Promise<Result<void>>
}

// React Hook 반환 타입
export interface UseTossPaymentReturn {
  requestPayment: (request: PaymentRequest) => Promise<Result<Payment>>
  confirmPayment: (confirm: ConfirmRequest) => Promise<Result<Payment>>
  cancelPayment: (cancel: CancelRequest) => Promise<Result<Payment>>
  getPayment: (paymentKey: string) => Promise<Result<Payment>>
  isLoading: boolean
  error: string | null
}

// 결제 위젯 Props
export interface PaymentWidgetProps {
  amount: number
  orderId: string
  orderName: string
  onSuccess: (payment: Payment) => void
  onFail: (error: PaymentFailure) => void
  customerEmail?: string
  customerName?: string
  paymentMethods?: PaymentMethod[]
  theme?: 'light' | 'dark'
}

// 에러 코드
export const TOSS_ERROR_CODES = {
  // 공통 에러
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // 결제 에러
  ALREADY_PROCESSED_PAYMENT: 'ALREADY_PROCESSED_PAYMENT',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: 'EXCEED_MAX_DAILY_PAYMENT_COUNT',
  EXCEED_MAX_PAYMENT_AMOUNT: 'EXCEED_MAX_PAYMENT_AMOUNT',
  INVALID_CARD_COMPANY: 'INVALID_CARD_COMPANY',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  
  // 취소 에러
  CANCELLABLE_AMOUNT_INCONSISTENT: 'CANCELLABLE_AMOUNT_INCONSISTENT',
  NOT_CANCELLABLE_AMOUNT: 'NOT_CANCELLABLE_AMOUNT',
  CANCEL_AMOUNT_EXCEEDED: 'CANCEL_AMOUNT_EXCEEDED',
  
  // 가상계좌 에러
  INVALID_BANK_CODE: 'INVALID_BANK_CODE',
  INVALID_ACCOUNT_INFO: 'INVALID_ACCOUNT_INFO'
} as const

export type TossErrorCode = typeof TOSS_ERROR_CODES[keyof typeof TOSS_ERROR_CODES]