import type {
  ReturnRequest,
  ExchangeRequest,
  RequestStatus,
  InspectionData,
  ReturnExchangeStats,
  ReturnExchangePolicy
} from '../src/types'

// Admin configuration for return-exchange module
export const ReturnExchangeAdminConfig = {
  // Module metadata
  name: 'return-exchange',
  displayName: '반품/교환 관리',
  description: '반품 및 교환 요청을 관리합니다',
  version: '1.0.0',
  
  // Admin pages
  pages: [
    {
      id: 'requests',
      title: '요청 관리',
      path: '/admin/return-exchange/requests',
      icon: '📦',
      description: '반품/교환 요청 목록 조회 및 관리'
    },
    {
      id: 'inspection',
      title: '검수 관리',
      path: '/admin/return-exchange/inspection',
      icon: '🔍',
      description: '상품 검수 관리'
    },
    {
      id: 'refunds',
      title: '환불 관리',
      path: '/admin/return-exchange/refunds',
      icon: '💳',
      description: '환불 처리 및 관리'
    },
    {
      id: 'policy',
      title: '정책 설정',
      path: '/admin/return-exchange/policy',
      icon: '⚙️',
      description: '반품/교환 정책 설정'
    },
    {
      id: 'stats',
      title: '통계 및 분석',
      path: '/admin/return-exchange/stats',
      icon: '📊',
      description: '반품/교환 통계 및 분석'
    }
  ],
  
  // Quick actions
  quickActions: [
    {
      id: 'pending-approval',
      title: '승인 대기',
      icon: '⏳',
      action: 'showPendingRequests',
      badge: true
    },
    {
      id: 'inspection-queue',
      title: '검수 대기',
      icon: '🔍',
      action: 'showInspectionQueue',
      badge: true
    },
    {
      id: 'refund-queue',
      title: '환불 대기',
      icon: '💳',
      action: 'showRefundQueue',
      badge: true
    }
  ],
  
  // Permissions
  permissions: [
    {
      id: 'view_requests',
      name: '요청 조회',
      description: '반품/교환 요청 조회 권한'
    },
    {
      id: 'manage_requests',
      name: '요청 관리',
      description: '반품/교환 요청 승인/거절 권한'
    },
    {
      id: 'manage_inspection',
      name: '검수 관리',
      description: '상품 검수 처리 권한'
    },
    {
      id: 'manage_refunds',
      name: '환불 관리',
      description: '환불 처리 권한'
    },
    {
      id: 'manage_policy',
      name: '정책 관리',
      description: '반품/교환 정책 설정 권한'
    },
    {
      id: 'view_stats',
      name: '통계 조회',
      description: '통계 및 분석 조회 권한'
    }
  ],
  
  // Dashboard widgets
  widgets: [
    {
      id: 'request-summary',
      title: '요청 현황',
      type: 'summary',
      span: 2,
      height: 1
    },
    {
      id: 'pending-actions',
      title: '처리 대기',
      type: 'action-list',
      span: 1,
      height: 1
    },
    {
      id: 'recent-requests',
      title: '최근 요청',
      type: 'table',
      span: 3,
      height: 2
    },
    {
      id: 'monthly-trend',
      title: '월별 추이',
      type: 'chart',
      span: 2,
      height: 1
    }
  ]
}

// Admin service interface
export interface ReturnExchangeAdminService {
  // Request management
  getRequests(filters?: RequestFilters): Promise<(ReturnRequest | ExchangeRequest)[]>
  getRequestById(id: string): Promise<ReturnRequest | ExchangeRequest>
  approveRequest(id: string, adminId: string, notes?: string): Promise<void>
  rejectRequest(id: string, adminId: string, reason: string): Promise<void>
  updateRequestStatus(id: string, status: RequestStatus, adminId: string): Promise<void>
  
  // Inspection management
  getInspectionQueue(): Promise<(ReturnRequest | ExchangeRequest)[]>
  submitInspection(requestId: string, data: InspectionData): Promise<void>
  getInspectionHistory(requestId: string): Promise<InspectionData[]>
  
  // Refund management
  getRefundQueue(): Promise<ReturnRequest[]>
  processRefund(requestId: string, adminId: string): Promise<void>
  getRefundHistory(filters?: RefundFilters): Promise<RefundHistory[]>
  
  // Policy management
  getPolicy(): Promise<ReturnExchangePolicy>
  updatePolicy(policy: Partial<ReturnExchangePolicy>): Promise<void>
  
  // Statistics
  getStats(period?: StatsPeriod): Promise<ReturnExchangeStats>
  exportData(filters?: ExportFilters): Promise<string>
}

// Filter interfaces
export interface RequestFilters {
  status?: RequestStatus[]
  type?: ('return' | 'exchange')[]
  dateFrom?: Date
  dateTo?: Date
  userId?: string
  orderId?: string
  search?: string
  page?: number
  limit?: number
}

export interface RefundFilters {
  status?: ('pending' | 'processing' | 'completed' | 'failed')[]
  dateFrom?: Date
  dateTo?: Date
  amountFrom?: number
  amountTo?: number
  method?: string[]
}

export interface ExportFilters {
  format: 'csv' | 'excel'
  dateFrom: Date
  dateTo: Date
  includeFields?: string[]
}

export type StatsPeriod = 'week' | 'month' | 'quarter' | 'year'

// Additional types for admin
export interface RefundHistory {
  id: string
  requestId: string
  amount: number
  method: string
  status: string
  processedBy: string
  processedAt: Date
  transactionId?: string
}

export interface AdminAction {
  id: string
  type: 'approve' | 'reject' | 'inspect' | 'refund'
  requestId: string
  adminId: string
  timestamp: Date
  notes?: string
}

// Admin utility functions
export const getStatusBadgeColor = (status: RequestStatus): string => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    collecting: 'bg-purple-100 text-purple-800',
    collected: 'bg-purple-100 text-purple-800',
    inspecting: 'bg-orange-100 text-orange-800',
    processing: 'bg-blue-100 text-blue-800',
    shipping: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount)
}

export const getUrgencyLevel = (request: ReturnRequest | ExchangeRequest): 'low' | 'medium' | 'high' => {
  const daysSinceCreated = Math.floor(
    (Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysSinceCreated > 7) return 'high'
  if (daysSinceCreated > 3) return 'medium'
  return 'low'
}

export const getProcessingDeadline = (request: ReturnRequest | ExchangeRequest): Date => {
  const deadline = new Date(request.createdAt)
  deadline.setDate(deadline.getDate() + 7) // 7일 처리 기한
  return deadline
}

// Export admin configuration as default
export default ReturnExchangeAdminConfig