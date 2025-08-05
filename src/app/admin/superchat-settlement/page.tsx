'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function AdminSuperChatSettlement() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [settlements, setSettlements] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalSuperChats: 0,
    totalAmount: 0,
    pendingSettlement: 0,
    completedSettlement: 0,
    platformFee: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSettlements, setSelectedSettlements] = useState<string[]>([])

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.type !== 'ADMIN') {
        router.push('/login')
        return
      }
      loadSettlements()
    }
  }, [authLoading, isAuthenticated, user, currentPage, statusFilter])

  const loadSettlements = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter !== 'all' ? statusFilter : ''
      })

      const response = await fetch(`/api/admin/settlement/superchat?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch settlements')

      const data = await response.json()
      setSettlements(data.settlements || [])
      setStats(data.stats || {
        totalSuperChats: 0,
        totalAmount: 0,
        pendingSettlement: 0,
        completedSettlement: 0,
        platformFee: 0
      })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load settlements:', error)
      setSettlements([])
    } finally {
      setLoading(false)
    }
  }

  const handleProcessSettlement = async (settlementId: string) => {
    if (!confirm('정산을 처리하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/settlement/${settlementId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to process settlement')
      
      alert('정산이 처리되었습니다.')
      loadSettlements()
    } catch (error) {
      console.error('Failed to process settlement:', error)
      alert('정산 처리에 실패했습니다.')
    }
  }

  const handleBatchProcess = async () => {
    if (selectedSettlements.length === 0) {
      alert('처리할 정산을 선택해주세요.')
      return
    }

    if (!confirm(`${selectedSettlements.length}개의 정산을 일괄 처리하시겠습니까?`)) return

    try {
      const response = await fetch('/api/admin/settlement/batch-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ settlementIds: selectedSettlements })
      })

      if (!response.ok) throw new Error('Failed to batch process')
      
      alert('일괄 정산이 처리되었습니다.')
      setSelectedSettlements([])
      loadSettlements()
    } catch (error) {
      console.error('Failed to batch process:', error)
      alert('일괄 정산 처리에 실패했습니다.')
    }
  }

  const handleRejectSettlement = async (settlementId: string) => {
    const reason = prompt('거절 사유를 입력해주세요:')
    if (!reason) return

    try {
      const response = await fetch(`/api/admin/settlement/${settlementId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) throw new Error('Failed to reject settlement')
      
      alert('정산이 거절되었습니다.')
      loadSettlements()
    } catch (error) {
      console.error('Failed to reject settlement:', error)
      alert('정산 거절에 실패했습니다.')
    }
  }

  const toggleSelectSettlement = (id: string) => {
    setSelectedSettlements(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    )
  }

  if (authLoading || loading) {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">슈퍼챗 정산 관리</h1>
            <p className="text-gray-600 mt-1">크리에이터 슈퍼챗 수익 정산을 관리합니다</p>
          </div>
          {selectedSettlements.length > 0 && (
            <button
              onClick={handleBatchProcess}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              선택 항목 일괄 정산 ({selectedSettlements.length}개)
            </button>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">총 슈퍼챗</p>
            <p className="text-2xl font-bold mt-1">{stats.totalSuperChats.toLocaleString()}개</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">총 금액</p>
            <p className="text-2xl font-bold mt-1">₩{stats.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">정산 대기</p>
            <p className="text-2xl font-bold mt-1 text-orange-600">₩{stats.pendingSettlement.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">정산 완료</p>
            <p className="text-2xl font-bold mt-1 text-green-600">₩{stats.completedSettlement.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">플랫폼 수수료</p>
            <p className="text-2xl font-bold mt-1">₩{stats.platformFee.toLocaleString()}</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="pending">정산 대기</option>
              <option value="processing">처리중</option>
              <option value="completed">완료</option>
              <option value="rejected">거절됨</option>
            </select>
            <button
              onClick={() => router.push('/admin/superchat')}
              className="px-4 py-2 text-blue-600 hover:text-blue-700"
            >
              슈퍼챗 내역 보기 →
            </button>
          </div>
        </div>

        {/* 정산 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSettlements(settlements.filter(s => s.status === 'pending').map(s => s.id))
                        } else {
                          setSelectedSettlements([])
                        }
                      }}
                      checked={selectedSettlements.length === settlements.filter(s => s.status === 'pending').length && settlements.filter(s => s.status === 'pending').length > 0}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    크리에이터
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    정산 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계좌 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className="px-6 py-4">
                      {settlement.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedSettlements.includes(settlement.id)}
                          onChange={() => toggleSelectSettlement(settlement.id)}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {settlement.channel?.name || '알 수 없음'}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{settlement.channel?.handle || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          ₩{settlement.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          수수료: ₩{(settlement.amount * 0.1).toLocaleString()} (10%)
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          실수령액: ₩{(settlement.amount * 0.9).toLocaleString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <p>{settlement.bankName || '-'}</p>
                        <p>{settlement.bankAccount || '-'}</p>
                        <p className="text-gray-500">{settlement.accountHolder || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        settlement.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        settlement.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        settlement.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {settlement.status === 'pending' ? '대기중' :
                         settlement.status === 'processing' ? '처리중' :
                         settlement.status === 'completed' ? '완료' : '거절됨'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(settlement.requestedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {settlement.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleProcessSettlement(settlement.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            정산 처리
                          </button>
                          <button
                            onClick={() => handleRejectSettlement(settlement.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            거절
                          </button>
                        </div>
                      )}
                      {settlement.status === 'completed' && settlement.proofUrl && (
                        <a
                          href={settlement.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          증빙 보기
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-700">
                {currentPage} / {totalPages} 페이지
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}