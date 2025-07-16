import React, { useEffect, useRef } from 'react'
import { PaymentWidgetProps, Payment, PaymentFailure } from '../types'

declare global {
  interface Window {
    TossPayments: any
  }
}

export const PaymentWidget: React.FC<PaymentWidgetProps> = ({
  amount,
  orderId,
  orderName,
  onSuccess,
  onFail,
  customerEmail,
  customerName,
  paymentMethods = ['CARD', 'VIRTUAL_ACCOUNT', 'TRANSFER'],
  theme = 'light'
}) => {
  const paymentWidgetRef = useRef<HTMLDivElement>(null)
  const tossPayments = useRef<any>(null)

  useEffect(() => {
    const loadTossPayments = async () => {
      // 토스페이먼츠 SDK 로드
      if (!window.TossPayments) {
        const script = document.createElement('script')
        script.src = 'https://js.tosspayments.com/v1/payment-widget'
        script.async = true
        document.head.appendChild(script)
        
        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      // 클라이언트 키는 환경변수에서 가져와야 함
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) {
        console.error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.')
        return
      }

      tossPayments.current = window.TossPayments(clientKey)
      
      // 결제 위젯 렌더링
      const paymentWidget = tossPayments.current.payment({
        amount: amount,
        currency: 'KRW',
        orderId: orderId,
        orderName: orderName,
        customerEmail: customerEmail,
        customerName: customerName,
        theme: theme
      })

      if (paymentWidgetRef.current) {
        // 결제 방법 렌더링
        paymentMethods.forEach((method, index) => {
          const methodElement = document.createElement('div')
          methodElement.id = `payment-method-${method.toLowerCase()}`
          paymentWidgetRef.current?.appendChild(methodElement)
          
          paymentWidget.renderPaymentMethods(
            `#payment-method-${method.toLowerCase()}`,
            { variantKey: method }
          )
        })

        // 약관 동의 렌더링
        const agreementElement = document.createElement('div')
        agreementElement.id = 'agreement'
        paymentWidgetRef.current?.appendChild(agreementElement)
        paymentWidget.renderAgreement('#agreement')
      }
    }

    loadTossPayments()
  }, [amount, orderId, orderName, customerEmail, customerName, paymentMethods, theme])

  const handlePayment = async () => {
    if (!tossPayments.current) {
      onFail({ code: 'SDK_NOT_LOADED', message: '토스페이먼츠 SDK가 로드되지 않았습니다.' })
      return
    }

    try {
      const payment = tossPayments.current.payment({
        amount: amount,
        currency: 'KRW',
        orderId: orderId,
        orderName: orderName,
        customerEmail: customerEmail,
        customerName: customerName
      })

      // 결제 요청
      await payment.requestPayment({
        method: 'CARD', // 또는 다른 결제 방법
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        flowMode: 'DEFAULT', // 'DIRECT' for 바로결제
        easyPay: 'KAKAOPAY' // 간편결제 옵션
      })
    } catch (error: any) {
      onFail({
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || '결제 중 오류가 발생했습니다.'
      })
    }
  }

  return (
    <div className="payment-widget">
      <div ref={paymentWidgetRef} className="payment-methods-container">
        {/* 토스페이먼츠 위젯이 여기에 렌더링됩니다 */}
      </div>
      
      <div className="payment-info">
        <div className="order-summary">
          <h3>주문 정보</h3>
          <p>상품명: {orderName}</p>
          <p>결제금액: {amount.toLocaleString()}원</p>
          <p>주문번호: {orderId}</p>
        </div>
        
        <button 
          className="payment-button"
          onClick={handlePayment}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#3065AC',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          {amount.toLocaleString()}원 결제하기
        </button>
      </div>
    </div>
  )
}

export default PaymentWidget