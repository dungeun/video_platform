'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'
import { 
  Calendar, Users, DollarSign, Target, 
  Clock, Edit, Trash2, ChevronLeft, 
  Image as ImageIcon, MapPin, Hash,
  FileText, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'

interface Campaign {
  id: string
  title: string
  description: string
  budget: number
  targetFollowers: number
  startDate: string
  endDate: string
  status: string
  platform: string
  requirements?: string
  hashtags?: string
  location?: string
  imageUrl?: string
  maxApplicants: number
  rewardAmount: number
  business: {
    name: string
    businessProfile?: {
      companyName: string
    }
  }
  _count: {
    applications: number
  }
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const user = AuthService.getCurrentUser()
      if (!user || (user.type !== 'BUSINESS' && user.type !== 'ADMIN')) {
        router.push('/login')
        return
      }
      fetchCampaign()
    }
    checkAuth()
  }, [params.id])

  const fetchCampaign = async () => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/business/campaigns/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign || data)
      } else {
        setError('캠페인을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('캠페인 조회 실패:', error)
      setError('캠페인을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: FileText, text: '초안' },
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '진행중' },
      PAUSED: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: '일시중지' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', icon: XCircle, text: '완료' }
    }
    
    const badge = badges[status] || badges.DRAFT
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || '캠페인을 찾을 수 없습니다.'}</p>
          <Link href="/business/campaigns" className="mt-4 text-indigo-600 hover:text-indigo-700">
            캠페인 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/business/campaigns" 
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(campaign.status)}
              <Link
                href={`/business/campaigns/${campaign.id}/edit`}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                수정
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 캠페인 이미지 */}
            {campaign.imageUrl && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.title}
                  className="w-full h-96 object-cover"
                />
              </div>
            )}

            {/* 캠페인 설명 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">캠페인 소개</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{campaign.description}</p>
            </div>

            {/* 요구사항 */}
            {campaign.requirements && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">요구사항</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{campaign.requirements}</p>
              </div>
            )}

            {/* 해시태그 */}
            {campaign.hashtags && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  필수 해시태그
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    if (!campaign.hashtags) return [];
                    if (Array.isArray(campaign.hashtags)) return campaign.hashtags;
                    if (typeof campaign.hashtags === 'string') {
                      return campaign.hashtags.split(' ').filter(tag => tag);
                    }
                    return [];
                  })().map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 캠페인 상태 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">캠페인 정보</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    예산
                  </span>
                  <span className="font-semibold">{formatCurrency(campaign.budget || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    보상금
                  </span>
                  <span className="font-semibold">{formatCurrency(campaign.rewardAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    목표 팔로워
                  </span>
                  <span className="font-semibold">{campaign.targetFollowers?.toLocaleString() || 0}명+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    지역
                  </span>
                  <span className="font-semibold">{campaign.location || '전국'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    플랫폼
                  </span>
                  <span className="font-semibold">{campaign.platform}</span>
                </div>
              </div>
            </div>

            {/* 기간 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">캠페인 기간</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">시작일</p>
                  <p className="font-semibold flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(campaign.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">종료일</p>
                  <p className="font-semibold flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(campaign.endDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* 지원 현황 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">지원 현황</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    총 지원자
                  </span>
                  <span className="font-semibold">{campaign._count?.applications || 0}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">최대 모집인원</span>
                  <span className="font-semibold">{campaign.maxApplicants || 0}명</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(((campaign._count?.applications || 0) / (campaign.maxApplicants || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <Link
                  href={`/business/campaigns/${campaign.id}/applicants`}
                  className="block w-full text-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
                >
                  지원자 관리
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}