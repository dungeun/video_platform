'use client'

import { useState } from 'react'
import { 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  MoreVertical, 
  Play,
  Clock,
  BarChart3,
  CheckSquare,
  Square,
  Copy,
  Download,
  Link
} from 'lucide-react'

interface Video {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  duration: number
  status: 'published' | 'draft' | 'scheduled' | 'processing'
  visibility: 'public' | 'private' | 'unlisted'
  uploadedAt: string
  publishedAt?: string
  scheduledAt?: string
  views: number
  likes: number
  comments: number
  revenue: number
  category?: string
  tags?: string[]
}

interface VideoTableProps {
  videos: Video[]
  isLoading: boolean
  selectedVideos: string[]
  onToggleSelection: (videoId: string) => void
  onToggleSelectAll: () => void
  onEdit: (video: Video) => void
  onDelete: (videoId: string) => void
  onUpdateStatus: (videoId: string, status: Video['status']) => void
  onUpdateVisibility: (videoId: string, visibility: Video['visibility']) => void
}

export default function VideoTable({
  videos,
  isLoading,
  selectedVideos,
  onToggleSelection,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateVisibility
}: VideoTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: Video['status']) => {
    const badges = {
      published: { bg: 'bg-green-100', text: 'text-green-800', label: '공개' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: '초안' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: '예약' },
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '처리중' }
    }
    const badge = badges[status]
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getVisibilityIcon = (visibility: Video['visibility']) => {
    switch (visibility) {
      case 'public':
        return <Eye className="w-4 h-4 text-green-600" />
      case 'private':
        return <EyeOff className="w-4 h-4 text-red-600" />
      case 'unlisted':
        return <Link className="w-4 h-4 text-yellow-600" />
      default:
        return null
    }
  }

  const copyVideoLink = (videoId: string) => {
    const link = `${window.location.origin}/watch/${videoId}`
    navigator.clipboard.writeText(link)
    alert('비디오 링크가 복사되었습니다!')
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">비디오 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <div className="mb-4">
            <Play className="w-16 h-16 mx-auto text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">업로드된 비디오가 없습니다</h3>
          <p className="text-gray-600">첫 번째 비디오를 업로드해보세요!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedVideos.length === videos.length && videos.length > 0}
                  onChange={onToggleSelectAll}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                비디오
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                공개 설정
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                통계
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                날짜
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                수익
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">작업</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedVideos.includes(video.id)}
                    onChange={() => onToggleSelection(video.id)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-24">
                      <img
                        className="h-16 w-24 rounded object-cover"
                        src={video.thumbnailUrl || '/placeholder-video.jpg'}
                        alt={video.title}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {video.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {video.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDuration(video.duration)}
                        </span>
                        {video.category && (
                          <span className="text-xs text-gray-400">
                            {video.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(video.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      const nextVisibility = 
                        video.visibility === 'public' ? 'private' :
                        video.visibility === 'private' ? 'unlisted' : 'public'
                      onUpdateVisibility(video.id, nextVisibility)
                    }}
                    className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                    title={video.visibility}
                  >
                    {getVisibilityIcon(video.visibility)}
                    <span className="text-sm text-gray-600">
                      {video.visibility === 'public' ? '전체 공개' :
                       video.visibility === 'private' ? '비공개' : '일부 공개'}
                    </span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">
                        <Eye className="w-4 h-4 inline mr-1" />
                        {video.views.toLocaleString()}
                      </span>
                      <span className="text-gray-600">
                        👍 {video.likes.toLocaleString()}
                      </span>
                      <span className="text-gray-600">
                        💬 {video.comments}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(video.uploadedAt)}
                  </div>
                  {video.publishedAt && (
                    <div className="text-xs text-gray-500">
                      공개: {formatDate(video.publishedAt)}
                    </div>
                  )}
                  {video.scheduledAt && (
                    <div className="text-xs text-blue-600">
                      예약: {formatDate(video.scheduledAt)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ₩{video.revenue.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === video.id ? null : video.id)}
                      className="text-gray-400 hover:text-gray-600 p-2"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {openMenuId === video.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onEdit(video)
                              setOpenMenuId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Edit3 className="w-4 h-4" />
                            편집
                          </button>
                          
                          <button
                            onClick={() => {
                              window.open(`/watch/${video.id}`, '_blank')
                              setOpenMenuId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Play className="w-4 h-4" />
                            미리보기
                          </button>
                          
                          <button
                            onClick={() => {
                              copyVideoLink(video.id)
                              setOpenMenuId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Copy className="w-4 h-4" />
                            링크 복사
                          </button>
                          
                          <button
                            onClick={() => {
                              window.open(`/studio/analytics/${video.id}`, '_blank')
                              setOpenMenuId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <BarChart3 className="w-4 h-4" />
                            분석 보기
                          </button>
                          
                          <hr className="my-1" />
                          
                          <button
                            onClick={() => {
                              const newStatus = video.status === 'published' ? 'draft' : 'published'
                              onUpdateStatus(video.id, newStatus)
                              setOpenMenuId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            {video.status === 'published' ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                비공개로 전환
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                공개하기
                              </>
                            )}
                          </button>
                          
                          <hr className="my-1" />
                          
                          <button
                            onClick={() => {
                              onDelete(video.id)
                              setOpenMenuId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}