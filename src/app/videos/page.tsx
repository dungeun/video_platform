'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PageLayout from '@/components/layouts/PageLayout'
import VideoList from '@/components/video/VideoList'
import SearchSuggestions from '@/components/search/SearchSuggestions'
import { useAuth } from '@/hooks/useAuth'
import { Search, Filter, Grid, List, TrendingUp, Clock, Eye } from 'lucide-react'
import { transformCampaignToVideo, getCategoryLabel } from '@/lib/utils/video'
import type { Video } from '@/types/video'

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
  { id: 'entertainment', label: '엔터테인먼트' },
  { id: 'other', label: '기타' }
]

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'views', label: '조회수순' },
  { value: 'likes', label: '좋아요순' },
  { value: 'duration', label: '재생시간순' },
  { value: 'oldest', label: '오래된순' }
]

const durationOptions = [
  { value: 'all', label: '전체' },
  { value: 'short', label: '1분 미만', min: 0, max: 60 },
  { value: 'medium', label: '1-10분', min: 60, max: 600 },
  { value: 'long', label: '10분 이상', min: 600, max: undefined }
]

const viewsOptions = [
  { value: 'all', label: '전체' },
  { value: 'popular', label: '1만회 이상', min: 10000 },
  { value: 'viral', label: '10만회 이상', min: 100000 },
  { value: 'mega', label: '100만회 이상', min: 1000000 }
]

function VideosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest')
  const [selectedDuration, setSelectedDuration] = useState(searchParams.get('duration') || 'all')
  const [selectedViews, setSelectedViews] = useState(searchParams.get('views') || 'all')
  const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.get('tags')?.split(',').filter(Boolean) || [])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 비디오 데이터 로드
  const loadVideos = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(1)
      }

      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(sortBy && { sort: sortBy })
      })

      // Add advanced filters
      if (selectedDuration !== 'all') {
        const durationFilter = durationOptions.find(d => d.value === selectedDuration)
        if (durationFilter) {
          if (durationFilter.min !== undefined) params.append('minDuration', durationFilter.min.toString())
          if (durationFilter.max !== undefined) params.append('maxDuration', durationFilter.max.toString())
        }
      }

      if (selectedViews !== 'all') {
        const viewsFilter = viewsOptions.find(v => v.value === selectedViews)
        if (viewsFilter?.min) {
          params.append('minViews', viewsFilter.min.toString())
        }
      }

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','))
      }

      // 먼저 비디오 API 시도
      let videoResponse = await fetch(`/api/videos?${params}`)
      let videoData = null
      
      if (videoResponse.ok) {
        videoData = await videoResponse.json()
      }

      // 비디오가 없거나 적으면 캠페인을 비디오로 변환하여 보충
      let allVideos: Video[] = videoData?.videos || []
      
      if (allVideos.length < 10) {
        const campaignResponse = await fetch(`/api/home/campaigns?${params}`)
        if (campaignResponse.ok) {
          const campaignData = await campaignResponse.json()
          const convertedVideos = (campaignData.campaigns || []).map(transformCampaignToVideo)
          
          // 중복 제거 후 추가
          const existingIds = new Set(allVideos.map((v: any) => v.id))
          const newVideos = convertedVideos.filter((v: any) => !existingIds.has(v.id))
          allVideos = [...allVideos, ...newVideos]
        }
      }

      // 정렬 적용
      const sortedVideos = sortVideos(allVideos, sortBy)
      
      if (reset) {
        setVideos(sortedVideos)
      } else {
        setVideos(prev => [...prev, ...sortedVideos])
      }
      
      setHasMore(sortedVideos.length === 20)
      
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setLoading(false)
    }
  }

  // 비디오 정렬
  const sortVideos = (videos: Video[], sortType: string) => {
    const sorted = [...videos]
    
    switch (sortType) {
      case 'latest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'popular':
      case 'views':
        return sorted.sort((a, b) => b.viewCount - a.viewCount)
      case 'likes':
        return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      default:
        return sorted
    }
  }

  // 초기 로드 및 필터 변경 시 reload
  useEffect(() => {
    loadVideos(true)
  }, [searchTerm, selectedCategory, sortBy, selectedDuration, selectedViews, selectedTags])

  // URL 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (sortBy !== 'latest') params.set('sort', sortBy)
    if (selectedDuration !== 'all') params.set('duration', selectedDuration)
    if (selectedViews !== 'all') params.set('views', selectedViews)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    
    const newUrl = params.toString() ? `/videos?${params.toString()}` : '/videos'
    router.replace(newUrl, { scroll: false })
  }, [searchTerm, selectedCategory, sortBy, selectedDuration, selectedViews, selectedTags, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // searchTerm이 변경되면 useEffect에서 자동으로 로드됨
  }

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    loadVideos(false)
  }

  const handleVideoClick = (videoId: string) => {
    router.push(`/videos/${videoId}`)
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 (모바일 최적화) */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-4">
              {/* 상단: 제목과 검색 (모바일 반응형) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">비디오</h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    다양한 크리에이터들의 창의적인 비디오를 만나보세요
                  </p>
                </div>
                
                {user?.type === 'BUSINESS' && (
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/studio/upload">
                      + 비디오 업로드
                    </Link>
                  </Button>
                )}
              </div>

              {/* 검색 바 (모바일 최적화) */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    placeholder="비디오 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSearchSuggestions(true)}
                    className="pl-9 sm:pl-10 text-sm sm:text-base"
                  />
                  <SearchSuggestions
                    query={searchTerm}
                    isVisible={showSearchSuggestions && searchTerm.length > 0}
                    onSelect={(suggestion) => {
                      if (suggestion.type === 'tag') {
                        const tag = suggestion.text.replace('#', '')
                        setSelectedTags(prev => [...prev, tag])
                      } else {
                        setSearchTerm(suggestion.text)
                      }
                      setShowSearchSuggestions(false)
                    }}
                    onClose={() => setShowSearchSuggestions(false)}
                  />
                </div>
                <Button type="submit" className="px-3 sm:px-4">
                  <span className="hidden sm:inline">검색</span>
                  <Search className="w-4 h-4 sm:hidden" />
                </Button>
              </form>

              {/* 필터 및 정렬 (모바일 최적화) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                  {/* 상단: 메인 필터들 */}
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
                    {/* 카테고리 필터 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm">
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
                    </div>

                    {/* 정렬 */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm flex-shrink-0">
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
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0"
                    >
                      <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">고급 필터</span>
                      <span className="xs:hidden">필터</span>
                      {showAdvancedFilters ? '▲' : '▼'}
                    </Button>
                  </div>

                  {/* 선택된 필터 표시 (모바일에서 스크롤) */}
                  {(selectedCategory !== 'all' || searchTerm || selectedDuration !== 'all' || selectedViews !== 'all' || selectedTags.length > 0) && (
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap overflow-x-auto scrollbar-hide">
                      {selectedCategory !== 'all' && (
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-gray-300 text-xs whitespace-nowrap flex-shrink-0"
                          onClick={() => setSelectedCategory('all')}
                        >
                          {getCategoryLabel(selectedCategory)} ×
                        </Badge>
                      )}
                      {searchTerm && (
                        <Badge 
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-300 text-xs whitespace-nowrap flex-shrink-0"
                          onClick={() => setSearchTerm('')}
                        >
                          &ldquo;{searchTerm.length > 10 ? searchTerm.substring(0, 10) + '...' : searchTerm}&rdquo; ×
                        </Badge>
                      )}
                      {selectedDuration !== 'all' && (
                        <Badge 
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-300 text-xs whitespace-nowrap flex-shrink-0"
                          onClick={() => setSelectedDuration('all')}
                        >
                          {durationOptions.find(d => d.value === selectedDuration)?.label} ×
                        </Badge>
                      )}
                      {selectedViews !== 'all' && (
                        <Badge 
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-300 text-xs whitespace-nowrap flex-shrink-0"
                          onClick={() => setSelectedViews('all')}
                        >
                          {viewsOptions.find(v => v.value === selectedViews)?.label} ×
                        </Badge>
                      )}
                      {selectedTags.map(tag => (
                        <Badge 
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-gray-300 text-xs whitespace-nowrap flex-shrink-0"
                          onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                        >
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* 보기 모드 전환 (모바일 최적화) */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-2 sm:px-3"
                  >
                    <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-2 sm:px-3"
                  >
                    <List className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 고급 필터 패널 (모바일 최적화) */}
            {showAdvancedFilters && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* 재생시간 필터 */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      재생시간
                    </label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="text-xs sm:text-sm">
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

                  {/* 조회수 필터 */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      조회수
                    </label>
                    <Select value={selectedViews} onValueChange={setSelectedViews}>
                      <SelectTrigger className="text-xs sm:text-sm">
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
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      태그 (쉼표로 구분)
                    </label>
                    <Input
                      placeholder="예: 뷰티, 패션, 여행"
                      value={selectedTags.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        setSelectedTags(tags)
                      }}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* 필터 초기화 버튼 */}
                <div className="flex justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedDuration('all')
                      setSelectedViews('all')
                      setSelectedTags([])
                      setSearchTerm('')
                      setSortBy('latest')
                    }}
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    모든 필터 초기화
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 메인 컨텐츠 (모바일 최적화) */}
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* 통계 정보 (모바일 최적화) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600">총 비디오</p>
                <p className="text-lg sm:text-xl font-bold">{videos.length}개</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600">인기 급상승</p>
                <p className="text-lg sm:text-xl font-bold">
                  {videos.filter(v => v.viewCount > 1000).length}개
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600">오늘 업로드</p>
                <p className="text-lg sm:text-xl font-bold">
                  {videos.filter(v => {
                    const today = new Date()
                    const videoDate = new Date(v.createdAt)
                    return videoDate.toDateString() === today.toDateString()
                  }).length}개
                </p>
              </div>
            </div>
          </div>

          {/* 비디오 목록 (모바일 최적화) */}
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6">
            <VideoList
              videos={videos}
              loading={loading}
              onVideoClick={handleVideoClick}
              variant={viewMode === 'list' ? 'large' : 'default'}
              columns={viewMode === 'list' ? 1 : 4}
            />

            {/* 더 보기 버튼 (모바일 최적화) */}
            {hasMore && !loading && videos.length > 0 && (
              <div className="flex justify-center mt-6 sm:mt-8">
                <Button 
                  onClick={handleLoadMore}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  더 많은 비디오 보기
                </Button>
              </div>
            )}

            {/* 로딩 중 */}
            {loading && videos.length === 0 && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {/* 결과가 없을 때 (모바일 최적화) */}
            {!loading && videos.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  다른 검색어나 필터를 시도해보세요.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                    setSortBy('latest')
                    setSelectedDuration('all')
                    setSelectedViews('all')
                    setSelectedTags([])
                  }}
                  className="w-full sm:w-auto"
                >
                  필터 초기화
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageLayout>
    }>
      <VideosPageContent />
    </Suspense>
  )
}