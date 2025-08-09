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
    compact: 'h-24 w-full',
    default: 'h-48 w-full',
    large: 'h-56 w-full'
  }

  return (
    <div className={cn('relative rounded-t-lg overflow-hidden bg-gray-100', sizeClasses[variant])}>
      {/* 썸네일 이미지 */}
      <Image
        src={video.thumbnailUrl}
        alt={video.title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* 재생 시간 */}
      {video.duration > 0 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
      )}
      
      {/* 라이브 표시 */}
      {video.isLive && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
      
      {/* 호버 시 플레이 버튼 */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 fill-current" />
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
    compact: 'text-sm font-medium line-clamp-2',
    default: 'text-base font-semibold line-clamp-2',
    large: 'text-lg font-bold line-clamp-2'
  }

  return (
    <div className="p-4 flex-1">
      {/* 제목 */}
      <h3 className={cn(
        'text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2',
        titleClasses[variant]
      )}>
        {video.title}
      </h3>

      {/* 크리에이터 정보 */}
      {showCreator && (
        <div className="flex items-center gap-2 mb-2">
          {video.creator.profileImage ? (
            <Image
              src={video.creator.profileImage}
              alt={video.creator.name}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600">
                {video.creator.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm text-gray-600 flex items-center gap-1">
            {video.creator.name}
            {video.creator.isVerified && (
              <CheckCircle className="w-3 h-3 text-blue-500" />
            )}
          </span>
        </div>
      )}

      {/* 설명 */}
      {showDescription && video.description && variant !== 'compact' && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {video.description}
        </p>
      )}

      {/* 비디오 메타데이터 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{formatViewCount(video.viewCount)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(video.createdAt)}</span>
        </div>
      </div>

      {/* 카테고리 및 태그 */}
      {variant === 'large' && (video.category || video.tags?.length) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {video.category && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {video.category}
            </span>
          )}
          {video.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
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
        href={`/videos/${video.id}`}
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