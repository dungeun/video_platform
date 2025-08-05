'use client'

import { useState, useEffect } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { useAuth } from '@/hooks/useAuth'
import { Play, Users, Heart, MessageSquare, Share2, MoreVertical } from 'lucide-react'

// 더미 라이브 스트림 데이터
const liveStreams = [
  {
    id: '1',
    title: '실시간 주식 시장 분석 🔥',
    streamer: '주식왕',
    viewers: 1243,
    category: '주식',
    thumbnail: 'https://picsum.photos/320/180?random=1',
    avatar: 'https://i.pravatar.cc/40?img=1',
    isLive: true,
    duration: '2:34:12'
  },
  {
    id: '2',
    title: '오늘의 부동산 핫이슈',
    streamer: '부동산전문가',
    viewers: 892,
    category: '부동산',
    thumbnail: 'https://picsum.photos/320/180?random=2',
    avatar: 'https://i.pravatar.cc/40?img=2',
    isLive: true,
    duration: '1:23:45'
  },
  {
    id: '3',
    title: '맛집 투어 라이브',
    streamer: '푸드여행러',
    viewers: 567,
    category: '음식',
    thumbnail: 'https://picsum.photos/320/180?random=3',
    avatar: 'https://i.pravatar.cc/40?img=3',
    isLive: true,
    duration: '0:45:23'
  },
  {
    id: '4',
    title: '게임 실시간 스트리밍',
    streamer: '게임마스터',
    viewers: 2341,
    category: '게임',
    thumbnail: 'https://picsum.photos/320/180?random=4',
    avatar: 'https://i.pravatar.cc/40?img=4',
    isLive: true,
    duration: '3:12:08'
  },
  {
    id: '5',
    title: '자동차 리뷰 라이브',
    streamer: '카리뷰어',
    viewers: 445,
    category: '자동차',
    thumbnail: 'https://picsum.photos/320/180?random=5',
    avatar: 'https://i.pravatar.cc/40?img=5',
    isLive: true,
    duration: '1:45:32'
  },
  {
    id: '6',
    title: '여행 VLOG 라이브',
    streamer: '여행러버',
    viewers: 678,
    category: '여행',
    thumbnail: 'https://picsum.photos/320/180?random=6',
    avatar: 'https://i.pravatar.cc/40?img=6',
    isLive: true,
    duration: '2:01:15'
  }
]

const categories = ['전체', '주식', '부동산', '음식', '게임', '자동차', '여행']

export default function LivePage() {
  const { isAuthenticated } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [filteredStreams, setFilteredStreams] = useState(liveStreams)

  useEffect(() => {
    if (selectedCategory === '전체') {
      setFilteredStreams(liveStreams)
    } else {
      setFilteredStreams(liveStreams.filter(stream => stream.category === selectedCategory))
    }
  }, [selectedCategory])

  const formatViewers = (viewers: number) => {
    if (viewers >= 1000) {
      return `${(viewers / 1000).toFixed(1)}K`
    }
    return viewers.toString()
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">🔴 라이브 스트리밍</h1>
            <p className="text-gray-400">지금 실시간으로 진행 중인 방송을 만나보세요</p>
          </div>

          {/* 카테고리 필터 */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
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
          </div>

          {/* 라이브 스트림 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreams.map((stream) => (
              <div
                key={stream.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer group"
              >
                {/* 썸네일 */}
                <div className="relative">
                  <img
                    src={stream.thumbnail}
                    alt={stream.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* 라이브 표시 */}
                  <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                  
                  {/* 시청자 수 */}
                  <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {formatViewers(stream.viewers)}
                  </div>
                  
                  {/* 방송 시간 */}
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                    {stream.duration}
                  </div>
                  
                  {/* 플레이 버튼 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-80 transition-opacity duration-200" />
                  </div>
                </div>

                {/* 스트림 정보 */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={stream.avatar}
                      alt={stream.streamer}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                        {stream.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm mb-1">{stream.streamer}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {formatViewers(stream.viewers)} 시청 중
                        </span>
                        <span className="bg-gray-700 px-2 py-1 rounded">
                          {stream.category}
                        </span>
                      </div>
                    </div>
                    
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 빈 상태 */}
          {filteredStreams.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📺</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                현재 {selectedCategory} 카테고리에 진행 중인 라이브가 없습니다
              </h3>
              <p className="text-gray-500">다른 카테고리를 확인해보세요!</p>
            </div>
          )}

          {/* 라이브 시작 버튼 (로그인 사용자용) */}
          {isAuthenticated && (
            <div className="fixed bottom-8 right-8">
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg transition-colors">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                라이브 시작하기
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}