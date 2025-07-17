'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    revenue: 0,
    growth: 0,
    newUsers: 0,
    pendingApprovals: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [systemAlerts, setSystemAlerts] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // 실제로는 API 호출로 데이터를 가져옴
        setTimeout(() => {
          setStats({
            totalUsers: 1284,
            activeUsers: 892,
            totalCampaigns: 156,
            activeCampaigns: 42,
            revenue: 15670000,
            growth: 23.5,
            newUsers: 128,
            pendingApprovals: 15
          })
          
          setRecentActivities([
            {
              id: 1,
              type: 'user_registered',
              title: '새 사용자 가입',
              description: '인플루언서 "뷰티크리에이터A"가 가입했습니다.',
              time: '5분 전',
              icon: '👤'
            },
            {
              id: 2,
              type: 'campaign_created',
              title: '새 캠페인 생성',
              description: '패션 브랜드 B가 "여름 컬렉션" 캠페인을 생성했습니다.',
              time: '15분 전',
              icon: '📢'
            },
            {
              id: 3,
              type: 'payment_completed',
              title: '결제 완료',
              description: '뷰티 캠페인 정산금 ₩2,500,000이 처리되었습니다.',
              time: '1시간 전',
              icon: '💰'
            },
            {
              id: 4,
              type: 'report_received',
              title: '신고 접수',
              description: '부적절한 콘텐츠 신고가 접수되었습니다.',
              time: '2시간 전',
              icon: '🚨'
            }
          ])
          
          setSystemAlerts([
            {
              id: 1,
              type: 'warning',
              message: '서버 사용률이 85%에 도달했습니다.',
              time: '30분 전'
            },
            {
              id: 2,
              type: 'info',
              message: '시스템 정기 점검이 내일 오전 2시에 예정되어 있습니다.',
              time: '1시간 전'
            }
          ])
          
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error)
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-1">플랫폼 전체 현황을 한눈에 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 사용자</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  활성: {stats.activeUsers.toLocaleString()}명
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-500 text-sm font-medium">+12%</span>
              <span className="text-gray-500 text-sm ml-2">지난달 대비</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 캠페인</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalCampaigns}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  진행중: {stats.activeCampaigns}개
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-500 text-sm font-medium">+8%</span>
              <span className="text-gray-500 text-sm ml-2">지난달 대비</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">월 매출</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₩{stats.revenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  목표 달성률: 87%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-500 text-sm font-medium">+{stats.growth}%</span>
              <span className="text-gray-500 text-sm ml-2">지난달 대비</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">대기중 승인</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.pendingApprovals}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  즉시 처리 필요
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <a href="/admin/approvals" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                승인 관리 →
              </a>
            </div>
          </div>
        </div>

        {/* 시스템 알림 */}
        {systemAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">시스템 알림</h2>
            </div>
            <div className="p-6 space-y-4">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg ${
                    alert.type === 'warning' 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {alert.type === 'warning' ? (
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className={`text-sm ${
                        alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                      }`}>
                        {alert.message}
                      </p>
                      <p className={`text-xs mt-1 ${
                        alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {alert.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 시스템 설정 및 UI 설정 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* UI 설정 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">UI 설정</h2>
              <a href="/admin/ui-config" className="text-sm text-blue-600 hover:text-blue-700">
                설정 페이지로 →
              </a>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <a href="/admin/ui-config" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">헤더 커스터마이징</p>
                        <p className="text-xs text-gray-500">로고, 메뉴, CTA 버튼 설정</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
                <a href="/admin/ui-config" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">푸터 커스터마이징</p>
                        <p className="text-xs text-gray-500">콜럼 및 링크 관리</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
                <a href="/admin/ui-config" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">메뉴 관리</p>
                        <p className="text-xs text-gray-500">드래그 앤 드롭으로 순서 변경</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* 시스템 설정 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">시스템 설정</h2>
              <a href="/admin/settings" className="text-sm text-blue-600 hover:text-blue-700">
                설정 페이지로 →
              </a>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <a href="/admin/settings" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">일반 설정</p>
                        <p className="text-xs text-gray-500">사이트 정보, 유지보수 모드</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
                <a href="/admin/settings" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">결제 설정</p>
                        <p className="text-xs text-gray-500">수수료, 결제 방법, 정산 주기</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
                <a href="/admin/settings" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">알림 설정</p>
                        <p className="text-xs text-gray-500">이메일, SMS, 푸시 알림</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 활동 & 빠른 작업 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 활동 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
              <a href="/admin/activities" className="text-sm text-blue-600 hover:text-blue-700">
                전체보기 →
              </a>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{(activity as any).description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 빠른 작업 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/admin/users/new"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-600">사용자 추가</p>
                  </div>
                </a>

                <a
                  href="/admin/campaigns/review"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-600">캠페인 검토</p>
                  </div>
                </a>

                <a
                  href="/admin/reports"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-600">신고 처리</p>
                  </div>
                </a>

                <a
                  href="/admin/analytics"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-gray-600">통계 분석</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}