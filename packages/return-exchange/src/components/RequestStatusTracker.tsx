'use client'

import React from 'react'
import type { RequestStatus, ReturnRequest, ExchangeRequest } from '../types'

interface RequestStatusTrackerProps {
  request: ReturnRequest | ExchangeRequest
  className?: string
}

interface StatusStep {
  status: RequestStatus
  label: string
  description: string
  icon: string
}

const RETURN_STEPS: StatusStep[] = [
  {
    status: 'pending',
    label: '신청 접수',
    description: '반품 신청이 접수되었습니다',
    icon: '📝'
  },
  {
    status: 'approved',
    label: '승인 완료',
    description: '반품이 승인되었습니다',
    icon: '✅'
  },
  {
    status: 'collecting',
    label: '상품 수거',
    description: '상품을 수거 중입니다',
    icon: '📦'
  },
  {
    status: 'collected',
    label: '수거 완료',
    description: '상품 수거가 완료되었습니다',
    icon: '🚛'
  },
  {
    status: 'inspecting',
    label: '검수 진행',
    description: '상품을 검수 중입니다',
    icon: '🔍'
  },
  {
    status: 'processing',
    label: '환불 처리',
    description: '환불을 처리 중입니다',
    icon: '💳'
  },
  {
    status: 'completed',
    label: '완료',
    description: '반품이 완료되었습니다',
    icon: '🎉'
  }
]

const EXCHANGE_STEPS: StatusStep[] = [
  {
    status: 'pending',
    label: '신청 접수',
    description: '교환 신청이 접수되었습니다',
    icon: '📝'
  },
  {
    status: 'approved',
    label: '승인 완료',
    description: '교환이 승인되었습니다',
    icon: '✅'
  },
  {
    status: 'collecting',
    label: '상품 수거',
    description: '기존 상품을 수거 중입니다',
    icon: '📦'
  },
  {
    status: 'collected',
    label: '수거 완료',
    description: '상품 수거가 완료되었습니다',
    icon: '🚛'
  },
  {
    status: 'inspecting',
    label: '검수 진행',
    description: '상품을 검수 중입니다',
    icon: '🔍'
  },
  {
    status: 'processing',
    label: '교환 준비',
    description: '새 상품을 준비 중입니다',
    icon: '⚙️'
  },
  {
    status: 'shipping',
    label: '배송 중',
    description: '새 상품을 배송 중입니다',
    icon: '🚚'
  },
  {
    status: 'completed',
    label: '완료',
    description: '교환이 완료되었습니다',
    icon: '🎉'
  }
]

export function RequestStatusTracker({ request, className = '' }: RequestStatusTrackerProps) {
  const steps = request.type === 'return' ? RETURN_STEPS : EXCHANGE_STEPS
  const currentStepIndex = steps.findIndex(step => step.status === request.status)
  const isRejected = request.status === 'rejected'
  const isCancelled = request.status === 'cancelled'

  const getStepStatus = (stepIndex: number) => {
    if (isRejected || isCancelled) {
      return stepIndex === 0 ? 'completed' : 'pending'
    }
    
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'current': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-400 bg-gray-100'
    }
  }

  const getConnectorColor = (stepIndex: number) => {
    const status = getStepStatus(stepIndex)
    return status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
  }

  // Special handling for rejected/cancelled status
  if (isRejected || isCancelled) {
    return (
      <div className={`bg-white rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">
            {isRejected ? '❌' : '⏹️'}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isRejected ? '반품/교환 거절' : '반품/교환 취소'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isRejected 
              ? `사유: ${request.reasonDetail || '검수 기준에 부합하지 않음'}`
              : '요청이 취소되었습니다'
            }
          </p>
          <div className="text-sm text-gray-500">
            처리일: {request.updatedAt.toLocaleDateString()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {request.type === 'return' ? '반품' : '교환'} 진행 상황
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>요청번호: {request.requestNumber}</span>
          <span>•</span>
          <span>신청일: {request.createdAt.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">진행률</span>
          <span className="text-sm font-medium text-blue-600">
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Status Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const isLast = index === steps.length - 1
          
          return (
            <div key={step.status} className="relative">
              <div className="flex items-start">
                {/* Icon */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
                  ${getStatusColor(status)}
                `}>
                  {status === 'completed' ? '✓' : step.icon}
                </div>
                
                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className={`
                    font-medium
                    ${status === 'current' ? 'text-blue-600' : 
                      status === 'completed' ? 'text-green-600' : 'text-gray-400'}
                  `}>
                    {step.label}
                  </div>
                  <div className={`
                    text-sm mt-1
                    ${status === 'current' ? 'text-blue-600' : 
                      status === 'completed' ? 'text-green-600' : 'text-gray-400'}
                  `}>
                    {step.description}
                  </div>
                  
                  {/* Additional info for current step */}
                  {status === 'current' && (
                    <div className="mt-2 text-xs text-gray-500">
                      {step.status === 'shipping' && request.type === 'exchange' && request.newTrackingNumber && (
                        <div>송장번호: {request.newTrackingNumber}</div>
                      )}
                      {step.status === 'inspecting' && request.inspection && (
                        <div>검수자: {request.inspection.inspectorId}</div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Time indicator */}
                <div className="text-xs text-gray-400 ml-4">
                  {status === 'completed' && request.updatedAt.toLocaleDateString()}
                  {status === 'current' && '진행중'}
                </div>
              </div>
              
              {/* Connector line */}
              {!isLast && (
                <div className={`
                  absolute left-5 top-10 w-0.5 h-6 -translate-x-0.5
                  ${getConnectorColor(index)}
                `} />
              )}
            </div>
          )
        })}
      </div>

      {/* Additional Information */}
      {request.type === 'return' && request.refundStatus && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">환불 정보</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>환불 금액: {request.refundAmount.toLocaleString()}원</div>
            <div>환불 방법: {request.refundMethod === 'original' ? '원결제 수단' : 
                            request.refundMethod === 'points' ? '포인트' : '계좌이체'}</div>
            {request.refundStatus.transactionId && (
              <div>거래번호: {request.refundStatus.transactionId}</div>
            )}
            {request.refundStatus.processedAt && (
              <div>처리일: {request.refundStatus.processedAt.toLocaleDateString()}</div>
            )}
          </div>
        </div>
      )}

      {request.type === 'exchange' && request.additionalPayment && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">추가 결제 정보</h4>
          <div className="text-sm text-blue-700">
            {request.additionalPayment > 0 
              ? `추가 결제: ${request.additionalPayment.toLocaleString()}원`
              : `환불 예정: ${Math.abs(request.additionalPayment).toLocaleString()}원`
            }
          </div>
        </div>
      )}

      {/* Inspection Result */}
      {request.inspection && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">검수 결과</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>결과: {
              request.inspection.result === 'pass' ? '통과' :
              request.inspection.result === 'fail' ? '실패' : '부분 통과'
            }</div>
            <div>검수일: {request.inspection.inspectedAt.toLocaleDateString()}</div>
            {request.inspection.notes && (
              <div>검수 메모: {request.inspection.notes}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}