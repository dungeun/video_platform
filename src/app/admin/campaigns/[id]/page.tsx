'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'

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
      }
    }
    status: string
    message: string
    proposedPrice?: number
    createdAt: string
  }>
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCampaignDetail()
  }, [params.id])

  const fetchCampaignDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/campaigns/${params.id}`, {
        credentials: 'include'
      })
      
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
      const response = await fetch(`/api/admin/campaigns/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setCampaign(prev => prev ? { ...prev, status: newStatus } : null)
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
      const response = await fetch(`/api/admin/campaigns/${params.id}/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })
      
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !campaign) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || '캠페인을 찾을 수 없습니다.'}</p>
          <Link href="/admin/campaigns" className="text-blue-600 hover:text-blue-800">
            목록으로 돌아가기
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">캠페인 상세</h1>
            <p className="text-gray-600 mt-1">캠페인 정보와 지원자를 관리합니다</p>
          </div>
          <Link
            href="/admin/campaigns"
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            목록으로
          </Link>
        </div>

        {/* 캠페인 정보 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 캠페인 이미지 및 기본 정보 */}
            <div className="lg:col-span-2">
              <div className="flex items-start space-x-6">
                {campaign.imageUrl && (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h2>
                  <p className="text-gray-600 mb-4">{(campaign as any).description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`px-3 py-1 rounded-full font-medium ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                    <span className="text-gray-500">
                      {getPlatformIcon((campaign as any).category)} {(campaign as any).category}
                    </span>
                    <span className="text-gray-500">
                      예산: ₩{campaign.budget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 상태 변경 버튼 */}
              <div className="mt-6 flex space-x-2">
                {campaign.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('active')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      캠페인 승인
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      캠페인 거절
                    </button>
                  </>
                )}
                {campaign.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('paused')}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      일시중지
                    </button>
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      캠페인 완료
                    </button>
                  </>
                )}
                {campaign.status === 'paused' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('active')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      캠페인 재개
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      캠페인 취소
                    </button>
                  </>
                )}
              </div>

              {/* 상세 정보 */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">캠페인 기간</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {campaign.startDate} ~ {campaign.endDate}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">목표 팔로워</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {(campaign as any).targetFollowers.toLocaleString()}명 이상
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                  <p className="mt-1 text-sm text-gray-900">{campaign.createdAt}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">결제 상태</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {campaign.isPaid ? '결제 완료' : '미결제'}
                  </p>
                </div>
              </div>

              {campaign.requirements && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">요구사항</h3>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {campaign.requirements}
                  </p>
                </div>
              )}

              {campaign.hashtags && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">해시태그</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {JSON.parse(campaign.hashtags).map((tag: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 업체 정보 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">업체 정보</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">회사명</p>
                  <p className="text-sm font-medium text-gray-900">
                    {campaign.business.profile?.companyName || campaign.business.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">담당자</p>
                  <p className="text-sm font-medium text-gray-900">{campaign.business.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">이메일</p>
                  <p className="text-sm font-medium text-gray-900">{campaign.business.email}</p>
                </div>
                {campaign.business.profile && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">사업자번호</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(campaign.business.profile as any).businessNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">대표자명</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(campaign.business.profile as any).representativeName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">업종</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(campaign.business.profile as any).businessCategory}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 지원자 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              지원자 목록 ({campaign.applications.length}명)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    인플루언서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    팔로워
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제안가격
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지원일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaign.applications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {application.influencer.profile?.avatar && (
                          <img
                            className="h-10 w-10 rounded-full mr-3"
                            src={application.influencer.profile.avatar}
                            alt=""
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.influencer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.influencer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.influencer.profile?.followerCount?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.proposedPrice ? `₩${application.proposedPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        application.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        application.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.status === 'APPROVED' ? '승인' :
                         application.status === 'REJECTED' ? '거절' : '대기'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {application.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApplicationStatus(application.id, 'APPROVED')}
                            className="text-green-600 hover:text-green-900"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleApplicationStatus(application.id, 'REJECTED')}
                            className="text-red-600 hover:text-red-900"
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}