import { type Result } from '@repo/core'
import { TossPaymentService } from '../services/TossPaymentService'
import { WebhookEvent, Payment } from '../types'

export interface WebhookHandlerConfig {
  onPaymentCompleted?: (payment: Payment) => Promise<void>
  onPaymentCanceled?: (payment: Payment) => Promise<void>
  onPaymentFailed?: (payment: Payment) => Promise<void>
  onVirtualAccountIssued?: (payment: Payment) => Promise<void>
  onVirtualAccountDeposited?: (payment: Payment) => Promise<void>
}

export class WebhookHandler {
  private paymentService: TossPaymentService
  private config: WebhookHandlerConfig

  constructor(paymentService: TossPaymentService, config: WebhookHandlerConfig = {}) {
    this.paymentService = paymentService
    this.config = config
  }

  /**
   * 웹훅 이벤트 처리
   */
  async handleWebhook(signature: string, body: string): Promise<Result<void>> {
    try {
      // 웹훅 검증 및 이벤트 파싱
      const eventResult = await this.paymentService.processWebhook(signature, body)
      if (!eventResult.success) {
        return { success: false, error: eventResult.error || new Error('웹훅 처리 실패') }
      }

      const event = eventResult.data!
      
      // 이벤트 타입별 처리
      switch (event.eventType) {
        case 'PAYMENT_STATUS_CHANGED':
          return await this.handlePaymentStatusChanged(event.data)
        default:
          return { success: false, error: new Error(`처리할 수 없는 이벤트 타입: ${event.eventType}`) }
      }
    } catch (error) {
      return { success: false, error: new Error(`웹훅 처리 중 오류: ${error}`) }
    }
  }

  /**
   * 결제 상태 변경 이벤트 처리
   */
  private async handlePaymentStatusChanged(payment: Payment): Promise<Result<void>> {
    try {
      switch (payment.status) {
        case 'DONE':
          await this.handlePaymentCompleted(payment)
          break
          
        case 'CANCELED':
        case 'PARTIAL_CANCELED':
          await this.handlePaymentCanceled(payment)
          break
          
        case 'ABORTED':
        case 'EXPIRED':
          await this.handlePaymentFailed(payment)
          break
          
        case 'WAITING_FOR_DEPOSIT':
          if (payment.virtualAccount) {
            await this.handleVirtualAccountIssued(payment)
          }
          break
          
        default:
          console.log(`처리하지 않는 결제 상태: ${payment.status}`)
      }

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: new Error(`결제 상태 변경 처리 중 오류: ${error}`) }
    }
  }

  /**
   * 결제 완료 처리
   */
  private async handlePaymentCompleted(payment: Payment): Promise<void> {
    console.log(`결제 완료: ${payment.orderId}, 금액: ${payment.totalAmount}원`)
    
    if (this.config.onPaymentCompleted) {
      await this.config.onPaymentCompleted(payment)
    }

    // 기본 처리 로직
    await this.updateOrderStatus(payment.orderId, 'PAID')
    await this.sendPaymentConfirmationEmail(payment)
    await this.updateInventory(payment)
  }

  /**
   * 결제 취소 처리
   */
  private async handlePaymentCanceled(payment: Payment): Promise<void> {
    console.log(`결제 취소: ${payment.orderId}`)
    
    if (this.config.onPaymentCanceled) {
      await this.config.onPaymentCanceled(payment)
    }

    // 기본 처리 로직
    await this.updateOrderStatus(payment.orderId, 'CANCELED')
    await this.restoreInventory(payment)
    await this.sendCancellationNotification(payment)
  }

  /**
   * 결제 실패 처리
   */
  private async handlePaymentFailed(payment: Payment): Promise<void> {
    console.log(`결제 실패: ${payment.orderId}`)
    
    if (this.config.onPaymentFailed) {
      await this.config.onPaymentFailed(payment)
    }

    // 기본 처리 로직
    await this.updateOrderStatus(payment.orderId, 'FAILED')
    await this.restoreInventory(payment)
  }

  /**
   * 가상계좌 발급 처리
   */
  private async handleVirtualAccountIssued(payment: Payment): Promise<void> {
    console.log(`가상계좌 발급: ${payment.orderId}`)
    
    if (this.config.onVirtualAccountIssued) {
      await this.config.onVirtualAccountIssued(payment)
    }

    // 기본 처리 로직
    await this.updateOrderStatus(payment.orderId, 'WAITING_FOR_DEPOSIT')
    await this.sendVirtualAccountInfo(payment)
  }

  /**
   * 가상계좌 입금 처리
   */
  private async handleVirtualAccountDeposited(payment: Payment): Promise<void> {
    console.log(`가상계좌 입금 완료: ${payment.orderId}`)
    
    if (this.config.onVirtualAccountDeposited) {
      await this.config.onVirtualAccountDeposited(payment)
    }

    // 결제 완료와 동일한 처리
    await this.handlePaymentCompleted(payment)
  }

  /**
   * 주문 상태 업데이트
   */
  private async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      // 주문 관리 시스템과 연동하여 상태 업데이트
      console.log(`주문 상태 업데이트: ${orderId} -> ${status}`)
      
      // 실제 구현에서는 주문 관리 모듈과 연동
      // await orderService.updateStatus(orderId, status)
    } catch (error) {
      console.error(`주문 상태 업데이트 실패: ${error}`)
    }
  }

  /**
   * 재고 업데이트
   */
  private async updateInventory(payment: Payment): Promise<void> {
    try {
      // 재고 관리 시스템과 연동하여 재고 차감
      console.log(`재고 차감: ${payment.orderId}`)
      
      // 실제 구현에서는 재고 관리 모듈과 연동
      // await inventoryService.decreaseStock(payment.orderId)
    } catch (error) {
      console.error(`재고 업데이트 실패: ${error}`)
    }
  }

  /**
   * 재고 복원
   */
  private async restoreInventory(payment: Payment): Promise<void> {
    try {
      // 취소된 주문의 재고 복원
      console.log(`재고 복원: ${payment.orderId}`)
      
      // 실제 구현에서는 재고 관리 모듈과 연동
      // await inventoryService.restoreStock(payment.orderId)
    } catch (error) {
      console.error(`재고 복원 실패: ${error}`)
    }
  }

  /**
   * 결제 확인 이메일 발송
   */
  private async sendPaymentConfirmationEmail(payment: Payment): Promise<void> {
    try {
      console.log(`결제 확인 이메일 발송: ${payment.orderId}`)
      
      // 알림 모듈과 연동하여 이메일 발송
      // await notificationService.sendEmail({
      //   template: 'payment-confirmation',
      //   data: payment
      // })
    } catch (error) {
      console.error(`이메일 발송 실패: ${error}`)
    }
  }

  /**
   * 취소 알림 발송
   */
  private async sendCancellationNotification(payment: Payment): Promise<void> {
    try {
      console.log(`취소 알림 발송: ${payment.orderId}`)
      
      // 취소 알림 발송 로직
    } catch (error) {
      console.error(`취소 알림 발송 실패: ${error}`)
    }
  }

  /**
   * 가상계좌 정보 발송
   */
  private async sendVirtualAccountInfo(payment: Payment): Promise<void> {
    try {
      if (payment.virtualAccount) {
        console.log(`가상계좌 정보 발송: ${payment.orderId}`)
        console.log(`계좌번호: ${payment.virtualAccount.accountNumber}`)
        console.log(`입금기한: ${payment.virtualAccount.dueDate}`)
        
        // 가상계좌 정보 알림 발송
      }
    } catch (error) {
      console.error(`가상계좌 정보 발송 실패: ${error}`)
    }
  }

  /**
   * Express.js용 미들웨어
   */
  expressMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const signature = req.headers['toss-signature'] || req.headers['x-toss-signature']
        const body = JSON.stringify(req.body)

        const result = await this.handleWebhook(signature, body)
        
        if (result.success) {
          res.status(200).json({ success: true })
        } else {
          console.error('웹훅 처리 실패:', result.error)
          res.status(400).json({ error: result.error })
        }
      } catch (error) {
        console.error('웹훅 미들웨어 오류:', error)
        res.status(500).json({ error: '서버 오류' })
      }
    }
  }

  /**
   * Next.js API 라우트용 핸들러
   */
  nextjsHandler() {
    return async (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }

      try {
        const signature = req.headers['toss-signature'] || req.headers['x-toss-signature']
        const body = JSON.stringify(req.body)

        const result = await this.handleWebhook(signature, body)
        
        if (result.success) {
          res.status(200).json({ success: true })
        } else {
          console.error('웹훅 처리 실패:', result.error)
          res.status(400).json({ error: result.error })
        }
      } catch (error) {
        console.error('웹훅 핸들러 오류:', error)
        res.status(500).json({ error: '서버 오류' })
      }
    }
  }
}