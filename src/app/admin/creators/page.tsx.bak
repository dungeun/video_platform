'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function AdminCreators() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [creators, setCreators] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalCreators: 0,
    verifiedCreators: 0,
    totalSubscribers: 0,
    totalEarnings: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('all')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.type !== 'ADMIN') {
        router.push('/login')
        return
      }
      loadCreators()
    }
  }, [authLoading, isAuthenticated, user, currentPage, verifiedFilter])

  const loadCreators = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        verified: verifiedFilter !== 'all' ? verifiedFilter : '',
        search: searchTerm
      })

      const response = await fetch(`/api/admin/creators?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch creators')

      const data = await response.json()
      setCreators(data.creators || [])
      setStats(data.stats || {
        totalCreators: 0,
        verifiedCreators: 0,
        totalSubscribers: 0,
        totalEarnings: 0
      })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load creators:', error)
      setCreators([])
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationToggle = async (creatorId: string, isVerified: boolean) => {
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ isVerified })
      })

      if (!response.ok) throw new Error('Failed to update verification')
      
      // 목록 새로고침
      loadCreators()
    } catch (error) {
      console.error('Failed to update verification status:', error)
      alert('인증 상태 변경에 실패했습니다.')
    }
  }

  const handleStatusChange = async (creatorId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      // 목록 새로고침
      loadCreators()
    } catch (error) {
      console.error('Failed to update creator status:', error)
      alert('상태 변경에 실패했습니다.')
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">크리에이터 관리</h1>
          <p className="text-gray-600 mt-1">플랫폼의 모든 크리에이터를 관리합니다</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">전체 크리에이터</p>
            <p className="text-2xl font-bold mt-1">{stats.totalCreators.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">인증된 크리에이터</p>
            <p className="text-2xl font-bold mt-1">{stats.verifiedCreators.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">총 구독자</p>
            <p className="text-2xl font-bold mt-1">{stats.totalSubscribers.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">총 수익</p>
            <p className="text-2xl font-bold mt-1">₩{stats.totalEarnings.toLocaleString()}</p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="이름, 채널명, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadCreators()}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 크리에이터</option>
              <option value="true">인증됨</option>
              <option value="false">미인증</option>
            </select>
            <button
              onClick={loadCreators}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              검색
            </button>
          </div>
        </div>

        {/* 크리에이터 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    크리에이터
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    채널
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수익
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creators.map((creator) => (
                  <tr key={creator.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={creator.channel?.avatarUrl || creator.profile?.profileImage || '/images/default-avatar.png'}
                          alt={creator.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{creator.name}</p>
                          <p className="text-sm text-gray-500">{creator.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {creator.channel?.name || '-'}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{creator.channel?.handle || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          creator.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          creator.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {creator.status === 'ACTIVE' ? '활성' :
                           creator.status === 'SUSPENDED' ? '정지' : '비활성'}
                        </span>
                        {creator.channel?.isVerified && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            인증됨
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p>구독자: {(creator.channel?.subscriberCount || 0).toLocaleString()}</p>
                        <p>동영상: {(creator.channel?.videoCount || 0).toLocaleString()}</p>
                        <p>조회수: {(creator.channel?.totalViews || 0).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p>총 수익: ₩{(creator.channel?.totalEarnings || 0).toLocaleString()}</p>
                        <p>정산 대기: ₩{(creator.channel?.pendingSettlement || 0).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(creator.createdAt), { 
                        addSuffix: true,
                        locale: ko 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => router.push(`/channel/${creator.channel?.handle}`)}
                          className="text-blue-600 hover:text-blue-900 text-left"
                        >
                          채널 보기
                        </button>
                        <button
                          onClick={() => handleVerificationToggle(creator.id, !creator.channel?.isVerified)}
                          className={`text-left ${
                            creator.channel?.isVerified 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {creator.channel?.isVerified ? '인증 해제' : '인증'}
                        </button>
                        <select
                          value={creator.status}
                          onChange={(e) => handleStatusChange(creator.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="ACTIVE">활성</option>
                          <option value="SUSPENDED">정지</option>
                          <option value="INACTIVE">비활성</option>
                        </select>
                      </div>
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