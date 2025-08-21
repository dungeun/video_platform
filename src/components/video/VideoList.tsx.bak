'use client'

import React from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import VideoCard from './VideoCard'
import { cn } from '@/lib/utils'
import type { VideoListProps } from '@/types/video'

export default function VideoList({
  videos,
  loading = false,
  onVideoClick,
  variant = 'default',
  columns = 4,
  className
}: VideoListProps) {
  // 로딩 상태 (모바일 최적화)
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          <span className="text-sm sm:text-base">비디오를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  // 비디오가 없는 경우 (모바일 최적화)
  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-white mb-2">
          표시할 비디오가 없습니다
        </h3>
        <p className="text-sm sm:text-base text-gray-400">
          비디오가 업로드되면 여기에 표시됩니다.
        </p>
      </div>
    )
  }

  // 그리드 컬럼 클래스 매핑 (모바일 최적화)
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
  }

  // 갭 크기 (모바일 최적화)
  const gapClasses = {
    compact: 'gap-2 sm:gap-3',
    default: 'gap-3 sm:gap-4 md:gap-6',
    large: 'gap-4 sm:gap-6 md:gap-8'
  }

  return (
    <div className={cn(
      'grid',
      gridClasses[columns as keyof typeof gridClasses] || gridClasses[4],
      gapClasses[variant],
      className
    )}>
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          variant={variant}
          onClick={onVideoClick}
          showDescription={variant === 'large'}
          showCreator={true}
        />
      ))}
    </div>
  )
}

// 특정 레이아웃을 위한 편의 컴포넌트들
export function VideoGrid({ videos, loading, onVideoClick, className }: Omit<VideoListProps, 'columns' | 'variant'>) {
  return (
    <VideoList
      videos={videos}
      loading={loading}
      onVideoClick={onVideoClick}
      variant="default"
      columns={4}
      className={className}
    />
  )
}

export function CompactVideoGrid({ videos, loading, onVideoClick, className }: Omit<VideoListProps, 'columns' | 'variant'>) {
  return (
    <VideoList
      videos={videos}
      loading={loading}
      onVideoClick={onVideoClick}
      variant="compact"
      columns={6}
      className={className}
    />
  )
}

export function LargeVideoGrid({ videos, loading, onVideoClick, className }: Omit<VideoListProps, 'columns' | 'variant'>) {
  return (
    <VideoList
      videos={videos}
      loading={loading}
      onVideoClick={onVideoClick}
      variant="large"
      columns={3}
      className={className}
    />
  )
}

// 사이드바나 관련 비디오를 위한 세로 목록 컴포넌트
export function VideoListVertical({ videos, loading, onVideoClick, className }: Omit<VideoListProps, 'columns' | 'variant'>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">표시할 비디오가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {videos.map((video) => (
        <div key={video.id} className="flex gap-3">
          <div className="flex-shrink-0">
            <VideoCard
              video={video}
              variant="compact"
              onClick={onVideoClick}
              showDescription={false}
              showCreator={false}
              className="w-40"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white line-clamp-2 mb-1">
              {video.title}
            </h4>
            <p className="text-xs text-gray-300 mb-1">{video.creator.name}</p>
            <p className="text-xs text-gray-400">
              조회수 {video.viewCount.toLocaleString()}회
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}