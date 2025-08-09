'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'
import { useBusinessVideoStats } from '@/hooks/useSharedData'
// VideoManagementTab removed - old campaign platform component
import { Play, Eye, Heart, Users, TrendingUp, Clock, BarChart3, MessageCircle } from 'lucide-react'

function StudioDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'videos')
  
  // 캐싱된 통계 데이터 사용
  const { data: videoStatsData, isLoading: videoStatsLoading } = useBusinessVideoStats()
  
  const videoStats = videoStatsData || {
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    subscriberCount: 0,
    engagementRate: 0,
    watchTime: 0,
    commentCount: 0,
    shareCount: 0,
    popularVideos: []
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('=== Studio Dashboard 인증 체크 ===');
        
        // AuthService에서 먼저 확인
        let currentUser = AuthService.getCurrentUser()
        console.log('AuthService user:', currentUser)
        
        // AuthService에 없으면 localStorage 확인
        if (!currentUser) {
          const storedUser = localStorage.getItem('user')
          console.log('Stored user:', storedUser)
          
          if (!storedUser) {
            console.log('No user in localStorage - 로그인 페이지로 리다이렉트')
            router.push('/login')
            return
          }
          
          const parsedUser = JSON.parse(storedUser)
          console.log('Parsed user:', parsedUser)
          
          // 사용자 정보 복원
          currentUser = parsedUser
        }
        
        const userType = currentUser?.type?.toUpperCase()
        console.log('User type:', userType);
        
        if (!currentUser || (userType !== 'BUSINESS' && userType !== 'ADMIN' && userType !== 'INFLUENCER')) {
          console.log('User type not allowed:', userType, '- 로그인 페이지로 리다이렉트')
          router.push('/login')
          return
        }
        
        console.log('인증 성공 - 페이지 로드');
        setUser(currentUser)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab') || 'videos'
    setActiveTab(tab)
  }, [searchParams])

  if (isLoading || videoStatsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/studio/dashboard?tab=${tab}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 서브 히어로 섹션 */}
      <section className="bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              환영합니다, {user?.name || user?.email || '크리에이터'}님! 🎬
            </h1>
            <p className="text-lg text-white/80 mb-6">
              오늘도 멋진 콘텐츠로 구독자들과 소통하세요.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/studio/upload" 
                className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Play className="w-5 h-5 mr-2" />
                비디오 업로드
              </Link>
              <Link 
                href="/studio/analytics" 
                className="inline-flex items-center px-6 py-3 bg-white/10 text-white border border-white/20 rounded-lg font-medium hover:bg-white/20 transition-colors"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                분석 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-6 py-8 flex-1">
        {/* 비디오 통계 카드 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">채널 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">총 비디오</h3>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{videoStats.totalVideos}</p>
              <p className="text-sm text-gray-500 mt-1">업로드된 비디오</p>
              <div className="mt-3 text-xs text-red-600">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  +{videoStats.recentVideos || 0} 이번주
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">총 조회수</h3>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{videoStats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">누적 조회수</p>
              <div className="mt-3 text-xs text-blue-600">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  평균 {videoStats.averageViews || 0}회
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">구독자</h3>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{videoStats.subscriberCount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">채널 구독자</p>
              <div className="mt-3 text-xs text-green-600">
                <span className="inline-flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  +12% 이번달
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">시청 시간</h3>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{Math.floor(videoStats.watchTime / 60)}시간</p>
              <p className="text-sm text-gray-500 mt-1">총 시청 시간</p>
              <div className="mt-3 text-xs text-purple-600">
                <span className="inline-flex items-center">
                  평균 시청 {Math.floor((videoStats.watchTime / videoStats.totalViews) || 0)}분
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 참여도 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">참여도 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">좋아요</h3>
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{videoStats.totalLikes.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">총 좋아요 수</p>
              <div className="mt-3 text-xs text-pink-600">
                <span className="inline-flex items-center">
                  참여율 {videoStats.engagementRate}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">댓글</h3>
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{videoStats.commentCount?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-500 mt-1">총 댓글 수</p>
              <div className="mt-3 text-xs text-indigo-600">
                <span className="inline-flex items-center">
                  평균 {Math.floor((videoStats.commentCount || 0) / videoStats.totalVideos)}개
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">성장률</h3>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">+24%</p>
              <p className="text-sm text-gray-500 mt-1">월간 성장률</p>
              <div className="mt-3 text-xs text-green-600">
                <span className="inline-flex items-center">
                  지난달 대비
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 인기 비디오 섹션 */}
        {videoStats.popularVideos && videoStats.popularVideos.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">인기 비디오 TOP 5</h3>
                <Link href="/studio/videos" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  전체 보기 →
                </Link>
              </div>
              <div className="space-y-4">
                {videoStats.popularVideos.map((video: any, index: number) => (
                  <div key={video.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                    </div>
                    <div className="flex-shrink-0">
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-16 h-12 bg-gray-200 rounded object-cover"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Play className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/videos/${video.id}`} className="block">
                        <h4 className="text-sm font-medium text-gray-900 truncate hover:text-indigo-600">
                          {video.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {video.views.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            {video.likes.toLocaleString()}
                          </span>
                          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('videos')}
              className={`${
                activeTab === 'videos'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              내 비디오
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`${
                activeTab === 'analytics'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              분석
            </button>
            <button
              onClick={() => handleTabChange('comments')}
              className={`${
                activeTab === 'comments'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              댓글
            </button>
            <button
              onClick={() => handleTabChange('revenue')}
              className={`${
                activeTab === 'revenue'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              수익
            </button>
            <button
              onClick={() => handleTabChange('superchat')}
              className={`${
                activeTab === 'superchat'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              SuperChat
            </button>
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div>
          {activeTab === 'videos' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">내 비디오</h3>
              <p className="text-gray-600">비디오 관리 기능은 준비 중입니다.</p>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">채널 분석</h3>
              <p className="text-gray-600">분석 기능은 준비 중입니다.</p>
            </div>
          )}
          {activeTab === 'comments' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">댓글 관리</h3>
              <p className="text-gray-600">댓글 관리 기능은 준비 중입니다.</p>
            </div>
          )}
          {activeTab === 'revenue' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">수익 관리</h3>
              <p className="text-gray-600">수익 관리 기능은 준비 중입니다.</p>
            </div>
          )}
          {activeTab === 'superchat' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SuperChat 관리</h3>
              <p className="text-gray-600">SuperChat 관리 기능은 준비 중입니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function StudioDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudioDashboardContent />
    </Suspense>
  )
}