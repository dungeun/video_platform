// Import types for internal use
import { PaymentStatus, PaymentMethod } from './types'

// 서비스
export { TossPaymentService } from './services/TossPaymentService'

// 훅
export { useTossPayment } from './hooks/useTossPayment'

// 컴포넌트
export { PaymentWidget } from './components/PaymentWidget'

// Provider
export { TossPaymentProvider, useTossPaymentContext } from './providers'

// 웹훅
export { WebhookHandler } from './webhooks/WebhookHandler'
export type { WebhookHandlerConfig } from './webhooks/WebhookHandler'

// 유틸리티
export * from './utils'

// 타입
export type {
  // 기본 타입
  PaymentMethod,
  PaymentStatus,
  Payment,
  PaymentRequest,
  ConfirmRequest,
  CancelRequest,
  
  // 결제 방법별 타입
  CardPayment,
  VirtualAccount,
  TransferPayment,
  MobilePayment,
  GiftCertificate,
  
  // 기타 타입
  CashReceipt,
  CashReceiptConfig,
  PaymentDiscount,
  PaymentCancel,
  PaymentFailure,
  PaymentReceipt,
  PaymentCheckout,
  RefundReceiveAccount,
  
  // 빌링키 (자동결제)
  BillingKey,
  BillingKeyCard,
  BillingPaymentRequest,
  
  // 웹훅
  WebhookEvent,
  
  // 설정
  TossPaymentsConfig,
  
  // 서비스 인터페이스
  PaymentService,
  
  // React 관련
  UseTossPaymentReturn,
  PaymentWidgetProps,
  
  // 에러
  TossErrorCode
} from './types'

// 상수
export { TOSS_ERROR_CODES } from './types'

// 유틸리티 함수들
export const PaymentUtils = {
  /**
   * 금액을 원화 형식으로 포맷
   */
  formatCurrency: (amount: number): string => {
    return `${amount.toLocaleString()}원`
  },

  /**
   * 카드번호 마스킹
   */
  maskCardNumber: (cardNumber: string): string => {
    if (cardNumber.length < 4) return cardNumber
    return cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-****-****-$4')
  },

  /**
   * 가상계좌 번호 포맷
   */
  formatAccountNumber: (accountNumber: string, bankCode: string): string => {
    return `${accountNumber} (${PaymentUtils.getBankName(bankCode)})`
  },

  /**
   * 은행 코드를 은행명으로 변환
   */
  getBankName: (bankCode: string): string => {
    const bankNames: Record<string, string> = {
      '39': 'KDB산업은행',
      '34': 'IBK기업은행',
      '03': 'KB국민은행',
      '06': 'KEB하나은행',
      '05': '신한은행',
      '07': '우리은행',
      '23': 'SC제일은행',
      '37': '시티은행',
      '04': 'KB은행',
      '20': '우체국',
      '31': '대구은행',
      '32': '부산은행',
      '35': '경남은행',
      '12': '농협',
      '11': 'NH농협은행',
      '45': '새마을금고',
      '64': '산림조합',
      '88': '신협',
      '27': '한국씨티은행',
      '71': '우체국예금보험',
      '89': '케이뱅크',
      '90': '카카오뱅크',
      '92': '토스뱅크'
    }
    return bankNames[bankCode] || '기타은행'
  },

  /**
   * 결제 상태를 한글로 변환
   */
  getStatusText: (status: PaymentStatus): string => {
    const statusTexts: Record<PaymentStatus, string> = {
      'READY': '결제 대기',
      'IN_PROGRESS': '결제 진행 중',
      'WAITING_FOR_DEPOSIT': '입금 대기',
      'DONE': '결제 완료',
      'CANCELED': '결제 취소',
      'PARTIAL_CANCELED': '부분 취소',
      'ABORTED': '결제 중단',
      'EXPIRED': '결제 만료'
    }
    return statusTexts[status] || '알 수 없음'
  },

  /**
   * 결제 방법을 한글로 변환
   */
  getMethodText: (method: PaymentMethod): string => {
    const methodTexts: Record<PaymentMethod, string> = {
      'CARD': '카드',
      'VIRTUAL_ACCOUNT': '가상계좌',
      'TRANSFER': '계좌이체',
      'MOBILE': '휴대폰',
      'CULTURE_GIFT_CERTIFICATE': '문화상품권',
      'KAKAO_PAY': '카카오페이',
      'NAVER_PAY': '네이버페이',
      'TOSS_PAY': '토스페이'
    }
    return methodTexts[method] || '기타'
  },

  /**
   * 주문 ID 생성 (타임스탠프 기반)
   */
  generateOrderId: (prefix: string = 'ORDER'): string => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}_${timestamp}_${random}`
  },

  /**
   * 결제 가능한 시간 확인
   */
  isPaymentTimeValid: (validHours: number = 24): boolean => {
    const now = new Date()
    const hour = now.getHours()
    
    // 새벽 2시~5시는 시스템 점검 시간으로 가정
    if (hour >= 2 && hour < 5) {
      return false
    }
    
    return true
  },

  /**
   * VAT 계산
   */
  calculateVAT: (totalAmount: number): { supplyAmount: number; vat: number } => {
    const supplyAmount = Math.floor(totalAmount / 1.1)
    const vat = totalAmount - supplyAmount
    return { supplyAmount, vat }
  },

  /**
   * 할부 개월 수 옵션 생성
   */
  getInstallmentOptions: (amount: number): number[] => {
    // 5만원 이상부터 할부 가능
    if (amount < 50000) {
      return [0] // 일시불만
    }
    
    // 금액에 따른 할부 개월 수 제한
    if (amount < 100000) {
      return [0, 2, 3]
    } else if (amount < 500000) {
      return [0, 2, 3, 6]
    } else {
      return [0, 2, 3, 6, 12]
    }
  }
}

// 기본 설정
export const DEFAULT_CONFIG = {
  baseUrl: 'https://api.tosspayments.com',
  timeout: 30000,
  retryCount: 3,
  validHours: 24
} as const