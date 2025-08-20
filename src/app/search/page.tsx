'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, X, TrendingUp, Clock, Grid, List } from 'lucide-react'
import SearchFilters from '@/components/search/SearchFilters'
import SearchResults from '@/components/search/SearchResults'
import { useSearch } from '@/hooks/useSearch'

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'live' | 'creators'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const {
    results,
    isLoading,
    hasMore,
    filters,
    setFilters,
    search,
    loadMore,
    suggestions,
    trending
  } = useSearch()

  // URL 파라미터에서 검색 실행
  useEffect(() => {
    const query = searchParams.get('q')
    const tab = searchParams.get('tab') as typeof activeTab
    
    if (query) {
      setSearchQuery(query)
      search(query, tab || 'all', filters)
      
      // 검색 기록에 추가
      addToHistory(query)
    }
  }, [searchParams])

  // 검색 기록 로드
  useEffect(() => {
    const history = localStorage.getItem('searchHistory')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  // 검색 기록에 추가
  const addToHistory = (query: string) => {
    if (!query.trim()) return
    
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    const updated = [query, ...history.filter((q: string) => q !== query)].slice(0, 10)
    localStorage.setItem('searchHistory', JSON.stringify(updated))
    setSearchHistory(updated)
  }

  // 검색 실행
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!searchQuery.trim()) return
    
    const params = new URLSearchParams()
    params.set('q', searchQuery)
    params.set('tab', activeTab)
    
    router.push(`/search?${params.toString()}`)
    search(searchQuery, activeTab, filters)
    addToHistory(searchQuery)
    setShowSuggestions(false)
  }

  // 탭 변경
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    
    if (searchQuery) {
      const params = new URLSearchParams()
      params.set('q', searchQuery)
      params.set('tab', tab)
      router.push(`/search?${params.toString()}`)
      search(searchQuery, tab, filters)
    }
  }

  // 검색 기록 삭제
  const clearHistory = () => {
    localStorage.removeItem('searchHistory')
    setSearchHistory([])
  }

  // 추천 검색어 클릭
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    
    const params = new URLSearchParams()
    params.set('q', suggestion)
    params.set('tab', activeTab)
    
    router.push(`/search?${params.toString()}`)
    search(suggestion, activeTab, filters)
    addToHistory(suggestion)
  }

  const tabCounts = {
    all: results.total,
    videos: results.videos.length,
    live: results.streams.length,
    creators: results.creators.length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 검색 헤더 */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* 검색 바 */}
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="비디오, 스트림, 크리에이터 검색..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setShowSuggestions(false)
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  검색
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                    showFilters ? 'bg-gray-50 border-gray-400' : ''
                  }`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {/* 자동완성 및 추천 */}
              {showSuggestions && (searchQuery || searchHistory.length > 0 || trending.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border overflow-hidden z-50">
                  {/* 자동완성 */}
                  {searchQuery && suggestions.length > 0 && (
                    <div className="p-2 border-b">
                      <p className="text-xs text-gray-500 px-2 py-1">추천 검색어</p>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                        >
                          <Search className="w-4 h-4 text-gray-400" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 검색 기록 */}
                  {!searchQuery && searchHistory.length > 0 && (
                    <div className="p-2 border-b">
                      <div className="flex items-center justify-between px-2 py-1">
                        <p className="text-xs text-gray-500">최근 검색</p>
                        <button
                          onClick={clearHistory}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          모두 지우기
                        </button>
                      </div>
                      {searchHistory.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(query)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{query}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 인기 검색어 */}
                  {!searchQuery && trending.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs text-gray-500 px-2 py-1">인기 검색어</p>
                      {trending.map((trend, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(trend)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <span>{trend}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* 검색 탭 */}
            {searchQuery && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-1">
                  <button
                    onClick={() => handleTabChange('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    전체 {tabCounts.all > 0 && `(${tabCounts.all})`}
                  </button>
                  <button
                    onClick={() => handleTabChange('videos')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'videos'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    비디오 {tabCounts.videos > 0 && `(${tabCounts.videos})`}
                  </button>
                  <button
                    onClick={() => handleTabChange('live')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'live'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    라이브 {tabCounts.live > 0 && `(${tabCounts.live})`}
                  </button>
                  <button
                    onClick={() => handleTabChange('creators')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'creators'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    크리에이터 {tabCounts.creators > 0 && `(${tabCounts.creators})`}
                  </button>
                </div>

                {/* 뷰 모드 전환 */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <SearchFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters)
            if (searchQuery) {
              search(searchQuery, activeTab, newFilters)
            }
          }}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* 검색 결과 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {searchQuery ? (
          <>
            {/* 검색 정보 */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                "<span className="font-medium text-gray-900">{searchQuery}</span>" 검색 결과
              </p>
              {results.total > 0 && (
                <p className="text-sm text-gray-500">
                  총 {results.total.toLocaleString()}개 결과
                </p>
              )}
            </div>

            {/* 결과 표시 */}
            <SearchResults
              results={results}
              activeTab={activeTab}
              viewMode={viewMode}
              isLoading={isLoading}
              onLoadMore={loadMore}
              hasMore={hasMore}
            />
          </>
        ) : (
          /* 기본 화면 */
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">
              원하는 콘텐츠를 검색해보세요
            </h2>
            <p className="text-gray-500">
              비디오, 라이브 스트림, 크리에이터를 한 번에 검색할 수 있습니다
            </p>

            {/* 인기 검색어 */}
            {trending.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3">인기 검색어</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {trending.map((trend, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(trend)}
                      className="px-4 py-2 bg-white border rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}