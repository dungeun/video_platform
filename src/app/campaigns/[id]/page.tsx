'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Campaign {
  id: string;
  title: string;
  brand: string;
  brandId: string;
  description: string;
  budget: number;
  budgetRange: string;
  deadline: string;
  daysLeft: number;
  category: string;
  platforms: string[];
  required_followers: number;
  location: string;
  view_count: number;
  applicants: number;
  maxApplicants: number;
  image_url: string;
  tags: string[];
  status: string;
  requirements: string;
  detailedRequirements: string[];
  deliverables: string[];
  duration: string;
  campaignPeriod: string;
  applicationDeadline: string;
  brandInfo: {
    name: string;
    description: string;
    values: string[];
    avatar: boolean;
  };
  recentApplicants: Array<{
    id: string;
    name: string;
    avatar?: string;
    followers?: number;
  }>;
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [similarCampaigns, setSimilarCampaigns] = useState<any[]>([])

  // 캠페인 데이터 가져오기
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/campaigns/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('캠페인을 찾을 수 없습니다.')
          }
          throw new Error('캠페인 정보를 가져오는데 실패했습니다.')
        }
        
        const data = await response.json()
        setCampaign(data)

        // 비슷한 캠페인 가져오기 (같은 카테고리)
        const similarResponse = await fetch(`/api/campaigns?category=${data.category}&limit=3`)
        if (similarResponse.ok) {
          const similarData = await similarResponse.json()
          setSimilarCampaigns(
            similarData.campaigns
              .filter((c: any) => c.id !== params.id)
              .slice(0, 3)
              .map((c: any) => ({
                id: c.id,
                title: c.title,
                brand: c.brand_name,
                budget: `₩${c.budget.toLocaleString()}`
              }))
          )
        }
      } catch (err) {
        console.error('캠페인 조회 오류:', err)
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCampaign()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 pt-32">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h3 className="font-medium">오류가 발생했습니다</h3>
            <p className="text-sm mt-1">{error || '캠페인을 찾을 수 없습니다.'}</p>
            <Link 
              href="/campaigns"
              className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              캠페인 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const ApplicationModal = () => {
    const [step, setStep] = useState(1)
    const [applicationData, setApplicationData] = useState({
      message: '',
      portfolio: '',
      price: '',
      availableDate: ''
    })

    // 지원 동기 템플릿
    const messageTemplates = [
      `안녕하세요! ${campaign.brand}의 ${campaign.title} 캠페인에 지원합니다.\n\n저는 ${campaign.category} 분야에서 활발히 활동하고 있는 인플루언서입니다. 평소 ${campaign.brand} 브랜드를 좋아하고 있었고, 이번 캠페인을 통해 진정성 있는 콘텐츠를 제작하고 싶습니다.\n\n특히 저의 팔로워들이 ${campaign.category}에 관심이 많아, 높은 참여율을 기대할 수 있습니다. 감사합니다!`,
      
      `${campaign.brand}님 안녕하세요!\n\n이번 ${campaign.title} 캠페인이 정말 흥미롭습니다. 저는 ${campaign.platforms?.join(', ')}에서 ${campaign.category} 콘텐츠를 주로 제작하고 있습니다.\n\n제가 이 캠페인에 적합한 이유:\n1. ${campaign.category} 분야 전문성\n2. 활발한 팔로워 소통\n3. 높은 콘텐츠 퀄리티\n\n좋은 기회 주시면 최선을 다하겠습니다!`,
      
      `안녕하세요, ${campaign.brand}팀!\n\n${campaign.title} 캠페인에 큰 관심을 가지고 지원합니다. 저는 진정성 있는 콘텐츠로 팔로워들과 소통하며, 특히 ${campaign.category} 관련 게시물에서 높은 참여율을 보이고 있습니다.\n\n이번 캠페인을 통해 ${campaign.brand}의 가치를 효과적으로 전달하고, 팔로워들에게 유익한 정보를 제공하고 싶습니다.\n\n포트폴리오 링크를 함께 첨부하니 검토 부탁드립니다. 감사합니다!`
    ]

    const [selectedTemplate, setSelectedTemplate] = useState(-1)

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">캠페인 지원하기</h2>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">지원 동기</h3>
                  
                  {/* 템플릿 선택 버튼 */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">템플릿을 선택하거나 직접 작성하세요</p>
                    <div className="flex gap-2 flex-wrap">
                      {['템플릿 1', '템플릿 2', '템플릿 3'].map((label, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedTemplate(index)
                            setApplicationData({
                              ...applicationData, 
                              message: messageTemplates[index]
                            })
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            selectedTemplate === index 
                              ? 'bg-cyan-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setSelectedTemplate(-1)
                          setApplicationData({...applicationData, message: ''})
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          selectedTemplate === -1 && applicationData.message === ''
                            ? 'bg-cyan-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        직접 작성
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={applicationData.message}
                    onChange={(e) => {
                      setApplicationData({...applicationData, message: e.target.value})
                      setSelectedTemplate(-1) // 직접 수정시 템플릿 선택 해제
                    }}
                    rows={8}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="이 캠페인에 지원하는 이유와 어떤 콘텐츠를 만들 계획인지 설명해주세요..."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">관련 포트폴리오</h3>
                  <input
                    type="url"
                    value={applicationData.portfolio}
                    onChange={(e) => setApplicationData({...applicationData, portfolio: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="관련 작업물 링크를 입력해주세요 (선택사항)"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">희망 금액</h3>
                  <input
                    type="text"
                    value={applicationData.price}
                    onChange={(e) => setApplicationData({...applicationData, price: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="₩0"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold mb-2">지원이 완료되었습니다!</h3>
                  <p className="text-gray-600">브랜드에서 검토 후 연락드릴 예정입니다.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">다음 단계</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-cyan-600 mr-2">✓</span>
                      브랜드 담당자가 지원서를 검토합니다
                    </li>
                    <li className="flex items-start">
                      <span className="text-cyan-600 mr-2">✓</span>
                      선정되면 이메일로 안내를 받습니다
                    </li>
                    <li className="flex items-start">
                      <span className="text-cyan-600 mr-2">✓</span>
                      상세 가이드라인과 계약서를 확인합니다
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setShowApplicationModal(false)
                    router.push('/dashboard')
                  }}
                  className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700"
                >
                  대시보드로 이동
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 pt-32 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="detail-section">
              <Link 
                href="/campaigns" 
                className="inline-flex items-center text-white/70 hover:text-white mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                캠페인 목록으로
              </Link>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium mb-3">
                      뷰티
                    </span>
                    <h1 className="text-3xl font-bold text-white mb-2">{campaign.title}</h1>
                    <p className="text-xl text-white/80">{campaign.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60 mb-1">마감까지</p>
                    <p className="text-2xl font-bold text-cyan-400">D-7</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-white/60 text-sm mb-1">예산</p>
                    <p className="text-white font-semibold">{campaign.budget}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">캠페인 기간</p>
                    <p className="text-white font-semibold">{campaign.duration}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">지원 현황</p>
                    <p className="text-white font-semibold">{campaign.applicants}/{campaign.maxApplicants}명</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">플랫폼</p>
                    <div className="flex gap-2">
                      {campaign.platforms?.includes('instagram') && (
                        <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded">Instagram</span>
                      )}
                      {campaign.platforms?.includes('youtube') && (
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">YouTube</span>
                      )}
                      {campaign.platforms?.includes('tiktok') && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">TikTok</span>
                      )}
                      {campaign.platforms?.includes('twitter') && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Twitter</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'border-cyan-600 text-cyan-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              캠페인 소개
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'requirements' 
                  ? 'border-cyan-600 text-cyan-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              지원 자격
            </button>
            <button
              onClick={() => setActiveTab('brand')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'brand' 
                  ? 'border-cyan-600 text-cyan-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              브랜드 정보
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {activeTab === 'overview' && (
                  <div className="detail-section space-y-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">캠페인 소개</h2>
                      <p className="text-gray-700 leading-relaxed">{(campaign as any).description}</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">제작 콘텐츠</h2>
                      <ul className="space-y-3">
                        {campaign.deliverables.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 text-cyan-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">캠페인 일정</h2>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold">지원 마감</p>
                            <p className="text-gray-600">{campaign.applicationDeadline}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold">캠페인 기간</p>
                            <p className="text-gray-600">{campaign.campaignPeriod}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'requirements' && (
                  <div className="detail-section space-y-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">지원 자격</h2>
                      <ul className="space-y-3">
                        {campaign.detailedRequirements.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-cyan-600 mr-3">•</span>
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <div className="flex">
                        <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <h3 className="font-semibold text-yellow-800 mb-1">지원 전 확인사항</h3>
                          <p className="text-yellow-700 text-sm">
                            모든 요구사항을 충족하는지 확인 후 지원해주세요. 허위 정보로 지원 시 향후 캠페인 참여가 제한될 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'brand' && (
                  <div className="detail-section space-y-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">브랜드 소개</h2>
                      <h3 className="text-lg font-semibold mb-2">{campaign.brandInfo.name}</h3>
                      <p className="text-gray-700 mb-6">{(campaign.brandInfo as any).description}</p>
                      
                      <h4 className="font-semibold mb-3">브랜드 가치</h4>
                      <div className="flex flex-wrap gap-2">
                        {campaign.brandInfo.values.map((value, index) => (
                          <span key={index} className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h2 className="text-xl font-bold mb-4">비슷한 캠페인</h2>
                      <div className="space-y-4">
                        {similarCampaigns.length > 0 ? (
                          similarCampaigns.map((similar) => (
                            <Link 
                              key={similar.id}
                              href={`/campaigns/${similar.id}`}
                              className="block p-4 border rounded-lg hover:border-cyan-300 transition-colors"
                            >
                              <h3 className="font-semibold mb-1">{similar.title}</h3>
                              <p className="text-sm text-gray-600">{similar.brand} · {similar.budget}</p>
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">비슷한 캠페인이 없습니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">지원 현황</span>
                      <span className="text-sm font-medium">{campaign.applicants}/{campaign.maxApplicants || 100}명</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-cyan-600 h-2 rounded-full" 
                        style={{ width: `${(campaign.applicants / (campaign.maxApplicants || 100)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowApplicationModal(true)}
                    className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors mb-4"
                  >
                    지원하기
                  </button>

                  {/* 최근 지원자 */}
                  {campaign.recentApplicants && campaign.recentApplicants.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">최근 지원자</h4>
                      <div className="space-y-2">
                        {campaign.recentApplicants.map((applicant) => (
                          <div key={applicant.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
                              {applicant.avatar ? (
                                <img 
                                  src={applicant.avatar} 
                                  alt={applicant.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  {applicant.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{applicant.name}</p>
                              {applicant.followers && (
                                <p className="text-xs text-gray-500">
                                  팔로워 {applicant.followers.toLocaleString()}명
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => setIsSaved(!isSaved)}
                    className={`w-full px-6 py-3 border rounded-lg font-medium transition-colors mb-4 ${
                      isSaved 
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isSaved ? '★ 저장됨' : '☆ 관심 캠페인 저장'}
                  </button>

                  {/* 관리자 전용 관리 링크 */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3 text-gray-900">캠페인 관리</h3>
                    <div className="space-y-2">
                      <Link 
                        href={`/campaigns/${campaign.id}/applicants`}
                        className="block w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
                      >
                        지원자 관리
                      </Link>
                      <Link 
                        href={`/campaigns/${campaign.id}/invite`}
                        className="block w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
                      >
                        인플루언서 초대
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-3">공유하기</h3>
                    <div className="flex gap-2">
                      <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                      </button>
                      <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                      </button>
                      <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Modal */}
      {showApplicationModal && <ApplicationModal />}
      
      <Footer />
    </div>
  )
}