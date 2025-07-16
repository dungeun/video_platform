import { useState, useEffect, useCallback } from 'react'
import type {
  ReturnRequest,
  ExchangeRequest,
  CreateReturnRequestData,
  CreateExchangeRequestData,
  RequestStatus,
  EligibilityResult,
  ReturnExchangePolicy
} from '../types'
import { returnExchangeService } from '../services/ReturnExchangeService'

interface UseReturnExchangeOptions {
  userId?: string
  orderId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseReturnExchangeResult {
  // Data
  requests: (ReturnRequest | ExchangeRequest)[]
  currentRequest: ReturnRequest | ExchangeRequest | null
  policy: ReturnExchangePolicy | null
  eligibility: EligibilityResult | null
  
  // Loading states
  loading: boolean
  creating: boolean
  updating: boolean
  
  // Error states
  error: string | null
  
  // Actions
  createReturnRequest: (data: CreateReturnRequestData) => Promise<ReturnRequest>
  createExchangeRequest: (data: CreateExchangeRequestData) => Promise<ExchangeRequest>
  getRequest: (requestId: string) => Promise<void>
  updateRequestStatus: (requestId: string, status: RequestStatus) => Promise<void>
  checkEligibility: (orderId: string, items: string[]) => Promise<void>
  refreshRequests: () => Promise<void>
  clearError: () => void
}

export function useReturnExchange(options: UseReturnExchangeOptions = {}): UseReturnExchangeResult {
  const { userId, orderId, autoRefresh = false, refreshInterval = 30000 } = options
  
  // State
  const [requests, setRequests] = useState<(ReturnRequest | ExchangeRequest)[]>([])
  const [currentRequest, setCurrentRequest] = useState<ReturnRequest | ExchangeRequest | null>(null)
  const [policy, setPolicy] = useState<ReturnExchangePolicy | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load policy on mount
  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const policyData = await returnExchangeService.getPolicy()
        setPolicy(policyData)
      } catch (err) {
        console.error('Failed to load policy:', err)
      }
    }
    
    loadPolicy()
  }, [])

  // Load requests
  const loadRequests = useCallback(async () => {
    if (!userId && !orderId) return
    
    setLoading(true)
    setError(null)
    
    try {
      let requestData: (ReturnRequest | ExchangeRequest)[]
      
      if (userId) {
        requestData = await returnExchangeService.getRequestsByUser(userId)
      } else if (orderId) {
        requestData = await returnExchangeService.getRequestsByOrder(orderId)
      } else {
        requestData = []
      }
      
      setRequests(requestData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [userId, orderId])

  // Initial load
  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(loadRequests, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadRequests])

  // Actions
  const createReturnRequest = useCallback(async (data: CreateReturnRequestData): Promise<ReturnRequest> => {
    setCreating(true)
    setError(null)
    
    try {
      const request = await returnExchangeService.createReturnRequest(data)
      
      // Update local state
      setRequests(prev => [request, ...prev])
      setCurrentRequest(request)
      
      return request
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '반품 신청에 실패했습니다'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setCreating(false)
    }
  }, [])

  const createExchangeRequest = useCallback(async (data: CreateExchangeRequestData): Promise<ExchangeRequest> => {
    setCreating(true)
    setError(null)
    
    try {
      const request = await returnExchangeService.createExchangeRequest(data)
      
      // Update local state
      setRequests(prev => [request, ...prev])
      setCurrentRequest(request)
      
      return request
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '교환 신청에 실패했습니다'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setCreating(false)
    }
  }, [])

  const getRequest = useCallback(async (requestId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const request = await returnExchangeService.getRequest(requestId)
      setCurrentRequest(request)
      
      // Update in requests list if exists
      setRequests(prev => 
        prev.map(req => req.id === requestId ? request : req)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 정보를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateRequestStatus = useCallback(async (requestId: string, status: RequestStatus): Promise<void> => {
    setUpdating(true)
    setError(null)
    
    try {
      await returnExchangeService.updateRequestStatus(requestId, status)
      
      // Refresh the request data
      await getRequest(requestId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 업데이트에 실패했습니다')
    } finally {
      setUpdating(false)
    }
  }, [getRequest])

  const checkEligibility = useCallback(async (orderId: string, items: string[]): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await returnExchangeService.checkEligibility(orderId, items)
      setEligibility(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '자격 확인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshRequests = useCallback(async (): Promise<void> => {
    await loadRequests()
  }, [loadRequests])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Data
    requests,
    currentRequest,
    policy,
    eligibility,
    
    // Loading states
    loading,
    creating,
    updating,
    
    // Error states
    error,
    
    // Actions
    createReturnRequest,
    createExchangeRequest,
    getRequest,
    updateRequestStatus,
    checkEligibility,
    refreshRequests,
    clearError
  }
}

// Additional hooks for specific use cases
export function useReturnRequest(requestId?: string) {
  const [request, setRequest] = useState<ReturnRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) return

    const loadRequest = async () => {
      setLoading(true)
      try {
        const requestData = await returnExchangeService.getRequest(requestId)
        if (requestData.type === 'return') {
          setRequest(requestData as ReturnRequest)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '반품 요청을 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    loadRequest()
  }, [requestId])

  return { request, loading, error }
}

export function useExchangeRequest(requestId?: string) {
  const [request, setRequest] = useState<ExchangeRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) return

    const loadRequest = async () => {
      setLoading(true)
      try {
        const requestData = await returnExchangeService.getRequest(requestId)
        if (requestData.type === 'exchange') {
          setRequest(requestData as ExchangeRequest)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '교환 요청을 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    loadRequest()
  }, [requestId])

  return { request, loading, error }
}

// Hook for checking eligibility
export function useEligibilityCheck() {
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkEligibility = useCallback(async (orderId: string, items: string[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const eligibilityResult = await returnExchangeService.checkEligibility(orderId, items)
      setResult(eligibilityResult)
      return eligibilityResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '자격 확인에 실패했습니다'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    result,
    loading,
    error,
    checkEligibility,
    clearResult: () => setResult(null),
    clearError: () => setError(null)
  }
}