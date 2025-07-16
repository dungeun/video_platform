import type {
  ExchangeRequest as IExchangeRequest,
  RequestItem,
  ExchangeItem,
  ShippingAddress,
  ShippingFee,
  InspectionData,
  RequestReason,
  RequestStatus
} from '../types'

export class ExchangeRequest implements IExchangeRequest {
  id: string
  requestNumber: string
  type: 'exchange' = 'exchange'
  orderId: string
  userId: string
  reason: RequestReason
  reasonDetail?: string
  status: RequestStatus
  items: RequestItem[]
  images?: string[]
  exchangeItems: ExchangeItem[]
  additionalPayment?: number
  newShippingAddress?: ShippingAddress
  shippingFee?: ShippingFee
  inspection?: InspectionData
  newTrackingNumber?: string
  createdAt: Date
  updatedAt: Date

  constructor(data: Partial<IExchangeRequest>) {
    this.id = data.id || ''
    this.requestNumber = data.requestNumber || ''
    this.orderId = data.orderId || ''
    this.userId = data.userId || ''
    this.reason = data.reason || 'other'
    this.reasonDetail = data.reasonDetail
    this.status = data.status || 'pending'
    this.items = data.items || []
    this.images = data.images
    this.exchangeItems = data.exchangeItems || []
    this.additionalPayment = data.additionalPayment
    this.newShippingAddress = data.newShippingAddress
    this.shippingFee = data.shippingFee
    this.inspection = data.inspection
    this.newTrackingNumber = data.newTrackingNumber
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
  }

  // Business logic methods
  getTotalAdditionalPayment(): number {
    let total = this.additionalPayment || 0
    
    // Add exchange shipping fee if customer pays
    if (this.shippingFee?.exchangePayer === 'customer') {
      total += this.shippingFee.exchangeFee || 0
    }
    
    // Add return shipping fee if customer pays
    if (this.shippingFee?.returnPayer === 'customer') {
      total += this.shippingFee.returnFee
    }
    
    return total
  }

  requiresAdditionalPayment(): boolean {
    return this.getTotalAdditionalPayment() > 0
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

  canBeShipped(): boolean {
    return this.status === 'processing' && 
           (!this.inspection || this.inspection.result !== 'fail')
  }

  hasNewShippingAddress(): boolean {
    return !!(this.newShippingAddress && 
              this.newShippingAddress.recipientName &&
              this.newShippingAddress.address)
  }

  getStatusMessage(): string {
    const messages: Record<RequestStatus, string> = {
      pending: '교환 신청이 접수되었습니다',
      approved: '교환이 승인되었습니다',
      rejected: '교환이 거절되었습니다',
      collecting: '상품을 수거 중입니다',
      collected: '상품 수거가 완료되었습니다',
      inspecting: '상품을 검수 중입니다',
      processing: '교환 상품을 준비 중입니다',
      shipping: '교환 상품을 배송 중입니다',
      completed: '교환이 완료되었습니다',
      cancelled: '교환이 취소되었습니다'
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

  getExchangeItemsText(): string {
    return this.exchangeItems
      .map(item => `상품 ID: ${item.newProductId} (수량: ${item.quantity})`)
      .join(', ')
  }

  // Validation methods
  hasRequiredImages(): boolean {
    return !!(this.images && this.images.length > 0)
  }

  hasValidExchangeItems(): boolean {
    return this.exchangeItems.length > 0 && 
           this.exchangeItems.every(item => 
             item.newProductId && item.quantity > 0
           )
  }

  hasValidShippingAddress(): boolean {
    if (!this.newShippingAddress) return true
    
    const addr = this.newShippingAddress
    return !!(
      addr.recipientName &&
      addr.recipientPhone &&
      addr.postalCode &&
      addr.address
    )
  }

  // Price calculation methods
  calculatePriceDifference(): number {
    return this.exchangeItems.reduce(
      (total, item) => total + item.priceDifference,
      0
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

  setTrackingNumber(trackingNumber: string): void {
    this.newTrackingNumber = trackingNumber
    this.updatedAt = new Date()
  }

  updateShippingAddress(address: ShippingAddress): void {
    this.newShippingAddress = address
    this.updatedAt = new Date()
  }

  // Helper methods for UI
  getProgressPercentage(): number {
    const statusOrder: RequestStatus[] = [
      'pending', 'approved', 'collecting', 'collected',
      'inspecting', 'processing', 'shipping', 'completed'
    ]
    
    const currentIndex = statusOrder.indexOf(this.status)
    if (currentIndex === -1) return 0
    
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100)
  }

  getNextStep(): string {
    const nextSteps: Record<RequestStatus, string> = {
      pending: '승인 대기 중',
      approved: '상품 수거 예정',
      collecting: '수거 완료 대기',
      collected: '검수 시작 예정',
      inspecting: '검수 완료 대기',
      processing: '교환 상품 배송 준비',
      shipping: '배송 완료 대기',
      completed: '교환 완료',
      rejected: '교환 거절됨',
      cancelled: '교환 취소됨'
    }
    
    return nextSteps[this.status] || '상태 확인 중'
  }

  // Serialization
  toJSON(): IExchangeRequest {
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
      exchangeItems: this.exchangeItems,
      additionalPayment: this.additionalPayment,
      newShippingAddress: this.newShippingAddress,
      shippingFee: this.shippingFee,
      inspection: this.inspection,
      newTrackingNumber: this.newTrackingNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}