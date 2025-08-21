'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'
import PageLayout from '@/components/layouts/PageLayout'
import VideoList from '@/components/video/VideoList'
import { transformCampaignToVideo } from '@/lib/utils/video'
import type { Video } from '@/types/video'

interface Campaign {
  id: string
  title: string
  brand: string
  applicants: number
  maxApplicants: number
  deadline: number
  category: string
  platforms: string[]
  description: string
  createdAt: string
  budget: string
  imageUrl?: string
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([])
  const [homeData, setHomeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // UI 설정 가져오기
  const { config, loadSettingsFromAPI } = useUIConfigStore()
  
  // 배너 슬라이드 데이터 - UI 설정에서 가져오기
  const bannerSlides = config.mainPage?.heroSlides?.filter(slide => slide.visible) || []
  
  // 메뉴 카테고리 - UI 설정에서 가져오기
  const menuCategories = config.mainPage?.categoryMenus?.filter(menu => menu.visible) || []
  
  // 섹션 순서 가져오기 - UI 설정에서 관리되는 순서 사용
  const defaultSectionOrder = [
    { id: 'hero', type: 'hero', order: 1, visible: true },
    { id: 'category', type: 'category', order: 2, visible: true },
    { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
    { id: 'promo', type: 'promo', order: 4, visible: true },
    { id: 'ranking', type: 'ranking', order: 5, visible: true },
    { id: 'youtube', type: 'youtube', order: 6, visible: true },
    { id: 'recommended', type: 'recommended', order: 7, visible: true },
  ]
  
  // config에서 sectionOrder를 사용, 없으면 defaultSectionOrder 사용
  let sectionOrder = config.mainPage?.sectionOrder && config.mainPage.sectionOrder.length > 0 
    ? [...config.mainPage.sectionOrder] 
    : [...defaultSectionOrder]
  
  // 커스텀 섹션들도 순서에 추가
  const customSectionOrders = (config.mainPage?.customSections || [])
    .filter(section => section.visible)
    .map((section) => ({
      id: section.id,
      type: 'custom' as const,
      order: section.order || 999,
      visible: section.visible,
    }))
  
  // 모든 섹션 합치고 정렬 - 기존 섹션은 유지하고 커스텀 섹션만 추가
  const allSections = [...sectionOrder]
  customSectionOrders.forEach(customOrder => {
    const existingIndex = allSections.findIndex(s => s.id === customOrder.id)
    if (existingIndex === -1) {
      // 기존에 없는 커스텀 섹션만 추가
      allSections.push(customOrder)
    }
  })
  
  // 표시할 섹션만 필터링하고 순서대로 정렬
  const visibleSections = allSections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order)
  
  // 카테고리별 기본 픽토그램
  const defaultCategoryIcons: Record<string, React.ReactNode> = {
    beauty: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    fashion: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    food: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    travel: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    tech: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    fitness: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    lifestyle: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    pet: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>
    ),
    parenting: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    game: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    education: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  }

  // 샘플 비디오 데이터 (부동산 카테고리 포함)
  const getSampleVideos = (): Video[] => [
    {
      id: '1',
      title: '서울 아파트 투자 전략! 2024년 유망 지역 분석',
      description: '부동산 전문가가 알려주는 2024년 서울 아파트 투자 핫스팟',
      thumbnailUrl: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=300&fit=crop',
      duration: 754, // 12:34 in seconds
      viewCount: 87000,
      likeCount: 1200,
      createdAt: '2024-01-15T00:00:00Z',
      creator: {
        id: 'creator1',
        name: '부동산박사',
        profileImage: 'https://i.pravatar.cc/32?img=10'
      },
      category: 'realestate'
    },
    {
      id: '2',
      title: '삼성전자 매수 타이밍! 반도체 사이클 분석',
      description: '반도체 업계 전망과 삼성전자 투자 포인트 완벽 분석',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
      duration: 1125, // 18:45 in seconds
      viewCount: 124000,
      likeCount: 2100,
      createdAt: '2024-01-12T00:00:00Z',
      creator: {
        id: 'creator2',
        name: '주식천재',
        profileImage: 'https://i.pravatar.cc/32?img=14'
      },
      category: 'stock'
    },
    {
      id: '3',
      title: '2024 신형 BMW 3시리즈 시승기',
      description: '완전히 새로워진 BMW 3시리즈의 모든 것',
      thumbnailUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop',
      duration: 920, // 15:20 in seconds
      viewCount: 95000,
      likeCount: 1800,
      createdAt: '2024-01-10T00:00:00Z',
      creator: {
        id: 'creator3',
        name: '카리뷰어',
        profileImage: 'https://i.pravatar.cc/32?img=18'
      },
      category: 'car'
    },
    {
      id: '4',
      title: '집에서 만드는 완벽한 파스타 레시피',
      description: '이탈리아 셰프가 알려주는 정통 파스타 만들기',
      thumbnailUrl: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&h=300&fit=crop',
      duration: 510, // 8:30 in seconds
      viewCount: 156000,
      likeCount: 3200,
      createdAt: '2024-01-08T00:00:00Z',
      creator: {
        id: 'creator4',
        name: '요리왕',
        profileImage: 'https://i.pravatar.cc/32?img=20'
      },
      category: 'food'
    },
    {
      id: '5',
      title: '제주도 숨은 맛집 투어',
      description: '현지인만 아는 제주도 진짜 맛집들을 소개합니다',
      thumbnailUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
      duration: 1335, // 22:15 in seconds
      viewCount: 203000,
      likeCount: 4100,
      createdAt: '2024-01-05T00:00:00Z',
      creator: {
        id: 'creator5',
        name: '여행러버',
        profileImage: 'https://i.pravatar.cc/32?img=22'
      },
      category: 'travel'
    },
    {
      id: '6',
      title: 'LOL 시즌14 최강 챔피언 티어리스트',
      description: '프로게이머가 알려주는 랭크 올리는 챔피언 추천',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
      duration: 1000, // 16:40 in seconds
      viewCount: 89000,
      likeCount: 1900,
      createdAt: '2024-01-03T00:00:00Z',
      creator: {
        id: 'creator6',
        name: '게임마스터',
        profileImage: 'https://i.pravatar.cc/32?img=24'
      },
      category: 'game'
    },
    {
      id: '7',
      title: '강남 재건축 대박! 새 아파트 분양 정보',
      description: '강남 재건축 단지의 최신 분양 정보와 투자 포인트',
      thumbnailUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
      duration: 865, // 14:25 in seconds
      viewCount: 156000,
      likeCount: 2800,
      createdAt: '2024-01-16T00:00:00Z',
      creator: {
        id: 'creator7',
        name: '부동산왕',
        profileImage: 'https://i.pravatar.cc/32?img=15'
      },
      category: 'realestate'
    },
    {
      id: '8',
      title: '전세대출 금리 변화! 지금이 기회?',
      description: '최근 전세대출 금리 동향과 대출 받기 좋은 타이밍 분석',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
      duration: 720, // 12:00 in seconds
      viewCount: 98000,
      likeCount: 1650,
      createdAt: '2024-01-14T00:00:00Z',
      creator: {
        id: 'creator8',
        name: '대출전문가',
        profileImage: 'https://i.pravatar.cc/32?img=16'
      },
      category: 'realestate'
    },
    {
      id: '9',
      title: '인천 청라 신도시 현장 리포트',
      description: '청라 신도시의 현재 상황과 향후 전망을 현장에서 직접 확인',
      thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
      duration: 980, // 16:20 in seconds
      viewCount: 67000,
      likeCount: 1200,
      createdAt: '2024-01-11T00:00:00Z',
      creator: {
        id: 'creator9',
        name: '현장탐방러',
        profileImage: 'https://i.pravatar.cc/32?img=17'
      },
      category: 'realestate'
    }
  ]

  // YouTube 비디오 로드
  const loadYouTubeVideos = async () => {
    try {
      console.log('Loading YouTube videos...')
      const response = await fetch('/api/videos/youtube?limit=12')
      if (response.ok) {
        const data = await response.json()
        console.log('YouTube videos loaded:', data)
        if (data.videos && data.videos.length > 0) {
          setYoutubeVideos(data.videos)
          console.log('Set YouTube videos:', data.videos.length)
        } else {
          console.log('No YouTube videos found')
        }
      } else {
        console.error('Failed to fetch YouTube videos:', response.status)
      }
    } catch (error) {
      console.error('Failed to load YouTube videos:', error)
    }
  }
  
  // 홈 비디오 로드
  const loadHomeVideos = async () => {
    try {
      const response = await fetch('/api/home/videos?section=all&limit=12')
      if (response.ok) {
        const data = await response.json()
        setHomeData(data)
      }
    } catch (error) {
      console.error('Failed to load home videos:', error)
    }
  }

  // 비디오 데이터 로드 (실제 비디오 테이블에서 가져오기)
  const loadVideos = async () => {
    try {
      setLoading(true)
      
      // 새로운 비디오 API 엔드포인트 사용
      const response = await fetch('/api/home/videos?section=all&limit=20')
      if (response.ok) {
        const data = await response.json()
        
        // 트렌딩 비디오 설정
        if (data.sections?.trending) {
          setVideos(data.sections.trending)
        }
        
        // 홈 데이터 설정
        setHomeData(data)
        
        return
      }
      
      // API 실패 시 빈 배열 사용
      console.log('API failed, no videos to display')
      setVideos([])
      
    } catch (error) {
      console.error('Failed to load videos:', error)
      // 오류 발생 시 빈 배열 사용
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // UI 설정 로드
    loadSettingsFromAPI()
    
    // 로그인 상태 확인
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    
    // 업체 사용자는 비즈니스 대시보드로 리다이렉트
    if (currentUser && currentUser.type === 'BUSINESS') {
      router.push('/business/dashboard')
    }

    // 비디오 데이터 로드
    loadVideos()
    // YouTube 비디오 로드
    loadYouTubeVideos()
    // 홈 비디오 로드
    loadHomeVideos()
  }, [router])
  
  // 디버깅용 useEffect
  useEffect(() => {
    console.log('=== Main Page Debug ===')
    console.log('All sections:', allSections.map(s => `${s.id}(order:${s.order}, visible:${s.visible}, type:${s.type})`))
    console.log('Visible sections:', visibleSections.map(s => `${s.id}(${s.order}, type:${s.type})`))
    console.log('homeData sections:', homeData?.sections ? Object.keys(homeData.sections) : 'none')
    console.log('realestate videos count:', homeData?.sections?.realestate?.length || 0)
    console.log('youtubeVideos count:', youtubeVideos.length)
    console.log('Config sectionOrder:', config.mainPage?.sectionOrder)
  }, [homeData, youtubeVideos, config])


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/videos?search=${encodeURIComponent(searchTerm)}`)
    }
  }

  return (
    <PageLayout>
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* 섹션들을 순서대로 렌더링 */}
        {visibleSections.map((section) => {
          switch (section.type) {
            case 'hero':
              // 메인 배너 슬라이드 (모바일: 1개씩, 데스크톱: 2개씩)
              if (bannerSlides.length === 0) return null;
              
              // 현재 표시할 슬라이드 렌더링 함수
              const renderSlide = (slide: any) => {
                const SlideContent = (
                  <div
                    className={`w-full h-40 sm:h-48 md:h-64 lg:h-80 ${slide.bgColor} text-white relative rounded-xl sm:rounded-2xl overflow-hidden`}
                    style={{
                      backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className={`p-3 sm:p-4 md:p-6 lg:p-8 h-full flex flex-col justify-center ${slide.backgroundImage ? 'bg-black/30' : ''}`}>
                      <div>
                        <span className="inline-block bg-white/20 backdrop-blur px-2 sm:px-3 py-1 rounded-full text-xs font-medium mb-2">
                          {slide.tag || '🎬 VIDEO'}
                        </span>
                        <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 whitespace-pre-line leading-tight">
                          {slide.title.replace(/\\n/g, '\n')}
                        </h2>
                        <p className="text-xs sm:text-sm md:text-base opacity-90 line-clamp-2">{slide.subtitle}</p>
                        {slide.link && !slide.backgroundImage && (
                          <Link 
                            href={slide.link}
                            className="inline-block mt-2 sm:mt-3 md:mt-4 bg-white/20 backdrop-blur border border-white/30 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full hover:bg-white/30 transition text-xs touch-manipulation"
                          >
                            자세히 보기 →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );

                if (slide.link && slide.backgroundImage) {
                  return (
                    <Link href={slide.link} className="block group">
                      <div className="relative">
                        {SlideContent}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded-2xl" />
                      </div>
                    </Link>
                  );
                }
                return SlideContent;
              };
              
              return (
                <div key={section.id} className="relative mb-8">
                  {/* 모바일 및 태블릿: 1개씩 표시 */}
                  <div className="md:hidden">
                    <div className="overflow-hidden">
                      <div 
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {bannerSlides.map((slide, index) => (
                          <div key={index} className="min-w-full flex-shrink-0">
                            {renderSlide(slide)}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 모바일 슬라이드 점 */}
                    {bannerSlides.length > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {bannerSlides.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition ${
                              index === currentSlide ? 'bg-gray-800 w-8' : 'bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 데스크톱: 2개씩 표시 */}
                  <div className="hidden md:block">
                    <div className="overflow-hidden">
                      <div 
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {Array.from({ length: Math.ceil(bannerSlides.length / 2) }, (_, pageIndex) => (
                          <div key={pageIndex} className="min-w-full flex-shrink-0 grid grid-cols-2 gap-4">
                            {bannerSlides.slice(pageIndex * 2, pageIndex * 2 + 2).map((slide, slideIndex) => (
                              <div key={`${pageIndex}-${slideIndex}`}>
                                {renderSlide(slide)}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 데스크톱 페이지 점 */}
                    {Math.ceil(bannerSlides.length / 2) > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {Array.from({ length: Math.ceil(bannerSlides.length / 2) }, (_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition ${
                              index === currentSlide ? 'bg-gray-800 w-8' : 'bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
              
            case 'category':
              // 카테고리 메뉴 그리드 (모바일 최적화)
              return (
                <div key={section.id} className="mb-8">
                  <div className="flex justify-center">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-11 gap-2 sm:gap-3">
                      {menuCategories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/videos?category=${category.categoryId}`}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-gray-700 transition relative">
                          {category.icon && (category.icon.startsWith('data:') || category.icon.startsWith('http')) ? (
                            <img src={category.icon} alt={category.name} className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 object-contain" />
                          ) : (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8">
                              {defaultCategoryIcons[category.categoryId] || (
                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                              )}
                            </div>
                          )}
                          {category.badge && (
                            <span className={`absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              category.badge === 'HOT' ? 'bg-red-500 text-white' : 
                              category.badge === '신규' ? 'bg-blue-500 text-white' : 
                              'bg-gray-500 text-white'
                            }`}>
                              {category.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-300 text-center line-clamp-2 leading-tight">{category.name}</span>
                      </Link>
                    ))}
                    </div>
                  </div>
                </div>
              );
              
            case 'quicklinks':
              // 바로가기 링크 (모바일: 1단 가로 스크롤, 데스크톱: 3단 그리드)
              return config.mainPage?.quickLinks && config.mainPage.quickLinks.filter(link => link.visible).length > 0 ? (
                <div key={section.id} className="mb-8">
                  {/* 모바일 및 태블릿: 가로 스크롤 */}
                  <div className="md:hidden">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {config.mainPage.quickLinks.filter(link => link.visible).map((link) => (
                        <Link 
                          key={link.id}
                          href={link.link} 
                          className="bg-gray-800 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-700 transition touch-manipulation flex-shrink-0 min-w-[180px]"
                        >
                          {link.icon && (
                            link.icon.startsWith('data:') || link.icon.startsWith('http') ? (
                              <img src={link.icon} alt={link.title} className="w-6 h-6 object-contain" />
                            ) : (
                              <span className="text-lg">{link.icon}</span>
                            )
                          )}
                          <span className="font-medium text-white text-sm whitespace-nowrap">{link.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  
                  {/* 데스크톱: 그리드 레이아웃 */}
                  <div className="hidden md:grid grid-cols-3 gap-4">
                    {config.mainPage.quickLinks.filter(link => link.visible).map((link) => (
                      <Link 
                        key={link.id}
                        href={link.link} 
                        className="bg-gray-800 rounded-xl p-5 flex items-center justify-center gap-3 hover:bg-gray-700 transition touch-manipulation"
                      >
                        {link.icon && (
                          link.icon.startsWith('data:') || link.icon.startsWith('http') ? (
                            <img src={link.icon} alt={link.title} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-2xl">{link.icon}</span>
                          )
                        )}
                        <span className="font-medium text-white text-base">{link.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null;
              
            case 'promo':
              // 프로모션 배너
              return config.mainPage?.promoBanner?.visible ? (
                config.mainPage.promoBanner.link ? (
                  <Link key={section.id} href={config.mainPage.promoBanner.link} className="block mb-8">
                    <div 
                      className="rounded-2xl p-6 relative overflow-hidden hover:shadow-lg transition group"
                      style={{
                        backgroundImage: config.mainPage.promoBanner.backgroundImage 
                          ? `url(${config.mainPage.promoBanner.backgroundImage})`
                          : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: !config.mainPage.promoBanner.backgroundImage 
                          ? '#FEF3C7' 
                          : undefined
                      }}
                    >
                      <div className={`flex items-center justify-between ${
                        config.mainPage.promoBanner.backgroundImage ? 'relative z-10' : ''
                      }`}>
                        {config.mainPage.promoBanner.backgroundImage && (
                          <div className="absolute inset-0 bg-black/20 -z-10" />
                        )}
                        <div>
                          <h3 className={`text-xl font-bold mb-1 ${
                            config.mainPage.promoBanner.backgroundImage ? 'text-white' : 'text-gray-900'
                          }`}>
                            {config.mainPage.promoBanner.title}
                          </h3>
                          <p className={config.mainPage.promoBanner.backgroundImage ? 'text-white/90' : 'text-gray-700'}>
                            {config.mainPage.promoBanner.subtitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {config.mainPage.promoBanner.icon && (
                            <span className="text-5xl">{config.mainPage.promoBanner.icon}</span>
                          )}
                          <svg className="w-6 h-6 opacity-50 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div 
                    key={section.id}
                    className="rounded-2xl p-6 mb-8 relative overflow-hidden"
                    style={{
                      backgroundImage: config.mainPage.promoBanner.backgroundImage 
                        ? `url(${config.mainPage.promoBanner.backgroundImage})`
                        : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: !config.mainPage.promoBanner.backgroundImage 
                        ? '#FEF3C7' 
                        : undefined
                    }}
                  >
                    <div className={`flex items-center justify-between ${
                      config.mainPage.promoBanner.backgroundImage ? 'relative z-10' : ''
                    }`}>
                      {config.mainPage.promoBanner.backgroundImage && (
                        <div className="absolute inset-0 bg-black/20 -z-10" />
                      )}
                      <div>
                        <h3 className={`text-xl font-bold mb-1 ${
                          config.mainPage.promoBanner.backgroundImage ? 'text-white' : 'text-gray-900'
                        }`}>
                          {config.mainPage.promoBanner.title}
                        </h3>
                        <p className={config.mainPage.promoBanner.backgroundImage ? 'text-white/90' : 'text-gray-700'}>
                          {config.mainPage.promoBanner.subtitle}
                        </p>
                      </div>
                      {config.mainPage.promoBanner.icon && (
                        <span className="text-5xl">{config.mainPage.promoBanner.icon}</span>
                      )}
                    </div>
                  </div>
                )
              ) : null;
              
            case 'ranking':
              // 인기 비디오 섹션
              return (
                <section key={section.id} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{config.mainPage?.rankingSection?.title || '인기 비디오'}</h2>
                      {config.mainPage?.rankingSection?.subtitle && (
                        <p className="text-gray-400 mt-1">{config.mainPage.rankingSection.subtitle}</p>
                      )}
                      {!config.mainPage?.rankingSection?.subtitle && (
                        <p className="text-gray-400 mt-1">가장 많이 시청된 비디오들을 확인해보세요</p>
                      )}
                    </div>
                    <Link href="/videos" className="text-indigo-400 hover:text-indigo-300 font-medium">
                      전체보기 →
                    </Link>
                  </div>
                  
                  <VideoList
                    videos={loading ? [] : videos
                      .sort((a, b) => {
                        // 랭킹 기준에 따른 정렬
                        switch (config.mainPage?.rankingSection?.criteria) {
                          case 'popular':
                          default:
                            return b.viewCount - a.viewCount; // 조회수 높은 순
                        }
                      })
                      .slice(0, config.mainPage?.rankingSection?.count || 5)
                    }
                    loading={loading}
                    variant="default"
                    columns={4}
                  />
                </section>
              );
              
            case 'youtube':
              // YouTube 비디오 섹션 - 다중 섹션 지원
              // section.id를 사용하여 해당하는 YouTube 섹션 설정 찾기
              const youtubeConfig = config.mainPage?.youtubeSections?.find(ys => ys.id === section.id);
              if (!youtubeConfig || !youtubeConfig.visible) return null;
              
              // 카테고리에 따라 YouTube 비디오 가져오기
              const youtubeSectionVideos = homeData?.sections?.[youtubeConfig.category] || []
              
              console.log('Rendering youtube section:', {
                sectionId: section.id,
                category: youtubeConfig.category,
                videosCount: youtubeSectionVideos.length,
                config: youtubeConfig
              })
              
              if (youtubeSectionVideos.length === 0) {
                console.log('No youtube videos found for category:', youtubeConfig.category)
                return null
              }
              
              return (
                <section key={section.id} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{youtubeConfig.title}</h2>
                      {youtubeConfig.subtitle && (
                        <p className="text-gray-400 mt-1">{youtubeConfig.subtitle}</p>
                      )}
                    </div>
                    <Link href={youtubeConfig.viewAllLink || '/videos/youtube'} className="text-indigo-400 hover:text-indigo-300 font-medium">
                      전체보기 →
                    </Link>
                  </div>
                  
                  <div className={`grid gap-4 sm:gap-6 ${
                    youtubeConfig.count <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                    youtubeConfig.count <= 6 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    {youtubeSectionVideos.slice(0, youtubeConfig.count).map((video: any) => (
                      <div key={video.id} className="group">
                        <Link href={`/videos/youtube/${video.id}`} className="block">
                          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-3">
                            <img 
                              src={video.thumbnailUrl} 
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                              {Math.floor((video.duration || 0) / 60)}:{((video.duration || 0) % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-white font-medium line-clamp-2 mb-1 group-hover:text-indigo-400 transition-colors">
                              {video.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span>{video.channelTitle || video.channel?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span>조회수 {parseInt(video.viewCount || '0').toLocaleString()}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </section>
              );
              
            case 'recommended':
              // 추천 비디오
              const recommendedConfig = config.mainPage?.recommendedSection;
              if (!recommendedConfig || !recommendedConfig.visible) return null;
              
              // 추천 비디오 데이터 (homeData의 recommended 섹션 사용)
              const recommendedVideos = homeData?.sections?.recommended || [];
              
              if (recommendedVideos.length === 0) {
                console.log('No recommended videos found, returning null');
                return null;
              }
              
              return (
                <section key={section.id} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{recommendedConfig.title || '추천 비디오'}</h2>
                      {recommendedConfig.subtitle && (
                        <p className="text-gray-400 mt-1">{recommendedConfig.subtitle}</p>
                      )}
                    </div>
                    <Link href="/videos" className="text-indigo-400 hover:text-indigo-300 font-medium">
                      전체보기 →
                    </Link>
                  </div>
                  
                  <VideoList
                    videos={loading ? [] : recommendedVideos.slice(0, recommendedConfig.count || 10)}
                    loading={loading}
                    variant="default"
                    columns={4}
                  />
                </section>
              );
              
            case 'custom':
              // 커스텀 섹션
              const customSection = config.mainPage?.customSections?.find(cs => cs.id === section.id);
              if (!customSection || !customSection.visible) return null;
              
              return (
                <section key={section.id} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{customSection.title}</h2>
                      {customSection.subtitle && (
                        <p className="text-gray-400 mt-1">{customSection.subtitle}</p>
                      )}
                    </div>
                    {customSection.showMoreButton && (
                      <Link href={customSection.moreButtonLink || '/videos'} className="text-indigo-400 hover:text-indigo-300 font-medium">
                        {customSection.moreButtonText || '더보기'} →
                      </Link>
                    )}
                  </div>
                  
                  {(() => {
                    // 표시할 개수
                    const displayCount = customSection.columns * customSection.rows;
                    
                    if (customSection.type === 'auto' && customSection.filter) {
                      // 부동산 카테고리인 경우 YouTube 비디오 표시
                      if (customSection.filter.category === 'realestate') {
                        console.log('Rendering realestate section, youtubeVideos:', youtubeVideos.length)
                        return youtubeVideos.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {youtubeVideos.slice(0, displayCount).map((video) => (
                              <div key={video.id} className="group cursor-pointer">
                                <Link 
                                  href={`/videos/youtube/${video.id}`}
                                  className="block"
                                >
                                  <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-3">
                                    <img 
                                      src={video.thumbnailUrl} 
                                      alt={video.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                      {Math.floor((video.duration || 0) / 60)}:{((video.duration || 0) % 60).toString().padStart(2, '0')}
                                    </div>
                                    {video.featured && (
                                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                                        추천
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="text-white font-medium line-clamp-2 mb-1 group-hover:text-indigo-400 transition-colors">
                                      {video.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                      <span>{video.channelTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                      <span>조회수 {parseInt(video.viewCount || '0').toLocaleString()}</span>
                                      {video.assignedUser && (
                                        <span className="text-indigo-400">@{video.assignedUser.name}</span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-gray-400">비디오가 업로드되면 여기에 표시됩니다.</p>
                          </div>
                        );
                      }
                      
                      // 다른 카테고리인 경우 기존 캠페인 필터링 로직
                      let filteredCampaigns = [...campaigns];
                      
                      // 카테고리 필터링
                      if (customSection.filter.category) {
                        filteredCampaigns = filteredCampaigns.filter(c => 
                          c.category === customSection.filter!.category
                        );
                      }
                      
                      // 플랫폼 필터링
                      if (customSection.filter.platform) {
                        filteredCampaigns = filteredCampaigns.filter(c => 
                          c.platforms?.includes(customSection.filter!.platform!)
                        );
                      }
                      
                      // 정렬
                      switch (customSection.filter.sortBy) {
                        case 'latest':
                          filteredCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                          break;
                        case 'popular':
                          filteredCampaigns.sort((a, b) => b.applicants - a.applicants);
                          break;
                        case 'deadline':
                          filteredCampaigns.sort((a, b) => a.deadline - b.deadline);
                          break;
                        case 'budget':
                          filteredCampaigns.sort((a, b) => parseInt(b.budget) - parseInt(a.budget));
                          break;
                      }
                      
                      // 캠페인을 비디오로 변환
                      const convertedCustomVideos = filteredCampaigns.slice(0, displayCount).map(transformCampaignToVideo)
                      
                      return (
                        <VideoList
                          videos={convertedCustomVideos}
                          loading={loading}
                          variant="default"
                          columns={customSection.columns || 4}
                        />
                      );
                    }
                    
                    // 수동 타입이거나 필터가 없는 경우
                    return (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-400">콘텐츠를 준비중입니다.</p>
                      </div>
                    );
                  })()}
                </section>
              );
              
            default:
              return null;
          }
        })}

        {/* 하단 CTA (모바일 최적화) */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-center text-white">
          <h3 className="text-xl sm:text-2xl font-bold mb-2">비디오 크리에이터가 되어보세요</h3>
          <p className="text-white/80 mb-6 text-sm sm:text-base">창의적인 비디오 콘텐츠를 만들고 시청자들과 소통해보세요.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/register?type=creator"
              className="bg-white text-indigo-600 px-6 py-3 rounded-full font-medium hover:shadow-lg transition touch-manipulation text-sm sm:text-base"
            >
              크리에이터로 시작하기
            </Link>
            <Link
              href="/register?type=viewer"
              className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition touch-manipulation text-sm sm:text-base"
            >
              시청자로 시작하기
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
