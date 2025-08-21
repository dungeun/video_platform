'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Users, Eye, Clock, Calendar, Heart, MessageSquare, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface Video {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  duration: number
  views: number
  uploadedAt: string
  creator: {
    id: string
    name: string
    avatar: string
  }
}

interface Stream {
  id: string
  title: string
  thumbnailUrl: string
  viewerCount: number
  category: string
  creator: {
    id: string
    name: string
    avatar: string
  }
  isLive: boolean
}

interface Creator {
  id: string
  name: string
  avatar: string
  bio: string
  subscriberCount: number
  videoCount: number
  isVerified: boolean
  isLive: boolean
}

interface SearchResultsData {
  videos: Video[]
  streams: Stream[]
  creators: Creator[]
  total: number
}

interface SearchResultsProps {
  results: SearchResultsData
  activeTab: 'all' | 'videos' | 'live' | 'creators'
  viewMode: 'grid' | 'list'
  isLoading: boolean
  onLoadMore: () => void
  hasMore: boolean
}

export default function SearchResults({
  results,
  activeTab,
  viewMode,
  isLoading,
  onLoadMore,
  hasMore
}: SearchResultsProps) {
  const observerTarget = useRef<HTMLDivElement>(null)

  // 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

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
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    if (days < 30) return `${Math.floor(days / 7)}주 전`
    if (days < 365) return `${Math.floor(days / 30)}개월 전`
    return `${Math.floor(days / 365)}년 전`
  }

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // 비디오 카드
  const VideoCard = ({ video }: { video: Video }) => {
    if (viewMode === 'list') {
      return (
        <div className="flex gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
          <Link href={`/watch/${video.id}`} className="relative flex-shrink-0">
            <img
              src={video.thumbnailUrl || '/placeholder-video.jpg'}
              alt={video.title}
              className="w-60 h-36 object-cover rounded-lg"
            />
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.duration)}
            </span>
          </Link>
          
          <div className="flex-1">
            <Link href={`/watch/${video.id}`}>
              <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-red-600">
                {video.title}
              </h3>
            </Link>
            
            <div className="flex items-center gap-2 mt-2">
              <Link href={`/channel/${video.creator.id}`} className="flex items-center gap-2 hover:opacity-80">
                <img
                  src={video.creator.avatar || '/default-avatar.png'}
                  alt={video.creator.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-600">{video.creator.name}</span>
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {video.description}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formatViewCount(video.views)}회
              </span>
              <span>{formatDate(video.uploadedAt)}</span>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <Link href={`/watch/${video.id}`} className="block relative">
          <img
            src={video.thumbnailUrl || '/placeholder-video.jpg'}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </span>
        </Link>
        
        <div className="p-3">
          <Link href={`/watch/${video.id}`}>
            <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-red-600">
              {video.title}
            </h3>
          </Link>
          
          <Link href={`/channel/${video.creator.id}`} className="flex items-center gap-2 mt-2 hover:opacity-80">
            <img
              src={video.creator.avatar || '/default-avatar.png'}
              alt={video.creator.name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-600">{video.creator.name}</span>
          </Link>
          
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <span>{formatViewCount(video.views)}회</span>
            <span>•</span>
            <span>{formatDate(video.uploadedAt)}</span>
          </div>
        </div>
      </div>
    )
  }

  // 스트림 카드
  const StreamCard = ({ stream }: { stream: Stream }) => {
    if (viewMode === 'list') {
      return (
        <div className="flex gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
          <Link href={`/watch-live/${stream.id}`} className="relative flex-shrink-0">
            <img
              src={stream.thumbnailUrl || '/placeholder-stream.jpg'}
              alt={stream.title}
              className="w-60 h-36 object-cover rounded-lg"
            />
            {stream.isLive && (
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">
                LIVE
              </span>
            )}
          </Link>
          
          <div className="flex-1">
            <Link href={`/watch-live/${stream.id}`}>
              <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-red-600">
                {stream.title}
              </h3>
            </Link>
            
            <Link href={`/channel/${stream.creator.id}`} className="flex items-center gap-2 mt-2 hover:opacity-80">
              <img
                src={stream.creator.avatar || '/default-avatar.png'}
                alt={stream.creator.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-600">{stream.creator.name}</span>
            </Link>
            
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">
                <Users className="w-4 h-4 inline mr-1" />
                {formatViewCount(stream.viewerCount)}명 시청 중
              </span>
              <span className="text-sm text-gray-500">{stream.category}</span>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <Link href={`/watch-live/${stream.id}`} className="block relative">
          <img
            src={stream.thumbnailUrl || '/placeholder-stream.jpg'}
            alt={stream.title}
            className="w-full aspect-video object-cover"
          />
          {stream.isLive && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">
              LIVE
            </span>
          )}
          <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            <Users className="w-3 h-3 inline mr-1" />
            {formatViewCount(stream.viewerCount)}
          </div>
        </Link>
        
        <div className="p-3">
          <Link href={`/watch-live/${stream.id}`}>
            <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-red-600">
              {stream.title}
            </h3>
          </Link>
          
          <Link href={`/channel/${stream.creator.id}`} className="flex items-center gap-2 mt-2 hover:opacity-80">
            <img
              src={stream.creator.avatar || '/default-avatar.png'}
              alt={stream.creator.name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-600">{stream.creator.name}</span>
          </Link>
          
          <p className="text-sm text-gray-500 mt-1">{stream.category}</p>
        </div>
      </div>
    )
  }

  // 크리에이터 카드
  const CreatorCard = ({ creator }: { creator: Creator }) => {
    return (
      <div className="bg-white rounded-lg p-4 hover:shadow-lg transition-shadow">
        <Link href={`/channel/${creator.id}`} className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={creator.avatar || '/default-avatar.png'}
              alt={creator.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            {creator.isLive && (
              <span className="absolute bottom-0 right-0 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                LIVE
              </span>
            )}
          </div>
          
          <h3 className="font-semibold text-gray-900 mt-3 flex items-center gap-1">
            {creator.name}
            {creator.isVerified && (
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </h3>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {creator.bio}
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>{formatViewCount(creator.subscriberCount)} 구독자</span>
            <span>{creator.videoCount}개 동영상</span>
          </div>
          
          <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
            구독
          </button>
        </Link>
      </div>
    )
  }

  // 로딩 상태
  if (isLoading && results.total === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // 결과 없음
  if (!isLoading && results.total === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">검색 결과가 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">다른 검색어를 시도해보세요.</p>
      </div>
    )
  }

  return (
    <div>
      {/* 전체 탭 */}
      {activeTab === 'all' && (
        <div className="space-y-8">
          {/* 비디오 섹션 */}
          {results.videos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">비디오</h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
                {results.videos.slice(0, 8).map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}

          {/* 라이브 섹션 */}
          {results.streams.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">라이브 스트림</h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
                {results.streams.slice(0, 4).map(stream => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </div>
          )}

          {/* 크리에이터 섹션 */}
          {results.creators.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">크리에이터</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.creators.slice(0, 4).map(creator => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 비디오 탭 */}
      {activeTab === 'videos' && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
          {results.videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* 라이브 탭 */}
      {activeTab === 'live' && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
          {results.streams.map(stream => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}

      {/* 크리에이터 탭 */}
      {activeTab === 'creators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.creators.map(creator => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}

      {/* 무한 스크롤 타겟 */}
      <div ref={observerTarget} className="h-10" />

      {/* 로딩 인디케이터 */}
      {isLoading && results.total > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )}
    </div>
  )
}