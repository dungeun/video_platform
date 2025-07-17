'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import SetMockToken from './set-mock-token'
import CampaignDetailPanel from '@/components/admin/CampaignDetailPanel'
import CampaignCreateModal from '@/components/admin/CampaignCreateModal'
import { adminApi } from '@/lib/admin-api'

interface Campaign {
  id: string
  title: string
  description: string
  businessName: string
  businessEmail: string
  platform: string
  budget: number
  targetFollowers: number
  startDate: string
  endDate: string
  status: string
  applicantCount: number
  selectedCount: number
  createdAt: string
  imageUrl?: string
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [currentPage, filter, searchTerm])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filter !== 'all' && { status: filter }),
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await adminApi.get(`/api/admin/campaigns?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.total || 0)
      } else {
        console.error('Failed to fetch campaigns:', response.status)
        setCampaigns([])
      }
    } catch (error) {
      console.error('캠페인 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 검색이나 필터 변경 시 첫 페이지로 리셋
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }
  
  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch)
    setCurrentPage(1)
  }

  const openCampaignDetail = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setIsPanelOpen(true)
  }

  const closeCampaignDetail = () => {
    setIsPanelOpen(false)
    setTimeout(() => setSelectedCampaignId(null), 300) // 애니메이션 후 초기화
  }

  const handlePanelStatusChange = () => {
    fetchCampaigns() // 목록 새로고침
  }

  const handleCreateSuccess = () => {
    setCurrentPage(1)
    fetchCampaigns()
  }

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    // 상태 변경 확인
    const statusMessages: { [key: string]: string } = {
      active: '이 캠페인을 승인하시겠습니까?',
      paused: '이 캠페인을 일시중지하시겠습니까?',
      completed: '이 캠페인을 완료 처리하시겠습니까?',
      cancelled: '이 캠페인을 취소하시겠습니까?'
    }
    
    const message = statusMessages[newStatus] || '상태를 변경하시겠습니까?'
    
    if (!confirm(message)) {
      return
    }
    
    try {
      const response = await adminApi.put(`/api/admin/campaigns/${campaignId}/status`, { status: newStatus })
      
      if (response.ok) {
        setCampaigns(prev => prev.map(campaign =>
          campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign
        ))
        
        // 성공 메시지 (옵션)
        // alert('상태가 변경되었습니다.')
      } else {
        alert('상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '진행중'
      case 'pending': return '승인대기'
      case 'paused': return '일시중지'
      case 'completed': return '완료'
      case 'cancelled': return '취소'
      default: return '알 수 없음'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM': return '📷'
      case 'YOUTUBE': return '🎥'
      case 'TIKTOK': return '🎵'
      case 'BLOG': return '✍️'
      default: return '📱'
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
      <SetMockToken />
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">캠페인 관리</h1>
            <p className="text-gray-600 mt-1">플랫폼의 모든 캠페인을 관리하고 승인합니다</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>신규 캠페인</span>
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 캠페인</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">진행중</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인대기</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 예산</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₩{campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="캠페인 제목 또는 업체명으로 검색..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 상태</option>
                <option value="pending">승인대기</option>
                <option value="active">진행중</option>
                <option value="paused">일시중지</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>
        </div>

        {/* 캠페인 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업체
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  플랫폼
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  예산
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  지원자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img 
                          className="h-16 w-16 rounded-lg object-cover"
                          src={campaign.imageUrl || '/placeholder-image.jpg'}
                          alt={campaign.title}
                        />
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => openCampaignDetail(campaign.id)}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                        >
                          {campaign.title}
                        </button>
                        <div className="text-sm text-gray-500">{(campaign as any).description}</div>
                        <div className="text-xs text-gray-400">
                          {campaign.startDate} ~ {campaign.endDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{campaign.businessName}</div>
                    <div className="text-sm text-gray-500">{campaign.businessEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getPlatformIcon((campaign as any).category)}</span>
                      <span className="text-sm text-gray-900">{(campaign as any).category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₩{((campaign as any).budget || 0).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{(campaign as any).targetFollowers.toLocaleString()} 팔로워</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{campaign.applicantCount}명</div>
                    <div className="text-sm text-gray-500">선택: {campaign.selectedCount}명</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-1">
                        {campaign.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(campaign.id, 'active')}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleStatusChange(campaign.id, 'cancelled')}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              거절
                            </button>
                          </>
                        )}
                        {campaign.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(campaign.id, 'paused')}
                              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                            >
                              일시중지
                            </button>
                            <button
                              onClick={() => handleStatusChange(campaign.id, 'completed')}
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              완료
                            </button>
                          </>
                        )}
                        {campaign.status === 'paused' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(campaign.id, 'active')}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              재개
                            </button>
                            <button
                              onClick={() => handleStatusChange(campaign.id, 'cancelled')}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              취소
                            </button>
                          </>
                        )}
                        {(campaign.status === 'completed' || campaign.status === 'cancelled') && (
                          <span className="px-3 py-1 text-xs text-gray-500">
                            작업 완료
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{totalCount}</span>개 중{' '}
                  <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> -{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> 표시
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">이전</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* 페이지 번호 */}
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1
                    // 현재 페이지 주변 3개씩만 표시
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    } else if (
                      pageNumber === currentPage - 3 ||
                      pageNumber === currentPage + 3
                    ) {
                      return (
                        <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">다음</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 캠페인 상세 슬라이드 패널 */}
      <CampaignDetailPanel
        campaignId={selectedCampaignId}
        isOpen={isPanelOpen}
        onClose={closeCampaignDetail}
        onStatusChange={handlePanelStatusChange}
      />

      {/* 캠페인 생성 모달 */}
      <CampaignCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </AdminLayout>
  )
}