import { Result } from '@repo/core'
import { HttpClient } from '@repo/api-client'
import CryptoJS from 'crypto-js'
import {
  PaymentService,
  PaymentRequest,
  Payment,
  ConfirmRequest,
  CancelRequest,
  BillingKey,
  BillingPaymentRequest,
  TossPaymentsConfig,
  WebhookEvent
} from '../types'

export class TossPaymentService implements PaymentService {
  private httpClient: HttpClient
  private config: TossPaymentsConfig

  constructor(config: TossPaymentsConfig) {
    this.config = config
    this.httpClient = new HttpClient({
      baseURL: config.baseUrl || 'https://api.tosspayments.com',
      timeout: 30000,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * 결제 요청 (결제창 호출용 데이터 생성)
   */
  async requestPayment(request: PaymentRequest): Promise<Result<Payment>> {
    try {
      // 결제 요청은 클라이언트에서 토스페이먼츠 SDK로 처리
      // 여기서는 주문 정보 검증 및 준비만 수행
      const validationResult = this.validatePaymentRequest(request)
      if (!validationResult.success) {
        return { success: false, error: validationResult.error }
      }

      // 결제 대기 상태의 Payment 객체 생성
      const payment: Payment = {
        paymentKey: '', // 실제 결제 시 생성됨
        type: request.paymentMethod || 'CARD',
        orderId: request.orderId,
        orderName: request.orderName,
        mId: '', // 머천트 ID
        currency: 'KRW',
        method: request.paymentMethod || 'CARD',
        totalAmount: request.amount,
        balanceAmount: request.amount,
        status: 'READY',
        requestedAt: new Date().toISOString(),
        useEscrow: request.escrow || false,
        suppliedAmount: Math.floor(request.amount / 1.1),
        vat: request.amount - Math.floor(request.amount / 1.1),
        isPartialCancelable: true
      }

      return { success: true, data: payment }
    } catch (error) {
      return { success: false, error: new Error(`결제 요청 준비 실패: ${error}`) }
    }
  }

  /**
   * 결제 승인 (결제창에서 결제 완료 후 호출)
   */
  async confirmPayment(confirm: ConfirmRequest): Promise<Result<Payment>> {
    try {
      const response = await this.httpClient.post<Payment>('/v1/payments/confirm', {
        paymentKey: confirm.paymentKey,
        orderId: confirm.orderId,
        amount: confirm.amount
      })

      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: new Error(`결제 승인 오류: ${error}`) }
    }
  }

  /**
   * 결제 조회
   */
  async getPayment(paymentKey: string): Promise<Result<Payment>> {
    try {
      const response = await this.httpClient.get<Payment>(`/v1/payments/${paymentKey}`)
      
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: new Error(`결제 조회 오류: ${error}`) }
    }
  }

  /**
   * 주문 ID로 결제 조회
   */
  async getPaymentByOrderId(orderId: string): Promise<Result<Payment>> {
    try {
      const response = await this.httpClient.get<Payment>(`/v1/payments/orders/${orderId}`)
      
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: new Error(`주문 조회 오류: ${error}`) }
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment(cancel: CancelRequest): Promise<Result<Payment>> {
    try {
      const requestBody: any = {
        cancelReason: cancel.cancelReason
      }

      if (cancel.cancelAmount) {
        requestBody.cancelAmount = cancel.cancelAmount
      }

      if (cancel.refundReceiveAccount) {
        requestBody.refundReceiveAccount = cancel.refundReceiveAccount
      }

      if (cancel.taxFreeAmount) {
        requestBody.taxFreeAmount = cancel.taxFreeAmount
      }

      if (cancel.taxExemptionAmount) {
        requestBody.taxExemptionAmount = cancel.taxExemptionAmount
      }

      const response = await this.httpClient.post<Payment>(
        `/v1/payments/${cancel.paymentKey}/cancel`,
        requestBody
      )

      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: new Error(`결제 취소 오류: ${error}`) }
    }
  }

  /**
   * 빌링키 발급 (자동결제용)
   */
  async issueBillingKey(customerKey: string, authKey: string): Promise<Result<BillingKey>> {
    try {
      const response = await this.httpClient.post<BillingKey>('/v1/billing/authorizations/issue', {
        customerKey,
        authKey
      })

      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: new Error(`빌링키 발급 오류: ${error}`) }
    }
  }

  /**
   * 자동결제 (빌링키 사용)
   */
  async requestBillingPayment(billing: BillingPaymentRequest): Promise<Result<Payment>> {
    try {
      const response = await this.httpClient.post<Payment>(
        `/v1/billing/${billing.billingKey}`,
        {
          amount: billing.amount,
          orderId: billing.orderId,
          orderName: billing.orderName,
          customerEmail: billing.customerEmail,
          customerName: billing.customerName,
          taxFreeAmount: billing.taxFreeAmount
        }
      )

      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: new Error(`자동결제 오류: ${error}`) }
    }
  }

  /**
   * 빌링키 조회
   */
  async getBillingKey(billingKey: string): Promise<Result<BillingKey>> {
    try {
      const response = await this.httpClient.get<BillingKey>(`/v1/billing/authorizations/${billingKey}`)
      
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: new Error(`빌링키 조회 오류: ${error}`) }
    }
  }

  /**
   * 빌링키 삭제
   */
  async deleteBillingKey(billingKey: string): Promise<Result<void>> {
    try {
      const response = await this.httpClient.delete(`/v1/billing/authorizations/${billingKey}`)
      
      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: new Error(`빌링키 삭제 오류: ${error}`) }
    }
  }

  /**
   * 웹훅 검증
   */
  verifyWebhook(signature: string, body: string): boolean {
    if (!this.config.webhook?.secret) {
      return false
    }

    const expectedSignature = CryptoJS.HmacSHA256(body, this.config.webhook.secret).toString()
    return signature === expectedSignature
  }

  /**
   * 웹훅 이벤트 처리
   */
  async processWebhook(signature: string, body: string): Promise<Result<WebhookEvent>> {
    try {
      if (!this.verifyWebhook(signature, body)) {
        return { success: false, error: new Error('웹훅 서명 검증 실패') }
      }

      const event: WebhookEvent = JSON.parse(body)
      
      // 이벤트 타입별 처리
      switch (event.eventType) {
        case 'PAYMENT_STATUS_CHANGED':
          // 결제 상태 변경 처리
          break
        default:
          return { success: false, error: new Error(`지원하지 않는 이벤트 타입: ${event.eventType}`) }
      }

      return { success: true, data: event }
    } catch (error) {
      return { success: false, error: new Error(`웹훅 처리 오류: ${error}`) }
    }
  }

  /**
   * 결제 요청 검증
   */
  private validatePaymentRequest(request: PaymentRequest): Result<void> {
    if (!request.amount || request.amount <= 0) {
      return { success: false, error: new Error('결제 금액이 유효하지 않습니다') }
    }

    if (!request.orderId) {
      return { success: false, error: new Error('주문 ID가 필요합니다') }
    }

    if (!request.orderName) {
      return { success: false, error: new Error('주문명이 필요합니다') }
    }

    if (!request.successUrl) {
      return { success: false, error: new Error('성공 URL이 필요합니다') }
    }

    if (!request.failUrl) {
      return { success: false, error: new Error('실패 URL이 필요합니다') }
    }

    // 최소/최대 결제 금액 검증
    if (request.amount < 100) {
      return { success: false, error: new Error('최소 결제 금액은 100원입니다') }
    }

    if (request.amount > 10000000) {
      return { success: false, error: new Error('최대 결제 금액은 10,000,000원입니다') }
    }

    return { success: true, data: undefined }
  }

  /**
   * 결제 상태 확인
   */
  async checkPaymentStatus(paymentKey: string): Promise<Result<boolean>> {
    const paymentResult = await this.getPayment(paymentKey)
    if (!paymentResult.success) {
      return { success: false, error: paymentResult.error || new Error('결제 조회 실패') }
    }

    const isCompleted = paymentResult.data!.status === 'DONE'
    return { success: true, data: isCompleted }
  }

  /**
   * 부분 취소 가능 금액 조회
   */
  async getCancellableAmount(paymentKey: string): Promise<Result<number>> {
    const paymentResult = await this.getPayment(paymentKey)
    if (!paymentResult.success) {
      return { success: false, error: paymentResult.error || new Error('결제 조회 실패') }
    }

    return { success: true, data: paymentResult.data!.balanceAmount }
  }
}