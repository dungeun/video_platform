'use client'

import { useState, useEffect } from 'react'
import { Search, Download, Link, User, Calendar, Eye, ThumbsUp, Clock, Trash2, Edit, CheckCircle } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'

interface YouTubeVideo {
  id: string
  youtubeId: string
  youtubeUrl: string
  title: string
  description: string
  thumbnailUrl: string
  channelTitle: string
  duration: string
  viewCount: number
  likeCount: number
  publishedAt: string
  assignedUser?: {
    id: string
    name: string
    email: string
  }
  status: 'imported' | 'published' | 'hidden'
  featured: boolean
  importedAt: string
}

export default function AdminYouTubePage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importType, setImportType] = useState<'url' | 'search'>('url')
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [userSearch, setUserSearch] = useState('')

  // Fetch imported videos
  const fetchVideos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/youtube')
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch users for assignment
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  useEffect(() => {
    fetchVideos()
    fetchUsers()
  }, [])

  // Import video by URL
  const handleImportByUrl = async () => {
    if (!importUrl) return

    setImporting(true)
    try {
      const response = await fetch('/api/admin/youtube/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: importUrl,
          assignedUserId: selectedUser || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('비디오를 성공적으로 가져왔습니다!')
        setImportUrl('')
        setSelectedUser('')
        fetchVideos()
      } else {
        alert('비디오 가져오기에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error importing video:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setImporting(false)
    }
  }

  // Search and import videos
  const handleSearch = async () => {
    if (!searchQuery) return

    setImporting(true)
    try {
      const response = await fetch('/api/admin/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          limit: 10
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.videos?.length || 0}개의 비디오를 찾았습니다.`)
        // Show search results for selection
      } else {
        alert('검색에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error searching videos:', error)
      alert('오류가 발생했습니다.')
    } finally {
      setImporting(false)
    }
  }

  // Assign video to user
  const handleAssignUser = async (videoId: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/youtube/${videoId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        alert('유저가 할당되었습니다.')
        fetchVideos()
      }
    } catch (error) {
      console.error('Error assigning user:', error)
    }
  }

  // Update video status
  const handleStatusChange = async (videoId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/youtube/${videoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchVideos()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Toggle featured status
  const handleToggleFeatured = async (videoId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/youtube/${videoId}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured })
      })

      if (response.ok) {
        fetchVideos()
      }
    } catch (error) {
      console.error('Error toggling featured:', error)
    }
  }

  // Delete video
  const handleDelete = async (videoId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/youtube/${videoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchVideos()
      }
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }

  const formatDuration = (duration: string) => {
    // Parse ISO 8601 duration
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return duration

    const hours = match[1] ? `${match[1]}:` : ''
    const minutes = match[2] ? match[2].padStart(2, '0') : '00'
    const seconds = match[3] ? match[3].padStart(2, '0') : '00'

    return `${hours}${minutes}:${seconds}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">YouTube 컨텐츠 관리</h1>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">YouTube 비디오 가져오기</h2>
          
          {/* Import Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">지원하는 YouTube URL 형식:</p>
              <ul className="ml-4 space-y-0.5 text-xs">
                <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
                <li>• https://youtu.be/VIDEO_ID</li>
                <li>• 추가 파라미터가 있는 URL도 지원 (예: &ab_channel=...)</li>
              </ul>
            </div>
          </div>

          {true ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="YouTube URL을 입력하세요 (예: https://www.youtube.com/watch?v=...)"
                    className="pl-10 pr-4 py-2 border rounded-lg w-full"
                  />
                </div>
              </div>

              {/* User Assignment */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="유저 검색 (선택사항)"
                    className="pl-10 pr-4 py-2 border rounded-lg w-full"
                  />
                </div>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="">유저 선택</option>
                  {users
                    .filter(user => 
                      !userSearch || 
                      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      user.email.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))
                  }
                </select>
              </div>

              <button
                onClick={handleImportByUrl}
                disabled={importing || !importUrl}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {importing ? '가져오는 중...' : '가져오기'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">가져온 비디오 목록 ({videos.length}개)</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">로딩 중...</div>
          ) : videos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              아직 가져온 비디오가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">썸네일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목/채널</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">통계</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">할당된 유저</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          className="w-24 h-14 object-cover rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <a 
                            href={video.youtubeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline line-clamp-2"
                          >
                            {video.title}
                          </a>
                          <div className="text-sm text-gray-500 mt-1">
                            {video.channelTitle}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-gray-400" />
                            {formatNumber(video.viewCount)}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4 text-gray-400" />
                            {formatNumber(video.likeCount)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {video.assignedUser ? (
                          <div className="text-sm">
                            <div className="font-medium">{video.assignedUser.name}</div>
                            <div className="text-gray-500">{video.assignedUser.email}</div>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => handleAssignUser(video.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="">유저 할당</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <select
                            value={video.status}
                            onChange={(e) => handleStatusChange(video.id, e.target.value)}
                            className={`text-sm border rounded px-2 py-1 ${
                              video.status === 'published' ? 'bg-green-50 text-green-700' :
                              video.status === 'hidden' ? 'bg-gray-50 text-gray-700' :
                              'bg-yellow-50 text-yellow-700'
                            }`}
                          >
                            <option value="imported">가져옴</option>
                            <option value="published">게시됨</option>
                            <option value="hidden">숨김</option>
                          </select>
                          {video.featured && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              추천
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleFeatured(video.id, video.featured)}
                            className={`p-1 rounded ${video.featured ? 'text-blue-500' : 'text-gray-400'} hover:bg-gray-100`}
                            title={video.featured ? '추천 해제' : '추천 설정'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}