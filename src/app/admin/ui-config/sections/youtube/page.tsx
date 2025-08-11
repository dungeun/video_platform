'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Youtube, Plus, Trash2 } from 'lucide-react';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';

interface YoutubeSection {
  title: string;
  subtitle?: string;
  visible: boolean;
  count: number;
  category: string;
  keywords?: string[];
  channelIds?: string[];
  viewAllLink?: string;
}

export default function YoutubeSectionEditPage() {
  const router = useRouter();
  const { config, updateMainPageYoutubeSection, loadSettingsFromAPI } = useUIConfigStore();
  const [youtubeSection, setYoutubeSection] = useState<YoutubeSection>({
    title: '최신 부동산 유튜브',
    subtitle: '부동산 전문 유튜버들의 최신 영상',
    visible: true,
    count: 6,
    category: 'realestate',
    keywords: ['부동산', '아파트', '재테크', '투자'],
    channelIds: [],
    viewAllLink: '/videos/youtube?category=realestate'
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [newChannelId, setNewChannelId] = useState('');

  // UI 설정에서 YouTube 섹션 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadSettingsFromAPI();
      setLoading(false);
    };
    loadData();
  }, []);

  // config가 로드되면 youtubeSection 업데이트
  useEffect(() => {
    if (config.mainPage?.youtubeSection) {
      setYoutubeSection(config.mainPage.youtubeSection);
    }
  }, [config]);

  const handleUpdate = (updates: Partial<YoutubeSection>) => {
    setYoutubeSection({ ...youtubeSection, ...updates });
  };

  const handleAddKeyword = () => {
    if (newKeyword && !youtubeSection.keywords?.includes(newKeyword)) {
      handleUpdate({ 
        keywords: [...(youtubeSection.keywords || []), newKeyword] 
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    handleUpdate({ 
      keywords: youtubeSection.keywords?.filter(k => k !== keyword) || []
    });
  };

  const handleAddChannelId = () => {
    if (newChannelId && !youtubeSection.channelIds?.includes(newChannelId)) {
      handleUpdate({ 
        channelIds: [...(youtubeSection.channelIds || []), newChannelId] 
      });
      setNewChannelId('');
    }
  };

  const handleRemoveChannelId = (channelId: string) => {
    handleUpdate({ 
      channelIds: youtubeSection.channelIds?.filter(id => id !== channelId) || []
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Store에 업데이트
      updateMainPageYoutubeSection(youtubeSection);
      
      // API 호출하여 설정 저장
      const response = await fetch('/api/admin/ui-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          config: {
            ...config,
            mainPage: {
              ...config.mainPage,
              youtubeSection: youtubeSection
            }
          }
        }),
      });

      if (response.ok) {
        alert('저장되었습니다.');
        router.push('/admin/ui-config?tab=sections');
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = [
    { value: 'realestate', label: '부동산', description: '부동산 관련 콘텐츠' },
    { value: 'finance', label: '재테크', description: '투자 및 재테크 정보' },
    { value: 'lifestyle', label: '라이프스타일', description: '일상 및 라이프스타일' },
    { value: 'tech', label: '테크', description: 'IT 및 기술 관련' },
    { value: 'education', label: '교육', description: '학습 및 교육 콘텐츠' },
    { value: 'entertainment', label: '엔터테인먼트', description: '예능 및 오락' },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">설정을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로 가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">YouTube 섹션 관리</h1>
        <p className="text-gray-600 mt-2">메인 페이지에 표시되는 YouTube 비디오 섹션을 관리합니다.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            YouTube 섹션 설정
          </h2>
          <button
            onClick={() => handleUpdate({ visible: !youtubeSection.visible })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              youtubeSection.visible 
                ? 'bg-green-50 text-green-700 border-green-300' 
                : 'bg-gray-50 text-gray-700 border-gray-300'
            }`}
          >
            {youtubeSection.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{youtubeSection.visible ? '표시중' : '숨김'}</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* 기본 설정 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                섹션 제목
              </label>
              <input
                type="text"
                value={youtubeSection.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부제목 (선택사항)
              </label>
              <input
                type="text"
                value={youtubeSection.subtitle || ''}
                onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 전문가들의 최신 영상"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                표시 개수
              </label>
              <select
                value={youtubeSection.count}
                onChange={(e) => handleUpdate({ count: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3개</option>
                <option value={6}>6개</option>
                <option value={9}>9개</option>
                <option value={12}>12개</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전체보기 링크
              </label>
              <input
                type="text"
                value={youtubeSection.viewAllLink || ''}
                onChange={(e) => handleUpdate({ viewAllLink: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/videos/youtube"
              />
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              카테고리
            </label>
            <div className="grid md:grid-cols-2 gap-2">
              {categoryOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    youtubeSection.category === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={youtubeSection.category === option.value}
                    onChange={(e) => handleUpdate({ category: e.target.value })}
                    className="mt-0.5 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 검색 키워드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색 키워드
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="키워드 입력"
                />
                <button
                  onClick={handleAddKeyword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {youtubeSection.keywords?.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 채널 ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              특정 채널 ID (선택사항)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChannelId()}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="YouTube 채널 ID 입력"
                />
                <button
                  onClick={handleAddChannelId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {youtubeSection.channelIds?.map((channelId) => (
                  <span
                    key={channelId}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-mono"
                  >
                    {channelId}
                    <button
                      onClick={() => handleRemoveChannelId(channelId)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                특정 채널의 비디오만 표시하려면 채널 ID를 추가하세요
              </p>
            </div>
          </div>

          {/* 미리보기 */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">레이아웃 미리보기</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-600" />
                    {youtubeSection.title}
                  </h3>
                  {youtubeSection.subtitle && (
                    <p className="text-sm text-gray-600 mt-0.5">{youtubeSection.subtitle}</p>
                  )}
                </div>
                <span className="text-sm text-blue-600 font-medium">전체보기 →</span>
              </div>

              <div className={`grid gap-3 ${
                youtubeSection.count <= 3 ? 'grid-cols-1 md:grid-cols-3' : 
                youtubeSection.count <= 6 ? 'grid-cols-2 md:grid-cols-3' :
                'grid-cols-3 md:grid-cols-4'
              }`}>
                {[...Array(Math.min(youtubeSection.count, 4))].map((_, index) => (
                  <div key={index} className="bg-white border rounded-lg p-2">
                    <div className="aspect-video bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <Youtube className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        <div className="h-2 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-lg ${
            saving 
              ? 'bg-gray-400 text-gray-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}