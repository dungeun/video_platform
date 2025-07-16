import { useState, useCallback } from 'react'
import { type Result } from '@repo/core'
import { TossPaymentService } from '../services/TossPaymentService'
import {
  PaymentRequest,
  Payment,
  ConfirmRequest,
  CancelRequest,
  UseTossPaymentReturn
} from '../types'

export function useTossPayment(service: TossPaymentService): UseTossPaymentReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestPayment = useCallback(async (request: PaymentRequest): Promise<Result<Payment>> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await service.requestPayment(request)
      if (!result.success) {
        setError(result.error?.message || '알 수 없는 오류')
      }
      return result
    } catch (err) {
      const errorMessage = `결제 요청 실패: ${err}`
      setError(errorMessage)
      return { success: false, error: new Error(errorMessage) }
    } finally {
      setIsLoading(false)
    }
  }, [service])

  const confirmPayment = useCallback(async (confirm: ConfirmRequest): Promise<Result<Payment>> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await service.confirmPayment(confirm)
      if (!result.success) {
        setError(result.error?.message || '알 수 없는 오류')
      }
      return result
    } catch (err) {
      const errorMessage = `결제 승인 실패: ${err}`
      setError(errorMessage)
      return { success: false, error: new Error(errorMessage) }
    } finally {
      setIsLoading(false)
    }
  }, [service])

  const cancelPayment = useCallback(async (cancel: CancelRequest): Promise<Result<Payment>> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await service.cancelPayment(cancel)
      if (!result.success) {
        setError(result.error?.message || '알 수 없는 오류')
      }
      return result
    } catch (err) {
      const errorMessage = `결제 취소 실패: ${err}`
      setError(errorMessage)
      return { success: false, error: new Error(errorMessage) }
    } finally {
      setIsLoading(false)
    }
  }, [service])

  const getPayment = useCallback(async (paymentKey: string): Promise<Result<Payment>> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await service.getPayment(paymentKey)
      if (!result.success) {
        setError(result.error?.message || '알 수 없는 오류')
      }
      return result
    } catch (err) {
      const errorMessage = `결제 조회 실패: ${err}`
      setError(errorMessage)
      return { success: false, error: new Error(errorMessage) }
    } finally {
      setIsLoading(false)
    }
  }, [service])

  return {
    requestPayment,
    confirmPayment,
    cancelPayment,
    getPayment,
    isLoading,
    error
  }
}