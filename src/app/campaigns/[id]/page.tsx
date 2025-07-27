'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Heart, 
  Share2, 
  Instagram, 
  Youtube,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react'

// 플랫폼 아이콘 컴포넌트들
const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
)

const BlogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.94 14.036c-.233.624-.43 1.2-.606 1.783.96-.697 2.101-1.139 3.418-1.304 2.513-.314 4.746-1.973 5.876-4.058l-1.456-1.455c-.706 1.263-2.188 2.548-4.062 2.805-1.222.167-2.415.642-3.17 1.229zM16 2.5c-1.621 0-3.128.665-4.2 1.737L9.063 6.975c-1.075 1.072-1.737 2.579-1.737 4.2 0 3.268 2.732 6 6 6s6-2.732 6-6-2.732-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.846 0 3.543-.497 5.02-1.327l-1.411-1.411C14.5 19.775 13.295 20 12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8c0 1.295-.225 2.5-.738 3.609l1.411 1.411C21.503 15.543 22 13.846 22 12c0-5.52-4.48-10-10-10z"/>
  </svg>
)

interface Campaign {
  id: string
  title: string
  description: string
  business: {
    id: string
    name: string
    logo: string | null
    category: string
  }
  platforms: string[]
  budget: number
  targetFollowers: number
  maxApplicants: number
  startDate: string
  endDate: string
  requirements: string | null
  hashtags: string[]
  imageUrl: string | null
  detailImages: string[]
  status: string
  createdAt: string
  _count: {
    applications: number
    likes: number
  }
  applications?: Array<{
    id: string
    status: string
    influencer: {
      id: string
      name: string
      profileImage: string | null
    }
  }>
  isLiked?: boolean
  hasApplied?: boolean
  applicationStatus?: string
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fetchCampaign()
  }, [params.id])

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch campaign')
      
      const data = await response.json()
      setCampaign(data.campaign)
      setIsLiked(data.campaign.isLiked || false)
      setLikeCount(data.campaign._count.likes || 0)
    } catch (error) {
      console.error('Error fetching campaign:', error)
      toast({
        title: '오류',
        description: '캠페인 정보를 불러올 수 없습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '좋아요를 누르려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${params.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })

      if (!response.ok) throw new Error('Failed to toggle like')

      const data = await response.json()
      setIsLiked(data.liked)
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1)
      
      toast({
        title: data.liked ? '관심 캠페인 추가' : '관심 캠페인 제거',
        description: data.liked ? '마이페이지에서 확인할 수 있습니다.' : ''
      })
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: '오류',
        description: '좋아요 처리 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleApply = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '캠페인에 지원하려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      router.push('/login')
      return
    }

    if (user.role !== 'INFLUENCER') {
      toast({
        title: '권한 없음',
        description: '인플루언서만 캠페인에 지원할 수 있습니다.',
        variant: 'destructive'
      })
      return
    }

    setApplying(true)
    
    try {
      const response = await fetch(`/api/campaigns/${params.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply')
      }

      const data = await response.json()
      
      toast({
        title: '지원 완료',
        description: '캠페인 지원이 완료되었습니다.'
      })
      
      // 페이지 새로고침 또는 지원 상태 업데이트
      fetchCampaign()
    } catch (error) {
      console.error('Error applying to campaign:', error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '지원 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setApplying(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign?.title,
          text: campaign?.description,
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(url)
      toast({
        title: '링크 복사됨',
        description: '캠페인 링크가 클립보드에 복사되었습니다.'
      })
    }
  }


  const calculateDaysLeft = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-5 h-5" />
      case 'YOUTUBE':
        return <Youtube className="w-5 h-5" />
      case 'TIKTOK':
        return <TikTokIcon />
      case 'BLOG':
        return <BlogIcon />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">모집 중</Badge>
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800">완료</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">취소됨</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">캠페인을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">요청하신 캠페인이 존재하지 않거나 삭제되었습니다.</p>
          <Button asChild>
            <Link href="/campaigns">캠페인 목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    )
  }

  const daysLeft = calculateDaysLeft(campaign.endDate)
  const applicationProgress = (campaign._count.applications / campaign.maxApplicants) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 이미지 */}
      <div className="relative h-96 bg-gray-900">
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt={campaign.title}
            fill
            className="object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600" />
        )}
        
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* 뒤로가기 버튼 */}
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => router.back()}
          >
            ← 뒤로가기
          </Button>
        </div>
        
        {/* 공유 & 좋아요 버튼 */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`text-white hover:bg-white/20 ${isLiked ? 'text-red-500' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 캠페인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(campaign.status)}
                    <span className="text-gray-500">|</span>
                    <div className="flex items-center gap-2">
                      {campaign.platforms.map(platform => (
                        <span key={platform} className="flex items-center gap-1 text-gray-600">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 비즈니스 정보 */}
              <Link href={`/business/${campaign.business.id}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                  {campaign.business.logo ? (
                    <Image
                      src={campaign.business.logo}
                      alt={campaign.business.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{campaign.business.name}</h3>
                  <p className="text-sm text-gray-600">{campaign.business.category}</p>
                </div>
              </Link>

              {/* 캠페인 설명 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">캠페인 소개</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
              </div>

              {/* 요구사항 */}
              {campaign.requirements && (
                <div className="pt-6 border-t">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">요구사항</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.requirements}</p>
                </div>
              )}

              {/* 해시태그 */}
              {campaign.hashtags.length > 0 && (
                <div className="pt-6 border-t">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">해시태그</h2>
                  <div className="flex flex-wrap gap-2">
                    {campaign.hashtags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 상세 이미지 */}
              {campaign.detailImages && campaign.detailImages.length > 0 && (
                <div className="pt-6 border-t">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">상세 이미지</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaign.detailImages.map((image, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`상세 이미지 ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-6">
            {/* 캠페인 정보 카드 */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">캠페인 정보</h3>
              
              <div className="space-y-4">
                {/* 예산 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    총 예산
                  </span>
                  <span className="font-semibold">₩{campaign.budget.toLocaleString()}</span>
                </div>

                {/* 모집 인원 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      모집 현황
                    </span>
                    <span className="font-semibold">
                      {campaign._count.applications}/{campaign.maxApplicants}명
                    </span>
                  </div>
                  <Progress value={applicationProgress} className="h-2" />
                </div>

                {/* 팔로워 요구사항 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    최소 팔로워
                  </span>
                  <span className="font-semibold">{campaign.targetFollowers.toLocaleString()}명</span>
                </div>

                {/* 기간 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    캠페인 기간
                  </span>
                  <span className="font-semibold">
                    {new Date(campaign.startDate).toLocaleDateString()} ~ {new Date(campaign.endDate).toLocaleDateString()}
                  </span>
                </div>

                {/* 남은 기간 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    마감까지
                  </span>
                  <span className={`font-semibold ${daysLeft <= 3 ? 'text-red-600' : ''}`}>
                    {daysLeft > 0 ? `${daysLeft}일 남음` : '마감됨'}
                  </span>
                </div>

                {/* 좋아요 수 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    관심
                  </span>
                  <span className="font-semibold">{likeCount}명</span>
                </div>
              </div>

              {/* 지원 버튼 */}
              <div className="mt-6 space-y-3">
                {user?.role === 'INFLUENCER' && (
                  <>
                    {campaign.hasApplied ? (
                      <div className="text-center">
                        <Badge className="bg-green-100 text-green-800">
                          {campaign.applicationStatus === 'PENDING' && '지원 완료 (검토 중)'}
                          {campaign.applicationStatus === 'APPROVED' && '승인됨'}
                          {campaign.applicationStatus === 'REJECTED' && '거절됨'}
                        </Badge>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleApply}
                        disabled={applying || campaign.status !== 'ACTIVE' || daysLeft === 0}
                      >
                        {applying ? '지원 중...' : '캠페인 지원하기'}
                      </Button>
                    )}
                  </>
                )}
                
                {user?.role === 'BUSINESS' && user?.id === campaign.business.id && (
                  <>
                    <Link
                      href={`/business/campaigns/${campaign.id}/edit`}
                      className="block w-full"
                    >
                      <Button className="w-full" size="lg">
                        <Edit className="w-4 h-4 mr-2" />
                        캠페인 수정
                      </Button>
                    </Link>
                    <Link
                      href={`/business/campaigns/${campaign.id}/applicants`}
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full" size="lg">
                        <Users className="w-4 h-4 mr-2" />
                        지원자 관리 ({campaign._count.applications}명)
                      </Button>
                    </Link>
                  </>
                )}
                
                {user?.role === 'INFLUENCER' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleLike}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                    {isLiked ? '관심 캠페인 제거' : '관심 캠페인 추가'}
                  </Button>
                )}
              </div>
            </div>

            {/* 주의사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">주의사항</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• 허위 정보 작성 시 불이익이 있을 수 있습니다.</li>
                    <li>• 캠페인 승인 후 취소 시 패널티가 부과됩니다.</li>
                    <li>• 콘텐츠 제작 가이드라인을 반드시 준수해주세요.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}