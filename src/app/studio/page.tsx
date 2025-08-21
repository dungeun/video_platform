'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { 
  Upload,
  Video,
  BarChart3,
  Play,
  DollarSign,
  Users,
  Eye,
  Heart,
  TrendingUp,
  Clock
} from 'lucide-react'

export default function StudioPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }
    
    // 비즈니스 타입 사용자만 접근 가능
    if (user.type?.toUpperCase() !== 'BUSINESS') {
      router.push('/dashboard')
      return
    }
    
    setIsLoading(false)
  }, [isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">스튜디오 로딩 중...</h1>
          <p className="text-gray-600">크리에이터 대시보드를 준비하고 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">크리에이터 스튜디오</h1>
          <p className="text-gray-600">콘텐츠를 제작하고 관리하세요</p>
        </div>

        {/* 주요 액션 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link 
            href="/studio/upload"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Upload className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">비디오 업로드</h3>
            <p className="text-blue-100 text-sm">새로운 콘텐츠를 업로드하세요</p>
          </Link>

          <Link 
            href="/studio/live"
            className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Play className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">라이브 방송</h3>
            <p className="text-red-100 text-sm">실시간 방송을 시작하세요</p>
          </Link>

          <Link 
            href="/studio/videos"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Video className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">비디오 관리</h3>
            <p className="text-green-100 text-sm">업로드한 비디오를 관리하세요</p>
          </Link>

          <Link 
            href="/studio/earnings"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <DollarSign className="w-8 h-8 mb-4" />
            <h3 className="text-lg font-semibold mb-2">수익 관리</h3>
            <p className="text-purple-100 text-sm">수익 현황을 확인하세요</p>
          </Link>
        </div>

        {/* 현황 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 조회수</p>
                <p className="text-2xl font-bold text-gray-900">45,672</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5%
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">구독자</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8.2%
                </p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이번 달 수익</p>
                <p className="text-2xl font-bold text-gray-900">₩567K</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15.3%
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">업로드 비디오</p>
                <p className="text-2xl font-bold text-gray-900">89</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Video className="w-3 h-3 mr-1" />
                  활성
                </p>
              </div>
              <Video className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* 콘텐츠 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 최근 업로드 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">최근 업로드</h3>
              <Link href="/studio/videos" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                전체 보기
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <Video className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">오늘의 라이브 하이라이트</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      1,234
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      89
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      2시간 전
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <Video className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">게임 플레이 영상</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      890
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      56
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      1일 전
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <Video className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">튜토리얼 시리즈 #3</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      567
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      34
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      3일 전
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 분석 및 통계 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">분석 요약</h3>
              <Link href="/studio/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                상세 보기
              </Link>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">조회수 증가율</span>
                  <span className="text-sm font-bold text-blue-600">+12.5%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">구독자 증가율</span>
                  <span className="text-sm font-bold text-green-600">+8.2%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">참여도</span>
                  <span className="text-sm font-bold text-purple-600">좋음</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}