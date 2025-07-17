'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/auth'
import { apiGet, apiPost } from '@/lib/api/client'
import { ArrowLeft, Calendar, DollarSign, Users, Target, Share2, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [campaign, setCampaign] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const currentUser = AuthService.getCurrentUser()
        
        if (!currentUser) {
          const storedUser = localStorage.getItem('user')
          if (!storedUser) {
            router.push('/login')
            return
          }
          
          const parsedUser = JSON.parse(storedUser)
          AuthService.login(parsedUser.type, parsedUser)
        }
        
        const userType = currentUser?.type?.toUpperCase()
        
        if (userType !== 'BUSINESS' && userType !== 'ADMIN') {
          router.push('/login')
          return
        }
        
        await fetchCampaignData()
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }
    
    checkAuthAndFetchData()
  }, [params.id])

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true)
      
      // 캠페인 상세 정보 가져오기
      const campaignResponse = await apiGet(`/api/business/campaigns/${params.id}`)
      
      if (!campaignResponse.ok) {
        if (campaignResponse.status === 404) {
          toast({
            title: '오류',
            description: '캠페인을 찾을 수 없습니다.',
            variant: 'destructive'
          })
          router.push('/business/campaigns')
          return
        }
        throw new Error('캠페인 데이터 로드 실패')
      }
      
      const campaignData = await campaignResponse.json()
      setCampaign(campaignData.campaign)
      
      // 지원자 정보 가져오기
      const applicationsResponse = await apiGet(`/api/business/campaigns/${params.id}/applications`)
      
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        setApplications(applicationsData.applications || [])
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      toast({
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!confirm('정말로 이 캠페인을 삭제하시겠습니까?')) return

    try {
      const response = await apiPost(`/api/business/campaigns/${params.id}/delete`, {})
      
      if (response.ok) {
        toast({
          title: '성공',
          description: '캠페인이 삭제되었습니다.'
        })
        router.push('/business/campaigns')
      } else {
        throw new Error('캠페인 삭제 실패')
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '캠페인 삭제에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await apiPost(`/api/business/applications/${applicationId}/status`, {
        status
      })

      if (response.ok) {
        toast({
          title: '성공',
          description: status === 'approved' ? '지원서가 승인되었습니다.' : '지원서가 거절되었습니다.'
        })
        fetchCampaignData() // 목록 새로고침
      } else {
        throw new Error('상태 변경 실패')
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        variant: 'destructive'
      })
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

  if (!campaign) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href="/business/campaigns" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            캠페인 목록으로
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  campaign.status === 'active' 
                    ? 'bg-green-100 text-green-700'
                    : campaign.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {campaign.status === 'active' ? '진행중' : campaign.status === 'pending' ? '대기중' : '완료'}
                </span>
                <span className="text-gray-500 text-sm">
                  생성일: {new Date(campaign.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
              </button>
              {campaign.status === 'active' && (
                <Link 
                  href={`/business/campaigns/${params.id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  수정
                </Link>
              )}
              <button 
                onClick={handleDeleteCampaign}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">₩{campaign.budget?.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">예산</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            <p className="text-sm text-gray-500 mt-1">지원자</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{(campaign as any).targetFollowers?.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">최소 팔로워</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일
            </p>
            <p className="text-sm text-gray-500 mt-1">남은 기간</p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                개요
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'applications'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                지원자 ({applications.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* 개요 탭 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">캠페인 설명</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{(campaign as any).description}</p>
                </div>

                {campaign.requirements && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">요구사항</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{campaign.requirements}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">캠페인 정보</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">플랫폼</dt>
                        <dd className="text-gray-900 font-medium">{(campaign as any).category}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">시작일</dt>
                        <dd className="text-gray-900">{new Date(campaign.startDate).toLocaleDateString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">종료일</dt>
                        <dd className="text-gray-900">{new Date(campaign.endDate).toLocaleDateString()}</dd>
                      </div>
                    </dl>
                  </div>

                  {campaign.hashtags && campaign.hashtags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">해시태그</h3>
                      <div className="flex flex-wrap gap-2">
                        {campaign.hashtags.map((tag: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {campaign.imageUrl && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">대표 이미지</h3>
                    <img 
                      src={campaign.imageUrl} 
                      alt={campaign.title}
                      className="w-full max-w-2xl rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 지원자 탭 */}
            {activeTab === 'applications' && (
              <div>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">아직 지원자가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {application.influencerName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{application.influencerName}</h4>
                              <p className="text-sm text-gray-500">@{application.influencerHandle}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>팔로워: {application.followers?.toLocaleString()}</span>
                                <span>참여율: {application.engagementRate}%</span>
                                <span>지원일: {new Date(application.appliedAt).toLocaleDateString()}</span>
                              </div>
                              {application.message && (
                                <p className="mt-2 text-sm text-gray-600 italic">"{application.message}"</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {application.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApplicationStatus(application.id, 'approved')}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="승인"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleApplicationStatus(application.id, 'rejected')}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="거절"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <Link
                              href={`/influencers/${application.influencerId}`}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="프로필 보기"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                          </div>
                        </div>
                        
                        {application.status !== 'pending' && (
                          <div className="mt-3">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              application.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {application.status === 'approved' ? '승인됨' : '거절됨'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}