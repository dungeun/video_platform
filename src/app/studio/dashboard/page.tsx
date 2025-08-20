'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'
import { useBusinessVideoStats } from '@/hooks/useSharedData'
// VideoManagementTab removed - old campaign platform component
import { Play, Eye, Heart, Users, TrendingUp, Clock, BarChart3, MessageCircle, Calendar, DollarSign, Bell, Settings, Upload, Zap } from 'lucide-react'

// Custom Chart Components
function RevenueChart() {
  const data = [
    { day: '1', ad: 45000, superchat: 12000 },
    { day: '2', ad: 38000, superchat: 8000 },
    { day: '3', ad: 52000, superchat: 15000 },
    { day: '4', ad: 41000, superchat: 11000 },
    { day: '5', ad: 48000, superchat: 13000 },
    { day: '6', ad: 55000, superchat: 18000 },
    { day: '7', ad: 43000, superchat: 9000 }
  ]
  
  const maxValue = Math.max(...data.map(d => d.ad + d.superchat))
  
  return (
    <div className="h-64">
      <div className="flex items-end space-x-1 sm:space-x-2 h-full">
        {data.map((item, index) => {
          const totalHeight = ((item.ad + item.superchat) / maxValue) * 200
          const adHeight = (item.ad / maxValue) * 200
          const superchatHeight = (item.superchat / maxValue) * 200
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex flex-col-reverse" style={{ height: '200px' }}>
                <div 
                  className="bg-red-500 rounded-t-sm" 
                  style={{ height: `${adHeight}px` }}
                  title={`광고 수익: ₩${item.ad.toLocaleString()}`}
                ></div>
                <div 
                  className="bg-blue-500 rounded-t-sm" 
                  style={{ height: `${superchatHeight}px` }}
                  title={`SuperChat: ₩${item.superchat.toLocaleString()}`}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-2 hidden sm:block">{item.day}일</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ViewerStatsChart() {
  const data = [
    { time: '00:00', views: 1200, watchTime: 45 },
    { time: '04:00', views: 800, watchTime: 32 },
    { time: '08:00', views: 2200, watchTime: 68 },
    { time: '12:00', views: 3500, watchTime: 85 },
    { time: '16:00', views: 4100, watchTime: 92 },
    { time: '20:00', views: 3800, watchTime: 88 },
    { time: '24:00', views: 2800, watchTime: 75 }
  ]
  
  const maxViews = Math.max(...data.map(d => d.views))
  const maxWatchTime = Math.max(...data.map(d => d.watchTime))
  
  return (
    <div className="h-64">
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 400 180">
          {/* Views Line */}
          <polyline
            points={data.map((item, index) => 
              `${(index * 60) + 20},${180 - (item.views / maxViews) * 140}`
            ).join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Watch Time Line */}
          <polyline
            points={data.map((item, index) => 
              `${(index * 60) + 20},${180 - (item.watchTime / maxWatchTime) * 140}`
            ).join(' ')}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Data Points */}
          {data.map((item, index) => (
            <g key={index}>
              <circle
                cx={(index * 60) + 20}
                cy={180 - (item.views / maxViews) * 140}
                r="4"
                fill="#3B82F6"
                className="drop-shadow-sm"
              />
              <circle
                cx={(index * 60) + 20}
                cy={180 - (item.watchTime / maxWatchTime) * 140}
                r="4"
                fill="#EF4444"
                className="drop-shadow-sm"
              />
            </g>
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          {data.map((item, index) => (
            <span key={index}>{item.time}</span>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">조회수</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm text-gray-600">시청시간 (%)</span>
        </div>
      </div>
    </div>
  )
}

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

        {/* 대시보드 위젯 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* 최근 활동 위젯 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
                  <p className="text-sm text-gray-500">지난 7일간의 채널 활동</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { type: 'upload', content: 'React 고급 패턴 #3', time: '2시간 전', icon: Upload, color: 'text-green-600 bg-green-100' },
                { type: 'comment', content: '신규 댓글 5개에 답글 완료', time: '4시간 전', icon: MessageCircle, color: 'text-blue-600 bg-blue-100' },
                { type: 'milestone', content: '구독자 10,000명 달성!', time: '1일 전', icon: Users, color: 'text-purple-600 bg-purple-100' },
                { type: 'revenue', content: '이번주 수익 목표 달성', time: '2일 전', icon: DollarSign, color: 'text-yellow-600 bg-yellow-100' }
              ].map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.content}</div>
                      <div className="text-xs text-gray-500">{activity.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 빠른 액션 위젯 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">빠른 액션</h3>
                  <p className="text-sm text-gray-500">자주 사용하는 기능들</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Link href="/studio/upload" className="group p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">비디오 업로드</div>
                </div>
              </Link>
              
              <button className="group p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Play className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">라이브 시작</div>
                </div>
              </button>
              
              <Link href="/studio/analytics" className="group p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">상세 분석</div>
                </div>
              </Link>
              
              <Link href="/studio/settings" className="group p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">채널 설정</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

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
            <div className="space-y-6">
              {/* 수익 차트 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">수익 분석</h3>
                    <p className="text-sm text-gray-500">최근 30일간의 수익 추이</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">광고 수익</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">SuperChat</span>
                    </div>
                  </div>
                </div>
                <RevenueChart />
              </div>
              
              {/* 시청자 통계 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">시청자 통계</h3>
                    <p className="text-sm text-gray-500">조회수 및 시청시간 추이</p>
                  </div>
                </div>
                <ViewerStatsChart />
              </div>
              
              {/* 참여도 분석 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">참여도 분석</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600 mb-1">{((videoStats.totalLikes / videoStats.totalViews) * 100 || 0).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">좋아요율</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">{((videoStats.commentCount / videoStats.totalViews) * 100 || 0).toFixed(2)}%</div>
                    <div className="text-sm text-gray-600">댓글율</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{Math.floor(((videoStats.watchTime / 60) / videoStats.totalViews) * 100) || 0}%</div>
                    <div className="text-sm text-gray-600">시청완료율</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* 댓글 알림 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">새 알림</h3>
                      <p className="text-sm text-gray-500">답변이 필요한 댓글과 알림</p>
                    </div>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">5개</span>
                </div>
                <div className="space-y-4">
                  {[
                    { user: '김민수', comment: '정말 유용한 강의였어요! 다음 편은 언제 올라오나요?', video: 'React 튜토리얼 #1', time: '2시간 전' },
                    { user: '이지은', comment: '설명이 너무 잘 되어있네요. 감사합니다!', video: 'JavaScript 기초', time: '4시간 전' },
                    { user: '박철수', comment: '코드에서 오타가 있는 것 같은데 확인해주세요', video: 'Node.js 실습', time: '6시간 전' }
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-indigo-600">{item.user[0]}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.user}</span>
                          <span className="text-xs text-gray-500">• {item.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{item.comment}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">on "{item.video}"</span>
                        <div className="flex items-center space-x-2">
                          <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">답글</button>
                          <button className="text-xs text-gray-500 hover:text-gray-700">숨기기</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 댓글 통계 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">댓글 활동</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">24</div>
                    <div className="text-sm text-gray-600">오늘 새 댓글</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">18</div>
                    <div className="text-sm text-gray-600">답변 완료</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">6</div>
                    <div className="text-sm text-gray-600">답변 대기</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">92%</div>
                    <div className="text-sm text-gray-600">답변율</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* 수익 개요 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">이번 달 총 수익</h3>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-600">₩1,250,000</p>
                  <p className="text-sm text-gray-500 mt-1">+15% vs 지난달</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">광고 수익</h3>
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">₩980,000</p>
                  <p className="text-sm text-gray-500 mt-1">78% of total</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">SuperChat</h3>
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">₩270,000</p>
                  <p className="text-sm text-gray-500 mt-1">22% of total</p>
                </div>
              </div>
              
              {/* 수익 내역 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">최근 수익 내역</h3>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">전체 보기</button>
                </div>
                <div className="space-y-4">
                  {[
                    { type: '광고 수익', amount: 45000, date: '2024-01-15', video: 'React 튜토리얼 #1' },
                    { type: 'SuperChat', amount: 12000, date: '2024-01-14', video: '라이브 스트림' },
                    { type: '광고 수익', amount: 32000, date: '2024-01-13', video: 'JavaScript 강의' },
                    { type: 'SuperChat', amount: 8000, date: '2024-01-12', video: '코딩 실습 라이브' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          item.type === '광고 수익' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.type}</div>
                          <div className="text-xs text-gray-500">{item.video}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">+₩{item.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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