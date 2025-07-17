'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import PaymentDetailPanel from '@/components/admin/PaymentDetailPanel'
import { adminApi } from '@/lib/admin-api'

interface Payment {
  id: string
  campaignId: string
  campaignTitle: string
  businessName: string
  influencerName: string
  amount: number
  paymentMethod: string
  status: string
  requestDate: string
  processedDate?: string
  description: string
  type: 'campaign_payment' | 'influencer_payout' | 'platform_fee'
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [currentPage, filter, searchTerm])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filter !== 'all' && { status: filter }),
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await adminApi.get(`/api/admin/payments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.total || 0)
      } else {
        console.error('Failed to fetch payments:', response.status)
        setPayments([])
      }
    } catch (error) {
      console.error('결제 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }
  
  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch)
    setCurrentPage(1)
  }

  const handlePaymentAction = async (paymentId: string, action: string) => {
    try {
      const response = await adminApi.put(`/api/admin/payments/${paymentId}`, { action })
      
      if (response.ok) {
        const newStatus = action === 'approve' ? 'completed' : 'cancelled'
        setPayments(prev => prev.map(payment =>
          payment.id === paymentId 
            ? { ...payment, status: newStatus, processedDate: new Date().toISOString().split('T')[0] }
            : payment
        ))
      }
    } catch (error) {
      console.error('결제 처리 실패:', error)
    }
  }

  const handleOpenPanel = (paymentId: string) => {
    setSelectedPaymentId(paymentId)
    setIsPanelOpen(true)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setTimeout(() => setSelectedPaymentId(null), 300)
  }

  const handlePanelUpdate = () => {
    fetchPayments()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료'
      case 'pending': return '대기'
      case 'processing': return '처리중'
      case 'cancelled': return '취소'
      default: return '알 수 없음'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'campaign_payment': return 'bg-blue-100 text-blue-800'
      case 'influencer_payout': return 'bg-green-100 text-green-800'
      case 'platform_fee': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'campaign_payment': return '캠페인 결제'
      case 'influencer_payout': return '인플루언서 정산'
      case 'platform_fee': return '플랫폼 수수료'
      default: return '알 수 없음'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결제 관리</h1>
          <p className="text-gray-600 mt-1">플랫폼의 모든 결제와 정산을 관리합니다</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 결제</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">완료</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 금액</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₩{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="캠페인, 업체명, 인플루언서명으로 검색..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기</option>
                <option value="processing">처리중</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>
        </div>

        {/* 결제 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  참여자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">#{payment.id}</div>
                      <div className="text-sm text-gray-500">{(payment as any).description}</div>
                      <div className="text-xs text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(payment.type)}`}>
                          {getTypeText(payment.type)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.campaignTitle}</div>
                    <div className="text-sm text-gray-500">{payment.businessName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.influencerName}</div>
                    <div className="text-sm text-gray-500">{payment.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₩{payment.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      신청: {payment.requestDate}
                      {payment.processedDate && (
                        <div>처리: {payment.processedDate}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handlePaymentAction(payment.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handlePaymentAction(payment.id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            거부
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleOpenPanel(payment.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        상세
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{totalCount}</span>개 중{' '}
                  <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> -{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> 표시
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">이전</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* 페이지 번호 */}
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1
                    // 현재 페이지 주변 3개씩만 표시
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    } else if (
                      pageNumber === currentPage - 3 ||
                      pageNumber === currentPage + 3
                    ) {
                      return (
                        <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">다음</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 결제 상세 슬라이드 패널 */}
      {selectedPaymentId && (
        <PaymentDetailPanel
          paymentId={selectedPaymentId}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          onUpdate={handlePanelUpdate}
        />
      )}
    </AdminLayout>
  )
}