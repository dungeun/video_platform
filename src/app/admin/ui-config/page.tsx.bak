'use client';

import { useState } from 'react';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';
import { HeaderConfigTab } from '@/components/admin/ui-config/HeaderConfigTab';
import { FooterConfigTab } from '@/components/admin/ui-config/FooterConfigTab';
import { SectionsConfigTab } from '@/components/admin/ui-config/SectionsConfigTab';
import { SectionOrderTab } from '@/components/admin/ui-config/SectionOrderTab';
import SidebarMenuManager from '@/components/admin/SidebarMenuManager';

export default function UIConfigPage() {
  const { config, resetToDefault } = useUIConfigStore();
  const [activeTab, setActiveTab] = useState<'header' | 'footer' | 'sidebar' | 'sections' | 'section-order'>('header');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // API 호출하여 설정 저장
      const response = await fetch('/api/admin/ui-config', {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        setSaveMessage('설정이 성공적으로 저장되었습니다.');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      setSaveMessage('저장 중 오류가 발생했습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    try {
      // 기본값으로 초기화
      resetToDefault();
      
      // 기본값을 가져와서 DB에 저장
      const defaultConfig = {
        header: {
          logo: { text: '비디오픽' },
          menus: [
            { id: '1', label: '홈', href: '/', order: 1, visible: true },
            { id: '2', label: '인기', href: '/videos?sort=popular', order: 2, visible: true },
            { id: '3', label: '구독', href: '/subscriptions', order: 3, visible: true },
            { id: '4', label: '라이브', href: '/live', order: 4, visible: true },
            { id: '5', label: '커뮤니티', href: '/community', order: 5, visible: true },
          ],
          ctaButton: { text: '무료로 시작하기', href: '/register', visible: true }
        },
        footer: {
          columns: [
            {
              id: '1', title: '서비스', order: 1,
              links: [
                { id: '1-1', label: '비디오 둘러보기', href: '/videos', order: 1, visible: true },
                { id: '1-2', label: '크리에이터 찾기', href: '/channels', order: 2, visible: true },
                { id: '1-3', label: '스튜디오', href: '/studio', order: 3, visible: true },
              ]
            }
          ],
          social: [
            { platform: 'twitter', url: 'https://twitter.com/videopick', visible: true },
            { platform: 'facebook', url: 'https://facebook.com/videopick', visible: true }
          ],
          copyright: '© 2024 비디오픽. All rights reserved.'
        },
        sidebar: {
          mainMenu: [
            { id: 'home', label: '홈', href: '/', icon: 'Home', order: 1, visible: true, section: 'main' },
            { id: 'live', label: '라이브', href: '/live', icon: 'Tv', order: 2, visible: true, section: 'main' },
            { id: 'videos', label: '동영상', href: '/videos', icon: 'Video', order: 3, visible: true, section: 'main' },
            { id: 'trending', label: '인기 영상', href: '/trending', icon: 'Fire', order: 4, visible: true, section: 'main' },
            { id: 'new', label: '신규 영상', href: '/new', icon: 'Plus', order: 5, visible: true, section: 'main' },
          ],
          categoryMenu: [
            { id: 'realestate', label: '부동산', href: '/category/realestate', icon: 'Building', order: 1, visible: true, section: 'category' },
            { id: 'stock', label: '주식', href: '/category/stock', icon: 'TrendingUp', order: 2, visible: true, section: 'category' },
            { id: 'car', label: '자동차', href: '/category/car', icon: 'Car', order: 3, visible: true, section: 'category' },
            { id: 'food', label: '음식', href: '/category/food', icon: 'UtensilsCrossed', order: 4, visible: true, section: 'category' },
            { id: 'travel', label: '여행', href: '/category/travel', icon: 'Plane', order: 5, visible: true, section: 'category' },
            { id: 'game', label: '게임', href: '/category/game', icon: 'Gamepad2', order: 6, visible: true, section: 'category' },
          ],
          settingsMenu: [
            { id: 'settings', label: '설정', href: '/settings', icon: 'Settings', order: 1, visible: true, section: 'settings' },
            { id: 'help', label: '도움말', href: '/help', icon: 'HelpCircle', order: 2, visible: true, section: 'settings' },
            { id: 'feedback', label: '의견 보내기', href: '/feedback', icon: 'MessageSquare', order: 3, visible: true, section: 'settings' },
          ],
          subscribedChannels: [
            { id: 'channel1', name: '지창경', avatar: 'https://i.pravatar.cc/24?img=2', isLive: true, order: 1, visible: true },
            { id: 'channel2', name: '자랑맨', avatar: 'https://i.pravatar.cc/24?img=3', isLive: false, order: 2, visible: true },
            { id: 'channel3', name: '인순효그', avatar: 'https://i.pravatar.cc/24?img=4', isLive: false, order: 3, visible: true },
            { id: 'channel4', name: '주식왕', avatar: 'https://i.pravatar.cc/24?img=5', isLive: false, order: 4, visible: true },
          ]
        },
        mainPage: { heroSlides: [], categoryMenus: [], quickLinks: [], promoBanner: { title: '', subtitle: '', icon: '', visible: true } }
      };
      
      const response = await fetch('/api/admin/ui-config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: defaultConfig }),
      });

      if (response.ok) {
        setSaveMessage('기본값으로 초기화되었습니다.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      setSaveMessage('초기화 중 오류가 발생했습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">UI 설정 관리</h1>
        <p className="text-gray-600 mt-2">헤더와 푸터의 메뉴 및 콘텐츠를 관리합니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex flex-wrap gap-1 mb-8">
        <button
          onClick={() => setActiveTab('header')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'header'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          헤더 설정
        </button>
        <button
          onClick={() => setActiveTab('footer')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'footer'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          푸터 설정
        </button>
        <button
          onClick={() => setActiveTab('sidebar')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'sidebar'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          사이드바 설정
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'sections'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          섹션 관리
        </button>
        <button
          onClick={() => setActiveTab('section-order')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'section-order'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          섹션 순서 관리
        </button>
      </div>

      {activeTab === 'header' && <HeaderConfigTab />}
      {activeTab === 'footer' && <FooterConfigTab />}
      {activeTab === 'sidebar' && <SidebarMenuManager />}
      {activeTab === 'sections' && <SectionsConfigTab />}
      {activeTab === 'section-order' && <SectionOrderTab />}

      {/* 액션 버튼 */}
      <div className="mt-8">
          {saveMessage && (
            <div className={`mb-4 p-4 rounded-lg text-center ${
              saveMessage.includes('오류') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {saveMessage}
            </div>
          )}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleResetToDefault}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              기본값으로 초기화
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className={`px-6 py-2 rounded-lg transition-colors ${
                isSaving 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
      </div>
    </div>
  );
}