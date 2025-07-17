'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'

export default function BusinessDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    totalSpent: 0
  })
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [recentApplications, setRecentApplications] = useState<any[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('=== Business Dashboard 인증 체크 ===');
        
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
          
          // AuthService 복원
          AuthService.login(parsedUser.type, parsedUser)
          currentUser = parsedUser
        }
        
        const userType = currentUser.type?.toUpperCase()
        console.log('User type:', userType);
        
        if (userType !== 'BUSINESS' && userType !== 'ADMIN') {
          console.log('User type not allowed:', userType, '- 로그인 페이지로 리다이렉트')
          router.push('/login')
          return
        }
        
        console.log('인증 성공 - 페이지 로드');
        setUser(currentUser)
        setIsLoading(false)
        
        // 통계 데이터 가져오기
        fetchStats()
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [])

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await apiGet('/api/business/stats')
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setCampaigns(data.campaigns || [])
        setRecentApplications(data.recentApplications || [])
      } else {
        console.error('Stats API Error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  if (isLoading) {
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

  return (
    <>
      {/* 메인 컨텐츠 */}
      <div className="min-h-screen bg-gray-50">

      {/* 서브 히어로 섹션 */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              안녕하세요, {user.name}님! 👋
            </h1>
            <p className="text-lg text-white/80 mb-6">
              오늘도 성공적인 캠페인을 만들어보세요. LinkPick가 함께합니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/business/campaigns/new" 
                className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 캠페인 만들기
              </Link>
              <Link 
                href="/business/influencers" 
                className="inline-flex items-center px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                인플루언서 찾기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-6 py-8 flex-1">
        {/* 통계 카드 - 애니메이션 효과 추가 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">전체 캠페인</h3>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
            <p className="text-sm text-gray-500 mt-1">총 캠페인 수</p>
            <div className="mt-3 text-xs text-indigo-600">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                +20% 지난달 대비
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">진행중 캠페인</h3>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            <p className="text-sm text-gray-500 mt-1">현재 진행중</p>
            <div className="mt-3 text-xs text-green-600">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                +5% 지난주 대비
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">총 지원자</h3>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
            <p className="text-sm text-gray-500 mt-1">누적 지원자</p>
            <div className="mt-3 text-xs text-purple-600">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                +35% 이번달
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">총 지출</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">₩{stats.totalSpent.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">누적 집행 금액</p>
            <div className="mt-3 text-xs text-blue-600">
              <span className="inline-flex items-center">
                ROI 320% 달성
              </span>
            </div>
          </div>
        </div>

        {/* 캠페인 리스트와 최근 지원자 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 캠페인 리스트 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">내 캠페인</h2>
                  <Link href="/business/campaigns/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    새 캠페인 등록
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-medium text-gray-900">{campaign.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status === 'active' ? '진행중' : '완료'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>지원자: {campaign.applications}/{campaign.maxApplications}명</span>
                        <span>예산: {campaign.budget}</span>
                        <span>카테고리: {(campaign as any).category}</span>
                      </div>
                      <span className={campaign.deadline === '완료' ? 'text-gray-500' : 'text-red-600 font-medium'}>
                        {campaign.deadline}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center space-x-3">
                      <Link href={`/business/campaigns/${campaign.id}`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        상세보기
                      </Link>
                      <Link href={`/business/campaigns/${campaign.id}/applicants`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        지원자 관리
                      </Link>
                      {campaign.status === 'active' && (
                        <Link href={`/business/campaigns/${campaign.id}/edit`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                          수정
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-gray-200">
                <Link href="/business/campaigns" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  모든 캠페인 보기 →
                </Link>
              </div>
            </div>
          </div>

          {/* 최근 지원자 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">최근 지원자</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentApplications.map((application) => (
                  <div key={application.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{application.influencerName}</h4>
                        <p className="text-xs text-gray-500 mt-1">{application.campaignTitle}</p>
                      </div>
                      <span className="text-xs text-gray-500">{application.appliedAt}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <span>팔로워: {application.followers}</span>
                      <span>참여율: {application.engagementRate}</span>
                    </div>
                    <div className="mt-3 flex items-center space-x-2">
                      <button className="text-xs text-green-600 hover:text-green-700 font-medium">승인</button>
                      <span className="text-gray-300">|</span>
                      <button className="text-xs text-red-600 hover:text-red-700 font-medium">거절</button>
                      <span className="text-gray-300">|</span>
                      <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">프로필</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-gray-200">
                <Link href="/business/applications" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  모든 지원자 보기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      </div>
    </>
  )
}