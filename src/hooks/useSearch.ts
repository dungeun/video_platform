'use client'

import { useState, useCallback, useEffect } from 'react'
import { apiGet } from '@/lib/api/client'

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

interface SearchResults {
  videos: Video[]
  streams: Stream[]
  creators: Creator[]
  total: number
}

interface SearchFilters {
  category: string
  duration: string
  uploadDate: string
  sortBy: string
  viewCount: string
  type: string[]
}

export function useSearch() {
  const [results, setResults] = useState<SearchResults>({
    videos: [],
    streams: [],
    creators: [],
    total: 0
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentQuery, setCurrentQuery] = useState('')
  const [currentTab, setCurrentTab] = useState<'all' | 'videos' | 'live' | 'creators'>('all')
  
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    duration: 'all',
    uploadDate: 'all',
    sortBy: 'relevance',
    viewCount: 'all',
    type: []
  })
  
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [trending, setTrending] = useState<string[]>([])

  // 인기 검색어 로드
  useEffect(() => {
    loadTrending()
  }, [])

  const loadTrending = async () => {
    try {
      const response = await apiGet('/api/search/trending')
      const data = response as any
      setTrending(data.trending || [])
    } catch (error) {
      console.error('Failed to load trending:', error)
      
      // 데모 데이터
      setTrending([
        '게임 플레이',
        '요리 레시피',
        '뮤직비디오',
        '튜토리얼',
        'ASMR',
        '브이로그',
        '리뷰',
        '운동 루틴'
      ])
    }
  }

  // 자동완성 제안 로드
  const loadSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await apiGet(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
      const data = response as any
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Failed to load suggestions:', error)
      
      // 데모 데이터
      const demoSuggestions = [
        `${query} 튜토리얼`,
        `${query} 가이드`,
        `${query} 리뷰`,
        `${query} 하이라이트`,
        `${query} 라이브`,
        `${query} 초보자`,
        `${query} 전문가`,
        `${query} 2024`
      ].filter(s => s.toLowerCase().includes(query.toLowerCase()))
      
      setSuggestions(demoSuggestions.slice(0, 5))
    }
  }, [])

  // 검색 실행
  const search = useCallback(async (
    query: string,
    tab: 'all' | 'videos' | 'live' | 'creators',
    searchFilters?: SearchFilters,
    page = 1
  ) => {
    if (!query.trim()) return

    setIsLoading(true)
    setCurrentQuery(query)
    setCurrentTab(tab)
    setCurrentPage(page)

    const activeFilters = searchFilters || filters

    try {
      const params = new URLSearchParams({
        q: query,
        tab,
        page: page.toString(),
        limit: '20',
        ...Object.entries(activeFilters).reduce((acc, [key, value]) => {
          if (key === 'type' && Array.isArray(value) && value.length > 0) {
            acc[key] = value.join(',')
          } else if (value && value !== 'all') {
            acc[key] = value.toString()
          }
          return acc
        }, {} as Record<string, string>)
      })

      const response = await apiGet(`/api/search?${params.toString()}`)
      const data = response as any

      if (page === 1) {
        setResults(data)
      } else {
        setResults(prev => ({
          videos: [...prev.videos, ...(data.videos || [])],
          streams: [...prev.streams, ...(data.streams || [])],
          creators: [...prev.creators, ...(data.creators || [])],
          total: data.total || prev.total
        }))
      }

      setHasMore(
        (tab === 'videos' && data.videos?.length === 20) ||
        (tab === 'live' && data.streams?.length === 20) ||
        (tab === 'creators' && data.creators?.length === 20) ||
        (tab === 'all' && data.total > page * 20)
      )

      // 자동완성 업데이트
      if (page === 1) {
        loadSuggestions(query)
      }
    } catch (error) {
      console.error('Search failed:', error)
      
      // 데모 데이터
      const demoResults = generateDemoResults(query, tab, page)
      
      if (page === 1) {
        setResults(demoResults)
      } else {
        setResults(prev => ({
          videos: [...prev.videos, ...demoResults.videos],
          streams: [...prev.streams, ...demoResults.streams],
          creators: [...prev.creators, ...demoResults.creators],
          total: prev.total + demoResults.total
        }))
      }
      
      setHasMore(page < 3) // 데모는 3페이지까지만
    } finally {
      setIsLoading(false)
    }
  }, [filters, loadSuggestions])

  // 더 불러오기
  const loadMore = useCallback(async () => {
    if (!currentQuery || isLoading || !hasMore) return
    
    await search(currentQuery, currentTab, filters, currentPage + 1)
  }, [currentQuery, currentTab, filters, currentPage, isLoading, hasMore, search])

  // 데모 결과 생성
  const generateDemoResults = (query: string, tab: string, page: number): SearchResults => {
    const baseIndex = (page - 1) * 20
    
    const demoVideos: Video[] = tab === 'all' || tab === 'videos' 
      ? Array.from({ length: tab === 'all' ? 8 : 20 }, (_, i) => ({
          id: `video-${baseIndex + i}`,
          title: `${query} 관련 비디오 ${baseIndex + i + 1}`,
          description: `이것은 "${query}"에 대한 검색 결과입니다. 다양한 콘텐츠를 확인해보세요.`,
          thumbnailUrl: `https://picsum.photos/seed/${baseIndex + i}/320/180`,
          duration: Math.floor(Math.random() * 3600),
          views: Math.floor(Math.random() * 1000000),
          uploadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          creator: {
            id: `creator-${i % 5}`,
            name: `크리에이터 ${i % 5 + 1}`,
            avatar: `https://picsum.photos/seed/creator${i % 5}/40/40`
          }
        }))
      : []

    const demoStreams: Stream[] = tab === 'all' || tab === 'live'
      ? Array.from({ length: tab === 'all' ? 4 : 20 }, (_, i) => ({
          id: `stream-${baseIndex + i}`,
          title: `${query} 라이브 스트림 ${baseIndex + i + 1}`,
          thumbnailUrl: `https://picsum.photos/seed/stream${baseIndex + i}/320/180`,
          viewerCount: Math.floor(Math.random() * 10000),
          category: ['게임', '음악', '토크쇼', '교육'][i % 4],
          creator: {
            id: `creator-${i % 5}`,
            name: `스트리머 ${i % 5 + 1}`,
            avatar: `https://picsum.photos/seed/streamer${i % 5}/40/40`
          },
          isLive: Math.random() > 0.3
        }))
      : []

    const demoCreators: Creator[] = tab === 'all' || tab === 'creators'
      ? Array.from({ length: tab === 'all' ? 4 : 20 }, (_, i) => ({
          id: `creator-${baseIndex + i}`,
          name: `${query} 크리에이터 ${baseIndex + i + 1}`,
          avatar: `https://picsum.photos/seed/avatar${baseIndex + i}/120/120`,
          bio: `"${query}"에 대한 전문 크리에이터입니다. 다양한 콘텐츠를 제작하고 있습니다.`,
          subscriberCount: Math.floor(Math.random() * 1000000),
          videoCount: Math.floor(Math.random() * 500),
          isVerified: Math.random() > 0.5,
          isLive: Math.random() > 0.7
        }))
      : []

    return {
      videos: demoVideos,
      streams: demoStreams,
      creators: demoCreators,
      total: tab === 'all' 
        ? demoVideos.length + demoStreams.length + demoCreators.length
        : tab === 'videos' 
          ? 60 
          : tab === 'live' 
            ? 40 
            : 30
    }
  }

  return {
    results,
    isLoading,
    hasMore,
    filters,
    setFilters,
    search,
    loadMore,
    suggestions,
    trending
  }
}