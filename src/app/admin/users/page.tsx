'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { adminApi } from '@/lib/admin-api'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface UserData {
  id: string
  name: string
  email: string
  type: string
  status: string
  createdAt: string
  lastLogin: string
  verified: boolean
  campaigns?: number
  followers?: number
  applications?: number
  profile?: {
    bio?: string
    instagram?: string
    followerCount?: number
    youtube?: string
    followerCount?: number
    tiktok?: string
    followerCount?: number
    followerCount?: number
    categories?: string
  }
  profile?: {
    companyName?: string
    businessNumber?: string
    representativeName?: string
    businessAddress?: string
    businessCategory?: string
    avatar?: boolean
  }
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    influencer: 0,
    business: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filterType !== 'all') params.append('type', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (searchTerm) params.append('search', searchTerm)
      params.append('page', currentPage.toString())
      params.append('limit', itemsPerPage.toString())
      
      const response = await adminApi.get(`/api/admin/users?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '사용자 목록을 불러올 수 없습니다.')
      }

      const data = await response.json()
      setUsers(data.users)
      if (data.stats) {
        setStats(data.stats)
      }
      if (data.totalPages) {
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      // 에러 발생시 빈 배열로 설정
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // 사용자 상세 정보 가져오기
  const fetchUserDetail = async (userId: string) => {
    try {
      const response = await adminApi.get(`/api/admin/users/${userId}`)

      if (!response.ok) {
        throw new Error('사용자 정보를 불러올 수 없습니다.')
      }

      const data = await response.json()
      setSelectedUser(data)
      setSheetOpen(true)
    } catch (error) {
      console.error('사용자 상세 조회 실패:', error)
      toast({
        title: "오류",
        description: "사용자 정보를 불러올 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  const handleUserClick = (user: UserData) => {
    fetchUserDetail(user.id)
  }

  useEffect(() => {
    setCurrentPage(1) // 필터 변경시 첫 페이지로
    fetchUsers()
  }, [filterType, filterStatus]) // 필터 변경시 다시 가져오기

  useEffect(() => {
    fetchUsers()
  }, [currentPage]) // 페이지 변경시 다시 가져오기

  // 검색어 입력시 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 500) // 500ms 후에 검색

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await adminApi.patch('/api/admin/users', {
        userId,
        status: newStatus
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '상태 변경에 실패했습니다.')
      }

      // 성공시 목록 새로고침
      fetchUsers()
      toast({
        title: "상태 변경 성공",
        description: "사용자 상태가 업데이트되었습니다.",
      })
    } catch (error) {
      console.error('상태 변경 실패:', error)
      toast({
        title: "상태 변경 실패",
        description: "상태 변경에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    }
  }

  const handleVerifyUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const response = await adminApi.patch('/api/admin/users', {
        userId,
        verified: !(user as any).emailVerified
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '인증 상태 변경에 실패했습니다.')
      }

      // 성공시 목록 새로고침
      fetchUsers()
      toast({
        title: "인증 상태 변경 성공",
        description: (user as any).emailVerified ? "인증이 해제되었습니다." : "인증이 완료되었습니다.",
      })
    } catch (error) {
      console.error('인증 상태 변경 실패:', error)
      toast({
        title: "인증 상태 변경 실패",
        description: "인증 상태 변경에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'inactive':
        return 'bg-gray-100 text-gray-700'
      case 'suspended':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'pending':
        return '대기'
      case 'inactive':
        return '비활성'
      case 'suspended':
        return '정지'
      default:
        return status || '알 수 없음'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'influencer':
        return '인플루언서'
      case 'business':
        return '업체'
      case 'admin':
        return '관리자'
      default:
        return '알 수 없음'
    }
  }

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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600 mt-1">플랫폼 사용자들을 관리하고 모니터링하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">관리자</p>
                <p className="text-2xl font-bold text-purple-900">{stats.admin}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">인플루언서</p>
                <p className="text-2xl font-bold text-green-900">{stats.influencer}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">업체</p>
                <p className="text-2xl font-bold text-blue-900">{stats.business}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="이름 또는 이메일 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
                  새 사용자 추가
                </button>
              </div>
            </div>
            
            {/* 사용자 타입 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사용자 타입</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                  <span className="ml-1 text-xs opacity-80">({stats.total})</span>
                </button>
                <button
                  onClick={() => setFilterType('admin')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterType === 'admin'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  관리자
                  <span className="ml-1 text-xs opacity-80">({stats.admin})</span>
                </button>
                <button
                  onClick={() => setFilterType('influencer')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterType === 'influencer'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  인플루언서
                  <span className="ml-1 text-xs opacity-80">({stats.influencer})</span>
                </button>
                <button
                  onClick={() => setFilterType('business')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterType === 'business'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  업체
                  <span className="ml-1 text-xs opacity-80">({stats.business})</span>
                </button>
              </div>
            </div>
            
            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'all'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'active'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  활성
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  대기
                </button>
                <button
                  onClick={() => setFilterStatus('inactive')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'inactive'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  비활성
                </button>
                <button
                  onClick={() => setFilterStatus('suspended')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'suspended'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  정지
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최근 로그인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[320px]">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold text-sm">
                            {userData.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => handleUserClick(userData)}
                            className="text-left hover:underline focus:outline-none"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {userData.name}
                              {userData.verified && (
                                <span className="ml-2 text-blue-500">✓</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{userData.email}</div>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        userData.type === 'admin' ? 'bg-purple-100 text-purple-700' :
                        userData.type === 'influencer' ? 'bg-green-100 text-green-700' :
                        userData.type === 'business' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getTypeText(userData.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(userData.status)}`}>
                        {getStatusText(userData.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>캠페인: {userData.campaigns || 0}개</div>
                        {userData.followers && (
                          <div className="text-xs text-gray-500">
                            팔로워: {userData.followers.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userData.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userData.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleVerifyUser(userData.id)}
                          className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                            userData.verified
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {userData.verified ? '인증됨' : '미인증'}
                        </button>
                        <div className="flex gap-1">
                          {['active', 'pending', 'inactive', 'suspended'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(userData.id, status)}
                              disabled={userData.status === status}
                              className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                                userData.status === status
                                  ? status === 'active' ? 'bg-green-600 text-white shadow-sm' :
                                    status === 'pending' ? 'bg-yellow-600 text-white shadow-sm' :
                                    status === 'inactive' ? 'bg-gray-600 text-white shadow-sm' :
                                    'bg-red-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                              } disabled:cursor-not-allowed`}
                            >
                              {getStatusText(status)}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleUserClick(userData)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          상세보기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">사용자가 없습니다</h3>
              <p className="text-gray-600">검색 조건에 맞는 사용자가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                총 {stats.total}개 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, stats.total)}개 표시
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {/* 페이지 번호들 */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-400">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 사용자 상세 정보 슬라이드 패널 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto bg-white border-l border-gray-200" side="right">
          {selectedUser && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-xl font-bold text-gray-900">사용자 상세 정보</SheetTitle>
                <SheetDescription className="text-gray-600">
                  {selectedUser.name} ({selectedUser.email})
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* 기본 정보 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">기본 정보</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? '취소' : '편집'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                      <p className="text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">사용자 타입</label>
                      <p className="text-gray-900">
                        {selectedUser.type === 'admin' ? '관리자' : 
                         selectedUser.type === 'business' ? '업체' : 
                         selectedUser.type === 'influencer' ? '인플루언서' : selectedUser.type}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedUser.status)}`}>
                          {getStatusText(selectedUser.status)}
                        </span>
                        {isEditing && (
                          <div className="flex gap-1">
                            {['active', 'pending', 'inactive', 'suspended'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  handleStatusChange(selectedUser.id, status)
                                  setSelectedUser({...selectedUser, status})
                                }}
                                disabled={selectedUser.status === status}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  selectedUser.status === status
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {getStatusText(status)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">인증 상태</label>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedUser.verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedUser.verified ? '인증됨' : '미인증'}
                        </span>
                        {isEditing && (
                          <Button
                            size="sm"
                            variant={selectedUser.verified ? "outline" : "default"}
                            onClick={() => {
                              handleVerifyUser(selectedUser.id)
                              setSelectedUser({...selectedUser, verified: !selectedUser.verified})
                            }}
                          >
                            {selectedUser.verified ? '인증 해제' : '인증하기'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                      <p className="text-gray-900">{selectedUser.createdAt}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">마지막 로그인</label>
                      <p className="text-gray-900">{selectedUser.lastLogin}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">캘페인</label>
                      <p className="text-gray-900">{selectedUser.campaigns || 0}개</p>
                    </div>
                    {selectedUser.followers !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">팔로워</label>
                        <p className="text-gray-900">{selectedUser.followers.toLocaleString()}명</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 인플루언서 프로필 */}
                {selectedUser.type === 'influencer' && selectedUser.profile && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">인플루언서 프로필</h3>
                    <div className="space-y-3">
                      {selectedUser.profile.bio && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">소개</label>
                          <p className="text-gray-900">{selectedUser.profile.bio}</p>
                        </div>
                      )}
                      {selectedUser.profile.instagram && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">인스타그램</label>
                          <p className="text-gray-900">
                            {selectedUser.profile.instagram} ({selectedUser.profile.followerCount?.toLocaleString()} 팔로워)
                          </p>
                        </div>
                      )}
                      {selectedUser.profile.youtube && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">유튜브</label>
                          <p className="text-gray-900">
                            {selectedUser.profile.youtube} ({selectedUser.profile.followerCount?.toLocaleString()} 구독자)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 업체 프로필 */}
                {selectedUser.type === 'business' && selectedUser.profile && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">업체 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                        <p className="text-gray-900">{(selectedUser.profile as any).companyName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호</label>
                        <p className="text-gray-900">{(selectedUser.profile as any).businessNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
                        <p className="text-gray-900">{(selectedUser.profile as any).representativeName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사업장 주소</label>
                        <p className="text-gray-900">{(selectedUser.profile as any).businessAddress}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업종</label>
                        <p className="text-gray-900">{(selectedUser.profile as any).businessCategory}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 삭제 버튼 */}
                {isEditing && (
                  <div className="pt-4 border-t">
                    <Button variant="destructive" className="w-full">
                      계정 삭제
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}