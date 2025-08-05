'use client'

import { useState, useEffect } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, Eye, ThumbsUp, Clock, Fire, Award, Star, Share2 } from 'lucide-react'

// 더미 인기 동영상 데이터
const trendingVideos = [
  {
    id: '1',
    title: '🔥 실시간 주식 급등주 분석 - 이 종목 꼭 보세요!',
    creator: '주식왕',
    views: 125430,
    likes: 3245,
    uploadedAt: '2024-08-04',
    duration: '18:45',
    thumbnail: 'https://picsum.photos/320/180?random=20',
    avatar: 'https://i.pravatar.cc/40?img=20',
    category: '주식',
    trending: 'hot',
    trendingRank: 1,
    growthRate: 240,
    description: '오늘 급등한 종목들을 실시간으로 분석합니다.'
  },
  {
    id: '2',
    title: '부동산 대폭락 시대가 온다? 전문가 긴급 분석',
    creator: '부동산전문가',
    views: 89320,
    likes: 2156,
    uploadedAt: '2024-08-04',
    duration: '25:12',
    thumbnail: 'https://picsum.photos/320/180?random=21',
    avatar: 'https://i.pravatar.cc/40?img=21',
    category: '부동산',
    trending: 'rising',
    trendingRank: 2,
    growthRate: 180,
    description: '2024년 하반기 부동산 시장 전망을 분석합니다.'
  },
  {
    id: '3',
    title: '서울 맛집 BEST 20 - 현지인만 아는 숨은 맛집',
    creator: '푸드여행러',
    views: 76540,
    likes: 4521,
    uploadedAt: '2024-08-03',
    duration: '32:18',
    thumbnail: 'https://picsum.photos/320/180?random=22',
    avatar: 'https://i.pravatar.cc/40?img=22',
    category: '음식',
    trending: 'hot',
    trendingRank: 3,
    growthRate: 320,
    description: '서울의 진짜 맛집들을 소개합니다.'
  },
  {
    id: '4',
    title: '2024년 최고의 게임 TOP 10 - 올해의 게임 어워드',
    creator: '게임마스터',
    views: 234110,
    likes: 8934,
    uploadedAt: '2024-08-03',
    duration: '45:30',
    thumbnail: 'https://picsum.photos/320/180?random=23',
    avatar: 'https://i.pravatar.cc/40?img=23',
    category: '게임',
    trending: 'viral',
    trendingRank: 4,
    growthRate: 450,
    description: '2024년 최고의 게임들을 순위별로 정리했습니다.'
  },
  {
    id: '5',
    title: '전기차 vs 하이브리드 완벽 비교 분석',
    creator: '카리뷰어',
    views: 45670,
    likes: 1234,
    uploadedAt: '2024-08-02',
    duration: '28:45',
    thumbnail: 'https://picsum.photos/320/180?random=24',
    avatar: 'https://i.pravatar.cc/40?img=24',
    category: '자동차',
    trending: 'rising',
    trendingRank: 5,
    growthRate: 160,
    description: '전기차와 하이브리드의 장단점을 비교 분석합니다.'
  },
  {
    id: '6',
    title: '제주도 3박4일 완벽 가이드 - 숨겨진 명소까지',
    creator: '여행러버',
    views: 67890,
    likes: 2789,
    uploadedAt: '2024-08-01',
    duration: '38:20',
    thumbnail: 'https://picsum.photos/320/180?random=25',
    avatar: 'https://i.pravatar.cc/40?img=25',
    category: '여행',
    trending: 'hot',
    trendingRank: 6,
    growthRate: 220,
    description: '제주도 여행의 모든 것을 담았습니다.'
  }
]

const trendingCategories = ['전체', '급상승', '화제', '바이럴']

export default function TrendingPage() {
  const { isAuthenticated } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [filteredVideos, setFilteredVideos] = useState(trendingVideos)
  const [timeFilter, setTimeFilter] = useState('today') // today, week, month

  useEffect(() => {
    let filtered = trendingVideos

    if (selectedCategory === '급상승') {
      filtered = trendingVideos.filter(video => video.trending === 'rising')
    } else if (selectedCategory === '화제') {
      filtered = trendingVideos.filter(video => video.trending === 'hot')
    } else if (selectedCategory === '바이럴') {
      filtered = trendingVideos.filter(video => video.trending === 'viral')
    }

    // 인기도 순으로 정렬
    filtered = filtered.sort((a, b) => b.growthRate - a.growthRate)

    setFilteredVideos(filtered)
  }, [selectedCategory])

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

  const getTrendingIcon = (trending: string) => {
    switch (trending) {
      case 'hot': return <Fire className="w-4 h-4 text-red-500" />
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'viral': return <Star className="w-4 h-4 text-yellow-500" />
      default: return <Award className="w-4 h-4 text-blue-500" />
    }
  }

  const getTrendingBadge = (trending: string) => {
    switch (trending) {
      case 'hot': return { text: 'HOT', color: 'bg-red-500' }
      case 'rising': return { text: '급상승', color: 'bg-green-500' }
      case 'viral': return { text: 'VIRAL', color: 'bg-yellow-500' }
      default: return { text: 'TREND', color: 'bg-blue-500' }
    }
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">🔥 인기 영상</h1>
                <p className="text-gray-400">지금 가장 핫한 영상들을 만나보세요</p>
              </div>
            </div>
            
            {/* 실시간 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {filteredVideos.filter(v => v.trending === 'hot').length}
                </div>
                <div className="text-sm text-gray-400">HOT 영상</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {filteredVideos.filter(v => v.trending === 'rising').length}
                </div>
                <div className="text-sm text-gray-400">급상승</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {filteredVideos.filter(v => v.trending === 'viral').length}
                </div>
                <div className="text-sm text-gray-400">바이럴</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(filteredVideos.reduce((sum, v) => sum + v.growthRate, 0) / filteredVideos.length)}%
                </div>
                <div className="text-sm text-gray-400">평균 성장률</div>
              </div>
            </div>
          </div>

          {/* 필터 */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 mb-4">
              {trendingCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 시간 필터 */}
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-3 py-1 rounded text-sm ${
                  timeFilter === 'today'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                오늘
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-3 py-1 rounded text-sm ${
                  timeFilter === 'week'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                이번 주
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-3 py-1 rounded text-sm ${
                  timeFilter === 'month'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                이번 달
              </button>
            </div>
          </div>

          {/* 인기 영상 리스트 */}
          <div className="space-y-4">
            {filteredVideos.map((video, index) => (
              <div
                key={video.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer"
              >
                <div className="flex gap-4 p-4">
                  {/* 순위 */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' :
                      'text-gray-500'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>

                  {/* 썸네일 */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded"
                    />
                    
                    {/* 트렌딩 배지 */}
                    <div className={`absolute top-1 left-1 ${getTrendingBadge(video.trending).color} text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1`}>
                      {getTrendingIcon(video.trending)}
                      {getTrendingBadge(video.trending).text}
                    </div>
                    
                    {/* 재생 시간 */}
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>

                  {/* 비디오 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white line-clamp-2 mb-2 hover:text-red-400 transition-colors">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={video.avatar}
                        alt={video.creator}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-gray-400 text-sm">{video.creator}</span>
                      <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                        {video.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {formatViews(video.views)} 조회
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {formatViews(video.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(video.uploadedAt)}
                      </span>
                      <span className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        {video.growthRate}% 증가
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-col items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 빈 상태 */}
          {filteredVideos.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                현재 {selectedCategory} 카테고리에 인기 영상이 없습니다
              </h3>
              <p className="text-gray-500">다른 카테고리를 확인해보세요!</p>
            </div>
          )}

          {/* 더보기 버튼 */}
          <div className="text-center mt-8">
            <button className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              더 많은 인기 영상 보기
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}