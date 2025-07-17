'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/auth'
import { apiGet, apiPost } from '@/lib/api/client'
import { ArrowLeft, Search, Filter, CheckCircle, XCircle, Eye, MessageSquare, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/Button'

export default function CampaignApplicantsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [campaign, setCampaign] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    const fetchData = async () => {
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
        
        // 캠페인 정보 가져오기
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
        
        // 지원자 목록 가져오기
        const applicationsResponse = await apiGet(`/api/business/campaigns/${params.id}/applications`)
        
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json()
          setApplications(applicationsData.applications || [])
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('데이터 로드 실패:', error)
        toast({
          title: '오류',
          description: '데이터를 불러오는데 실패했습니다.',
          variant: 'destructive'
        })
        router.push('/business/campaigns')
      }
    }
    
    fetchData()
  }, [params.id])

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
        
        // 목록 업데이트
        setApplications(applications.map(app => 
          app.id === applicationId 
            ? { ...app, status } 
            : app
        ))
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

  const filteredAndSortedApplications = applications
    .filter(app => {
      const matchesSearch = 
        app.influencerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.influencerHandle.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || app.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        case 'followers':
          return b.followers - a.followers
        case 'engagement':
          return b.engagementRate - a.engagementRate
        default:
          return 0
      }
    })

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length
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
            href={`/business/campaigns/${params.id}`} 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            캠페인 상세로 돌아가기
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">지원자 관리</h1>
              <p className="text-gray-600">{campaign.title}</p>
            </div>
            
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              엑셀 다운로드
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">전체 지원자</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">대기중</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">승인됨</h3>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">거절됨</h3>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="인플루언서 이름 또는 아이디 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">모든 상태</option>
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="date">지원일순</option>
                <option value="followers">팔로워순</option>
                <option value="engagement">참여율순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 지원자 리스트 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredAndSortedApplications.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">조건에 맞는 지원자가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedApplications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl font-medium">
                          {application.influencerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900">{application.influencerName}</h3>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            application.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : application.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.status === 'approved' ? '승인됨' : application.status === 'rejected' ? '거절됨' : '대기중'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">@{application.influencerHandle}</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-sm text-gray-500">팔로워</p>
                            <p className="text-sm font-medium text-gray-900">{application.followers?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">참여율</p>
                            <p className="text-sm font-medium text-gray-900">{application.engagementRate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">지원일</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">제안 가격</p>
                            <p className="text-sm font-medium text-gray-900">
                              ₩{application.proposedPrice?.toLocaleString() || campaign.budget.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {application.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 italic">"{application.message}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 ml-4">
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApplicationStatus(application.id, 'approved')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="승인"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleApplicationStatus(application.id, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="거절"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/influencers/${application.influencerId}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="프로필 보기"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="메시지"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}