'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Youtube, Plus, Trash2, X } from 'lucide-react';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';

interface YoutubeSection {
  id: string;
  title: string;
  subtitle?: string;
  visible: boolean;
  count: number;
  category: string;
  keywords?: string[];
  channelIds?: string[];
  viewAllLink?: string;
}

const categoryOptions = [
  { value: 'latest', label: '최신' },
  { value: 'realestate', label: '부동산' },
  { value: 'stock', label: '주식' },
  { value: 'crypto', label: '암호화폐' },
  { value: 'tech', label: '테크' },
  { value: 'game', label: '게임' },
  { value: 'food', label: '음식' },
  { value: 'travel', label: '여행' },
  { value: 'beauty', label: '뷰티' },
  { value: 'fashion', label: '패션' },
];

export default function YoutubeSectionEditPage() {
  const router = useRouter();
  const { config, updateMainPageYoutubeSections, loadSettingsFromAPI } = useUIConfigStore();
  const [youtubeSections, setYoutubeSections] = useState<YoutubeSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newKeywords, setNewKeywords] = useState<{[key: string]: string}>({});
  const [newChannelIds, setNewChannelIds] = useState<{[key: string]: string}>({});

  // UI 설정에서 YouTube 섹션 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadSettingsFromAPI();
      setLoading(false);
    };
    loadData();
  }, []);

  // config가 로드되면 youtubeSections 업데이트
  useEffect(() => {
    if (config.mainPage?.youtubeSections) {
      setYoutubeSections(config.mainPage.youtubeSections);
    }
  }, [config]);

  const handleAddSection = () => {
    const newSection: YoutubeSection = {
      id: `youtube-${Date.now()}`,
      title: '새 YouTube 섹션',
      subtitle: '',
      visible: true,
      count: 6,
      category: 'latest',
      keywords: [],
      channelIds: [],
      viewAllLink: '/videos/youtube'
    };
    setYoutubeSections([...youtubeSections, newSection]);
  };

  const handleUpdateSection = (id: string, updates: Partial<YoutubeSection>) => {
    setYoutubeSections(sections => 
      sections.map(section => 
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  const handleDeleteSection = (id: string) => {
    setYoutubeSections(sections => sections.filter(s => s.id !== id));
  };

  const handleAddKeyword = (sectionId: string) => {
    const keyword = newKeywords[sectionId];
    if (keyword) {
      const section = youtubeSections.find(s => s.id === sectionId);
      if (section && !section.keywords?.includes(keyword)) {
        handleUpdateSection(sectionId, {
          keywords: [...(section.keywords || []), keyword]
        });
        setNewKeywords(prev => ({ ...prev, [sectionId]: '' }));
      }
    }
  };

  const handleRemoveKeyword = (sectionId: string, keyword: string) => {
    const section = youtubeSections.find(s => s.id === sectionId);
    if (section) {
      handleUpdateSection(sectionId, {
        keywords: section.keywords?.filter(k => k !== keyword) || []
      });
    }
  };

  const handleAddChannelId = (sectionId: string) => {
    const channelId = newChannelIds[sectionId];
    if (channelId) {
      const section = youtubeSections.find(s => s.id === sectionId);
      if (section && !section.channelIds?.includes(channelId)) {
        handleUpdateSection(sectionId, {
          channelIds: [...(section.channelIds || []), channelId]
        });
        setNewChannelIds(prev => ({ ...prev, [sectionId]: '' }));
      }
    }
  };

  const handleRemoveChannelId = (sectionId: string, channelId: string) => {
    const section = youtubeSections.find(s => s.id === sectionId);
    if (section) {
      handleUpdateSection(sectionId, {
        channelIds: section.channelIds?.filter(id => id !== channelId) || []
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Store에 업데이트
      updateMainPageYoutubeSections(youtubeSections);
      
      // sectionOrder도 업데이트
      const sectionOrder = config.mainPage?.sectionOrder || [];
      const existingYoutubeIds = sectionOrder.filter(s => s.type === 'youtube').map(s => s.id);
      const newYoutubeIds = youtubeSections.map(s => s.id);
      
      // 삭제된 섹션 제거 및 새 섹션 추가
      const updatedSectionOrder = sectionOrder
        .filter(s => s.type !== 'youtube' || newYoutubeIds.includes(s.id))
        .concat(
          newYoutubeIds
            .filter(id => !existingYoutubeIds.includes(id))
            .map((id, index) => ({
              id,
              type: 'youtube' as const,
              order: sectionOrder.length + index + 1,
              visible: true
            }))
        );
      
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
              youtubeSections: youtubeSections,
              sectionOrder: updatedSectionOrder
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
    <div className="max-w-6xl mx-auto">
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

      {/* YouTube 섹션 목록 */}
      <div className="space-y-6 mb-6">
        {youtubeSections.map((section, index) => (
          <div key={section.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Youtube className="w-5 h-5 mr-2 text-red-600" />
                YouTube 섹션 {index + 1}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdateSection(section.id, { visible: !section.visible })}
                  className={`p-2 rounded ${section.visible ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {section.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    섹션 제목
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    부제목 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={section.subtitle || ''}
                    onChange={(e) => handleUpdateSection(section.id, { subtitle: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={section.category}
                    onChange={(e) => handleUpdateSection(section.id, { category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    표시 개수
                  </label>
                  <select
                    value={section.count}
                    onChange={(e) => handleUpdateSection(section.id, { count: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[3, 4, 6, 8, 9, 12].map(num => (
                      <option key={num} value={num}>{num}개</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전체보기 링크 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={section.viewAllLink || ''}
                    onChange={(e) => handleUpdateSection(section.id, { viewAllLink: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="/videos/youtube"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    키워드 (선택사항)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newKeywords[section.id] || ''}
                      onChange={(e) => setNewKeywords(prev => ({ ...prev, [section.id]: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword(section.id)}
                      className="flex-1 px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="키워드 입력"
                    />
                    <button
                      onClick={() => handleAddKeyword(section.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {section.keywords?.map(keyword => (
                      <span key={keyword} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(section.id, keyword)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    채널 ID (선택사항)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newChannelIds[section.id] || ''}
                      onChange={(e) => setNewChannelIds(prev => ({ ...prev, [section.id]: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddChannelId(section.id)}
                      className="flex-1 px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="YouTube 채널 ID"
                    />
                    <button
                      onClick={() => handleAddChannelId(section.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {section.channelIds?.map(channelId => (
                      <span key={channelId} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                        {channelId}
                        <button
                          onClick={() => handleRemoveChannelId(section.id, channelId)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 섹션 추가 버튼 */}
      <button
        onClick={handleAddSection}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      >
        <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <span className="text-gray-600">새 YouTube 섹션 추가</span>
      </button>

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