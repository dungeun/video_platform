'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Clock, TrendingUp, User, Hash } from 'lucide-react'

interface SearchSuggestion {
  id: string
  type: 'query' | 'video' | 'channel' | 'tag'
  text: string
  subtitle?: string
  icon?: React.ReactNode
  metadata?: {
    views?: number
    uploadedAt?: string
    channelName?: string
  }
}

interface SearchSuggestionsProps {
  query: string
  onSelect: (suggestion: SearchSuggestion) => void
  onClose: () => void
  isVisible: boolean
}

export default function SearchSuggestions({ 
  query, 
  onSelect, 
  onClose, 
  isVisible 
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // 검색 제안 데이터 로드
  useEffect(() => {
    if (!query.trim() || !isVisible) {
      setSuggestions([])
      return
    }

    const loadSuggestions = async () => {
      setLoading(true)
      try {
        // 검색 기록에서 제안 가져오기
        const recentSearches = getRecentSearches(query)
        
        // 인기 검색어
        const popularQueries = getPopularQueries(query)
        
        // 비디오 제목 검색
        let videoSuggestions: SearchSuggestion[] = []
        if (query.length >= 2) {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&type=videos&limit=3`)
          if (response.ok) {
            const data = await response.json()
            videoSuggestions = data.videos?.map((video: any) => ({
              id: `video-${video.id}`,
              type: 'video' as const,
              text: video.title,
              subtitle: video.channelName,
              icon: <Search className="w-4 h-4" />,
              metadata: {
                views: video.viewCount,
                channelName: video.channelName
              }
            })) || []
          }
        }

        // 채널 검색
        let channelSuggestions: SearchSuggestion[] = []
        if (query.length >= 2) {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&type=channels&limit=2`)
          if (response.ok) {
            const data = await response.json()
            channelSuggestions = data.channels?.map((channel: any) => ({
              id: `channel-${channel.id}`,
              type: 'channel' as const,
              text: channel.name,
              subtitle: `${channel.subscriberCount?.toLocaleString() || 0}명 구독`,
              icon: <User className="w-4 h-4" />
            })) || []
          }
        }

        // 태그 제안
        const tagSuggestions = getTagSuggestions(query)

        // 모든 제안 합치기
        const allSuggestions = [
          ...recentSearches,
          ...popularQueries,
          ...videoSuggestions,
          ...channelSuggestions,
          ...tagSuggestions
        ].slice(0, 8) // 최대 8개

        setSuggestions(allSuggestions)
      } catch (error) {
        console.error('Failed to load search suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(loadSuggestions, 150)
    return () => clearTimeout(debounceTimer)
  }, [query, isVisible])

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0) {
            onSelect(suggestions[selectedIndex])
          }
          break
        case 'Escape':
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, suggestions, selectedIndex, onSelect, onClose])

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    
    return undefined
  }, [isVisible, onClose])

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    // 검색 기록에 추가
    addToSearchHistory(suggestion.text)
    onSelect(suggestion)
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video':
        return <Search className="w-4 h-4 text-gray-400" />
      case 'channel':
        return <User className="w-4 h-4 text-gray-400" />
      case 'tag':
        return <Hash className="w-4 h-4 text-gray-400" />
      case 'query':
        return <Clock className="w-4 h-4 text-gray-400" />
      default:
        return <TrendingUp className="w-4 h-4 text-gray-400" />
    }
  }

  if (!isVisible || (!loading && suggestions.length === 0)) {
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="py-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                index === selectedIndex ? 'bg-gray-50' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.icon || getIconForType(suggestion.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {highlightQuery(suggestion.text, query)}
                </div>
                {suggestion.subtitle && (
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.subtitle}
                  </div>
                )}
              </div>
              {suggestion.metadata?.views && (
                <div className="text-xs text-gray-400">
                  {formatViewCount(suggestion.metadata.views)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 유틸리티 함수들
function getRecentSearches(query: string): SearchSuggestion[] {
  try {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    return recent
      .filter((search: string) => 
        search.toLowerCase().includes(query.toLowerCase()) && search !== query
      )
      .slice(0, 3)
      .map((search: string) => ({
        id: `recent-${search}`,
        type: 'query' as const,
        text: search,
        icon: <Clock className="w-4 h-4 text-gray-400" />
      }))
  } catch {
    return []
  }
}

function getPopularQueries(query: string): SearchSuggestion[] {
  const popular = [
    '뷰티 튜토리얼', '요리 레시피', '운동 루틴', '여행 브이로그', '게임 실황',
    '패션 하울', 'K-POP', '영화 리뷰', 'DIY', '펫 동영상'
  ]
  
  return popular
    .filter(term => term.toLowerCase().includes(query.toLowerCase()) && term !== query)
    .slice(0, 2)
    .map(term => ({
      id: `popular-${term}`,
      type: 'query' as const,
      text: term,
      icon: <TrendingUp className="w-4 h-4 text-gray-400" />
    }))
}

function getTagSuggestions(query: string): SearchSuggestion[] {
  const tags = [
    '뷰티', '패션', '요리', '여행', '운동', '게임', '음악', '댄스', 
    'ASMR', '브이로그', '리뷰', '언박싱', '메이크업', '스타일링'
  ]
  
  return tags
    .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 2)
    .map(tag => ({
      id: `tag-${tag}`,
      type: 'tag' as const,
      text: `#${tag}`,
      icon: <Hash className="w-4 h-4 text-gray-400" />
    }))
}

function addToSearchHistory(query: string) {
  try {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    const updated = [query, ...recent.filter((q: string) => q !== query)].slice(0, 10)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

function highlightQuery(text: string, query: string) {
  if (!query.trim()) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  
  return parts.map((part, index) => 
    regex.test(part) ? 
      <mark key={index} className="bg-yellow-200 px-0">{part}</mark> : 
      part
  )
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M회`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K회`
  } else {
    return `${count}회`
  }
}