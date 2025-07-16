import type { Order, OrderItem } from '@company/order-processing'
import type { User } from '@company/auth'
import type { Product } from '@company/types'

// 반품/교환 타입
export type RequestType = 'return' | 'exchange'

// 반품/교환 사유
export type RequestReason = 
  | 'defective' // 불량/파손
  | 'wrong-product' // 다른 상품 배송
  | 'change-mind' // 단순 변심
  | 'size-issue' // 사이즈 문제
  | 'color-issue' // 색상 문제
  | 'not-as-described' // 상품 설명과 다름
  | 'other' // 기타

// 반품/교환 상태
export type RequestStatus = 
  | 'pending' // 접수 대기
  | 'approved' // 승인
  | 'rejected' // 거절
  | 'collecting' // 수거중
  | 'collected' // 수거 완료
  | 'inspecting' // 검수중
  | 'processing' // 처리중
  | 'shipping' // 배송중 (교환)
  | 'completed' // 완료
  | 'cancelled' // 취소

// 검수 결과
export type InspectionResult = 
  | 'pass' // 통과
  | 'fail' // 실패
  | 'partial' // 부분 통과

// 환불 방법
export type RefundMethod = 
  | 'original' // 원결제 수단
  | 'points' // 포인트
  | 'account' // 계좌이체

// 반품/교환 요청 기본 정보
export interface BaseRequest {
  id: string
  requestNumber: string
  type: RequestType
  orderId: string
  userId: string
  reason: RequestReason
  reasonDetail?: string
  status: RequestStatus
  items: RequestItem[]
  images?: string[]
  createdAt: Date
  updatedAt: Date
}

// 반품 요청
export interface ReturnRequest extends BaseRequest {
  type: 'return'
  refundAmount: number
  refundMethod: RefundMethod
  refundAccount?: RefundAccount
  shippingFee?: ShippingFee
  inspection?: InspectionData
  refundStatus?: RefundStatus
}

// 교환 요청
export interface ExchangeRequest extends BaseRequest {
  type: 'exchange'
  exchangeItems: ExchangeItem[]
  additionalPayment?: number
  newShippingAddress?: ShippingAddress
  shippingFee?: ShippingFee
  inspection?: InspectionData
  newTrackingNumber?: string
}

// 요청 아이템
export interface RequestItem {
  orderItemId: string
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  quantity: number
  price: number
  reason?: RequestReason
  reasonDetail?: string
}

// 교환 아이템
export interface ExchangeItem {
  originalItemId: string
  newProductId: string
  newVariantId?: string
  quantity: number
  priceDifference: number
}

// 배송비 정보
export interface ShippingFee {
  returnFee: number // 반송 배송비
  returnPayer: 'customer' | 'company' // 반송 배송비 부담자
  exchangeFee?: number // 교환 배송비
  exchangePayer?: 'customer' | 'company' // 교환 배송비 부담자
}

// 환불 계좌 정보
export interface RefundAccount {
  bankCode: string
  accountNumber: string
  accountHolder: string
}

// 배송 주소
export interface ShippingAddress {
  recipientName: string
  recipientPhone: string
  postalCode: string
  address: string
  detailAddress: string
  memo?: string
}

// 검수 데이터
export interface InspectionData {
  inspectorId: string
  inspectedAt: Date
  result: InspectionResult
  notes?: string
  images?: string[]
  defectiveItems?: DefectiveItem[]
}

// 불량 아이템
export interface DefectiveItem {
  itemId: string
  defectType: string
  description: string
  images?: string[]
}

// 환불 상태
export interface RefundStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  amount: number
  processedAt?: Date
  transactionId?: string
  failureReason?: string
}

// 반품/교환 정책
export interface ReturnExchangePolicy {
  allowedDays: number // 가능 기간 (일)
  freeReturnReasons: RequestReason[] // 무료 반품 사유
  nonReturnableCategories: string[] // 반품 불가 카테고리
  requiresPhoto: boolean // 사진 첨부 필수 여부
  autoApprovalReasons: RequestReason[] // 자동 승인 사유
}

// 반품/교환 통계
export interface ReturnExchangeStats {
  totalRequests: number
  returnCount: number
  exchangeCount: number
  approvalRate: number
  averageProcessingDays: number
  topReasons: { reason: RequestReason; count: number }[]
  monthlyTrend: { month: string; returns: number; exchanges: number }[]
}

// 서비스 인터페이스
export interface ReturnExchangeService {
  // 요청 생성
  createReturnRequest(data: CreateReturnRequestData): Promise<ReturnRequest>
  createExchangeRequest(data: CreateExchangeRequestData): Promise<ExchangeRequest>
  
  // 조회
  getRequest(requestId: string): Promise<ReturnRequest | ExchangeRequest>
  getRequestsByUser(userId: string): Promise<(ReturnRequest | ExchangeRequest)[]>
  getRequestsByOrder(orderId: string): Promise<(ReturnRequest | ExchangeRequest)[]>
  
  // 상태 업데이트
  updateRequestStatus(requestId: string, status: RequestStatus): Promise<void>
  approveRequest(requestId: string): Promise<void>
  rejectRequest(requestId: string, reason: string): Promise<void>
  
  // 검수
  submitInspection(requestId: string, data: InspectionData): Promise<void>
  
  // 환불
  processRefund(returnId: string): Promise<RefundStatus>
  
  // 정책
  getPolicy(): Promise<ReturnExchangePolicy>
  checkEligibility(orderId: string, items: string[]): Promise<EligibilityResult>
}

// 생성 데이터
export interface CreateReturnRequestData {
  orderId: string
  items: Array<{
    orderItemId: string
    quantity: number
    reason: RequestReason
    reasonDetail?: string
  }>
  refundMethod: RefundMethod
  refundAccount?: RefundAccount
  images?: string[]
}

export interface CreateExchangeRequestData {
  orderId: string
  items: Array<{
    orderItemId: string
    quantity: number
    reason: RequestReason
    reasonDetail?: string
    newProductId: string
    newVariantId?: string
  }>
  shippingAddress?: ShippingAddress
  images?: string[]
}

// 자격 확인 결과
export interface EligibilityResult {
  eligible: boolean
  reasons: string[]
  eligibleItems: string[]
  ineligibleItems: { itemId: string; reason: string }[]
}