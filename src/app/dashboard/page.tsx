'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { 
  BarChart3, 
  Video, 
  Eye, 
  Heart, 
  MessageSquare, 
  TrendingUp,
  Users,
  Clock,
  Play,
  Settings
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 로그인 상태 확인
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }
    setIsLoading(false)
  }, [isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">대시보드 로딩 중...</h1>
          <p className="text-gray-600">사용자 정보를 확인하고 있습니다.</p>
        </div>
      </div>
    )
  }

  // 사용자 타입별 대시보드 콘텐츠
  const userType = user?.type?.toUpperCase()

  if (userType === 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
            <p className="text-gray-600">시스템 전체 현황을 관리하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 사용자</p>
                  <p className="text-2xl font-bold text-gray-900">12,345</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 비디오</p>
                  <p className="text-2xl font-bold text-gray-900">8,901</p>
                </div>
                <Video className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">오늘 조회수</p>
                  <p className="text-2xl font-bold text-gray-900">156K</p>
                </div>
                <Eye className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">활성 스트림</p>
                  <p className="text-2xl font-bold text-gray-900">234</p>
                </div>
                <Play className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">빠른 액세스</h3>
              <div className="space-y-3">
                <Link href="/admin/users" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>사용자 관리</span>
                </Link>
                <Link href="/admin/videos" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <Video className="w-5 h-5 text-green-500" />
                  <span>비디오 관리</span>
                </Link>
                <Link href="/admin/analytics" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span>분석 보고서</span>
                </Link>
                <Link href="/admin/settings" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span>시스템 설정</span>
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">새로운 사용자 등록: 김크리에이터</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">비디오 업로드: "오늘의 라이브"</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">신고 접수: 부적절한 콘텐츠</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (userType === 'BUSINESS') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">크리에이터 대시보드</h1>
            <p className="text-gray-600">콘텐츠 현황과 수익을 확인하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 조회수</p>
                  <p className="text-2xl font-bold text-gray-900">45,672</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">구독자</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">이번 달 수익</p>
                  <p className="text-2xl font-bold text-gray-900">₩567K</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">업로드 비디오</p>
                  <p className="text-2xl font-bold text-gray-900">89</p>
                </div>
                <Video className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">빠른 액세스</h3>
              <div className="space-y-3">
                <Link href="/studio/upload" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <Video className="w-5 h-5 text-blue-500" />
                  <span>비디오 업로드</span>
                </Link>
                <Link href="/studio/videos" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  <span>비디오 관리</span>
                </Link>
                <Link href="/studio/earnings" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  <span>수익 관리</span>
                </Link>
                <Link href="/studio/live" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                  <Play className="w-5 h-5 text-red-500" />
                  <span>라이브 방송</span>
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">최근 업로드</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-8 bg-gray-300 rounded"></div>
                  <div>
                    <p className="text-sm font-medium">오늘의 라이브 하이라이트</p>
                    <p className="text-xs text-gray-500">조회수: 1,234</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-8 bg-gray-300 rounded"></div>
                  <div>
                    <p className="text-sm font-medium">게임 플레이 영상</p>
                    <p className="text-xs text-gray-500">조회수: 890</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // INFLUENCER, USER 또는 기본 사용자
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 대시보드</h1>
          <p className="text-gray-600">활동 현황과 즐겨보는 콘텐츠를 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">시청 시간</p>
                <p className="text-2xl font-bold text-gray-900">24.5h</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">좋아요</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">댓글</p>
                <p className="text-2xl font-bold text-gray-900">42</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">구독 채널</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">빠른 액세스</h3>
            <div className="space-y-3">
              <Link href="/mypage" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                <Users className="w-5 h-5 text-blue-500" />
                <span>마이페이지</span>
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                <Settings className="w-5 h-5 text-gray-500" />
                <span>설정</span>
              </Link>
              <Link href="/videos" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                <Video className="w-5 h-5 text-green-500" />
                <span>비디오 둘러보기</span>
              </Link>
              <Link href="/live" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                <Play className="w-5 h-5 text-red-500" />
                <span>라이브 보기</span>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">최근 시청 기록</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-8 bg-gray-300 rounded"></div>
                <div>
                  <p className="text-sm font-medium">게임 리뷰 영상</p>
                  <p className="text-xs text-gray-500">2시간 전</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-8 bg-gray-300 rounded"></div>
                <div>
                  <p className="text-sm font-medium">요리 튜토리얼</p>
                  <p className="text-xs text-gray-500">1일 전</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-8 bg-gray-300 rounded"></div>
                <div>
                  <p className="text-sm font-medium">음악 라이브</p>
                  <p className="text-xs text-gray-500">3일 전</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}