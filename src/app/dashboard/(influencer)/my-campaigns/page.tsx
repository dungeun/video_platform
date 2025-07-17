'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, 
  Eye, FileText, Upload, MessageSquare, TrendingUp, Star
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  brand: string;
  brandLogo: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'submitted';
  appliedDate: string;
  deadline: string;
  budget: number;
  requirements: string[];
  submittedContent?: {
    url: string;
    submittedDate: string;
    views?: number;
    likes?: number;
    comments?: number;
  };
  feedback?: string;
  rating?: number;
  paymentStatus?: 'pending' | 'processing' | 'completed';
  paymentDate?: string;
}

export default function MyCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  // Mock 데이터
  const mockCampaigns: Campaign[] = [
    {
      id: '1',
      title: '여름 신제품 뷰티 리뷰 캠페인',
      brand: '글로우 코스메틱',
      brandLogo: '/images/brands/glow-cosmetics.png',
      status: 'in_progress',
      appliedDate: '2024-06-15',
      deadline: '2024-07-31',
      budget: 500000,
      requirements: [
        '인스타그램 피드 3개 이상',
        '스토리 5개 이상',
        '정품 태그 필수',
        '브랜드 계정 태그'
      ]
    },
    {
      id: '2',
      title: '프리미엄 피트니스 웨어 착용 리뷰',
      brand: '액티브 스포츠',
      brandLogo: '/images/brands/active-sports.png',
      status: 'submitted',
      appliedDate: '2024-06-01',
      deadline: '2024-06-30',
      budget: 300000,
      requirements: [
        '운동 중 착용샷 5장',
        '상세 리뷰 포함',
        '해시태그 10개 이상'
      ],
      submittedContent: {
        url: 'https://instagram.com/p/xxx',
        submittedDate: '2024-06-25',
        views: 5420,
        likes: 892,
        comments: 47
      }
    },
    {
      id: '3',
      title: '신메뉴 맛집 탐방 리뷰',
      brand: '맛있는 레스토랑',
      brandLogo: '/images/brands/delicious-restaurant.png',
      status: 'completed',
      appliedDate: '2024-05-10',
      deadline: '2024-05-31',
      budget: 200000,
      requirements: [
        '음식 사진 10장 이상',
        '분위기 사진 포함',
        '솔직한 리뷰'
      ],
      submittedContent: {
        url: 'https://instagram.com/p/yyy',
        submittedDate: '2024-05-28',
        views: 12300,
        likes: 2100,
        comments: 156
      },
      rating: 5,
      paymentStatus: 'completed',
      paymentDate: '2024-06-05'
    },
    {
      id: '4',
      title: '테크 제품 언박싱 리뷰',
      brand: '테크 이노베이션',
      brandLogo: '/images/brands/tech-innovation.png',
      status: 'pending',
      appliedDate: '2024-06-20',
      deadline: '2024-08-15',
      budget: 400000,
      requirements: [
        '유튜브 영상 1개',
        '10분 이상',
        '언박싱 + 사용 리뷰'
      ]
    },
    {
      id: '5',
      title: '여행 숙소 체험 리뷰',
      brand: '드림 호텔',
      brandLogo: '/images/brands/dream-hotel.png',
      status: 'rejected',
      appliedDate: '2024-06-18',
      deadline: '2024-07-15',
      budget: 600000,
      requirements: [
        '2박 3일 숙박',
        '블로그 포스팅',
        '인스타그램 연동'
      ],
      feedback: '죄송합니다. 이번 캠페인은 팔로워 5만명 이상 인플루언서를 대상으로 진행됩니다.'
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
      case 'in_progress':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'submitted':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Campaign['status']) => {
    switch (status) {
      case 'pending':
        return '심사중';
      case 'approved':
        return '승인됨';
      case 'in_progress':
        return '진행중';
      case 'rejected':
        return '거절됨';
      case 'submitted':
        return '제출 완료';
      case 'completed':
        return '완료됨';
      default:
        return '';
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return campaign.status === 'pending';
    if (activeTab === 'active') return ['approved', 'in_progress', 'submitted'].includes(campaign.status);
    if (activeTab === 'completed') return campaign.status === 'completed';
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(budget);
  };

  const calculateDaysLeft = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">내 캠페인</h1>
        <p className="text-gray-600">참여 중인 캠페인을 관리하고 진행 상황을 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">전체 캠페인</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">진행중</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns.filter(c => ['approved', 'in_progress', 'submitted'].includes(c.status)).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">완료됨</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaigns.filter(c => c.status === 'completed').length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">총 수익</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBudget(campaigns.filter(c => c.paymentStatus === 'completed').reduce((sum, c) => sum + c.budget, 0))}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              전체 ({campaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              대기중 ({campaigns.filter(c => c.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              진행중 ({campaigns.filter(c => ['approved', 'in_progress', 'submitted'].includes(c.status)).length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              완료 ({campaigns.filter(c => c.status === 'completed').length})
            </button>
          </nav>
        </div>
      </div>

      {/* 캠페인 리스트 */}
      <div className="space-y-4">
        {filteredCampaigns.map(campaign => (
          <div key={campaign.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* 브랜드 로고 */}
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-medium text-gray-600">
                      {campaign.brand.charAt(0)}
                    </span>
                  </div>

                  {/* 캠페인 정보 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{campaign.brand}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        지원일: {formatDate(campaign.appliedDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        마감일: {formatDate(campaign.deadline)}
                        {campaign.status === 'in_progress' && ` (${calculateDaysLeft(campaign.deadline)}일 남음)`}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatBudget(campaign.budget)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 상태 배지 */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(campaign.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                    {getStatusText(campaign.status)}
                  </span>
                </div>
              </div>

              {/* 요구사항 */}
              {campaign.status === 'in_progress' && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">캠페인 요구사항</h4>
                  <ul className="space-y-1">
                    {campaign.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 제출된 콘텐츠 */}
              {campaign.submittedContent && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">제출된 콘텐츠</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <a href={campaign.submittedContent.url} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        콘텐츠 보기
                      </a>
                      <span>제출일: {formatDate(campaign.submittedContent.submittedDate)}</span>
                    </div>
                    {campaign.submittedContent.views && (
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {campaign.submittedContent.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          {campaign.submittedContent.likes?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {campaign.submittedContent.comments}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 피드백 */}
              {campaign.feedback && (
                <div className="bg-red-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-red-900 mb-1">피드백</h4>
                  <p className="text-sm text-red-700">{campaign.feedback}</p>
                </div>
              )}

              {/* 평점 및 결제 정보 */}
              {campaign.status === 'completed' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {campaign.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">평점:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (campaign.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {campaign.paymentStatus && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">결제:</span>
                        <span className={`text-sm font-medium ${
                          campaign.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {campaign.paymentStatus === 'completed' ? '완료' : 
                           campaign.paymentStatus === 'processing' ? '처리중' : '대기중'}
                        </span>
                        {campaign.paymentDate && (
                          <span className="text-sm text-gray-500">
                            ({formatDate(campaign.paymentDate)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex items-center gap-3 mt-4">
                {campaign.status === 'in_progress' && (
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    콘텐츠 제출
                  </button>
                )}
                <a
                  href={`/campaigns/${campaign.id}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  상세보기
                </a>
                {campaign.status === 'in_progress' && (
                  <button className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    문의하기
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg">
          <div className="text-gray-400 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">캠페인이 없습니다</h3>
          <p className="text-gray-600 mb-4">
            {activeTab === 'pending' && '심사 중인 캠페인이 없습니다'}
            {activeTab === 'active' && '진행 중인 캠페인이 없습니다'}
            {activeTab === 'completed' && '완료된 캠페인이 없습니다'}
            {activeTab === 'all' && '아직 참여한 캠페인이 없습니다'}
          </p>
          <a
            href="/dashboard/explore"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            캠페인 탐색하기
          </a>
        </div>
      )}
    </div>
  );
}