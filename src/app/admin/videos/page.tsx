'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function AdminVideos() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalVideos: 0,
    publishedVideos: 0,
    totalViews: 0,
    totalLikes: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.type !== 'ADMIN') {
        router.push('/login')
        return
      }
      loadVideos()
    }
  }, [authLoading, isAuthenticated, user, currentPage, statusFilter])

  const loadVideos = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter !== 'all' ? statusFilter : '',
        search: searchTerm
      })

      const response = await fetch(`/api/admin/videos?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch videos')

      const data = await response.json()
      setVideos(data.videos || [])
      setStats(data.stats || {
        totalVideos: 0,
        publishedVideos: 0,
        totalViews: 0,
        totalLikes: 0
      })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load videos:', error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (videoId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      // 목록 새로고침
      loadVideos()
    } catch (error) {
      console.error('Failed to update video status:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('정말로 이 동영상을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete video')
      
      // 목록 새로고침
      loadVideos()
    } catch (error) {
      console.error('Failed to delete video:', error)
      alert('삭제에 실패했습니다.')
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
          <h1 className="text-2xl font-bold text-gray-900">동영상 관리</h1>
          <p className="text-gray-600 mt-1">플랫폼의 모든 동영상을 관리합니다</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">전체 동영상</p>
            <p className="text-2xl font-bold mt-1">{stats.totalVideos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">게시된 동영상</p>
            <p className="text-2xl font-bold mt-1">{stats.publishedVideos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">총 조회수</p>
            <p className="text-2xl font-bold mt-1">{stats.totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">총 좋아요</p>
            <p className="text-2xl font-bold mt-1">{stats.totalLikes.toLocaleString()}</p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="제목, 채널명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadVideos()}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="processing">처리중</option>
              <option value="published">게시됨</option>
              <option value="private">비공개</option>
              <option value="deleted">삭제됨</option>
            </select>
            <button
              onClick={loadVideos}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              검색
            </button>
          </div>
        </div>

        {/* 동영상 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    썸네일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목 / 채널
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업로드일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {videos.map((video) => (
                  <tr key={video.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={video.thumbnailUrl || video.thumbnailImageUrl || '/images/video-default-thumbnail.jpg'}
                        alt={video.title}
                        className="w-20 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{video.title}</p>
                        <p className="text-sm text-gray-500">
                          {video.channel?.name || video.business?.name || '알 수 없음'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        video.status === 'published' ? 'bg-green-100 text-green-800' :
                        video.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        video.status === 'private' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {video.status === 'published' ? '게시됨' :
                         video.status === 'processing' ? '처리중' :
                         video.status === 'private' ? '비공개' : '삭제됨'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p>조회수: {(video.viewCount || 0).toLocaleString()}</p>
                        <p>좋아요: {(video.likeCount || 0).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(video.createdAt), { 
                        addSuffix: true,
                        locale: ko 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/videos/${video.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          보기
                        </button>
                        <select
                          value={video.status}
                          onChange={(e) => handleStatusChange(video.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="processing">처리중</option>
                          <option value="published">게시됨</option>
                          <option value="private">비공개</option>
                        </select>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="text-red-600 hover:text-red-900"
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