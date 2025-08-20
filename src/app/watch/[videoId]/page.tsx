'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import VideoPlayer from '@/components/video/VideoPlayer'
import VideoInfo from '@/components/video/VideoInfo'
import CommentSection from '@/components/video/CommentSection'
import RecommendedVideos from '@/components/video/RecommendedVideos'
import CreatorInfo from '@/components/video/CreatorInfo'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface Video {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl?: string
  duration: number
  views: number
  likes: number
  dislikes: number
  createdAt: string
  updatedAt: string
  status: 'processing' | 'published' | 'failed' | 'scheduled'
  visibility: 'public' | 'unlisted' | 'private' | 'scheduled'
  category: string
  tags: string[]
  language: string
  isCommentsEnabled: boolean
  isRatingsEnabled: boolean
  ageRestriction: boolean
  creator: {
    id: string
    name: string
    email: string
    avatar?: string
    subscriberCount: number
    isVerified: boolean
  }
}

interface WatchPageProps {
  params: {
    videoId: string
  }
}

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params?.videoId as string
  
  const [video, setVideo] = useState<Video | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // 비디오 정보 로딩
  useEffect(() => {
    if (!videoId) return

    const fetchVideo = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/videos/${videoId}`)
        
        if (response.status === 404) {
          notFound()
        }
        
        if (!response.ok) {
          throw new Error('비디오를 불러올 수 없습니다')
        }

        const videoData = await response.json()
        
        // 비디오가 비공개이거나 아직 처리 중인 경우 체크
        if (videoData.visibility === 'private' && !videoData.isOwner) {
          throw new Error('비공개 비디오입니다')
        }
        
        if (videoData.status === 'processing') {
          throw new Error('비디오가 아직 처리 중입니다')
        }
        
        if (videoData.status === 'failed') {
          throw new Error('비디오 처리에 실패했습니다')
        }

        setVideo(videoData)

        // 시청 기록 저장
        recordWatchHistory(videoId)

        // 구독 상태 확인
        checkSubscriptionStatus(videoData.creator.id)

      } catch (err) {
        console.error('Error fetching video:', err)
        setError(err instanceof Error ? err.message : '비디오를 불러오는 중 오류가 발생했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideo()
  }, [videoId])

  // 시청 기록 저장
  const recordWatchHistory = async (videoId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return // 비로그인 사용자는 기록하지 않음

      await fetch(`/api/videos/${videoId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('Failed to record watch history:', error)
    }
  }

  // 구독 상태 확인
  const checkSubscriptionStatus = async (creatorId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/users/${creatorId}/subscription-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsSubscribed(data.isSubscribed)
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error)
    }
  }

  // 좋아요/싫어요 처리
  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!video) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/videos/${videoId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        const updatedCounts = await response.json()
        setVideo(prev => prev ? {
          ...prev,
          likes: updatedCounts.likes,
          dislikes: updatedCounts.dislikes
        } : null)
      }
    } catch (error) {
      console.error('Failed to handle reaction:', error)
    }
  }

  // 구독/구독취소 처리
  const handleSubscription = async () => {
    if (!video) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/users/${video.creator.id}/subscribe`, {
        method: isSubscribed ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setIsSubscribed(!isSubscribed)
        // 구독자 수 업데이트
        setVideo(prev => prev ? {
          ...prev,
          creator: {
            ...prev.creator,
            subscriberCount: prev.creator.subscriberCount + (isSubscribed ? -1 : 1)
          }
        } : null)
      }
    } catch (error) {
      console.error('Failed to handle subscription:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 비디오 플레이어 스켈레톤 */}
              <div className="aspect-video bg-muted rounded-lg animate-pulse" />
              
              {/* 비디오 제목 */}
              <Skeleton className="h-8 w-3/4" />
              
              {/* 크리에이터 정보 */}
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              
              {/* 댓글 섹션 */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 사이드바 */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <Skeleton className="h-20 w-32 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!video) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 비디오 플레이어 */}
            <VideoPlayer
              videoUrl={video.videoUrl}
              title={video.title}
              poster={video.thumbnailUrl}
              onTimeUpdate={(currentTime) => {
                // 시청 진행률 업데이트 (선택사항)
                if (currentTime > 0 && currentTime % 30 === 0) { // 30초마다
                  recordWatchProgress(videoId, currentTime)
                }
              }}
            />

            {/* 비디오 정보 */}
            <VideoInfo
              video={video}
              onLike={() => handleReaction('like')}
              onDislike={() => handleReaction('dislike')}
            />

            <Separator />

            {/* 크리에이터 정보 */}
            <CreatorInfo
              creator={video.creator}
              isSubscribed={isSubscribed}
              onSubscribe={handleSubscription}
            />

            <Separator />

            {/* 댓글 섹션 */}
            {video.isCommentsEnabled && (
              <CommentSection
                videoId={videoId}
                commentsEnabled={video.isCommentsEnabled}
              />
            )}
          </div>

          {/* 사이드바 - 추천 비디오 */}
          <div>
            <RecommendedVideos
              currentVideoId={videoId}
              category={video.category}
              tags={video.tags}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 시청 진행률 기록 (선택사항)
const recordWatchProgress = async (videoId: string, currentTime: number) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    await fetch(`/api/videos/${videoId}/progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentTime })
    })
  } catch (error) {
    console.error('Failed to record watch progress:', error)
  }
}