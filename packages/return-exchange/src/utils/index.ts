import type {
  RequestStatus,
  RequestReason,
  RefundMethod,
  InspectionResult,
  ReturnRequest,
  ExchangeRequest
} from '../types'

// Status utilities
export const getStatusText = (status: RequestStatus): string => {
  const statusTexts: Record<RequestStatus, string> = {
    pending: '접수 대기',
    approved: '승인됨',
    rejected: '거절됨',
    collecting: '수거 중',
    collected: '수거 완료',
    inspecting: '검수 중',
    processing: '처리 중',
    shipping: '배송 중',
    completed: '완료',
    cancelled: '취소됨'
  }
  
  return statusTexts[status] || status
}

export const getStatusColor = (status: RequestStatus): string => {
  const statusColors: Record<RequestStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    approved: 'text-blue-600 bg-blue-100',
    rejected: 'text-red-600 bg-red-100',
    collecting: 'text-purple-600 bg-purple-100',
    collected: 'text-purple-600 bg-purple-100',
    inspecting: 'text-orange-600 bg-orange-100',
    processing: 'text-blue-600 bg-blue-100',
    shipping: 'text-green-600 bg-green-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-gray-600 bg-gray-100'
  }
  
  return statusColors[status] || 'text-gray-600 bg-gray-100'
}

export const isStatusFinal = (status: RequestStatus): boolean => {
  return ['completed', 'rejected', 'cancelled'].includes(status)
}

export const isStatusActionable = (status: RequestStatus): boolean => {
  return ['pending', 'approved', 'collected'].includes(status)
}

// Reason utilities
export const getReasonText = (reason: RequestReason): string => {
  const reasonTexts: Record<RequestReason, string> = {
    defective: '불량/파손',
    'wrong-product': '다른 상품 배송',
    'change-mind': '단순 변심',
    'size-issue': '사이즈 문제',
    'color-issue': '색상 문제',
    'not-as-described': '상품 설명과 다름',
    other: '기타'
  }
  
  return reasonTexts[reason] || reason
}

export const isReasonCustomerFault = (reason: RequestReason): boolean => {
  return ['change-mind', 'size-issue', 'color-issue'].includes(reason)
}

export const isReasonCompanyFault = (reason: RequestReason): boolean => {
  return ['defective', 'wrong-product', 'not-as-described'].includes(reason)
}

// Refund method utilities
export const getRefundMethodText = (method: RefundMethod): string => {
  const methodTexts: Record<RefundMethod, string> = {
    original: '원결제 수단',
    points: '포인트',
    account: '계좌이체'
  }
  
  return methodTexts[method] || method
}

// Inspection utilities
export const getInspectionResultText = (result: InspectionResult): string => {
  const resultTexts: Record<InspectionResult, string> = {
    pass: '통과',
    fail: '실패',
    partial: '부분 통과'
  }
  
  return resultTexts[result] || result
}

export const getInspectionResultColor = (result: InspectionResult): string => {
  const resultColors: Record<InspectionResult, string> = {
    pass: 'text-green-600 bg-green-100',
    fail: 'text-red-600 bg-red-100',
    partial: 'text-yellow-600 bg-yellow-100'
  }
  
  return resultColors[result] || 'text-gray-600 bg-gray-100'
}

// Date utilities
export const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
  if (format === 'long') {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  return new Intl.DateTimeFormat('ko-KR').format(date)
}

export const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return '방금 전'
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}시간 전`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}일 전`
  
  return formatDate(date)
}

export const getDaysSince = (date: Date): number => {
  const now = new Date()
  const diffInTime = now.getTime() - date.getTime()
  return Math.floor(diffInTime / (1000 * 3600 * 24))
}

// Price utilities
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR').format(price)
}

export const formatPriceWithCurrency = (price: number): string => {
  return `${formatPrice(price)}원`
}

// Request utilities
export const getRequestTypeText = (type: 'return' | 'exchange'): string => {
  return type === 'return' ? '반품' : '교환'
}

export const getRequestTotalAmount = (request: ReturnRequest | ExchangeRequest): number => {
  return request.items.reduce((total, item) => total + (item.price * item.quantity), 0)
}

export const getRequestItemCount = (request: ReturnRequest | ExchangeRequest): number => {
  return request.items.reduce((total, item) => total + item.quantity, 0)
}

export const canRequestBeCancelled = (request: ReturnRequest | ExchangeRequest): boolean => {
  return ['pending', 'approved'].includes(request.status)
}

export const getProcessingTime = (request: ReturnRequest | ExchangeRequest): number => {
  if (!isStatusFinal(request.status)) return 0
  
  const diffInTime = request.updatedAt.getTime() - request.createdAt.getTime()
  return Math.floor(diffInTime / (1000 * 3600 * 24))
}

// Validation utilities
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^01[016789]\d{7,8}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPostalCode = (postalCode: string): boolean => {
  const postalRegex = /^\d{5}$/
  return postalRegex.test(postalCode)
}

// Image utilities
export const getImageUrl = (imagePath: string, size?: 'thumbnail' | 'medium' | 'large'): string => {
  if (!imagePath) return ''
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath
  }
  
  // Add size suffix if specified
  if (size && size !== 'large') {
    const parts = imagePath.split('.')
    if (parts.length > 1) {
      const extension = parts.pop()
      const filename = parts.join('.')
      return `/images/${filename}_${size}.${extension}`
    }
  }
  
  return `/images/${imagePath}`
}

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

export const getImageFileSize = (file: File): string => {
  const bytes = file.size
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  
  if (bytes === 0) return '0 Bytes'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Tracking utilities
export const formatTrackingNumber = (trackingNumber: string): string => {
  // Format tracking number with dashes for better readability
  if (trackingNumber.length === 12) {
    return trackingNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  return trackingNumber
}

export const getTrackingUrl = (trackingNumber: string, carrier?: string): string => {
  // Return tracking URL based on carrier
  // This is a simplified example - in real implementation, you'd have proper carrier mapping
  const carriers: Record<string, string> = {
    'cj': `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingNumber}`,
    'hanjin': `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=${trackingNumber}`,
    'lotte': `https://www.lotteglogis.com/mobile/reservation/tracking/linkView?InvNo=${trackingNumber}`
  }
  
  return carriers[carrier || 'cj'] || `#tracking-${trackingNumber}`
}

// Export utility functions as named exports
export {
  getStatusText as statusText,
  getStatusColor as statusColor,
  getReasonText as reasonText,
  getRefundMethodText as refundMethodText,
  formatPrice as price,
  formatPriceWithCurrency as priceWithCurrency,
  formatDate as date,
  getRelativeTime as relativeTime
}

// Export utility object for backward compatibility
export const ReturnExchangeUtils = {
  status: {
    getText: getStatusText,
    getColor: getStatusColor,
    isFinal: isStatusFinal,
    isActionable: isStatusActionable
  },
  reason: {
    getText: getReasonText,
    isCustomerFault: isReasonCustomerFault,
    isCompanyFault: isReasonCompanyFault
  },
  refund: {
    getMethodText: getRefundMethodText
  },
  inspection: {
    getResultText: getInspectionResultText,
    getResultColor: getInspectionResultColor
  },
  date: {
    format: formatDate,
    relative: getRelativeTime,
    daysSince: getDaysSince
  },
  price: {
    format: formatPrice,
    formatWithCurrency: formatPriceWithCurrency
  },
  request: {
    getTypeText: getRequestTypeText,
    getTotalAmount: getRequestTotalAmount,
    getItemCount: getRequestItemCount,
    canBeCancelled: canRequestBeCancelled,
    getProcessingTime: getProcessingTime
  },
  validation: {
    isValidPhoneNumber,
    isValidEmail,
    isValidPostalCode
  },
  image: {
    getUrl: getImageUrl,
    isImageFile,
    getFileSize: getImageFileSize
  },
  tracking: {
    format: formatTrackingNumber,
    getUrl: getTrackingUrl
  }
}