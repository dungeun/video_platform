'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import PageLayout from '@/components/layouts/PageLayout'
import { useAuth } from '@/hooks/useAuth'
import { 
  Building, TrendingUp, Car, UtensilsCrossed, Plane, Gamepad2,
  Eye, ThumbsUp, Clock, Filter, Grid, List, Search, Star 
} from 'lucide-react'

// 카테고리 정보
const categoryInfo = {
  realestate: {
    name: '부동산',
    icon: Building,
    color: 'from-blue-500 to-blue-700',
    description: '부동산 투자, 매매, 임대 정보를 확인하세요',
    tags: ['아파트', '오피스텔', '투자', '경매', '전세', '매매']
  },
  stock: {
    name: '주식',
    icon: TrendingUp,
    color: 'from-green-500 to-green-700',
    description: '주식 투자, 종목 분석, 시장 동향을 알아보세요',
    tags: ['종목분석', '투자전략', '차트분석', '경제뉴스', 'ETF', '배당주']
  },
  car: {
    name: '자동차',
    icon: Car,
    color: 'from-red-500 to-red-700',
    description: '자동차 리뷰, 신차 정보, 구매 가이드를 만나보세요',
    tags: ['신차리뷰', '중고차', '전기차', '튜닝', '드라이빙', '자동차용품']
  },
  food: {
    name: '음식',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-orange-700',
    description: '맛집 정보, 요리 레시피, 음식 리뷰를 확인하세요',
    tags: ['맛집', '레시피', '요리', '디저트', '카페', '배달음식']
  },
  travel: {
    name: '여행',
    icon: Plane,
    color: 'from-purple-500 to-purple-700',
    description: '여행지 정보, 여행 팁, 숙박 정보를 알아보세요',
    tags: ['국내여행', '해외여행', '호텔', '맛집', '관광지', '여행용품']
  },
  game: {
    name: '게임',
    icon: Gamepad2,
    color: 'from-pink-500 to-pink-700',
    description: '게임 리뷰, 공략, 업데이트 소식을 만나보세요',
    tags: ['게임리뷰', '공략', 'e스포츠', '모바일게임', 'PC게임', '콘솔게임']
  }
}

// 더미 카테고리별 비디오 데이터
const categoryVideos = {
  realestate: [
    {
      id: '1',
      title: '2024 부동산 시장 전망 - 집값은 언제 오를까?',
      creator: '부동산전문가',
      views: 25430,
      likes: 1234,
      uploadedAt: '2024-08-04',
      duration: '18:45',
      thumbnail: 'https://picsum.photos/320/180?random=40',
      avatar: 'https://i.pravatar.cc/40?img=40',
      featured: true
    },
    {
      id: '2',
      title: '아파트 경매 투자 완전 정복 가이드',
      creator: '경매왕',
      views: 12543,
      likes: 567,
      uploadedAt: '2024-08-03',
      duration: '25:30',
      thumbnail: 'https://picsum.photos/320/180?random=41',
      avatar: 'https://i.pravatar.cc/40?img=41',
      featured: false
    }
  ],
  stock: [
    {
      id: '3',
      title: '급등주 발굴 비법 - 수익률 300% 달성하기',
      creator: '주식왕',
      views: 45670,
      likes: 2345,
      uploadedAt: '2024-08-04',
      duration: '22:15',
      thumbnail: 'https://picsum.photos/320/180?random=42',
      avatar: 'https://i.pravatar.cc/40?img=42',
      featured: true
    },
    {
      id: '4',
      title: '초보자를 위한 주식 기본 용어 정리',
      creator: '주식멘토',
      views: 18932,
      likes: 892,
      uploadedAt: '2024-08-03',
      duration: '15:45',
      thumbnail: 'https://picsum.photos/320/180?random=43',
      avatar: 'https://i.pravatar.cc/40?img=43',
      featured: false
    }
  ],
  car: [
    {
      id: '5',
      title: '2024년 최고의 전기차 TOP 5',
      creator: '카리뷰어',
      views: 34210,
      likes: 1567,
      uploadedAt: '2024-08-04',
      duration: '28:30',
      thumbnail: 'https://picsum.photos/320/180?random=44',
      avatar: 'https://i.pravatar.cc/40?img=44',
      featured: true
    }
  ],
  food: [
    {
      id: '6',
      title: '서울 맛집 BEST 20 - 현지인 추천',
      creator: '푸드여행러',
      views: 56780,
      likes: 3456,
      uploadedAt: '2024-08-03',
      duration: '32:18',
      thumbnail: 'https://picsum.photos/320/180?random=45',
      avatar: 'https://i.pravatar.cc/40?img=45',
      featured: true
    }
  ],
  travel: [
    {
      id: '7',
      title: '제주도 3박4일 완벽 가이드',
      creator: '여행러버',
      views: 43210,
      likes: 2134,
      uploadedAt: '2024-08-02',
      duration: '35:20',
      thumbnail: 'https://picsum.photos/320/180?random=46',
      avatar: 'https://i.pravatar.cc/40?img=46',
      featured: true
    }
  ],
  game: [
    {
      id: '8',
      title: '2024년 최고의 게임 TOP 10',
      creator: '게임마스터',
      views: 78920,
      likes: 4567,
      uploadedAt: '2024-08-04',
      duration: '45:30',
      thumbnail: 'https://picsum.photos/320/180?random=47',
      avatar: 'https://i.pravatar.cc/40?img=47',
      featured: true
    }
  ]
}

const sortOptions = ['최신순', '인기순', '조회수순', '좋아요순']

export default function CategoryPage() {
  const params = useParams()
  const categoryKey = params.category as string
  const { isAuthenticated } = useAuth()
  
  const [videos, setVideos] = useState(categoryVideos[categoryKey as keyof typeof categoryVideos] || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSort, setSelectedSort] = useState('최신순')
  const [selectedTag, setSelectedTag] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filteredVideos, setFilteredVideos] = useState(videos)

  const category = categoryInfo[categoryKey as keyof typeof categoryInfo]

  useEffect(() => {
    // 카테고리가 변경되면 해당 카테고리의 비디오를 로드
    const categoryVids = categoryVideos[categoryKey as keyof typeof categoryVideos] || []
    setVideos(categoryVids)
    setFilteredVideos(categoryVids)
  }, [categoryKey])

  useEffect(() => {
    let filtered = videos

    // 검색 필터링
    if (searchTerm) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.creator.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 정렬
    if (selectedSort === '인기순' || selectedSort === '조회수순') {
      filtered = [...filtered].sort((a, b) => b.views - a.views)
    } else if (selectedSort === '좋아요순') {
      filtered = [...filtered].sort((a, b) => b.likes - a.likes)
    } else if (selectedSort === '최신순') {
      filtered = [...filtered].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    }

    setFilteredVideos(filtered)
  }, [searchTerm, selectedSort, videos])

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1일 전'
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}주 전`
    return `${Math.ceil(diffDays / 30)}개월 전`
  }

  if (!category) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">카테고리를 찾을 수 없습니다</h1>
            <p className="text-gray-400">올바른 카테고리 URL을 확인해주세요.</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  const IconComponent = category.icon

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* 카테고리 헤더 */}
        <div className={`bg-gradient-to-r ${category.color} py-16`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <IconComponent className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
                <p className="text-lg opacity-90">{category.description}</p>
              </div>
            </div>
            
            {/* 인기 태그 */}
            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTag === tag
                      ? 'bg-white text-gray-900'
                      : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* 검색 및 필터 */}
          <div className="mb-8 space-y-4">
            {/* 검색바 */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`${category.name} 동영상 검색...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
              />
            </div>

            {/* 필터 및 보기 옵션 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* 보기 모드 */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">총 동영상</p>
                <p className="text-xl font-bold text-white">{filteredVideos.length}개</p>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">추천 영상</p>
                <p className="text-xl font-bold text-white">
                  {filteredVideos.filter(v => v.featured).length}개
                </p>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">총 시청시간</p>
                <p className="text-xl font-bold text-white">
                  {Math.round(filteredVideos.length * 20)}분
                </p>
              </div>
            </div>
          </div>

          {/* 동영상 그리드 */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredVideos.map((video) => (
              <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer group">
                {/* 썸네일 */}
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className={`object-cover ${
                      viewMode === 'grid' ? 'w-full h-48' : 'w-48 h-32'
                    }`}
                  />
                  
                  {video.featured && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      추천
                    </div>
                  )}
                  
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                    {video.duration}
                  </div>
                </div>

                {/* 동영상 정보 */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={video.avatar}
                      alt={video.creator}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                        {video.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm mb-2">{video.creator}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViews(video.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {formatViews(video.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(video.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 빈 상태 */}
          {filteredVideos.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconComponent className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {category.name} 카테고리에 동영상이 없습니다
              </h3>
              <p className="text-gray-500">다른 검색어를 시도해보거나 필터를 초기화해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}