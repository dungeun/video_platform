import { PaymentRequest, PaymentMethod, RefundReceiveAccount } from '../types'

/**
 * 결제 요청 유효성 검증 유틸리티
 */
export class PaymentValidator {
  /**
   * 결제 금액 유효성 검증
   */
  static validateAmount(amount: number): { valid: boolean; error?: string } {
    if (!amount || amount <= 0) {
      return { valid: false, error: '결제 금액은 0보다 커야 합니다.' }
    }
    
    if (amount < 100) {
      return { valid: false, error: '최소 결제 금액은 100원입니다.' }
    }
    
    if (amount > 10000000) {
      return { valid: false, error: '최대 결제 금액은 10,000,000원입니다.' }
    }
    
    if (!Number.isInteger(amount)) {
      return { valid: false, error: '결제 금액은 정수여야 합니다.' }
    }
    
    return { valid: true }
  }

  /**
   * 주문 ID 유효성 검증
   */
  static validateOrderId(orderId: string): { valid: boolean; error?: string } {
    if (!orderId || orderId.trim() === '') {
      return { valid: false, error: '주문 ID는 필수입니다.' }
    }
    
    if (orderId.length > 64) {
      return { valid: false, error: '주문 ID는 64자 이하여야 합니다.' }
    }
    
    // 허용된 문자: 영문, 숫자, -, _
    const pattern = /^[a-zA-Z0-9_-]+$/
    if (!pattern.test(orderId)) {
      return { valid: false, error: '주문 ID는 영문, 숫자, -, _만 사용 가능합니다.' }
    }
    
    return { valid: true }
  }

  /**
   * 주문명 유효성 검증
   */
  static validateOrderName(orderName: string): { valid: boolean; error?: string } {
    if (!orderName || orderName.trim() === '') {
      return { valid: false, error: '주문명은 필수입니다.' }
    }
    
    if (orderName.length > 100) {
      return { valid: false, error: '주문명은 100자 이하여야 합니다.' }
    }
    
    return { valid: true }
  }

  /**
   * 이메일 유효성 검증
   */
  static validateEmail(email?: string): { valid: boolean; error?: string } {
    if (!email) {
      return { valid: true } // 선택 필드
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      return { valid: false, error: '올바른 이메일 형식이 아닙니다.' }
    }
    
    return { valid: true }
  }

  /**
   * 전화번호 유효성 검증
   */
  static validatePhoneNumber(phone?: string): { valid: boolean; error?: string } {
    if (!phone) {
      return { valid: true } // 선택 필드
    }
    
    const phonePattern = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/
    if (!phonePattern.test(phone.replace(/-/g, ''))) {
      return { valid: false, error: '올바른 휴대폰 번호 형식이 아닙니다.' }
    }
    
    return { valid: true }
  }

  /**
   * 결제 수단 유효성 검증
   */
  static validatePaymentMethod(method?: PaymentMethod): { valid: boolean; error?: string } {
    if (!method) {
      return { valid: true } // 선택 필드
    }
    
    const validMethods: PaymentMethod[] = [
      'CARD', 'VIRTUAL_ACCOUNT', 'TRANSFER', 'MOBILE',
      'CULTURE_GIFT_CERTIFICATE', 'KAKAO_PAY', 'NAVER_PAY', 'TOSS_PAY'
    ]
    
    if (!validMethods.includes(method)) {
      return { valid: false, error: '지원하지 않는 결제 수단입니다.' }
    }
    
    return { valid: true }
  }

  /**
   * URL 유효성 검증
   */
  static validateUrl(url: string, fieldName: string): { valid: boolean; error?: string } {
    if (!url || url.trim() === '') {
      return { valid: false, error: `${fieldName}은(는) 필수입니다.` }
    }
    
    try {
      new URL(url)
      return { valid: true }
    } catch {
      // 상대 경로도 허용
      if (url.startsWith('/')) {
        return { valid: true }
      }
      return { valid: false, error: `${fieldName}은(는) 올바른 URL 형식이어야 합니다.` }
    }
  }

  /**
   * 전체 결제 요청 유효성 검증
   */
  static validatePaymentRequest(request: PaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // 금액 검증
    const amountValidation = this.validateAmount(request.amount)
    if (!amountValidation.valid && amountValidation.error) {
      errors.push(amountValidation.error)
    }
    
    // 주문 ID 검증
    const orderIdValidation = this.validateOrderId(request.orderId)
    if (!orderIdValidation.valid && orderIdValidation.error) {
      errors.push(orderIdValidation.error)
    }
    
    // 주문명 검증
    const orderNameValidation = this.validateOrderName(request.orderName)
    if (!orderNameValidation.valid && orderNameValidation.error) {
      errors.push(orderNameValidation.error)
    }
    
    // 이메일 검증
    const emailValidation = this.validateEmail(request.customerEmail)
    if (!emailValidation.valid && emailValidation.error) {
      errors.push(emailValidation.error)
    }
    
    // 전화번호 검증
    const phoneValidation = this.validatePhoneNumber(request.customerMobilePhone)
    if (!phoneValidation.valid && phoneValidation.error) {
      errors.push(phoneValidation.error)
    }
    
    // 결제 수단 검증
    const methodValidation = this.validatePaymentMethod(request.paymentMethod)
    if (!methodValidation.valid && methodValidation.error) {
      errors.push(methodValidation.error)
    }
    
    // URL 검증
    const successUrlValidation = this.validateUrl(request.successUrl, '성공 URL')
    if (!successUrlValidation.valid && successUrlValidation.error) {
      errors.push(successUrlValidation.error)
    }
    
    const failUrlValidation = this.validateUrl(request.failUrl, '실패 URL')
    if (!failUrlValidation.valid && failUrlValidation.error) {
      errors.push(failUrlValidation.error)
    }
    
    // 가상계좌 입금 기한 검증
    if (request.validHours !== undefined) {
      if (request.validHours < 1 || request.validHours > 720) {
        errors.push('가상계좌 입금 기한은 1시간 이상 720시간 이하여야 합니다.')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 환불 계좌 정보 유효성 검증
   */
  static validateRefundAccount(account: RefundReceiveAccount): { valid: boolean; error?: string } {
    if (!account.bankCode || account.bankCode.trim() === '') {
      return { valid: false, error: '은행 코드는 필수입니다.' }
    }
    
    if (!account.accountNumber || account.accountNumber.trim() === '') {
      return { valid: false, error: '계좌번호는 필수입니다.' }
    }
    
    if (!account.holderName || account.holderName.trim() === '') {
      return { valid: false, error: '예금주명은 필수입니다.' }
    }
    
    // 계좌번호 형식 검증 (숫자와 하이픈만 허용)
    const accountPattern = /^[0-9-]+$/
    if (!accountPattern.test(account.accountNumber)) {
      return { valid: false, error: '계좌번호는 숫자와 하이픈(-)만 사용 가능합니다.' }
    }
    
    return { valid: true }
  }

  /**
   * 할부 개월 수 유효성 검증
   */
  static validateInstallmentMonths(months: number, amount: number): { valid: boolean; error?: string } {
    const validMonths = [0, 2, 3, 6, 12]
    
    if (!validMonths.includes(months)) {
      return { valid: false, error: '지원하지 않는 할부 개월 수입니다.' }
    }
    
    // 5만원 미만은 일시불만 가능
    if (amount < 50000 && months > 0) {
      return { valid: false, error: '5만원 미만은 할부가 불가능합니다.' }
    }
    
    return { valid: true }
  }

  /**
   * 취소 금액 유효성 검증
   */
  static validateCancelAmount(cancelAmount: number, totalAmount: number): { valid: boolean; error?: string } {
    if (cancelAmount <= 0) {
      return { valid: false, error: '취소 금액은 0보다 커야 합니다.' }
    }
    
    if (cancelAmount > totalAmount) {
      return { valid: false, error: '취소 금액은 결제 금액을 초과할 수 없습니다.' }
    }
    
    if (!Number.isInteger(cancelAmount)) {
      return { valid: false, error: '취소 금액은 정수여야 합니다.' }
    }
    
    return { valid: true }
  }
}