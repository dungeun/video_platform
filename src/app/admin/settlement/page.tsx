'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPut } from '@/lib/api/client'
import { CreditCard, Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function AdminSettlement() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [settlements, setSettlements] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [proofUrl, setProofUrl] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.type !== 'ADMIN') {
        router.push('/admin')
        return
      }
      loadSettlements()
    }
  }, [authLoading, isAuthenticated, user, activeTab])

  const loadSettlements = async (page = 1) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (activeTab !== 'all') {
        params.append('status', activeTab)
      }

      const data = await apiGet(`/api/admin/settlement?${params.toString()}`) as any
      setSettlements(data.settlements)
      setStats(data.stats)
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to load settlements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (status: string) => {
    if (!selectedSettlement) return

    try {
      await apiPut('/api/admin/settlement', {
        settlementId: selectedSettlement.id,
        status,
        adminNotes,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        proofUrl: status === 'completed' ? proofUrl : undefined
      })

      setShowModal(false)
      setSelectedSettlement(null)
      setAdminNotes('')
      setRejectionReason('')
      setProofUrl('')
      loadSettlements(currentPage)
      
      alert('정산 상태가 업데이트되었습니다.')
    } catch (error) {
      console.error('Failed to update settlement:', error)
      alert('정산 상태 업데이트에 실패했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: '대기중' },
      processing: { color: 'bg-blue-100 text-blue-800', label: '처리중' },
      completed: { color: 'bg-green-100 text-green-800', label: '완료' },
      rejected: { color: 'bg-red-100 text-red-800', label: '거절' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (authLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthenticated || user?.type !== 'ADMIN') {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
          <p className="text-gray-600 mt-1">크리에이터 정산 신청을 관리하세요</p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">대기중</h3>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending?.count || 0}건
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ₩{(stats.pending?.totalAmount || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">처리중</h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.processing?.count || 0}건
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ₩{(stats.processing?.totalAmount || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">완료</h3>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed?.count || 0}건
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ₩{(stats.completed?.totalAmount || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">거절</h3>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.rejected?.count || 0}건
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ₩{(stats.rejected?.totalAmount || 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              대기중
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              className={`${
                activeTab === 'processing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              처리중
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              완료
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              전체
            </button>
          </nav>
        </div>

        {/* 정산 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    채널
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계좌정보
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(settlement.requestedAt), { 
                        addSuffix: true,
                        locale: ko 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {settlement.channel.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {settlement.channel.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {settlement.bankName} {settlement.bankAccount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {settlement.accountHolder}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      ₩{settlement.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(settlement.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          setSelectedSettlement(settlement)
                          setShowModal(true)
                          setAdminNotes(settlement.adminNotes || '')
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <button
                onClick={() => loadSettlements(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-700">
                {currentPage} / {totalPages} 페이지
              </span>
              <button
                onClick={() => loadSettlements(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {showModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">정산 상세</h2>

            <div className="space-y-6">
              {/* 정산 정보 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">정산 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">신청일</span>
                    <span className="font-medium">
                      {new Date(selectedSettlement.requestedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">금액</span>
                    <span className="font-medium">
                      ₩{selectedSettlement.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태</span>
                    {getStatusBadge(selectedSettlement.status)}
                  </div>
                </div>
              </div>

              {/* 채널 정보 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">채널 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">채널명</span>
                    <span className="font-medium">{selectedSettlement.channel.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">이메일</span>
                    <span className="font-medium">{selectedSettlement.channel.user.email}</span>
                  </div>
                </div>
              </div>

              {/* 계좌 정보 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">계좌 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">은행</span>
                    <span className="font-medium">{selectedSettlement.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">계좌번호</span>
                    <span className="font-medium">{selectedSettlement.bankAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">예금주</span>
                    <span className="font-medium">{selectedSettlement.accountHolder}</span>
                  </div>
                </div>
              </div>

              {/* 관리자 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 메모
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="관리자용 메모를 입력하세요"
                />
              </div>

              {/* 상태별 추가 입력 */}
              {selectedSettlement.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      거절 사유 (거절 시)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="거절 사유를 입력하세요"
                    />
                  </div>
                </>
              )}

              {selectedSettlement.status === 'processing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    송금 증빙 URL (완료 시)
                  </label>
                  <input
                    type="text"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="송금 증빙 문서 URL"
                  />
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedSettlement(null)
                  setAdminNotes('')
                  setRejectionReason('')
                  setProofUrl('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                닫기
              </button>
              
              {selectedSettlement.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('processing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    처리 시작
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectionReason) {
                        alert('거절 사유를 입력해주세요.')
                        return
                      }
                      handleStatusUpdate('rejected')
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    거절
                  </button>
                </>
              )}
              
              {selectedSettlement.status === 'processing' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  완료 처리
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}