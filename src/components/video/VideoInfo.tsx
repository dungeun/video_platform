'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share, 
  Download,
  Flag,
  Eye,
  Calendar,
  Clock,
  Globe,
  Lock,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Video {
  id: string
  title: string
  description: string
  views: number
  likes: number
  dislikes: number
  createdAt: string
  category: string
  tags: string[]
  language: string
  visibility: 'public' | 'unlisted' | 'private' | 'scheduled'
  duration: number
  isRatingsEnabled: boolean
}

interface VideoInfoProps {
  video: Video
  onLike: () => void
  onDislike: () => void
}

export default function VideoInfo({ video, onLike, onDislike }: VideoInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null)

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

  const getVisibilityIcon = () => {
    switch (video.visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'unlisted':
        return <Users className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getVisibilityText = () => {
    switch (video.visibility) {
      case 'public':
        return '공개'
      case 'unlisted':
        return '비공개 링크'
      case 'private':
        return '비공개'
      default:
        return '공개'
    }
  }

  const handleReaction = (type: 'like' | 'dislike') => {
    if (userReaction === type) {
      setUserReaction(null)
    } else {
      setUserReaction(type)
      if (type === 'like') {
        onLike()
      } else {
        onDislike()
      }
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: window.location.href,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(window.location.href)
      // 토스트 알림 추가 가능
    }
  }

  const createdDate = new Date(video.createdAt)

  return (
    <div className="space-y-4">
      {/* 비디오 제목 */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          {video.title}
        </h1>
        
        {/* 비디오 메타데이터 */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{formatNumber(video.views)}회 시청</span>
          </div>
          
          <span>•</span>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDistanceToNow(createdDate, { 
                addSuffix: true,
                locale: ko 
              })}
            </span>
          </div>
          
          <span>•</span>
          
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(video.duration)}</span>
          </div>
          
          <span>•</span>
          
          <div className="flex items-center gap-1">
            {getVisibilityIcon()}
            <span>{getVisibilityText()}</span>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* 좋아요/싫어요 버튼 */}
          {video.isRatingsEnabled && (
            <div className="flex items-center bg-muted rounded-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('like')}
                className={`rounded-l-full px-4 ${
                  userReaction === 'like' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                    : ''
                }`}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                <span>{formatNumber(video.likes)}</span>
              </Button>
              
              <div className="w-px h-6 bg-border" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('dislike')}
                className={`rounded-r-full px-4 ${
                  userReaction === 'dislike' 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                    : ''
                }`}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                <span>{video.dislikes > 0 ? formatNumber(video.dislikes) : ''}</span>
              </Button>
            </div>
          )}

          {/* 공유 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-full"
          >
            <Share className="h-4 w-4 mr-2" />
            공유
          </Button>

          {/* 다운로드 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <Download className="h-4 w-4 mr-2" />
            다운로드
          </Button>

          {/* 더보기 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full">
                ⋯
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                신고하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 카테고리 및 태그 */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">
          {video.category}
        </Badge>
        {video.tags.slice(0, 5).map((tag, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            #{tag}
          </Badge>
        ))}
        {video.tags.length > 5 && (
          <Badge variant="outline" className="text-xs">
            +{video.tags.length - 5}개 더
          </Badge>
        )}
      </div>

      {/* 비디오 설명 */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-center gap-4 text-xs">
            <span>조회수 {formatNumber(video.views)}회</span>
            <span>
              {formatDistanceToNow(createdDate, { 
                addSuffix: true,
                locale: ko 
              })}
            </span>
          </div>
          
          <div className="text-foreground">
            {isExpanded ? (
              <div className="whitespace-pre-wrap">
                {video.description}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="block mt-2 text-muted-foreground hover:text-foreground text-sm font-medium"
                >
                  간략히 보기
                </button>
              </div>
            ) : (
              <div>
                <p className="line-clamp-3 whitespace-pre-wrap">
                  {video.description}
                </p>
                {video.description.length > 150 && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="mt-2 text-muted-foreground hover:text-foreground text-sm font-medium"
                  >
                    더보기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}