'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SearchSuggestions from './SearchSuggestions'
import { Search, Filter, X, Sliders } from 'lucide-react'

interface VideoSearchProps {
  initialQuery?: string
  initialFilters?: Record<string, any>
  onSearch?: (query: string, filters: Record<string, any>) => void
  compact?: boolean
}

export default function VideoSearch({ 
  initialQuery = '', 
  initialFilters = {},
  onSearch,
  compact = false
}: VideoSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(initialQuery || searchParams.get('search') || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState({
    category: 'all',
    duration: 'all',
    views: 'all',
    sort: 'latest',
    tags: [] as string[],
    ...initialFilters
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // 카테고리 옵션
  const categories = [
    { id: 'all', label: '전체' },
    { id: 'beauty', label: '뷰티' },
    { id: 'fashion', label: '패션' },
    { id: 'food', label: '음식' },
    { id: 'travel', label: '여행' },
    { id: 'tech', label: '기술' },
    { id: 'lifestyle', label: '라이프스타일' },
    { id: 'fitness', label: '운동' },
    { id: 'gaming', label: '게임' },
    { id: 'music', label: '음악' },
    { id: 'education', label: '교육' },
    { id: 'entertainment', label: '엔터테인먼트' }
  ]

  // 정렬 옵션
  const sortOptions = [
    { value: 'latest', label: '최신순' },
    { value: 'popular', label: '인기순' },
    { value: 'views', label: '조회수순' },
    { value: 'likes', label: '좋아요순' },
    { value: 'duration', label: '재생시간순' }
  ]

  // 재생시간 옵션
  const durationOptions = [
    { value: 'all', label: '전체' },
    { value: 'short', label: '1분 미만' },
    { value: 'medium', label: '1-10분' },
    { value: 'long', label: '10분 이상' }
  ]

  // 조회수 옵션
  const viewsOptions = [
    { value: 'all', label: '전체' },
    { value: 'popular', label: '1만회 이상' },
    { value: 'viral', label: '10만회 이상' },
    { value: 'mega', label: '100만회 이상' }
  ]

  // 검색 실행
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    const searchData = {
      query: query.trim(),
      filters: {
        ...filters,
        tags: filters.tags.filter(Boolean)
      }
    }

    if (onSearch) {
      onSearch(searchData.query, searchData.filters)
    } else {
      // URL 업데이트
      const params = new URLSearchParams()
      if (searchData.query) params.set('search', searchData.query)
      
      Object.entries(searchData.filters).forEach(([key, value]) => {
        if (value && value !== 'all' && (Array.isArray(value) ? value.length > 0 : true)) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','))
          } else {
            params.set(key, value.toString())
          }
        }
      })

      const newUrl = params.toString() ? `/videos?${params.toString()}` : '/videos'
      router.push(newUrl)
    }

    setShowSuggestions(false)
  }

  // 필터 업데이트
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 태그 추가
  const addTag = (tag: string) => {
    const cleanTag = tag.replace('#', '')
    if (!filters.tags.includes(cleanTag)) {
      updateFilter('tags', [...filters.tags, cleanTag])
    }
  }

  // 태그 제거
  const removeTag = (tag: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tag))
  }

  // 필터 초기화
  const clearFilters = () => {
    setQuery('')
    setFilters({
      category: 'all',
      duration: 'all',
      views: 'all',
      sort: 'latest',
      tags: []
    })
  }

  // 활성 필터 개수
  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'tags') return count + (value as string[]).length
    if (value && value !== 'all') return count + 1
    return count
  }, 0) + (query ? 1 : 0)

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getCategoryLabel = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.label || categoryId
  }

  if (compact) {
    return (
      <div className="relative">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="비디오 검색... (Ctrl+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="pl-9 pr-4"
            />
            <SearchSuggestions
              query={query}
              isVisible={showSuggestions && query.length > 0}
              onSelect={(suggestion) => {
                if (suggestion.type === 'tag') {
                  addTag(suggestion.text)
                } else {
                  setQuery(suggestion.text)
                  handleSearch()
                }
                setShowSuggestions(false)
              }}
              onClose={() => setShowSuggestions(false)}
            />
          </div>
          <Button type="submit" size="sm">
            검색
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 메인 검색 바 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            ref={searchInputRef}
            placeholder="비디오 제목, 크리에이터, 태그로 검색... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-4"
          />
          <SearchSuggestions
            query={query}
            isVisible={showSuggestions && query.length > 0}
            onSelect={(suggestion) => {
              if (suggestion.type === 'tag') {
                addTag(suggestion.text)
              } else {
                setQuery(suggestion.text)
              }
              setShowSuggestions(false)
            }}
            onClose={() => setShowSuggestions(false)}
          />
        </div>
        <Button type="submit">검색</Button>
      </form>

      {/* 빠른 필터 및 고급 필터 토글 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 카테고리 */}
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 정렬 */}
          <Select value={filters.sort} onValueChange={(value) => updateFilter('sort', value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 고급 필터 토글 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Sliders className="w-4 h-4" />
            고급 필터
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* 필터 초기화 */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            모든 필터 초기화
          </Button>
        )}
      </div>

      {/* 활성 필터 표시 */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {query && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setQuery('')}>
              &ldquo;{query}&rdquo; ×
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('category', 'all')}>
              {getCategoryLabel(filters.category)} ×
            </Badge>
          )}
          {filters.duration !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('duration', 'all')}>
              {durationOptions.find(d => d.value === filters.duration)?.label} ×
            </Badge>
          )}
          {filters.views !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('views', 'all')}>
              {viewsOptions.find(v => v.value === filters.views)?.label} ×
            </Badge>
          )}
          {filters.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              #{tag} ×
            </Badge>
          ))}
        </div>
      )}

      {/* 고급 필터 패널 */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 재생시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                재생시간
              </label>
              <Select value={filters.duration} onValueChange={(value) => updateFilter('duration', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 조회수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                조회수
              </label>
              <Select value={filters.views} onValueChange={(value) => updateFilter('views', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {viewsOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 태그 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그 (쉼표로 구분)
              </label>
              <Input
                placeholder="예: 뷰티, 패션, 여행"
                value={filters.tags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  updateFilter('tags', tags)
                }}
              />
            </div>
          </div>

          {/* 필터 적용 버튼 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdvanced(false)}>
              닫기
            </Button>
            <Button onClick={handleSearch}>
              필터 적용
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}