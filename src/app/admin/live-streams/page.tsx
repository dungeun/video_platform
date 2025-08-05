'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function AdminLiveStreams() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [liveStreams, setLiveStreams] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalStreams: 0,
    activeStreams: 0,
    totalViewers: 0,
    totalSuperChats: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.type !== 'ADMIN') {
        router.push('/login')
        return
      }
      loadLiveStreams()
    }
  }, [authLoading, isAuthenticated, user, currentPage, statusFilter])

  const loadLiveStreams = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter !== 'all' ? statusFilter : ''
      })

      const response = await fetch(`/api/admin/live-streams?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch live streams')

      const data = await response.json()
      setLiveStreams(data.streams || [])
      setStats(data.stats || {
        totalStreams: 0,
        activeStreams: 0,
        totalViewers: 0,
        totalSuperChats: 0
      })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load live streams:', error)
      setLiveStreams([])
    } finally {
      setLoading(false)
    }
  }

  const handleEndStream = async (streamId: string) => {
    if (!confirm('이 라이브 스트림을 종료하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/live-streams/${streamId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to end stream')
      
      alert('라이브 스트림이 종료되었습니다.')
      loadLiveStreams()
    } catch (error) {
      console.error('Failed to end stream:', error)
      alert('스트림 종료에 실패했습니다.')
    }
  }

  const handleDeleteStream = async (streamId: string) => {
    if (!confirm('이 라이브 스트림 기록을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/live-streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete stream')
      
      alert('라이브 스트림 기록이 삭제되었습니다.')
      loadLiveStreams()
    } catch (error) {
      console.error('Failed to delete stream:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const getStreamStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 animate-pulse'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800'
      case 'ended':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStreamStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return '🔴 라이브'
      case 'preparing':
        return '준비중'
      case 'ended':
        return '종료됨'
      default:
        return status
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
          <h1 className="text-2xl font-bold text-gray-900">라이브 스트림 관리</h1>
          <p className="text-gray-600 mt-1">실시간 방송을 모니터링하고 관리합니다</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">전체 스트림</p>
            <p className="text-2xl font-bold mt-1">{stats.totalStreams.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">현재 라이브</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{stats.activeStreams}</p>
              </div>
              {stats.activeStreams > 0 && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">현재 시청자</p>
            <p className="text-2xl font-bold mt-1">{stats.totalViewers.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">오늘 슈퍼챗</p>
            <p className="text-2xl font-bold mt-1">₩{stats.totalSuperChats.toLocaleString()}</p>
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
              <option value="live">라이브</option>
              <option value="preparing">준비중</option>
              <option value="ended">종료됨</option>
            </select>
            <button
              onClick={loadLiveStreams}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 라이브 스트림 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    썸네일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    방송 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    채널
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시청자 통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시작 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {liveStreams.map((stream) => (
                  <tr key={stream.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={stream.thumbnailUrl || '/images/video-default-thumbnail.jpg'}
                        alt={stream.title}
                        className="w-20 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{stream.title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {stream.description || '설명 없음'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {stream.channel?.name || '알 수 없음'}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{stream.channel?.handle || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStreamStatusBadge(stream.status)}`}>
                        {getStreamStatusText(stream.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p>현재: {stream.viewerCount.toLocaleString()}명</p>
                        <p>최고: {stream.peakViewers.toLocaleString()}명</p>
                        {stream.status === 'live' && (
                          <p className="text-green-600">슈퍼챗: ₩{(stream.superChatAmount || 0).toLocaleString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stream.startedAt ? (
                        <div>
                          <p>{formatDistanceToNow(new Date(stream.startedAt), { 
                            addSuffix: true,
                            locale: ko 
                          })}</p>
                          {stream.status === 'live' && (
                            <p className="text-xs text-gray-400">
                              진행 시간: {Math.floor((Date.now() - new Date(stream.startedAt).getTime()) / 60000)}분
                            </p>
                          )}
                        </div>
                      ) : (
                        '준비중'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1">
                        {stream.status === 'live' && (
                          <>
                            <a
                              href={`/live/${stream.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              시청하기
                            </a>
                            <button
                              onClick={() => handleEndStream(stream.id)}
                              className="text-red-600 hover:text-red-900 text-left"
                            >
                              방송 종료
                            </button>
                          </>
                        )}
                        {stream.status === 'ended' && stream.recordingUrl && (
                          <a
                            href={stream.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            녹화 보기
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteStream(stream.id)}
                          className="text-red-600 hover:text-red-900 text-left"
                        >
                          삭제
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