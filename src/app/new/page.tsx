'use client'

import { useState, useEffect } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Clock, Eye, ThumbsUp, Calendar, Filter, Sparkles, New } from 'lucide-react'

// 더미 신규 동영상 데이터
const newVideos = [
  {
    id: '1',
    title: '2024년 8월 주식 시장 전망 - 새로운 투자 기회',
    creator: '주식왕',
    views: 1243,
    likes: 87,
    uploadedAt: '2024-08-04T14:30:00Z',
    duration: '12:45',
    thumbnail: 'https://picsum.photos/320/180?random=30',
    avatar: 'https://i.pravatar.cc/40?img=30',
    category: '주식',
    isNew: true,
    freshness: 'just-uploaded'
  },
  {
    id: '2',
    title: '부동산 경매 완전 정복 가이드',
    creator: '부동산전문가',
    views: 532,
    likes: 45,
    uploadedAt: '2024-08-04T13:15:00Z',
    duration: '18:20',
    thumbnail: 'https://picsum.photos/320/180?random=31',
    avatar: 'https://i.pravatar.cc/40?img=31',
    category: '부동산',
    isNew: true,
    freshness: 'today'
  },
  {
    id: '3',
    title: '여름 별미 만들기 - 시원한 냉면 레시피',
    creator: '푸드여행러',
    views: 2341,
    likes: 234,
    uploadedAt: '2024-08-04T11:45:00Z',
    duration: '15:30',
    thumbnail: 'https://picsum.photos/320/180?random=32',
    avatar: 'https://i.pravatar.cc/40?img=32',
    category: '음식',
    isNew: true,
    freshness: 'today'
  },
  {
    id: '4',
    title: '신작 게임 리뷰 - 꼭 해봐야 할 게임 TOP 5',
    creator: '게임마스터',
    views: 4567,
    likes: 456,
    uploadedAt: '2024-08-04T09:30:00Z',
    duration: '22:18',
    thumbnail: 'https://picsum.photos/320/180?random=33',
    avatar: 'https://i.pravatar.cc/40?img=33',
    category: '게임',
    isNew: true,
    freshness: 'today'
  },
  {
    id: '5',
    title: '2024년 하반기 자동차 신모델 총정리',
    creator: '카리뷰어',
    views: 1876,
    likes: 123,
    uploadedAt: '2024-08-03T16:20:00Z',
    duration: '25:45',
    thumbnail: 'https://picsum.photos/320/180?random=34',
    avatar: 'https://i.pravatar.cc/40?img=34',
    category: '자동차',
    isNew: true,
    freshness: 'yesterday'
  },
  {
    id: '6',
    title: '국내 여행지 숨은 명소 BEST 10',
    creator: '여행러버',
    views: 3210,
    likes: 287,
    uploadedAt: '2024-08-03T14:10:00Z',
    duration: '28:15',
    thumbnail: 'https://picsum.photos/320/180?random=35',
    avatar: 'https://i.pravatar.cc/40?img=35',
    category: '여행',
    isNew: true,
    freshness: 'yesterday'
  }
]

const categories = ['전체', '방금 업로드', '오늘', '어제', '이번 주']

export default function NewPage() {
  const { isAuthenticated } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [filteredVideos, setFilteredVideos] = useState(newVideos)
  const [sortBy, setSortBy] = useState('latest') // latest, views, duration

  useEffect(() => {
    let filtered = newVideos

    if (selectedCategory === '방금 업로드') {
      filtered = newVideos.filter(video => video.freshness === 'just-uploaded')
    } else if (selectedCategory === '오늘') {
      filtered = newVideos.filter(video => ['just-uploaded', 'today'].includes(video.freshness))
    } else if (selectedCategory === '어제') {
      filtered = newVideos.filter(video => video.freshness === 'yesterday')
    } else if (selectedCategory === '이번 주') {
      filtered = newVideos
    }

    // 정렬
    if (sortBy === 'latest') {
      filtered = filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    } else if (sortBy === 'views') {
      filtered = filtered.sort((a, b) => b.views - a.views)
    }

    setFilteredVideos(filtered)
  }, [selectedCategory, sortBy])

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffHours < 48) return '1일 전'
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}일 전`
    return `${Math.floor(diffDays / 7)}주 전`
  }

  const getFreshnessIcon = (freshness: string) => {
    switch (freshness) {
      case 'just-uploaded': return <Sparkles className="w-4 h-4 text-yellow-400" />
      case 'today': return <New className="w-4 h-4 text-green-400" />
      case 'yesterday': return <Clock className="w-4 h-4 text-blue-400" />
      default: return <Plus className="w-4 h-4 text-gray-400" />
    }
  }

  const getFreshnessBadge = (freshness: string) => {
    switch (freshness) {
      case 'just-uploaded': return { text: '방금 업로드', color: 'bg-yellow-500' }
      case 'today': return { text: 'NEW', color: 'bg-green-500' }
      case 'yesterday': return { text: '어제', color: 'bg-blue-500' }
      default: return { text: '신규', color: 'bg-purple-500' }
    }
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">✨ 신규 영상</h1>
                <p className="text-gray-400">방금 업로드된 따끈따끈한 새 영상들을 만나보세요</p>
              </div>
            </div>
            
            {/* 실시간 업로드 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-4 text-center text-white">
                <div className="text-2xl font-bold">
                  {filteredVideos.filter(v => v.freshness === 'just-uploaded').length}
                </div>
                <div className="text-sm opacity-90">방금 업로드</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-center text-white">
                <div className="text-2xl font-bold">
                  {filteredVideos.filter(v => v.freshness === 'today').length}
                </div>
                <div className="text-sm opacity-90">오늘 업로드</div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-center text-white">
                <div className="text-2xl font-bold">
                  {filteredVideos.filter(v => v.freshness === 'yesterday').length}
                </div>
                <div className="text-sm opacity-90">어제 업로드</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-center text-white">
                <div className="text-2xl font-bold">
                  {filteredVideos.length}
                </div>
                <div className="text-sm opacity-90">전체 신규</div>
              </div>
            </div>
          </div>

          {/* 필터 및 정렬 */}
          <div className="mb-8 space-y-4">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {category === '방금 업로드' && <Sparkles className="w-4 h-4" />}
                  {category === '오늘' && <New className="w-4 h-4" />}
                  {category === '어제' && <Clock className="w-4 h-4" />}
                  {category === '이번 주' && <Calendar className="w-4 h-4" />}
                  {category}
                </button>
              ))}
            </div>

            {/* 정렬 옵션 */}
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value="latest">최신 업로드순</option>
                <option value="views">조회수순</option>
                <option value="duration">재생시간순</option>
              </select>
            </div>
          </div>

          {/* 신규 영상 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-all duration-300 cursor-pointer group hover:scale-105"
              >
                {/* 썸네일 */}
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* 신규 배지 */}
                  <div className={`absolute top-3 left-3 ${getFreshnessBadge(video.freshness).color} text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 animate-pulse`}>
                    {getFreshnessIcon(video.freshness)}
                    {getFreshnessBadge(video.freshness).text}
                  </div>
                  
                  {/* 재생 시간 */}
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs">
                    {video.duration}
                  </div>
                  
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Plus className="w-6 h-6 text-gray-800" />
                    </div>
                  </div>
                </div>

                {/* 비디오 정보 */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={video.avatar}
                      alt={video.creator}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-green-400 transition-colors">
                        {video.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm mb-2">{video.creator}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViews(video.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {video.likes}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                          {video.category}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(video.uploadedAt)}
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
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                현재 {selectedCategory}에 새로운 영상이 없습니다
              </h3>
              <p className="text-gray-500">조금 후에 다시 확인해보세요!</p>
            </div>
          )}

          {/* 새로고침 버튼 */}
          <div className="text-center mt-8">
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              새 영상 확인하기
            </button>
          </div>

          {/* 실시간 업로드 알림 */}
          <div className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">실시간 업데이트 중</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}