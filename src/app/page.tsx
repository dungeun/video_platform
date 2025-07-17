'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'
import PageLayout from '@/components/layouts/PageLayout'

interface Campaign {
  id: string
  rank: number
  title: string
  brand: string
  applicants: number
  maxApplicants: number
  deadline: number
  category: string
  platforms: string[]
  description: string
  createdAt: string
}

interface Statistics {
  activeInfluencers: { value: number; label: string; formatted: string }
  partnerBrands: { value: number; label: string; formatted: string }
  monthlyReach: { value: number; label: string; formatted: string }
  campaignSuccessRate: { value: number; label: string; formatted: string }
}

interface FAQ {
  question: string
  answer: string
  order: number
}

interface Testimonial {
  name: string
  role: string
  content: string
  rating: number
  avatar: string
  order: number
}

export default function HomePage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('business')
  const [user, setUser] = useState<User | null>(null)
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 데이터 상태
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [faqItems, setFaqItems] = useState<FAQ[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  
  // Refs for GSAP animations
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const trustRef = useRef<HTMLDivElement>(null)
  const howToRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // API에서 데이터 로드
  const loadHomeData = async () => {
    try {
      setLoading(true)
      
      // 병렬로 모든 데이터 로드
      const [campaignsRes, statisticsRes, contentRes] = await Promise.all([
        fetch(`/api/home/campaigns?filter=${campaignFilter}&limit=10`),
        fetch('/api/home/statistics'),
        fetch('/api/home/content')
      ])

      if (campaignsRes.ok) {
        const campaignData = await campaignsRes.json()
        setCampaigns(campaignData.campaigns || [])
      }

      if (statisticsRes.ok) {
        const statsData = await statisticsRes.json()
        setStatistics(statsData.statistics)
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json()
        setFaqItems(contentData.faq || [])
        setTestimonials(contentData.testimonials || [])
      }

    } catch (error) {
      console.error('Failed to load home data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    
    // 로그인 상태 확인
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    
    // 업체 사용자는 비즈니스 대시보드로 리다이렉트
    if (currentUser && (currentUser.type === 'BUSINESS' || currentUser.type === 'business')) {
      router.push('/business/dashboard')
    }

    // 홈페이지 데이터 로드
    loadHomeData()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [router])

  // 캠페인 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    loadHomeData()
  }, [campaignFilter])

  // Simple fade-in animations with CSS
  useEffect(() => {
    // Basic animations for elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, { threshold: 0.1 });

    // Observe elements
    const elements = document.querySelectorAll('.hero-content > *, .trust-item, .feature-card, .step-item, .success-story, .faq-item');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [])

  const handleLogout = () => {
    AuthService.logout()
    setUser(null)
    router.push('/login')
  }

  return (
    <PageLayout headerVariant="transparent">

      {/* 히어로 섹션 - 개선된 버전 */}
      <section ref={heroRef} className="relative min-h-[45vh] flex items-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 overflow-hidden">
        {/* 배경 애니메이션 */}
        <div className="absolute inset-0 hero-bg">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white hero-content">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              브랜드와 인플루언서의
              <span className="block bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                완벽한 시너지
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-white/80 mb-10 leading-relaxed">
              AI 기반 정밀 매칭으로 ROI를 극대화하고,<br />
              투명한 성과 분석으로 캠페인의 성공을 보장합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register?type=business" className="px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                브랜드로 시작하기
              </Link>
              <Link href="/register?type=influencer" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-indigo-900 transition-all duration-200">
                인플루언서로 시작하기
              </Link>
            </div>
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* 신뢰 지표 섹션 */}
      <section ref={trustRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">대한민국 No.1 인플루언서 마케팅 플랫폼</h3>
            <p className="text-xl text-gray-600 mt-4">수많은 브랜드와 인플루언서가 LinkPick를 선택했습니다</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-gray-300 mb-2 animate-pulse">---</div>
                  <div className="text-gray-400 animate-pulse">로딩 중...</div>
                </div>
              ))
            ) : statistics ? (
              <>
                <div className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
                    {statistics.activeInfluencers.formatted}
                  </div>
                  <div className="text-gray-600">{statistics.activeInfluencers.label}</div>
                </div>
                <div className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
                    {statistics.partnerBrands.formatted}
                  </div>
                  <div className="text-gray-600">{statistics.partnerBrands.label}</div>
                </div>
                <div className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
                    {statistics.monthlyReach.formatted}
                  </div>
                  <div className="text-gray-600">{statistics.monthlyReach.label}</div>
                </div>
                <div className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
                    {statistics.campaignSuccessRate.formatted}
                  </div>
                  <div className="text-gray-600">{statistics.campaignSuccessRate.label}</div>
                </div>
              </>
            ) : (
              // 기본값
              <>
                <div className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">50K+</div>
                  <div className="text-gray-600">활성 인플루언서</div>
                </div>
                <div className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">2,500+</div>
                  <div className="text-gray-600">파트너 브랜드</div>
                </div>
                <div className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">10M+</div>
                  <div className="text-gray-600">월간 도달 수</div>
                </div>
                <div className="text-center trust-item">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">98%</div>
                  <div className="text-gray-600">캠페인 성공률</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 인기 캠페인 랭킹 섹션 */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-cyan-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">🔥 실시간 인기 캠페인</h3>
            <p className="text-xl text-gray-600 mt-4">지금 가장 주목받는 캠페인을 확인하세요</p>
          </div>
          
          {/* 랭킹 카테고리 탭 */}
          <div className="flex justify-center mb-10">
            <div className="bg-white p-1 rounded-full shadow-md inline-flex">
              <button 
                onClick={() => setCampaignFilter('all')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  campaignFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                전체
              </button>
              <button 
                onClick={() => setCampaignFilter('popular')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  campaignFilter === 'popular' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                지원 많은순
              </button>
              <button 
                onClick={() => setCampaignFilter('deadline')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  campaignFilter === 'deadline' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                마감 임박
              </button>
              <button 
                onClick={() => setCampaignFilter('new')}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  campaignFilter === 'new' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                신규 캠페인
              </button>
            </div>
          </div>

          {/* TOP 3 캠페인 */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg animate-pulse">
                      {index + 1}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-xl p-6 pt-10 animate-pulse">
                    <div className="mb-4">
                      <div className="w-16 h-6 bg-gray-300 rounded mb-2"></div>
                      <div className="w-full h-6 bg-gray-300 rounded mb-1"></div>
                      <div className="w-24 h-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-full h-12 bg-gray-300 rounded mb-4"></div>
                    <div className="space-y-2 mb-4">
                      <div className="w-full h-4 bg-gray-300 rounded"></div>
                      <div className="w-full h-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-full h-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              campaigns.slice(0, 3).map((campaign, index) => {
              const rankColors = [
                'from-yellow-400 to-amber-400',
                'from-gray-400 to-gray-500', 
                'from-orange-400 to-orange-500'
              ]
              const categoryColors = {
                '뷰티': 'bg-pink-100 text-pink-700',
                '테크': 'bg-blue-100 text-blue-700',
                '패션': 'bg-orange-100 text-orange-700',
                '여행': 'bg-green-100 text-green-700',
                '푸드': 'bg-yellow-100 text-yellow-700',
                '피트니스': 'bg-purple-100 text-purple-700',
                '라이프': 'bg-indigo-100 text-indigo-700'
              }
              const platformColors = {
                'Instagram': 'bg-pink-100 text-pink-700',
                'YouTube': 'bg-red-100 text-red-700',
                'TikTok': 'bg-purple-100 text-purple-700',
                'Blog': 'bg-green-100 text-green-700',
                'Twitch': 'bg-purple-100 text-purple-700'
              }
              const deadlineColor = campaign.deadline <= 3 ? 'text-red-600' : campaign.deadline <= 7 ? 'text-orange-600' : 'text-green-600'
              
              return (
                <div key={campaign.id} className="relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`w-12 h-12 bg-gradient-to-r ${rankColors[index]} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-xl p-6 pt-10 hover:shadow-2xl transition-shadow">
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${categoryColors[campaign.category] || 'bg-gray-100 text-gray-700'}`}>
                        {campaign.category}
                      </span>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{campaign.title}</h4>
                      <p className="text-sm text-gray-600">{campaign.brand}</p>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">지원현황</span>
                        <span className="font-semibold text-pink-600">{campaign.applicants}/{campaign.maxApplicants}명</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">마감까지</span>
                        <span className={`font-semibold ${deadlineColor}`}>D-{campaign.deadline}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {campaign.platforms.map(platform => (
                        <span key={platform} className={`text-xs px-2 py-1 rounded ${platformColors[platform] || 'bg-gray-100 text-gray-700'}`}>
                          {platform}
                        </span>
                      ))}
                    </div>
                    <Link href={`/campaigns/${campaign.id}`} className="block w-full text-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                      캠페인 상세보기
                    </Link>
                  </div>
                </div>
              )
            })
            )}
          </div>

          {/* 4-10위 캠페인 리스트 */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
            <h4 className="text-lg font-bold mb-4">전체 캠페인 랭킹</h4>
            <div className="space-y-3">
              {loading ? (
                // 로딩 스켈레톤
                Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="w-48 h-5 bg-gray-300 rounded mb-1"></div>
                        <div className="w-32 h-4 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-6 bg-gray-300 rounded"></div>
                      <div className="w-24 h-4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                campaigns.slice(3, 10).map((campaign, index) => {
                const categoryColors = {
                  '뷰티': 'bg-pink-50 text-pink-700',
                  '테크': 'bg-blue-50 text-blue-700',
                  '패션': 'bg-orange-50 text-orange-700',
                  '여행': 'bg-green-50 text-green-700',
                  '푸드': 'bg-yellow-50 text-yellow-700',
                  '피트니스': 'bg-purple-50 text-purple-700',
                  '라이프': 'bg-indigo-50 text-indigo-700'
                }
                
                return (
                  <div key={campaign.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-4">
                      <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                        {index + 4}
                      </span>
                      <div>
                        <h5 className="font-medium text-gray-900">{campaign.title}</h5>
                        <p className="text-sm text-gray-500">{campaign.brand}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className={`text-sm px-3 py-1 rounded-full ${categoryColors[campaign.category] || 'bg-gray-50 text-gray-700'}`}>
                        {campaign.category}
                      </span>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{campaign.applicants}/{campaign.maxApplicants}명 · D-{campaign.deadline}</p>
                      </div>
                    </div>
                  </div>
                )
              })
              )}
            </div>
            <div className="mt-6 text-center">
              <Link href="/campaigns" className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                전체 캠페인 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 - 탭 형식 */}
      <section ref={featuresRef} className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              당신에게 필요한 모든 기능
            </h3>
            <p className="text-xl text-gray-600">
              브랜드와 인플루언서 모두를 위한 완벽한 솔루션
            </p>
          </div>

          {/* 탭 버튼 */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1 rounded-full inline-flex">
              <button
                onClick={() => setActiveTab('business')}
                className={`px-8 py-3 rounded-full font-medium transition-all duration-200 ${
                  activeTab === 'business' 
                    ? 'bg-white text-indigo-600 shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                비즈니스를 위한 기능
              </button>
              <button
                onClick={() => setActiveTab('influencer')}
                className={`px-8 py-3 rounded-full font-medium transition-all duration-200 ${
                  activeTab === 'influencer' 
                    ? 'bg-white text-indigo-600 shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                인플루언서를 위한 기능
              </button>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="max-w-6xl mx-auto">
            {activeTab === 'business' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow feature-card">
                  <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">AI 기반 인플루언서 매칭</h4>
                  <p className="text-gray-600 mb-4">
                    브랜드 특성과 타겟 오디언스를 분석하여 최적의 인플루언서를 자동으로 추천합니다.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      카테고리별 정밀 매칭
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      참여율 기반 추천
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      예산 최적화 알고리즘
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow feature-card">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">실시간 성과 분석</h4>
                  <p className="text-gray-600 mb-4">
                    캠페인 진행 상황과 ROI를 실시간으로 추적하고 상세한 리포트를 제공합니다.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      실시간 도달률 추적
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      전환율 분석
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      자동 리포트 생성
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow feature-card">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">안전한 에스크로 결제</h4>
                  <p className="text-gray-600 mb-4">
                    캠페인 완료 시까지 대금을 안전하게 보관하여 양측 모두를 보호합니다.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      단계별 대금 지급
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      분쟁 해결 시스템
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      자동 정산 처리
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow feature-card">
                  <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">원활한 커뮤니케이션</h4>
                  <p className="text-gray-600 mb-4">
                    인플루언서와 실시간으로 소통하고 캠페인을 효율적으로 관리합니다.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      실시간 메시징
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      파일 공유 시스템
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      화상 회의 연동
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'influencer' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow feature-card">
                  <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">맞춤형 캠페인 추천</h4>
                  <p className="text-gray-600 mb-4">
                    프로필과 관심사를 기반으로 최적의 캠페인을 자동으로 추천받습니다.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      AI 기반 매칭
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      카테고리별 필터링
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      실시간 알림
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow feature-card">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">투명한 수익 관리</h4>
                  <p className="text-gray-600 mb-4">
                    수익 현황을 실시간으로 확인하고 간편하게 정산받을 수 있습니다.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      실시간 수익 확인
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      자동 세금계산서
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      빠른 정산 처리
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow feature-card">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">성장 지원 도구</h4>
                  <p className="text-gray-600 mb-4">
                    인플루언서로서의 성장을 돕는 다양한 분석 도구와 교육을 제공합니다.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      참여율 분석
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      콘텐츠 성과 추적
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      성장 가이드
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow feature-card">
                  <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">브랜드 매칭 시스템</h4>
                  <p className="text-gray-600 mb-4">
                    나와 잘 맞는 브랜드를 찾고 장기적인 파트너십을 구축할 수 있습니다.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      브랜드 탐색
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      협업 제안 관리
                    </li>
                    <li className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      파트너십 구축
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 사용 방법 섹션 */}
      <section ref={howToRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              간단한 3단계로 시작하세요
            </h3>
            <p className="text-xl text-gray-600">
              복잡한 과정은 없습니다. 누구나 쉽게 시작할 수 있어요.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* 연결선 */}
              <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 hidden md:block"></div>
              
              <div className="grid md:grid-cols-3 gap-8 relative">
                <div className="text-center step-item">
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">
                    1
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">회원가입</h4>
                  <p className="text-gray-600">
                    간단한 정보만 입력하면 바로 시작할 수 있습니다.
                  </p>
                </div>

                <div className="text-center step-item">
                  <div className="w-20 h-20 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">
                    2
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">프로필 설정</h4>
                  <p className="text-gray-600">
                    브랜드 또는 인플루언서 정보를 입력해주세요.
                  </p>
                </div>

                <div className="text-center step-item">
                  <div className="w-20 h-20 bg-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">
                    3
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">매칭 시작</h4>
                  <p className="text-gray-600">
                    AI가 최적의 파트너를 찾아드립니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 성공 사례 섹션 */}
      <section ref={successRef} className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              성공 사례
            </h3>
            <p className="text-xl text-gray-600">
              LinkPick와 함께 성장한 브랜드와 인플루언서들의 이야기
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-xl success-story animate-pulse">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-gray-300 rounded-full mr-4"></div>
                    <div>
                      <div className="w-24 h-5 bg-gray-300 rounded mb-2"></div>
                      <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-4 bg-gray-300 rounded"></div>
                    <div className="w-full h-4 bg-gray-300 rounded"></div>
                    <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-24 h-5 bg-gray-300 rounded"></div>
                </div>
              ))
            ) : testimonials.length > 0 ? (
              testimonials.slice(0, 3).map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-xl success-story">
                  <div className="flex items-center mb-6">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="w-14 h-14 rounded-full mr-4"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=6366f1&color=fff`
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center text-yellow-500">
                    {'★'.repeat(testimonial.rating)}
                  </div>
                </div>
              ))
            ) : (
              // 기본 성공 사례
              <>
                <div className="bg-white p-8 rounded-2xl shadow-xl success-story">
                  <div className="flex items-center mb-6">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face" alt="Brand" className="w-14 h-14 rounded-full mr-4" />
                    <div>
                      <h4 className="font-bold text-gray-900">뷰티브랜드 A</h4>
                      <p className="text-sm text-gray-600">코스메틱 브랜드</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "LinkPick를 통해 우리 브랜드와 완벽하게 맞는 인플루언서를 찾았습니다. 캠페인 ROI가 320% 향상되었어요!"
                  </p>
                  <div className="flex items-center text-yellow-500">
                    {'★★★★★'}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl success-story">
                  <div className="flex items-center mb-6">
                    <img src="https://images.unsplash.com/photo-1494790108755-2616c9c3e0e6?w=60&h=60&fit=crop&crop=face" alt="Influencer" className="w-14 h-14 rounded-full mr-4" />
                    <div>
                      <h4 className="font-bold text-gray-900">@lifestyle_kim</h4>
                      <p className="text-sm text-gray-600">라이프스타일 인플루언서</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "다양한 브랜드와 협업하면서 월 수익이 3배 늘었습니다. 투명한 정산 시스템이 정말 만족스러워요."
                  </p>
                  <div className="flex items-center text-yellow-500">
                    {'★★★★★'}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl success-story">
                  <div className="flex items-center mb-6">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face" alt="Brand" className="w-14 h-14 rounded-full mr-4" />
                    <div>
                      <h4 className="font-bold text-gray-900">테크기업 B</h4>
                      <p className="text-sm text-gray-600">IT 스타트업</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "신제품 런칭 캠페인에서 목표 대비 150% 달성! AI 매칭으로 정확한 타겟팅이 가능했습니다."
                  </p>
                  <div className="flex items-center text-yellow-500">
                    {'★★★★★'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section ref={faqRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              자주 묻는 질문
            </h3>
            <p className="text-xl text-gray-600">
              궁금하신 점을 빠르게 해결해드립니다
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm faq-item animate-pulse">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="w-3/4 h-5 bg-gray-300 rounded"></div>
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : faqItems.length > 0 ? (
              faqItems.map((item, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm faq-item">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{item.question}</span>
                    <svg 
                      className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // 기본 FAQ 항목들
              [
                {
                  question: "LinkPick는 어떤 서비스인가요?",
                  answer: "LinkPick는 브랜드와 인플루언서를 연결하는 AI 기반 마케팅 플랫폼입니다. 정밀한 매칭 알고리즘으로 최적의 파트너를 찾아드립니다."
                },
                {
                  question: "수수료는 얼마인가요?",
                  answer: "캠페인 성공 시에만 거래액의 10%를 수수료로 받습니다. 회원가입과 플랫폼 이용은 무료입니다."
                },
                {
                  question: "어떤 카테고리의 인플루언서가 있나요?",
                  answer: "패션, 뷰티, 푸드, 여행, 테크, 게임 등 20개 이상의 카테고리에서 다양한 인플루언서가 활동하고 있습니다."
                },
                {
                  question: "캠페인 진행 과정은 어떻게 되나요?",
                  answer: "캠페인 등록 → 인플루언서 매칭 → 협의 및 계약 → 콘텐츠 제작 → 성과 측정의 5단계로 진행됩니다."
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm faq-item">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{item.question}</span>
                    <svg 
                      className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section ref={ctaRef} className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h3>
          <p className="text-xl text-white/80 mb-8">
            5분이면 충분합니다. 복잡한 절차 없이 바로 시작할 수 있어요.
          </p>
          <Link href="/register" className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-full font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
            무료로 시작하기
          </Link>
        </div>
      </section>

    </PageLayout>
  )
}