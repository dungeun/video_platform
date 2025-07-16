import type {
  ReturnExchangeService as IReturnExchangeService,
  ReturnRequest,
  ExchangeRequest,
  CreateReturnRequestData,
  CreateExchangeRequestData,
  RequestStatus,
  InspectionData,
  RefundStatus,
  ReturnExchangePolicy,
  EligibilityResult,
  RequestItem,
  ExchangeItem,
  ShippingFee
} from '../types'

export class ReturnExchangeService implements IReturnExchangeService {
  private requests: Map<string, ReturnRequest | ExchangeRequest> = new Map()
  private policy: ReturnExchangePolicy = {
    allowedDays: 7,
    freeReturnReasons: ['defective', 'wrong-product', 'not-as-described'],
    nonReturnableCategories: ['food', 'cosmetics-opened'],
    requiresPhoto: true,
    autoApprovalReasons: ['defective', 'wrong-product']
  }

  // Mock data for development
  constructor() {
    // Add some mock data
    const mockReturnRequest: ReturnRequest = {
      id: 'ret-001',
      requestNumber: 'RET-20240101-001',
      type: 'return',
      orderId: 'order-001',
      userId: 'user-001',
      reason: 'defective',
      reasonDetail: '제품에 스크래치가 있습니다',
      status: 'approved',
      items: [
        {
          orderItemId: 'item-001',
          productId: 'prod-001',
          productName: '무선 이어폰',
          quantity: 1,
          price: 59000,
          reason: 'defective',
          reasonDetail: '왼쪽 이어폰 소리가 나지 않습니다'
        }
      ],
      images: ['/images/return-001-1.jpg'],
      refundAmount: 59000,
      refundMethod: 'original',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02')
    }

    this.requests.set(mockReturnRequest.id, mockReturnRequest)
  }

  async createReturnRequest(data: CreateReturnRequestData): Promise<ReturnRequest> {
    // Validate request
    const validation = await this.validateReturnRequest(data)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    const requestId = this.generateRequestId('return')
    const requestNumber = this.generateRequestNumber('RET')
    
    // Calculate refund amount
    const refundAmount = await this.calculateRefundAmount(data.orderId, data.items)
    
    // Determine shipping fee
    const shippingFee = this.calculateShippingFee(data.items[0].reason)
    
    const returnRequest: ReturnRequest = {
      id: requestId,
      requestNumber,
      type: 'return',
      orderId: data.orderId,
      userId: 'current-user-id', // In real app, get from auth context
      reason: data.items[0].reason, // Use first item's reason as primary
      reasonDetail: data.items[0].reasonDetail,
      status: this.getInitialStatus(data.items[0].reason),
      items: await this.buildRequestItems(data.orderId, data.items),
      images: data.images,
      refundAmount,
      refundMethod: data.refundMethod,
      refundAccount: data.refundAccount,
      shippingFee,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.requests.set(requestId, returnRequest)
    
    // Auto-approve if applicable
    if (this.policy.autoApprovalReasons.includes(data.items[0].reason)) {
      await this.approveRequest(requestId)
    }

    return returnRequest
  }

  async createExchangeRequest(data: CreateExchangeRequestData): Promise<ExchangeRequest> {
    // Validate request
    const validation = await this.validateExchangeRequest(data)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    const requestId = this.generateRequestId('exchange')
    const requestNumber = this.generateRequestNumber('EXC')
    
    // Calculate additional payment
    const additionalPayment = await this.calculateAdditionalPayment(data.items)
    
    // Build exchange items
    const exchangeItems = await this.buildExchangeItems(data.items)
    
    // Determine shipping fee
    const shippingFee = this.calculateShippingFee(data.items[0].reason)
    
    const exchangeRequest: ExchangeRequest = {
      id: requestId,
      requestNumber,
      type: 'exchange',
      orderId: data.orderId,
      userId: 'current-user-id', // In real app, get from auth context
      reason: data.items[0].reason,
      reasonDetail: data.items[0].reasonDetail,
      status: this.getInitialStatus(data.items[0].reason),
      items: await this.buildRequestItems(data.orderId, data.items),
      exchangeItems,
      additionalPayment,
      newShippingAddress: data.shippingAddress,
      shippingFee,
      images: data.images,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.requests.set(requestId, exchangeRequest)
    
    // Auto-approve if applicable
    if (this.policy.autoApprovalReasons.includes(data.items[0].reason)) {
      await this.approveRequest(requestId)
    }

    return exchangeRequest
  }

  async getRequest(requestId: string): Promise<ReturnRequest | ExchangeRequest> {
    const request = this.requests.get(requestId)
    if (!request) {
      throw new Error(`Request not found: ${requestId}`)
    }
    return request
  }

  async getRequestsByUser(userId: string): Promise<(ReturnRequest | ExchangeRequest)[]> {
    return Array.from(this.requests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async getRequestsByOrder(orderId: string): Promise<(ReturnRequest | ExchangeRequest)[]> {
    return Array.from(this.requests.values())
      .filter(request => request.orderId === orderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async updateRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
    const request = await this.getRequest(requestId)
    request.status = status
    request.updatedAt = new Date()
    
    // Trigger side effects based on status
    switch (status) {
      case 'approved':
        // Send notification, initiate collection
        break
      case 'completed':
        if (request.type === 'return') {
          // Process refund
          await this.processRefund(requestId)
        }
        break
    }
  }

  async approveRequest(requestId: string): Promise<void> {
    await this.updateRequestStatus(requestId, 'approved')
    // Additional approval logic
  }

  async rejectRequest(requestId: string, reason: string): Promise<void> {
    const request = await this.getRequest(requestId)
    request.status = 'rejected'
    request.reasonDetail = reason
    request.updatedAt = new Date()
  }

  async submitInspection(requestId: string, data: InspectionData): Promise<void> {
    const request = await this.getRequest(requestId)
    request.inspection = data
    
    // Update status based on inspection result
    if (data.result === 'pass') {
      await this.updateRequestStatus(requestId, 'processing')
    } else if (data.result === 'fail') {
      await this.updateRequestStatus(requestId, 'rejected')
    }
  }

  async processRefund(returnId: string): Promise<RefundStatus> {
    const request = await this.getRequest(returnId)
    if (request.type !== 'return') {
      throw new Error('Not a return request')
    }

    const refundStatus: RefundStatus = {
      status: 'processing',
      amount: request.refundAmount,
      processedAt: new Date()
    }

    // Simulate refund processing
    setTimeout(() => {
      refundStatus.status = 'completed'
      refundStatus.transactionId = `TXN-${Date.now()}`
      request.refundStatus = refundStatus
    }, 2000)

    request.refundStatus = refundStatus
    return refundStatus
  }

  async getPolicy(): Promise<ReturnExchangePolicy> {
    return this.policy
  }

  async checkEligibility(orderId: string, items: string[]): Promise<EligibilityResult> {
    // Mock implementation
    const eligibleItems: string[] = []
    const ineligibleItems: { itemId: string; reason: string }[] = []
    
    // Check each item
    for (const itemId of items) {
      // Check if within allowed days
      const daysSinceDelivery = 5 // Mock value
      if (daysSinceDelivery > this.policy.allowedDays) {
        ineligibleItems.push({
          itemId,
          reason: `반품 가능 기간(${this.policy.allowedDays}일)이 지났습니다`
        })
      } else {
        eligibleItems.push(itemId)
      }
    }

    return {
      eligible: eligibleItems.length > 0,
      reasons: ineligibleItems.map(item => item.reason),
      eligibleItems,
      ineligibleItems
    }
  }

  // Private helper methods
  private async validateReturnRequest(data: CreateReturnRequestData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    
    if (!data.orderId) errors.push('주문 ID가 필요합니다')
    if (!data.items || data.items.length === 0) errors.push('반품할 상품을 선택해주세요')
    if (!data.refundMethod) errors.push('환불 방법을 선택해주세요')
    
    if (data.refundMethod === 'account' && !data.refundAccount) {
      errors.push('계좌 정보를 입력해주세요')
    }
    
    if (this.policy.requiresPhoto && (!data.images || data.images.length === 0)) {
      errors.push('상품 사진을 첨부해주세요')
    }

    return { valid: errors.length === 0, errors }
  }

  private async validateExchangeRequest(data: CreateExchangeRequestData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    
    if (!data.orderId) errors.push('주문 ID가 필요합니다')
    if (!data.items || data.items.length === 0) errors.push('교환할 상품을 선택해주세요')
    
    for (const item of data.items) {
      if (!item.newProductId) {
        errors.push('교환할 새 상품을 선택해주세요')
      }
    }
    
    if (this.policy.requiresPhoto && (!data.images || data.images.length === 0)) {
      errors.push('상품 사진을 첨부해주세요')
    }

    return { valid: errors.length === 0, errors }
  }

  private generateRequestId(type: 'return' | 'exchange'): string {
    const prefix = type === 'return' ? 'ret' : 'exc'
    return `${prefix}-${Date.now()}`
  }

  private generateRequestNumber(prefix: string): string {
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${dateStr}-${seq}`
  }

  private async calculateRefundAmount(orderId: string, items: any[]): Promise<number> {
    // Mock calculation
    return items.reduce((total, item) => total + (item.price || 50000) * item.quantity, 0)
  }

  private async calculateAdditionalPayment(items: any[]): Promise<number> {
    // Mock calculation - price difference between old and new items
    return items.reduce((total, item) => {
      const priceDiff = Math.random() * 20000 - 10000 // Random between -10000 and 10000
      return total + priceDiff
    }, 0)
  }

  private calculateShippingFee(reason: string): ShippingFee {
    const isFreeReturn = this.policy.freeReturnReasons.includes(reason as any)
    return {
      returnFee: isFreeReturn ? 0 : 3000,
      returnPayer: isFreeReturn ? 'company' : 'customer',
      exchangeFee: isFreeReturn ? 0 : 3000,
      exchangePayer: isFreeReturn ? 'company' : 'customer'
    }
  }

  private getInitialStatus(reason: string): RequestStatus {
    return this.policy.autoApprovalReasons.includes(reason as any) ? 'approved' : 'pending'
  }

  private async buildRequestItems(orderId: string, items: any[]): Promise<RequestItem[]> {
    // Mock implementation - in real app, fetch from order service
    return items.map(item => ({
      orderItemId: item.orderItemId,
      productId: item.productId || 'prod-001',
      productName: item.productName || 'Sample Product',
      variantId: item.variantId,
      variantName: item.variantName,
      quantity: item.quantity,
      price: item.price || 50000,
      reason: item.reason,
      reasonDetail: item.reasonDetail
    }))
  }

  private async buildExchangeItems(items: any[]): Promise<ExchangeItem[]> {
    return items.map(item => ({
      originalItemId: item.orderItemId,
      newProductId: item.newProductId,
      newVariantId: item.newVariantId,
      quantity: item.quantity,
      priceDifference: Math.random() * 20000 - 10000 // Mock price difference
    }))
  }
}

// Export singleton instance
export const returnExchangeService = new ReturnExchangeService()