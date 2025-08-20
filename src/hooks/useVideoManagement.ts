'use client'

import { useState, useCallback, useEffect } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client'

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

interface FilterOptions {
  status: string
  visibility: string
  category: string
  dateRange: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function useVideoManagement() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalVideos, setTotalVideos] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // 비디오 목록 로드
  const loadVideos = useCallback(async (
    filters: FilterOptions,
    searchQuery: string,
    loadMore = false
  ) => {
    setIsLoading(true)
    
    try {
      const page = loadMore ? currentPage + 1 : 1
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value && value !== 'all') {
            acc[key] = value
          }
          return acc
        }, {} as Record<string, string>)
      })

      const response = await apiGet(`/api/videos?${params.toString()}`)
      const data = response as any

      if (loadMore) {
        setVideos(prev => [...prev, ...data.videos])
      } else {
        setVideos(data.videos)
      }

      setTotalVideos(data.total)
      setHasMore(data.videos.length === pageSize)
      setCurrentPage(page)
    } catch (error) {
      console.error('Failed to load videos:', error)
      
      // 데모 데이터 (API가 없을 때)
      const demoVideos: Video[] = [
        {
          id: '1',
          title: '첫 번째 라이브 스트리밍 하이라이트',
          description: '오늘 진행한 라이브 스트리밍의 하이라이트 영상입니다.',
          thumbnailUrl: 'https://picsum.photos/seed/1/320/180',
          videoUrl: '/sample-video.mp4',
          duration: 324,
          status: 'published',
          visibility: 'public',
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          views: 15234,
          likes: 892,
          comments: 45,
          revenue: 125000,
          category: 'gaming',
          tags: ['게임', '라이브', '하이라이트']
        },
        {
          id: '2',
          title: '튜토리얼: 라이브 스트리밍 시작하기',
          description: '초보자를 위한 라이브 스트리밍 가이드',
          thumbnailUrl: 'https://picsum.photos/seed/2/320/180',
          videoUrl: '/sample-video.mp4',
          duration: 720,
          status: 'published',
          visibility: 'public',
          uploadedAt: new Date(Date.now() - 172800000).toISOString(),
          publishedAt: new Date(Date.now() - 172800000).toISOString(),
          views: 8923,
          likes: 567,
          comments: 89,
          revenue: 89000,
          category: 'education',
          tags: ['튜토리얼', '가이드', '교육']
        },
        {
          id: '3',
          title: '새로운 게임 플레이 영상',
          description: '최신 게임을 플레이하는 영상입니다.',
          thumbnailUrl: 'https://picsum.photos/seed/3/320/180',
          videoUrl: '/sample-video.mp4',
          duration: 1845,
          status: 'draft',
          visibility: 'private',
          uploadedAt: new Date(Date.now() - 3600000).toISOString(),
          views: 0,
          likes: 0,
          comments: 0,
          revenue: 0,
          category: 'gaming',
          tags: ['게임', '신작']
        },
        {
          id: '4',
          title: '음악 라이브 세션',
          description: '어쿠스틱 기타 라이브 세션',
          thumbnailUrl: 'https://picsum.photos/seed/4/320/180',
          videoUrl: '/sample-video.mp4',
          duration: 2400,
          status: 'scheduled',
          visibility: 'public',
          uploadedAt: new Date().toISOString(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          views: 0,
          likes: 0,
          comments: 0,
          revenue: 0,
          category: 'music',
          tags: ['음악', '라이브', '기타']
        }
      ]

      if (loadMore) {
        setVideos(prev => [...prev, ...demoVideos])
      } else {
        setVideos(demoVideos)
      }
      setTotalVideos(demoVideos.length)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage])

  // 비디오 업데이트
  const updateVideo = useCallback(async (videoId: string, updates: Partial<Video>) => {
    try {
      const response = await apiPut(`/api/videos/${videoId}`, updates)
      
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, ...updates }
          : video
      ))
      
      return response
    } catch (error) {
      console.error('Failed to update video:', error)
      
      // 데모: 로컬 업데이트
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, ...updates }
          : video
      ))
    }
  }, [])

  // 비디오 삭제
  const deleteVideo = useCallback(async (videoId: string) => {
    try {
      await apiDelete(`/api/videos/${videoId}`)
      setVideos(prev => prev.filter(video => video.id !== videoId))
      setTotalVideos(prev => prev - 1)
    } catch (error) {
      console.error('Failed to delete video:', error)
      
      // 데모: 로컬 삭제
      setVideos(prev => prev.filter(video => video.id !== videoId))
      setTotalVideos(prev => prev - 1)
    }
  }, [])

  // 여러 비디오 삭제
  const deleteMultipleVideos = useCallback(async (videoIds: string[]) => {
    try {
      await apiPost('/api/videos/bulk-delete', { videoIds })
      setVideos(prev => prev.filter(video => !videoIds.includes(video.id)))
      setTotalVideos(prev => prev - videoIds.length)
    } catch (error) {
      console.error('Failed to delete videos:', error)
      
      // 데모: 로컬 삭제
      setVideos(prev => prev.filter(video => !videoIds.includes(video.id)))
      setTotalVideos(prev => prev - videoIds.length)
    }
  }, [])

  // 여러 비디오 업데이트
  const updateMultipleVideos = useCallback(async (
    videoIds: string[],
    updates: Partial<Video>
  ) => {
    try {
      await apiPost('/api/videos/bulk-update', { videoIds, updates })
      
      setVideos(prev => prev.map(video => 
        videoIds.includes(video.id)
          ? { ...video, ...updates }
          : video
      ))
    } catch (error) {
      console.error('Failed to update videos:', error)
      
      // 데모: 로컬 업데이트
      setVideos(prev => prev.map(video => 
        videoIds.includes(video.id)
          ? { ...video, ...updates }
          : video
      ))
    }
  }, [])

  // 비디오 목록 새로고침
  const refreshVideos = useCallback(async () => {
    setCurrentPage(1)
    await loadVideos(
      {
        status: 'all',
        visibility: 'all',
        category: 'all',
        dateRange: 'all',
        sortBy: 'uploadedAt',
        sortOrder: 'desc'
      },
      ''
    )
  }, [loadVideos])

  return {
    videos,
    isLoading,
    hasMore,
    totalVideos,
    loadVideos,
    updateVideo,
    deleteVideo,
    deleteMultipleVideos,
    updateMultipleVideos,
    refreshVideos
  }
}