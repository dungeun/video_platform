import type {
  ReturnRequest as IReturnRequest,
  RequestItem,
  RefundMethod,
  RefundAccount,
  ShippingFee,
  InspectionData,
  RefundStatus,
  RequestReason,
  RequestStatus
} from '../types'

export class ReturnRequest implements IReturnRequest {
  id: string
  requestNumber: string
  type: 'return' = 'return'
  orderId: string
  userId: string
  reason: RequestReason
  reasonDetail?: string
  status: RequestStatus
  items: RequestItem[]
  images?: string[]
  refundAmount: number
  refundMethod: RefundMethod
  refundAccount?: RefundAccount
  shippingFee?: ShippingFee
  inspection?: InspectionData
  refundStatus?: RefundStatus
  createdAt: Date
  updatedAt: Date

  constructor(data: Partial<IReturnRequest>) {
    this.id = data.id || ''
    this.requestNumber = data.requestNumber || ''
    this.orderId = data.orderId || ''
    this.userId = data.userId || ''
    this.reason = data.reason || 'other'
    this.reasonDetail = data.reasonDetail
    this.status = data.status || 'pending'
    this.items = data.items || []
    this.images = data.images
    this.refundAmount = data.refundAmount || 0
    this.refundMethod = data.refundMethod || 'original'
    this.refundAccount = data.refundAccount
    this.shippingFee = data.shippingFee
    this.inspection = data.inspection
    this.refundStatus = data.refundStatus
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
  }

  // Business logic methods
  getTotalRefundAmount(): number {
    let total = this.refundAmount
    
    // Subtract return shipping fee if customer pays
    if (this.shippingFee?.returnPayer === 'customer') {
      total -= this.shippingFee.returnFee
    }
    
    return Math.max(0, total)
  }

  canBeApproved(): boolean {
    return this.status === 'pending'
  }

  canBeCancelled(): boolean {
    return ['pending', 'approved'].includes(this.status)
  }

  canBeInspected(): boolean {
    return this.status === 'collected'
  }

  isRefundable(): boolean {
    return this.status === 'processing' && 
           (!this.inspection || this.inspection.result !== 'fail')
  }

  getStatusMessage(): string {
    const messages: Record<RequestStatus, string> = {
      pending: '반품 신청이 접수되었습니다',
      approved: '반품이 승인되었습니다',
      rejected: '반품이 거절되었습니다',
      collecting: '상품을 수거 중입니다',
      collected: '상품 수거가 완료되었습니다',
      inspecting: '상품을 검수 중입니다',
      processing: '환불을 처리 중입니다',
      shipping: '교환 상품을 배송 중입니다',
      completed: '반품이 완료되었습니다',
      cancelled: '반품이 취소되었습니다'
    }
    
    return messages[this.status] || '상태 확인 중'
  }

  getReasonText(): string {
    const reasons: Record<RequestReason, string> = {
      defective: '불량/파손',
      'wrong-product': '다른 상품 배송',
      'change-mind': '단순 변심',
      'size-issue': '사이즈 문제',
      'color-issue': '색상 문제',
      'not-as-described': '상품 설명과 다름',
      other: '기타'
    }
    
    return reasons[this.reason] || '기타'
  }

  getRefundMethodText(): string {
    const methods: Record<RefundMethod, string> = {
      original: '원결제 수단',
      points: '포인트',
      account: '계좌이체'
    }
    
    return methods[this.refundMethod] || '원결제 수단'
  }

  // Validation methods
  hasRequiredImages(): boolean {
    return !!(this.images && this.images.length > 0)
  }

  hasValidRefundAccount(): boolean {
    if (this.refundMethod !== 'account') return true
    
    return !!(
      this.refundAccount &&
      this.refundAccount.bankCode &&
      this.refundAccount.accountNumber &&
      this.refundAccount.accountHolder
    )
  }

  // Update methods
  updateStatus(status: RequestStatus): void {
    this.status = status
    this.updatedAt = new Date()
  }

  setInspectionResult(inspection: InspectionData): void {
    this.inspection = inspection
    this.updatedAt = new Date()
  }

  setRefundStatus(refundStatus: RefundStatus): void {
    this.refundStatus = refundStatus
    this.updatedAt = new Date()
  }

  // Serialization
  toJSON(): IReturnRequest {
    return {
      id: this.id,
      requestNumber: this.requestNumber,
      type: this.type,
      orderId: this.orderId,
      userId: this.userId,
      reason: this.reason,
      reasonDetail: this.reasonDetail,
      status: this.status,
      items: this.items,
      images: this.images,
      refundAmount: this.refundAmount,
      refundMethod: this.refundMethod,
      refundAccount: this.refundAccount,
      shippingFee: this.shippingFee,
      inspection: this.inspection,
      refundStatus: this.refundStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}