'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Play,
  Clock,
  Eye,
  MoreVertical,
  BookmarkPlus,
  Share,
  Flag
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface RecommendedVideo {
  id: string
  title: string
  thumbnailUrl: string
  duration: number
  views: number
  createdAt: string
  creator: {
    id: string
    name: string
    avatar?: string
    isVerified: boolean
  }
  category: string
  tags: string[]
}

interface RecommendedVideosProps {
  currentVideoId: string
  category: string
  tags: string[]
  limit?: number
}

export default function RecommendedVideos({ 
  currentVideoId, 
  category, 
  tags, 
  limit = 20 
}: RecommendedVideosProps) {
  const [videos, setVideos] = useState<RecommendedVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRecommendedVideos = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const queryParams = new URLSearchParams({
          exclude: currentVideoId,
          category,
          tags: tags.join(','),
          limit: limit.toString()
        })

        const response = await fetch(`/api/videos/recommended?${queryParams}`)
        
        if (!response.ok) {
          throw new Error('추천 비디오를 불러올 수 없습니다')
        }

        const data = await response.json()
        setVideos(data.videos || [])
      } catch (err) {
        console.error('Failed to load recommended videos:', err)
        setError(err instanceof Error ? err.message : '추천 비디오 로딩 중 오류가 발생했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    loadRecommendedVideos()
  }, [currentVideoId, category, tags, limit])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleVideoAction = (action: string, videoId: string) => {
    switch (action) {
      case 'bookmark':
        // 북마크 추가/제거 로직
        console.log('Bookmark video:', videoId)
        break
      case 'share':
        // 공유 로직
        const shareUrl = `${window.location.origin}/watch/${videoId}`
        if (navigator.share) {
          navigator.share({
            title: '비디오 공유',
            url: shareUrl,
          }).catch(console.error)
        } else {
          navigator.clipboard.writeText(shareUrl)
        }
        break
      case 'report':
        // 신고 로직
        console.log('Report video:', videoId)
        break
    }
  }

  const VideoCard = ({ video }: { video: RecommendedVideo }) => (
    <Card className="group hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* 썸네일 */}
        <Link href={`/watch/${video.id}`} className="relative flex-shrink-0">
          <div className="relative w-40 h-24 bg-muted rounded-lg overflow-hidden">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            
            {/* 재생 시간 오버레이 */}
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </div>

            {/* 호버 시 재생 아이콘 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        </Link>

        {/* 비디오 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link 
                href={`/watch/${video.id}`}
                className="block"
              >
                <h4 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200 mb-1">
                  {video.title}
                </h4>
              </Link>

              <Link 
                href={`/channel/${video.creator.id}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{video.creator.name}</span>
                  {video.creator.isVerified && (
                    <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatNumber(video.views)}회</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(video.createdAt), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </span>
                </div>
              </div>

              {/* 카테고리 뱃지 */}
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {video.category}
                </Badge>
              </div>
            </div>

            {/* 액션 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleVideoAction('bookmark', video.id)}>
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  나중에 볼 동영상에 저장
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleVideoAction('share', video.id)}>
                  <Share className="w-4 h-4 mr-2" />
                  공유
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleVideoAction('report', video.id)}>
                  <Flag className="w-4 h-4 mr-2" />
                  신고
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  )

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">추천 동영상</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">추천 동영상</h3>
      
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="p-3">
              <div className="flex gap-3">
                <Skeleton className="w-40 h-24 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">추천할 동영상이 없습니다.</p>
        </div>
      )}
    </div>
  )
}