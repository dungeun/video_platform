'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { transformCampaignToVideo } from '@/lib/utils/video'
import { 
  Play, 
  Edit3, 
  Trash2, 
  Eye, 
  Heart, 
  MessageCircle, 
  MoreHorizontal,
  Plus,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface Video {
  id: string
  title: string
  description: string
  thumbnail: string | null
  views: number
  likes: number
  comments: number
  createdAt: string
  status: 'public' | 'private' | 'draft'
  duration: number
}

export default function VideoManagementTab() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      setLoading(true)
      
      // 비즈니스가 등록한 캠페인을 비디오로 변환하여 표시
      const response = await fetch('/api/business/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const campaigns = data.campaigns || []
        
        // 캠페인을 비디오 형태로 변환
        const videoList = campaigns.map((campaign: any) => {
          const video = transformCampaignToVideo(campaign)
          return {
            id: video.id,
            title: video.title,
            description: video.description,
            thumbnail: video.thumbnailUrl,
            views: video.viewCount,
            likes: video.likeCount,
            comments: Math.floor(video.likeCount * 0.2), // 임시 계산
            createdAt: video.createdAt,
            status: campaign.status === 'ACTIVE' ? 'public' : 
                   campaign.status === 'DRAFT' ? 'draft' : 'private',
            duration: video.duration
          }
        })

        setVideos(videoList)
      }
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('정말로 이 비디오를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        setVideos(videos.filter(v => v.id !== videoId))
      } else {
        alert('비디오 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete video error:', error)
      alert('비디오 삭제 중 오류가 발생했습니다.')
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'public':
        return <Badge className="bg-green-100 text-green-800">공개</Badge>
      case 'private':
        return <Badge className="bg-yellow-100 text-yellow-800">비공개</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">임시저장</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">내 비디오</h3>
          <p className="text-sm text-gray-600 mt-1">
            업로드한 비디오를 관리하고 통계를 확인하세요
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/upload">
            <Plus className="w-4 h-4 mr-2" />
            비디오 업로드
          </Link>
        </Button>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 비디오</p>
              <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
            </div>
            <Play className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 조회수</p>
              <p className="text-2xl font-bold text-gray-900">
                {videos.reduce((sum, v) => sum + v.views, 0).toLocaleString()}
              </p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 좋아요</p>
              <p className="text-2xl font-bold text-gray-900">
                {videos.reduce((sum, v) => sum + v.likes, 0).toLocaleString()}
              </p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">공개 비디오</p>
              <p className="text-2xl font-bold text-gray-900">
                {videos.filter(v => v.status === 'public').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* 비디오 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              업로드된 비디오가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              첫 번째 비디오를 업로드하여 시청자들과 만나보세요!
            </p>
            <Button asChild>
              <Link href="/studio/upload">
                <Plus className="w-4 h-4 mr-2" />
                비디오 업로드하기
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    비디오
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회수/좋아요
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    게시일
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-24 relative">
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="h-16 w-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="h-16 w-24 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link 
                            href={`/videos/${video.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-indigo-600 line-clamp-2"
                          >
                            {video.title}
                          </Link>
                          <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                            {video.description || '설명 없음'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(video.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center text-gray-600">
                          <Eye className="w-4 h-4 mr-1" />
                          {video.views.toLocaleString()}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Heart className="w-4 h-4 mr-1" />
                          {video.likes.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(video.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/videos/${video.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/studio/videos/${video.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="text-red-600 hover:text-red-900"
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
  )
}