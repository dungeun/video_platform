'use client';

import { useUIConfigStore } from '@/lib/stores/ui-config.store';
import { useEffect } from 'react';

interface Section {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'fixed';
  editUrl: string;
  order: number;
  type: string;
}

export function SectionsConfigTab() {
  const { config, loadSettingsFromAPI } = useUIConfigStore();

  useEffect(() => {
    loadSettingsFromAPI();
  }, []);

  // 기본 섹션 정의
  const baseSections: Section[] = [
    {
      id: 'hero',
      name: '히어로 배너',
      description: '메인 배너 슬라이드 (2단 구성)',
      status: 'active',
      editUrl: '/admin/ui-config/sections/hero',
      order: 1,
      type: 'hero'
    },
    {
      id: 'category',
      name: '카테고리 메뉴',
      description: '카테고리별 아이콘 그리드',
      status: 'active',
      editUrl: '/admin/ui-config/sections/category',
      order: 2,
      type: 'category'
    },
    {
      id: 'quicklinks',
      name: '바로가기 링크',
      description: '빠른 접근 링크 3개',
      status: 'active',
      editUrl: '/admin/ui-config/sections/quicklinks',
      order: 3,
      type: 'quicklinks'
    },
    {
      id: 'promo',
      name: '프로모션 배너',
      description: '이벤트 및 공지 배너',
      status: 'active',
      editUrl: '/admin/ui-config/sections/promo',
      order: 4,
      type: 'promo'
    },
    {
      id: 'ranking',
      name: '실시간 랭킹',
      description: '인기/마감임박 비디오 TOP 4',
      status: 'active',
      editUrl: '/admin/ui-config/sections/ranking',
      order: 5,
      type: 'ranking'
    },
    {
      id: 'recommended',
      name: '추천 비디오',
      description: '큐레이션된 비디오 목록',
      status: 'active',
      editUrl: '/admin/ui-config/sections/recommended',
      order: 7,
      type: 'recommended'
    },
    {
      id: 'cta',
      name: '하단 CTA',
      description: '회원가입 유도 영역',
      status: 'fixed',
      editUrl: '/admin/ui-config/sections/cta',
      order: 100,
      type: 'cta'
    }
  ];

  // 커스텀 섹션을 기본 섹션에 추가
  const customSections: Section[] = (config.mainPage?.customSections || []).map(section => ({
    id: section.id,
    name: section.title,
    description: section.subtitle || `${section.type === 'auto' ? '자동' : '수동'} 필터링 섹션`,
    status: section.visible ? 'active' : 'inactive',
    editUrl: `/admin/ui-config/sections/custom/${section.id}`,
    order: section.order || 999,
    type: 'custom'
  }));

  // 모든 섹션 합치기
  const allSections = [...baseSections, ...customSections].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-6">
      {/* 섹션 목록 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">홈페이지 섹션 관리</h2>
          <button
            onClick={() => window.location.href = '/admin/ui-config/sections/new'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 섹션 추가
          </button>
        </div>
        
        <div className="space-y-4">
          {allSections.map((section) => (
            <div key={section.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{section.name}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    section.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : section.status === 'fixed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {section.status === 'active' ? '활성' : section.status === 'fixed' ? '고정' : '비활성'}
                  </span>
                  <button 
                    onClick={() => window.location.href = section.editUrl}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    편집
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}