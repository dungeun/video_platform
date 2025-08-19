'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Eye, Clock, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { formatDuration, formatViewCount, formatTimeAgo } from '@/lib/utils/video'
import type { VideoCardProps } from '@/types/video'

interface VideoThumbnailProps {
  video: VideoCardProps['video']
  variant: NonNullable<VideoCardProps['variant']>
}

function VideoThumbnail({ video, variant }: VideoThumbnailProps) {
  const sizeClasses = {
    compact: 'h-20 sm:h-24 w-full',
    default: 'h-32 sm:h-40 md:h-48 w-full',
    large: 'h-40 sm:h-48 md:h-56 w-full'
  }

  return (
    <div className={cn('relative rounded-t-lg overflow-hidden bg-gray-100', sizeClasses[variant])}>
      {/* 썸네일 이미지 */}
      <Image
        src={video.thumbnailUrl}
        alt={video.title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      />
      
      {/* 재생 시간 (모바일 최적화) */}
      {video.duration > 0 && (
        <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black bg-opacity-80 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
          {formatDuration(video.duration)}
        </div>
      )}
      
      {/* 라이브 표시 (모바일 최적화) */}
      {video.isLive && (
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-600 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
      
      {/* 호버 시 플레이 버튼 (모바일에서 작게) */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
        <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 fill-current" />
      </div>
    </div>
  )
}

interface VideoInfoProps {
  video: VideoCardProps['video']
  variant: NonNullable<VideoCardProps['variant']>
  showDescription: boolean
  showCreator: boolean
}

function VideoInfo({ video, variant, showDescription, showCreator }: VideoInfoProps) {
  const titleClasses = {
    compact: 'text-xs sm:text-sm font-medium line-clamp-2',
    default: 'text-sm sm:text-base font-semibold line-clamp-2',
    large: 'text-base sm:text-lg font-bold line-clamp-2'
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 flex-1">
      {/* 제목 (모바일 최적화) */}
      <h3 className={cn(
        'text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-1 sm:mb-2',
        titleClasses[variant]
      )}>
        {video.title}
      </h3>

      {/* 크리에이터 정보 (모바일 최적화) */}
      {showCreator && video.creator && (
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
          {video.creator.profileImage ? (
            <Image
              src={video.creator.profileImage}
              alt={video.creator.name}
              width={16}
              height={16}
              className="rounded-full sm:w-5 sm:h-5"
            />
          ) : (
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600">
                {video.creator.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 truncate">
            {video.creator.name || 'Unknown Creator'}
            {video.creator.isVerified && (
              <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 flex-shrink-0" />
            )}
          </span>
        </div>
      )}

      {/* 설명 (모바일에서는 숨김) */}
      {showDescription && video.description && variant !== 'compact' && (
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-1 sm:mb-2 hidden sm:block">
          {video.description}
        </p>
      )}

      {/* 비디오 메타데이터 (모바일 최적화) */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="text-xs">{formatViewCount(video.viewCount)}</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="text-xs">{formatTimeAgo(video.createdAt)}</span>
        </div>
      </div>

      {/* 카테고리 및 태그 (모바일에서는 축소) */}
      {variant === 'large' && (video.category || video.tags?.length) && (
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
          {video.category && (
            <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {video.category}
            </span>
          )}
          {video.tags?.slice(0, variant === 'large' ? 2 : 3).map(tag => (
            <span key={tag} className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-blue-100 text-blue-700 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VideoCard({
  video,
  variant = 'default',
  onClick,
  showDescription = false,
  showCreator = true,
  className
}: VideoCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(video.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  // YouTube 비디오인지 확인
  const isYouTubeVideo = video.videoUrl && video.videoUrl.includes('youtube.com');
  
  // YouTube 비디오의 경우 ID에서 YouTube ID 추출 또는 다른 라우팅 사용
  const getVideoHref = () => {
    if (isYouTubeVideo) {
      // YouTube 비디오는 /videos/youtube/[id] 경로 사용
      // ID가 yt_로 시작하면 YouTube 비디오
      if (video.id.startsWith('yt_')) {
        return `/videos/youtube/${video.id}`;
      }
      // 또는 videoUrl에서 YouTube ID 추출
      const youtubeIdMatch = video.videoUrl?.match(/watch\?v=([^&]+)/);
      if (youtubeIdMatch) {
        return `/videos/youtube/yt_${youtubeIdMatch[1]}`;
      }
    }
    return `/videos/${video.id}`;
  };

  const cardContent = (
    <Card 
      variant="default" 
      padding="none"
      className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden"
    >
      <div className="flex flex-col h-full">
        <VideoThumbnail video={video} variant={variant} />
        <VideoInfo 
          video={video} 
          variant={variant} 
          showDescription={showDescription}
          showCreator={showCreator}
        />
      </div>
    </Card>
  )

  if (onClick) {
    return (
      <div 
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${video.title} 비디오 재생`}
        className={cn(
          'group block cursor-pointer',
          className
        )}
      >
        {cardContent}
      </div>
    )
  } else {
    return (
      <Link 
        href={getVideoHref()}
        aria-label={`${video.title} 비디오 페이지로 이동`}
        className={cn(
          'group block',
          className
        )}
      >
        {cardContent}
      </Link>
    )
  }
}

// VideoCard 변형들을 위한 편의 컴포넌트들
export function CompactVideoCard(props: Omit<VideoCardProps, 'variant'>) {
  return <VideoCard {...props} variant="compact" />
}

export function LargeVideoCard(props: Omit<VideoCardProps, 'variant'>) {
  return <VideoCard {...props} variant="large" showDescription />
}