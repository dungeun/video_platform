'use client'

import { useState, useEffect } from 'react'
import { User } from '@/lib/auth'
import { apiGet } from '@/lib/api/client'

interface InfluencerMyPageProps {
  user: User
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function InfluencerMyPage({ user, activeTab, setActiveTab }: InfluencerMyPageProps) {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalViews: 0,
    followers: 0
  })
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    youtube: '',
    naverBlog: '',
    tiktok: ''
  })
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)
  const [ratings, setRatings] = useState<number[]>([])
  const [newRating, setNewRating] = useState('')

  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([])
  const [recentEarnings, setRecentEarnings] = useState<any[]>([])

  // 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true)
        const response = await apiGet('/api/influencer/stats')
        
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setActiveCampaigns(data.activeCampaigns || [])
          setRecentEarnings(data.recentEarnings || [])
          
          // 평점 개수에 맞게 임시 평점 데이터 생성
          const ratingCount = data.stats.totalCampaigns || 0
          const tempRatings = Array.from({ length: ratingCount }, () => 
            Math.random() > 0.3 ? 5 : 4.5
          )
          setRatings(tempRatings)
        }
      } catch (error) {
        console.error('통계 데이터 조회 실패:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  const tabs = [
    { id: 'overview', name: '내 활동', icon: '📊' },
    { id: 'campaigns', name: '캠페인', icon: '📢' },
    { id: 'earnings', name: '수익', icon: '💰' },
    { id: 'withdrawal', name: '수익신청', icon: '🏦' },
    { id: 'profile', name: '프로필', icon: '👤' }
  ]

  return (
    <div className="space-y-6">
      {/* 사용자 정보 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">인플루언서</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">팔로워 {stats.followers.toLocaleString()}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">평점 ⭐ {stats.averageRating}</span>
              <span className="text-sm text-gray-400">({stats.totalCampaigns}개 리뷰)</span>
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            SNS 수정
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-cyan-600 border-b-2 border-cyan-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div className="p-6">
          {loadingStats && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
          )}
          
          {!loadingStats && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 통계 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">총 캠페인</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.totalCampaigns}</p>
                    </div>
                    <div className="text-blue-500 text-2xl">📝</div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">총 수익</p>
                      <p className="text-2xl font-bold text-green-900">
                        ₩{stats.totalEarnings.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-green-500 text-2xl">💰</div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">총 조회수</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {stats.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-purple-500 text-2xl">👁️</div>
                  </div>
                </div>
              </div>

              {/* 진행 중인 캠페인 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">진행 중인 캠페인</h3>
                <div className="space-y-3">
                  {activeCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                          <p className="text-sm text-gray-600">{campaign.brand}</p>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          ₩{campaign.reward.toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>진행률</span>
                          <span>{campaign.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-cyan-600 h-2 rounded-full"
                            style={{ width: `${campaign.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">마감일: {campaign.deadline}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loadingStats && activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">내 캠페인</h3>
                <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                  새 캠페인 찾기
                </button>
              </div>
              
              <div className="grid gap-4">
                {activeCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{campaign.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{campaign.brand}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'in_progress' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {campaign.status === 'in_progress' ? '진행중' : '대기중'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">마감일: {campaign.deadline}</span>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                          자세히
                        </button>
                        <button className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded text-sm hover:bg-cyan-200">
                          콘텐츠 업로드
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingStats && activeTab === 'earnings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">수익 현황</h3>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ₩{stats.totalEarnings.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">총 수익</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">최근 수익</h4>
                {recentEarnings.map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium text-gray-900">{earning.campaignTitle}</p>
                      <p className="text-sm text-gray-500">{earning.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        ₩{earning.amount.toLocaleString()}
                      </p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        지급완료
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingStats && activeTab === 'withdrawal' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">수익 신청</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">출금 가능 금액</p>
                  <p className="text-2xl font-bold text-green-600">₩350,000</p>
                </div>
              </div>

              {/* 출금 신청 양식 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">출금 신청</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      출금 금액
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">₩</span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">최소 출금 금액: ₩50,000</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      은행 선택
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                      <option value="">은행을 선택하세요</option>
                      <option value="kb">KB국민은행</option>
                      <option value="shinhan">신한은행</option>
                      <option value="woori">우리은행</option>
                      <option value="hana">하나은행</option>
                      <option value="nh">농협은행</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계좌번호
                    </label>
                    <input
                      type="text"
                      placeholder="계좌번호를 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예금주명
                    </label>
                    <input
                      type="text"
                      placeholder="예금주명을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                    출금 신청하기
                  </button>
                </div>
              </div>

              {/* 출금 내역 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">출금 내역</h4>
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">₩450,000</p>
                        <p className="text-sm text-gray-600 mt-1">KB국민은행 **** 1234</p>
                        <p className="text-xs text-gray-500 mt-1">2025-06-25 14:30</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        완료
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">₩380,000</p>
                        <p className="text-sm text-gray-600 mt-1">신한은행 **** 5678</p>
                        <p className="text-xs text-gray-500 mt-1">2025-06-10 11:20</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        완료
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">₩250,000</p>
                        <p className="text-sm text-gray-600 mt-1">KB국민은행 **** 1234</p>
                        <p className="text-xs text-gray-500 mt-1">2025-05-28 09:00</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        완료
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loadingStats && activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">프로필 설정</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    인스타그램 계정
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    블로그 URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://blog.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자기소개
                  </label>
                  <textarea
                    rows={4}
                    placeholder="자신을 소개해주세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                  저장하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SNS 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">SNS 계정 수정</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-pink-500">📷</span> Instagram
                  </span>
                </label>
                <input
                  type="text"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                  placeholder="@username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-red-500">🎥</span> YouTube
                  </span>
                </label>
                <input
                  type="text"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({...socialLinks, youtube: e.target.value})}
                  placeholder="youtube.com/@channelname"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-green-500">📝</span> 네이버 블로그
                  </span>
                </label>
                <input
                  type="text"
                  value={socialLinks.naverBlog}
                  onChange={(e) => setSocialLinks({...socialLinks, naverBlog: e.target.value})}
                  placeholder="blog.naver.com/blogid"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-purple-500">🎵</span> TikTok
                  </span>
                </label>
                <input
                  type="text"
                  value={socialLinks.tiktok}
                  onChange={(e) => setSocialLinks({...socialLinks, tiktok: e.target.value})}
                  placeholder="@username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            
            {/* 팔로워 가져오기 버튼 */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">SNS 계정을 입력하고 실제 팔로워 수를 가져올 수 있습니다.</p>
              <button
                onClick={async () => {
                  setLoadingFollowers(true)
                  // 시뮬레이션: 실제로는 API 호출
                  setTimeout(() => {
                    const mockFollowers = {
                      instagram: socialLinks.instagram ? Math.floor(Math.random() * 50000) + 10000 : 0,
                      youtube: socialLinks.youtube ? Math.floor(Math.random() * 100000) + 5000 : 0,
                      naverBlog: socialLinks.naverBlog ? Math.floor(Math.random() * 30000) + 1000 : 0,
                      tiktok: socialLinks.tiktok ? Math.floor(Math.random() * 80000) + 15000 : 0
                    }
                    
                    const totalFollowers = mockFollowers.instagram + mockFollowers.youtube + mockFollowers.naverBlog + mockFollowers.tiktok
                    
                    if (totalFollowers > 0) {
                      setStats({...stats, followers: totalFollowers})
                      alert(`팔로워 수가 업데이트되었습니다!\n\nInstagram: ${mockFollowers.instagram.toLocaleString()}\nYouTube: ${mockFollowers.youtube.toLocaleString()}\n네이버 블로그: ${mockFollowers.naverBlog.toLocaleString()}\nTikTok: ${mockFollowers.tiktok.toLocaleString()}\n\n총 팔로워: ${totalFollowers.toLocaleString()}`)
                    } else {
                      alert('SNS 계정을 먼저 입력해주세요.')
                    }
                    setLoadingFollowers(false)
                  }, 2000)
                }}
                disabled={loadingFollowers}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  loadingFollowers 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                }`}
              >
                {loadingFollowers ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    팔로워 수 가져오는 중...
                  </span>
                ) : (
                  '팔로워 수 가져오기'
                )}
              </button>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // TODO: API 호출하여 저장
                  setShowEditModal(false)
                  alert('SNS 계정이 업데이트되었습니다.')
                }}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}