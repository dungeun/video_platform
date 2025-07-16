import { PaymentMethod, PaymentStatus } from '../types'

/**
 * 결제 관련 포맷팅 유틸리티
 */
export class PaymentFormatter {
  /**
   * 금액을 원화 형식으로 포맷
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  /**
   * 금액을 천 단위 구분 기호로 포맷
   */
  static formatAmount(amount: number): string {
    return amount.toLocaleString('ko-KR')
  }

  /**
   * 카드번호 마스킹
   * 1234-5678-9012-3456 -> 1234-****-****-3456
   */
  static maskCardNumber(cardNumber: string): string {
    // 하이픈 제거
    const cleanNumber = cardNumber.replace(/-/g, '')
    
    if (cleanNumber.length < 8) {
      return cardNumber
    }
    
    // 앞 4자리와 뒤 4자리만 표시
    const masked = cleanNumber.slice(0, 4) + cleanNumber.slice(4, -4).replace(/./g, '*') + cleanNumber.slice(-4)
    
    // 4자리씩 하이픈으로 구분
    return masked.match(/.{1,4}/g)?.join('-') || masked
  }

  /**
   * 휴대폰 번호 포맷
   * 01012345678 -> 010-1234-5678
   */
  static formatPhoneNumber(phone: string): string {
    const cleanNumber = phone.replace(/[^0-9]/g, '')
    
    if (cleanNumber.length === 11) {
      return cleanNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    } else if (cleanNumber.length === 10) {
      return cleanNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
    
    return phone
  }

  /**
   * 계좌번호 포맷 (은행별 형식 적용)
   */
  static formatAccountNumber(accountNumber: string, bankCode?: string): string {
    const cleanNumber = accountNumber.replace(/[^0-9]/g, '')
    
    // 은행별 계좌번호 형식이 다르므로 기본적으로 4자리씩 구분
    const formatted = cleanNumber.match(/.{1,4}/g)?.join('-') || cleanNumber
    
    return formatted
  }

  /**
   * 날짜 포맷 (ISO string -> 한국 시간)
   */
  static formatDate(dateString: string, includeTime: boolean = true): string {
    const date = new Date(dateString)
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    }
    
    if (includeTime) {
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.second = '2-digit'
    }
    
    return new Intl.DateTimeFormat('ko-KR', options).format(date)
  }

  /**
   * 상대 시간 포맷 (몇 분 전, 몇 시간 전 등)
   */
  static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSeconds < 60) {
      return '방금 전'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return this.formatDate(dateString, false)
    }
  }

  /**
   * 결제 상태를 한글로 변환
   */
  static formatPaymentStatus(status: PaymentStatus): string {
    const statusMap: Record<PaymentStatus, string> = {
      'READY': '결제 대기',
      'IN_PROGRESS': '결제 진행 중',
      'WAITING_FOR_DEPOSIT': '입금 대기',
      'DONE': '결제 완료',
      'CANCELED': '결제 취소',
      'PARTIAL_CANCELED': '부분 취소',
      'ABORTED': '결제 중단',
      'EXPIRED': '결제 만료'
    }
    
    return statusMap[status] || status
  }

  /**
   * 결제 수단을 한글로 변환
   */
  static formatPaymentMethod(method: PaymentMethod): string {
    const methodMap: Record<PaymentMethod, string> = {
      'CARD': '신용/체크카드',
      'VIRTUAL_ACCOUNT': '가상계좌',
      'TRANSFER': '계좌이체',
      'MOBILE': '휴대폰',
      'CULTURE_GIFT_CERTIFICATE': '문화상품권',
      'KAKAO_PAY': '카카오페이',
      'NAVER_PAY': '네이버페이',
      'TOSS_PAY': '토스페이'
    }
    
    return methodMap[method] || method
  }

  /**
   * 은행 코드를 은행명으로 변환
   */
  static formatBankName(bankCode: string): string {
    const bankMap: Record<string, string> = {
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
    
    return bankMap[bankCode] || '기타은행'
  }

  /**
   * 카드사 코드를 카드사명으로 변환
   */
  static formatCardIssuer(issuerCode: string): string {
    const issuerMap: Record<string, string> = {
      '03': 'KB국민카드',
      '06': '하나카드',
      '05': '신한카드',
      '07': '우리카드',
      '11': 'NH농협카드',
      '15': '롯데카드',
      '08': '현대카드',
      '02': '삼성카드',
      '04': 'BC카드',
      '12': '케이뱅크',
      '13': '카카오뱅크',
      '22': '토스뱅크'
    }
    
    return issuerMap[issuerCode] || '기타카드'
  }

  /**
   * 할부 개월 수 포맷
   */
  static formatInstallmentMonths(months: number): string {
    if (months === 0) {
      return '일시불'
    }
    return `${months}개월`
  }

  /**
   * 주문 ID에서 날짜 추출 (타임스탬프 기반 ID인 경우)
   */
  static extractDateFromOrderId(orderId: string): string | null {
    // ORDER_1234567890123_456 형식에서 타임스탬프 추출
    const match = orderId.match(/(\d{13})/)
    if (match) {
      const timestamp = parseInt(match[1])
      return this.formatDate(new Date(timestamp).toISOString())
    }
    return null
  }

  /**
   * 에러 코드를 사용자 친화적 메시지로 변환
   */
  static formatErrorMessage(errorCode: string): string {
    const errorMap: Record<string, string> = {
      'INVALID_REQUEST': '잘못된 요청입니다.',
      'NOT_FOUND': '결제 정보를 찾을 수 없습니다.',
      'UNAUTHORIZED': '인증이 필요합니다.',
      'FORBIDDEN': '권한이 없습니다.',
      'ALREADY_PROCESSED_PAYMENT': '이미 처리된 결제입니다.',
      'PROVIDER_ERROR': '결제 제공사 오류가 발생했습니다.',
      'EXCEED_MAX_DAILY_PAYMENT_COUNT': '일일 결제 한도를 초과했습니다.',
      'EXCEED_MAX_PAYMENT_AMOUNT': '최대 결제 금액을 초과했습니다.',
      'INVALID_CARD_COMPANY': '지원하지 않는 카드사입니다.',
      'INVALID_PAYMENT_METHOD': '지원하지 않는 결제 수단입니다.',
      'CANCELLABLE_AMOUNT_INCONSISTENT': '취소 가능 금액이 일치하지 않습니다.',
      'NOT_CANCELLABLE_AMOUNT': '취소할 수 없는 금액입니다.',
      'CANCEL_AMOUNT_EXCEEDED': '취소 금액이 결제 금액을 초과합니다.',
      'INVALID_BANK_CODE': '올바르지 않은 은행 코드입니다.',
      'INVALID_ACCOUNT_INFO': '올바르지 않은 계좌 정보입니다.'
    }
    
    return errorMap[errorCode] || '알 수 없는 오류가 발생했습니다.'
  }
}