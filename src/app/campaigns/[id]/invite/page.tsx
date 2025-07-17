'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Filter, Plus, X, Send, 
  User, Star, Eye, Instagram, Youtube, MapPin,
  Calendar, Award, TrendingUp, Users, CheckCircle,
  UserPlus, Mail, MessageSquare, ExternalLink
} from 'lucide-react';

interface Influencer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  categories: string[];
  socialMedia: {
    instagram?: { handle: string; followers: number; };
    youtube?: { handle: string; subscribers: number; };
    tiktok?: { handle: string; followers: number; };
  };
  stats: {
    completedCampaigns: number;
    averageRating: number;
    responseRate: number;
    engagementRate: number;
  };
  portfolio: {
    recentPosts: number;
    totalViews: number;
    avgLikes: number;
  };
  isInvited: boolean;
  matchScore: number;
}

export default function InviteInfluencersPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [filteredInfluencers, setFilteredInfluencers] = useState<Influencer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minFollowers, setMinFollowers] = useState(1000);
  const [sortBy, setSortBy] = useState<'match' | 'followers' | 'rating' | 'engagement'>('match');
  const [loading, setLoading] = useState(true);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  // Mock 데이터
  const mockInfluencers: Influencer[] = [
    {
      id: '1',
      name: '김뷰티',
      email: 'kimbeauty@example.com',
      avatar: '/images/influencers/influencer1.jpg',
      bio: '뷰티 전문 인플루언서입니다. 트렌디한 메이크업과 스킨케어 리뷰를 전문으로 합니다.',
      location: '서울특별시',
      categories: ['beauty', 'lifestyle'],
      socialMedia: {
        instagram: { handle: 'kimbeauty_official', followers: 125000 },
        youtube: { handle: 'KimBeautyChannel', subscribers: 45000 }
      },
      stats: {
        completedCampaigns: 23,
        averageRating: 4.8,
        responseRate: 95,
        engagementRate: 5.2
      },
      portfolio: {
        recentPosts: 12,
        totalViews: 890000,
        avgLikes: 8500
      },
      isInvited: false,
      matchScore: 92
    },
    {
      id: '2',
      name: '박라이프',
      email: 'parklife@example.com',
      avatar: '/images/influencers/influencer2.jpg',
      bio: '일상 속 소소한 행복을 공유하는 라이프스타일 크리에이터입니다.',
      location: '경기도',
      categories: ['lifestyle', 'travel'],
      socialMedia: {
        instagram: { handle: 'park_daily_life', followers: 89000 },
        tiktok: { handle: 'parklife_daily', followers: 156000 }
      },
      stats: {
        completedCampaigns: 18,
        averageRating: 4.6,
        responseRate: 88,
        engagementRate: 6.8
      },
      portfolio: {
        recentPosts: 18,
        totalViews: 1200000,
        avgLikes: 12000
      },
      isInvited: true,
      matchScore: 87
    },
    {
      id: '3',
      name: '이패션',
      email: 'leefashion@example.com',
      avatar: '/images/influencers/influencer3.jpg',
      bio: '트렌디한 패션 스타일링과 코디 팁을 공유합니다.',
      location: '부산광역시',
      categories: ['fashion', 'beauty'],
      socialMedia: {
        instagram: { handle: 'lee_fashion_style', followers: 67000 },
        youtube: { handle: 'LeeFashionTV', subscribers: 23000 }
      },
      stats: {
        completedCampaigns: 15,
        averageRating: 4.4,
        responseRate: 82,
        engagementRate: 4.1
      },
      portfolio: {
        recentPosts: 15,
        totalViews: 450000,
        avgLikes: 5600
      },
      isInvited: false,
      matchScore: 78
    },
    {
      id: '4',
      name: '최푸드',
      email: 'choifood@example.com',
      avatar: '/images/influencers/influencer4.jpg',
      bio: '맛있는 음식과 레시피를 소개하는 푸드 크리에이터입니다.',
      location: '대구광역시',
      categories: ['food', 'lifestyle'],
      socialMedia: {
        instagram: { handle: 'choi_food_story', followers: 98000 },
        youtube: { handle: 'ChoiFoodChannel', subscribers: 67000 }
      },
      stats: {
        completedCampaigns: 31,
        averageRating: 4.9,
        responseRate: 92,
        engagementRate: 7.3
      },
      portfolio: {
        recentPosts: 20,
        totalViews: 1500000,
        avgLikes: 15000
      },
      isInvited: false,
      matchScore: 85
    }
  ];

  const categories = [
    { value: 'all', label: '전체 카테고리' },
    { value: 'beauty', label: '뷰티' },
    { value: 'fashion', label: '패션' },
    { value: 'food', label: '음식' },
    { value: 'travel', label: '여행' },
    { value: 'tech', label: '테크' },
    { value: 'lifestyle', label: '라이프스타일' }
  ];

  useEffect(() => {
    setTimeout(() => {
      setInfluencers(mockInfluencers);
      setFilteredInfluencers(mockInfluencers);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    filterAndSortInfluencers();
  }, [searchTerm, categoryFilter, minFollowers, sortBy, influencers]);

  const filterAndSortInfluencers = () => {
    let filtered = [...influencers];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(influencer =>
        influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(influencer => 
        influencer.categories.includes(categoryFilter)
      );
    }

    // 팔로워 수 필터
    filtered = filtered.filter(influencer => {
      const followers = influencer.socialMedia.instagram?.followers || 0;
      return followers >= minFollowers;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'followers':
          const aFollowers = a.socialMedia.instagram?.followers || 0;
          const bFollowers = b.socialMedia.instagram?.followers || 0;
          return bFollowers - aFollowers;
        case 'rating':
          return b.stats.averageRating - a.stats.averageRating;
        case 'engagement':
          return b.stats.engagementRate - a.stats.engagementRate;
        case 'match':
        default:
          return b.matchScore - a.matchScore;
      }
    });

    setFilteredInfluencers(filtered);
  };

  const handleInviteInfluencer = (influencerId: string) => {
    setInfluencers(prev => prev.map(influencer =>
      influencer.id === influencerId
        ? { ...influencer, isInvited: true }
        : influencer
    ));
  };

  const handleBulkInvite = () => {
    setInfluencers(prev => prev.map(influencer =>
      selectedInfluencers.includes(influencer.id)
        ? { ...influencer, isInvited: true }
        : influencer
    ));
    setSelectedInfluencers([]);
    setShowBulkInvite(false);
    setInviteMessage('');
  };

  const toggleInfluencerSelection = (influencerId: string) => {
    setSelectedInfluencers(prev =>
      prev.includes(influencerId)
        ? prev.filter(id => id !== influencerId)
        : [...prev, influencerId]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">인플루언서 초대</h1>
                <p className="text-sm text-gray-600">캠페인에 적합한 인플루언서를 찾아 초대하세요</p>
              </div>
            </div>
            {selectedInfluencers.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{selectedInfluencers.length}명 선택됨</span>
                <button
                  onClick={() => setShowBulkInvite(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  일괄 초대
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="인플루언서 이름, 카테고리로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 정렬 */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="match">매칭 점수순</option>
                <option value="followers">팔로워순</option>
                <option value="rating">평점순</option>
                <option value="engagement">참여율순</option>
              </select>
            </div>
          </div>

          {/* 추가 필터 */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">최소 팔로워:</label>
              <input
                type="number"
                value={minFollowers}
                onChange={(e) => setMinFollowers(parseInt(e.target.value) || 0)}
                min="0"
                step="1000"
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="text-sm text-gray-600">
              총 {filteredInfluencers.length}명 • 초대됨 {filteredInfluencers.filter(i => i.isInvited).length}명
            </div>
          </div>
        </div>

        {/* 인플루언서 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInfluencers.map(influencer => (
            <div key={influencer.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* 체크박스 */}
                  {!influencer.isInvited && (
                    <input
                      type="checkbox"
                      checked={selectedInfluencers.includes(influencer.id)}
                      onChange={() => toggleInfluencerSelection(influencer.id)}
                      className="mt-2 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  )}

                  {/* 프로필 이미지 */}
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>

                  {/* 정보 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{influencer.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                          <MapPin className="h-4 w-4" />
                          {influencer.location}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {influencer.categories.map(category => (
                            <span key={category} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 매칭 점수 */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(influencer.matchScore)}`}>
                        {influencer.matchScore}% 매칭
                      </div>
                    </div>

                    {/* 소셜 미디어 */}
                    <div className="space-y-2 mb-4">
                      {influencer.socialMedia.instagram && (
                        <div className="flex items-center gap-2 text-sm">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <span>@{influencer.socialMedia.instagram.handle}</span>
                          <span className="text-gray-500">({formatNumber(influencer.socialMedia.instagram.followers)} 팔로워)</span>
                        </div>
                      )}
                      {influencer.socialMedia.youtube && (
                        <div className="flex items-center gap-2 text-sm">
                          <Youtube className="h-4 w-4 text-red-600" />
                          <span>{influencer.socialMedia.youtube.handle}</span>
                          <span className="text-gray-500">({formatNumber(influencer.socialMedia.youtube.subscribers)} 구독자)</span>
                        </div>
                      )}
                    </div>

                    {/* 통계 */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="font-medium text-gray-900">{influencer.stats.completedCampaigns}</p>
                        <p className="text-xs text-gray-600">완료 캠페인</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="font-medium text-gray-900 flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {influencer.stats.averageRating}
                        </p>
                        <p className="text-xs text-gray-600">평균 평점</p>
                      </div>
                    </div>

                    {/* 소개 */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{influencer.bio}</p>

                    {/* 액션 버튼 */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-50">
                          프로필 보기
                        </button>
                        <button className="px-3 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50">
                          포트폴리오
                        </button>
                      </div>
                      
                      {influencer.isInvited ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          초대됨
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInviteInfluencer(influencer.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          초대하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {filteredInfluencers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">조건에 맞는 인플루언서가 없습니다</h3>
            <p className="text-gray-600">다른 검색 조건을 시도해보세요</p>
          </div>
        )}
      </div>

      {/* 일괄 초대 모달 */}
      {showBulkInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">인플루언서 일괄 초대</h3>
              <button
                onClick={() => setShowBulkInvite(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              선택한 {selectedInfluencers.length}명의 인플루언서에게 초대 메시지를 보냅니다.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">초대 메시지 (선택사항)</label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="개인적인 메시지를 추가하세요..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkInvite(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleBulkInvite}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                초대 보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}