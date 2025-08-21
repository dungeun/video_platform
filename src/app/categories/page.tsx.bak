'use client'

import Link from 'next/link'
import { useState } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { Building, TrendingUp, Car, UtensilsCrossed, Plane, Gamepad2, Play, Eye, Clock } from 'lucide-react'

interface VideoCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  videoCount: number;
  thumbnailUrl: string;
  color: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadDate: string;
  channelName: string;
  channelAvatar: string;
}

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories: VideoCategory[] = [
    {
      id: 'realestate',
      name: '부동산',
      description: '부동산 투자, 매매, 임대 관련 영상',
      icon: Building,
      videoCount: 1250,
      thumbnailUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
      color: 'bg-blue-500'
    },
    {
      id: 'stock',
      name: '주식',
      description: '주식 투자, 분석, 시장 동향',
      icon: TrendingUp,
      videoCount: 980,
      thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
      color: 'bg-green-500'
    },
    {
      id: 'car',
      name: '자동차',
      description: '자동차 리뷰, 시승기, 정보',
      icon: Car,
      videoCount: 750,
      thumbnailUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop',
      color: 'bg-red-500'
    },
    {
      id: 'food',
      name: '음식',
      description: '요리, 맛집, 레시피',
      icon: UtensilsCrossed,
      videoCount: 1450,
      thumbnailUrl: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&h=300&fit=crop',
      color: 'bg-orange-500'
    },
    {
      id: 'travel',
      name: '여행',
      description: '여행지 소개, 여행 팁',
      icon: Plane,
      videoCount: 620,
      thumbnailUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
      color: 'bg-purple-500'
    },
    {
      id: 'game',
      name: '게임',
      description: '게임 플레이, 리뷰, 공략',
      icon: Gamepad2,
      videoCount: 890,
      thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
      color: 'bg-indigo-500'
    }
  ]

  const sampleVideos: Video[] = [
    {
      id: '1',
      title: '서울 아파트 투자 전략! 2024년 유망 지역 분석',
      thumbnail: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=300&fit=crop',
      duration: '12:34',
      views: '87K',
      uploadDate: '5일 전',
      channelName: '부동산박사',
      channelAvatar: 'https://i.pravatar.cc/32?img=10'
    },
    {
      id: '2',
      title: '삼성전자 매수 타이밍! 반도체 사이클 분석',
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
      duration: '18:45',
      views: '124K',
      uploadDate: '2일 전',
      channelName: '주식천재',
      channelAvatar: 'https://i.pravatar.cc/32?img=14'
    },
    {
      id: '3',
      title: '2024 신형 BMW 3시리즈 시승기',
      thumbnail: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop',
      duration: '15:20',
      views: '95K',
      uploadDate: '1주 전',
      channelName: '카리뷰어',
      channelAvatar: 'https://i.pravatar.cc/32?img=18'
    },
    {
      id: '4',
      title: '집에서 만드는 완벽한 파스타 레시피',
      thumbnail: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&h=300&fit=crop',
      duration: '8:30',
      views: '156K',
      uploadDate: '3일 전',
      channelName: '요리왕',
      channelAvatar: 'https://i.pravatar.cc/32?img=20'
    }
  ]

  const filteredVideos = selectedCategory === 'all' 
    ? sampleVideos 
    : sampleVideos.filter(video => {
        // 실제로는 video.category === selectedCategory로 필터링
        return true
      })

  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">카테고리</h1>
          <p className="text-gray-400">관심 있는 카테고리의 영상을 찾아보세요</p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-700 transition-all duration-300 hover:scale-105"
              >
                <div className="relative h-48">
                  <img 
                    src={category.thumbnailUrl} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`p-4 rounded-full ${category.color} text-white`}>
                      <IconComponent size={32} />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                    <p className="text-gray-300 text-sm mb-2">{category.description}</p>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Play size={14} className="mr-1" />
                      <span>{category.videoCount.toLocaleString()}개 영상</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Videos */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">최신 영상</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <Link
                key={video.id}
                href={`/video/${video.id}`}
                className="group bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-700 transition-all duration-300"
              >
                <div className="relative">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center mb-2">
                    <img 
                      src={video.channelAvatar} 
                      alt={video.channelName}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-gray-400 text-sm">{video.channelName}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-xs space-x-2">
                    <div className="flex items-center">
                      <Eye size={12} className="mr-1" />
                      <span>{video.views}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      <span>{video.uploadDate}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
