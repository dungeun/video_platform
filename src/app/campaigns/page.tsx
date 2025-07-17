'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import PageLayout from '@/components/layouts/PageLayout'

interface Campaign {
  id: string;
  title: string;
  brand_name: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  platforms: string[];
  required_followers: number;
  location: string;
  view_count: number;
  applicant_count: number;
  image_url: string;
  tags: string[];
  status: string;
  created_at: string;
  start_date: string;
  end_date: string;
  requirements: string;
  application_deadline: string;
}

export default function CampaignsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('latest')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [viewType, setViewType] = useState('card') // 'card' or 'image'
  const [favorites, setFavorites] = useState<string[]>([]) // 즐겨찾기 ID 저장
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [categoryStats, setCategoryStats] = useState<{[key: string]: number}>({})

  const categories = [
    { id: 'all', name: '전체', count: pagination.total },
    { id: '패션', name: '패션', count: categoryStats['패션'] || 0 },
    { id: '뷰티', name: '뷰티', count: categoryStats['뷰티'] || 0 },
    { id: '음식', name: '음식', count: categoryStats['음식'] || 0 },
    { id: '여행', name: '여행', count: categoryStats['여행'] || 0 },
    { id: '기술', name: '기술', count: categoryStats['기술'] || 0 },
    { id: '라이프스타일', name: '라이프스타일', count: categoryStats['라이프스타일'] || 0 },
    { id: '스포츠', name: '스포츠', count: categoryStats['스포츠'] || 0 },
    { id: '게임', name: '게임', count: categoryStats['게임'] || 0 },
    { id: '교육', name: '교육', count: categoryStats['교육'] || 0 },
    { id: '헬스', name: '헬스', count: categoryStats['헬스'] || 0 }
  ]

  // 캠페인 데이터 가져오기
  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }
      
      const response = await fetch(`/api/campaigns?${params}`)
      
      if (!response.ok) {
        throw new Error('캠페인 데이터를 가져오는데 실패했습니다.')
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setCampaigns(data.campaigns || [])
      setPagination(data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      })
      setCategoryStats(data.categoryStats || {})
    } catch (err) {
      console.error('캠페인 데이터 조회 오류:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  // 페이지 로드 시 및 필터 변경 시 데이터 가져오기
  useEffect(() => {
    fetchCampaigns()
  }, [pagination.page, selectedCategory, selectedPlatform])

  // 즐겨찾기 토글 함수
  const toggleFavorite = (campaignId: string) => {
    setFavorites(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  // 플랫폼 아이콘 함수
  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'instagram': return '📷'
      case 'youtube': return '🎥'
      case 'tiktok': return '🎵'
      case 'blog': return '✍️'
      default: return '📱'
    }
  }

  // 필터 변경 핸들러
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 정렬 (클라이언트 사이드에서 수행)
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    switch(selectedSort) {
      case 'latest': 
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'deadline': 
        return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
      case 'popular': 
        return b.applicant_count - a.applicant_count;
      default: 
        return 0;
    }
  });

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              진행 중인 캠페인
            </h1>
            <p className="text-xl text-white/80">
              당신에게 맞는 브랜드 캠페인을 찾아보세요
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="space-y-4">
            {/* 첫번째 줄: 카테고리 필터 */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>

            {/* 두번째 줄: 추가 필터 및 정렬 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 플랫폼 필터 */}
              <select
                value={selectedPlatform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">모든 플랫폼</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="blog">Blog</option>
              </select>


              <div className="flex items-center gap-3 ml-auto">
                {/* 정렬 */}
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="latest">최신순</option>
                  <option value="deadline">마감임박순</option>
                  <option value="popular">인기순</option>
                </select>

                {/* 뷰 타입 선택 */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewType('card')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      viewType === 'card' 
                        ? 'bg-white text-cyan-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    카드형
                  </button>
                  <button
                    onClick={() => setViewType('image')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      viewType === 'image' 
                        ? 'bg-white text-cyan-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    이미지형
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-medium">데이터 로딩 실패</h3>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={fetchCampaigns}
                    className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-8">
                <p className="text-gray-600">
                  총 <span className="font-bold text-cyan-600">{pagination.total}개</span>의 캠페인이 있습니다.
                </p>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">캠페인이 없습니다</h3>
                  <p className="mt-1 text-sm text-gray-500">조건에 맞는 캠페인을 찾을 수 없습니다.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setSelectedCategory('all')
                        setSelectedPlatform('all')
                        setPagination(prev => ({ ...prev, page: 1 }))
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                    >
                      필터 초기화
                    </button>
                  </div>
                </div>
              ) : (
                <>

          {/* 카드형 뷰 */}
          {viewType === 'card' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="campaign-card relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="p-6">
                  {/* Brand & Category */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
                      {(campaign as any).category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        마감 D-{Math.ceil((new Date(campaign.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                      </span>
                      {/* 즐겨찾기 버튼 */}
                      <button
                        onClick={() => toggleFavorite(campaign.id)}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 transition-colors ${favorites.includes(campaign.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Title & Brand */}
                  <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 mb-4">{campaign.brand_name}</p>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {(campaign as any).description}
                  </p>

                  {/* Campaign Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      팔로워 {campaign.required_followers.toLocaleString()}명 이상
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      조회수: {campaign.view_count}
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="flex gap-2 mb-4">
                    {(campaign as any).category.includes('instagram') && (
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Instagram</span>
                    )}
                    {(campaign as any).category.includes('youtube') && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">YouTube</span>
                    )}
                    {(campaign as any).category.includes('tiktok') && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">TikTok</span>
                    )}
                    {(campaign as any).category.includes('twitter') && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Twitter</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <span>지원자: {campaign.applicant_count}명</span>
                    <span>상태: {
                      campaign.status === 'active' ? '진행중' :
                      campaign.status === 'paused' ? '일시정지' :
                      campaign.status === 'completed' ? '완료' :
                      campaign.status === 'draft' ? '초안' :
                      campaign.status
                    }</span>
                  </div>

                  {/* Action Button */}
                  <Link 
                    href={`/campaigns/${campaign.id}`}
                    className="block w-full text-center px-4 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                  >
                    상세보기 및 지원하기
                  </Link>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* 이미지형 뷰 */}
          {viewType === 'image' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* 즐겨찾기 버튼 */}
                  <button
                    onClick={() => toggleFavorite(campaign.id)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <svg 
                      className={`w-5 h-5 transition-colors ${favorites.includes(campaign.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* 이미지 */}
                  <Link href={`/campaigns/${campaign.id}`}>
                    <div className="relative aspect-square">
                      <img 
                        src={campaign.image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'} 
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* 오버레이 - 항상 표시 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                      
                      {/* 마감일 배지 */}
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        D-{Math.ceil((new Date(campaign.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                    </div>
                  </Link>

                  {/* 콘텐츠 - 항상 표시 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="mb-2">
                      <h3 className="font-bold text-sm line-clamp-2">{campaign.title}</h3>
                      <p className="text-xs opacity-90">{campaign.brand_name}</p>
                    </div>
                    
                    {/* 플랫폼 아이콘 */}
                    <div className="flex gap-1 mb-2">
                      {campaign.platforms?.map((platform: string) => (
                        <span key={platform} className="text-lg">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                    </div>
                    
                    {/* 지원자 수 */}
                    <div className="flex justify-end items-center text-xs mb-2">
                      <span>{campaign.applicant_count}명 지원</span>
                    </div>
                    
                    {/* 해시태그 */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {campaign.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs bg-white/20 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="text-center mt-12">
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                <span className="px-4 py-2 text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            원하는 캠페인을 찾지 못하셨나요?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            프로필을 등록하면 맞춤 캠페인 추천을 받을 수 있습니다.
          </p>
          <Link 
            href="/register?type=influencer" 
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            인플루언서로 등록하기
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}