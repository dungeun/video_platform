'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'

interface CampaignDetail {
  id: string
  title: string
  description: string
  business: {
    id: string
    name: string
    email: string
    profile?: {
      companyName: string
      businessNumber: string
      representativeName: string
      businessCategory: string
    }
  }
  platform: string
  budget: number
  targetFollowers: number
  startDate: string
  endDate: string
  requirements?: string
  hashtags?: string
  imageUrl?: string
  status: string
  isPaid: boolean
  reviewFeedback?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  applications: Array<{
    id: string
    influencer: {
      id: string
      name: string
      email: string
      profile?: {
        avatar?: string
        followerCount?: number
        followerCount?: number
        followerCount?: number
      }
    }
    status: string
    message: string
    proposedPrice?: number
    createdAt: string
  }>
}

interface CampaignDetailPanelProps {
  campaignId: string | null
  isOpen: boolean
  onClose: () => void
  onStatusChange?: () => void
}

export default function CampaignDetailPanel({ 
  campaignId, 
  isOpen, 
  onClose,
  onStatusChange 
}: CampaignDetailPanelProps) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchCampaignDetail()
    }
  }, [campaignId, isOpen])

  const fetchCampaignDetail = async () => {
    if (!campaignId) return
    
    try {
      setLoading(true)
      setError('')
      const response = await adminApi.get(`/api/admin/campaigns/${campaignId}`)
      
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
      } else {
        setError('캠페인 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('캠페인 상세 조회 실패:', error)
      setError('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!campaign) return
    
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
        setCampaign(prev => prev ? { ...prev, status: newStatus } : null)
        onStatusChange?.()
      } else {
        alert('상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await adminApi.put(`/api/admin/campaigns/${campaignId}/applications/${applicationId}/status`, { status: newStatus })
      
      if (response.ok) {
        fetchCampaignDetail() // 데이터 새로고침
      } else {
        alert('지원 상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('지원 상태 변경 실패:', error)
      alert('오류가 발생했습니다.')
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

  return (
    <>
      {/* 오버레이 */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 슬라이드 패널 */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">캠페인 상세</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : campaign ? (
              <div className="p-6 space-y-6">
                {/* 캠페인 기본 정보 */}
                <div>
                  <div className="flex items-start space-x-4">
                    {campaign.imageUrl && (
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{campaign.title}</h3>
                      <p className="text-gray-600 mt-1">{(campaign as any).description}</p>
                      
                      <div className="flex items-center space-x-3 mt-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusText(campaign.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getPlatformIcon((campaign as any).category)} {(campaign as any).category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 상태 변경 버튼 */}
                  <div className="mt-4 flex space-x-2">
                    {campaign.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange('active')}
                          className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleStatusChange('cancelled')}
                          className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          거절
                        </button>
                      </>
                    )}
                    {campaign.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleStatusChange('paused')}
                          className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        >
                          일시중지
                        </button>
                        <button
                          onClick={() => handleStatusChange('completed')}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          완료
                        </button>
                      </>
                    )}
                    {campaign.status === 'paused' && (
                      <>
                        <button
                          onClick={() => handleStatusChange('active')}
                          className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          재개
                        </button>
                        <button
                          onClick={() => handleStatusChange('cancelled')}
                          className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500">예산</p>
                    <p className="text-sm font-medium">₩{campaign.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">목표 팔로워</p>
                    <p className="text-sm font-medium">{(campaign as any).targetFollowers.toLocaleString()}명 이상</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">캠페인 기간</p>
                    <p className="text-sm font-medium">{campaign.startDate} ~ {campaign.endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">결제 상태</p>
                    <p className="text-sm font-medium">{campaign.isPaid ? '결제 완료' : '미결제'}</p>
                  </div>
                </div>

                {campaign.requirements && (
                  <div className="py-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">요구사항</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.requirements}</p>
                  </div>
                )}

                {campaign.hashtags && (
                  <div className="py-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">해시태그</p>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(campaign.hashtags).map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 업체 정보 */}
                <div className="py-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-3">업체 정보</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">회사명</p>
                      <p className="font-medium">
                        {campaign.business.profile?.companyName || campaign.business.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">담당자</p>
                      <p className="font-medium">{campaign.business.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">이메일</p>
                      <p className="font-medium">{campaign.business.email}</p>
                    </div>
                    {campaign.business.profile && (
                      <>
                        <div>
                          <p className="text-gray-500">사업자번호</p>
                          <p className="font-medium">{(campaign.business.profile as any).businessNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">대표자명</p>
                          <p className="font-medium">{(campaign.business.profile as any).representativeName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">업종</p>
                          <p className="font-medium">{(campaign.business.profile as any).businessCategory}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 지원자 목록 */}
                <div className="py-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    지원자 목록 ({campaign.applications.length}명)
                  </p>
                  {campaign.applications.length > 0 ? (
                    <div className="space-y-3">
                      {campaign.applications.map((application) => (
                        <div key={application.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {application.influencer.profile?.avatar && (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={application.influencer.profile.avatar}
                                  alt=""
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {application.influencer.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  팔로워: {application.influencer.profile?.followerCount?.toLocaleString() || '-'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                application.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                application.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {application.status === 'APPROVED' ? '승인' :
                                 application.status === 'REJECTED' ? '거절' : '대기'}
                              </span>
                              {application.status === 'PENDING' && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleApplicationStatus(application.id, 'APPROVED')}
                                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => handleApplicationStatus(application.id, 'REJECTED')}
                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                  >
                                    거절
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {application.proposedPrice && (
                            <p className="text-xs text-gray-500 mt-1">
                              제안가격: ₩{application.proposedPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">아직 지원자가 없습니다.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}