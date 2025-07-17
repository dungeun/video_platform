'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableMenuItem } from '@/components/admin/SortableMenuItem';
import { SortableFooterColumn } from '@/components/admin/SortableFooterColumn';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';
import type { MenuItem, FooterColumn, FooterLink } from '@/lib/stores/ui-config.store';

export default function UIConfigPage() {
  const { config, updateHeaderMenus, updateFooterColumns, updateLogo, updateCTAButton, updateCopyright, resetToDefault } = useUIConfigStore();
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleHeaderDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = config.header.menus.findIndex((item) => item.id === active.id);
      const newIndex = config.header.menus.findIndex((item) => item.id === over.id);
      
      const newMenus = arrayMove(config.header.menus, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index + 1,
      }));
      
      updateHeaderMenus(newMenus);
    }
  };

  const handleFooterDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = config.footer.columns.findIndex((item) => item.id === active.id);
      const newIndex = config.footer.columns.findIndex((item) => item.id === over.id);
      
      const newColumns = arrayMove(config.footer.columns, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index + 1,
      }));
      
      updateFooterColumns(newColumns);
    }
  };

  const handleMenuUpdate = (id: string, updates: Partial<MenuItem>) => {
    const newMenus = config.header.menus.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    updateHeaderMenus(newMenus);
  };

  const handleAddMenu = () => {
    const newMenu: MenuItem = {
      id: `menu-${Date.now()}`,
      label: '새 메뉴',
      href: '#',
      order: config.header.menus.length + 1,
      visible: true,
    };
    updateHeaderMenus([...config.header.menus, newMenu]);
  };

  const handleDeleteMenu = (id: string) => {
    updateHeaderMenus(config.header.menus.filter((item) => item.id !== id));
  };

  // 푸터 관련 핸들러
  const handleAddFooterColumn = () => {
    const newColumn: FooterColumn = {
      id: `column-${Date.now()}`,
      title: '새 컬럼',
      order: config.footer.columns.length + 1,
      links: []
    };
    updateFooterColumns([...config.footer.columns, newColumn]);
  };

  const handleFooterColumnUpdate = (columnId: string, updates: Partial<FooterColumn>) => {
    const newColumns = config.footer.columns.map((col) =>
      col.id === columnId ? { ...col, ...updates } : col
    );
    updateFooterColumns(newColumns);
  };

  const handleDeleteFooterColumn = (columnId: string) => {
    updateFooterColumns(config.footer.columns.filter((col) => col.id !== columnId));
  };

  const handleAddFooterLink = (columnId: string) => {
    const newLink: FooterLink = {
      id: `link-${Date.now()}`,
      label: '새 링크',
      href: '#',
      order: 1,
      visible: true
    };
    
    const newColumns = config.footer.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          links: [...col.links, { ...newLink, order: col.links.length + 1 }]
        };
      }
      return col;
    });
    
    updateFooterColumns(newColumns);
  };

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">UI 설정 관리</h1>
        <p className="text-gray-600 mt-2">헤더와 푸터의 메뉴 및 콘텐츠를 관리합니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex space-x-1 mb-8">
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
      </div>

      {activeTab === 'header' && (
        <div className="space-y-6">
          {/* 로고 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">로고 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    로고 텍스트
                  </label>
                  <input
                    type="text"
                    value={config.header.logo.text}
                    onChange={(e) => updateLogo({ ...config.header.logo, text: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    로고 이미지 URL (선택사항)
                  </label>
                  <input
                    type="text"
                    value={config.header.logo.imageUrl || ''}
                    onChange={(e) => updateLogo({ ...config.header.logo, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>

          {/* 메뉴 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">메뉴 설정</h2>
                <button
                  onClick={handleAddMenu}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  메뉴 추가
                </button>
              </div>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleHeaderDragEnd}>
                <SortableContext items={config.header.menus} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {config.header.menus.map((menu) => (
                      <SortableMenuItem
                        key={menu.id}
                        menu={menu}
                        onUpdate={handleMenuUpdate}
                        onDelete={handleDeleteMenu}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

          {/* CTA 버튼 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">CTA 버튼 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    버튼 텍스트
                  </label>
                  <input
                    type="text"
                    value={config.header.ctaButton.text}
                    onChange={(e) => updateCTAButton({ ...config.header.ctaButton, text: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    링크 URL
                  </label>
                  <input
                    type="text"
                    value={config.header.ctaButton.href}
                    onChange={(e) => updateCTAButton({ ...config.header.ctaButton, href: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.header.ctaButton.visible}
                      onChange={(e) => updateCTAButton({ ...config.header.ctaButton, visible: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">버튼 표시</span>
                  </label>
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'footer' && (
        <div className="space-y-6">
          {/* 푸터 컬럼 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">푸터 컬럼 설정</h2>
                <button
                  onClick={handleAddFooterColumn}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  컬럼 추가
                </button>
              </div>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFooterDragEnd}>
                <SortableContext items={config.footer.columns} strategy={horizontalListSortingStrategy}>
                  <div className="grid md:grid-cols-3 gap-6">
                    {config.footer.columns
                      .sort((a, b) => a.order - b.order)
                      .map((column) => (
                        <SortableFooterColumn
                          key={column.id}
                          column={column}
                          onUpdate={handleFooterColumnUpdate}
                          onDelete={handleDeleteFooterColumn}
                          onAddLink={handleAddFooterLink}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

          {/* 저작권 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">저작권 정보</h2>
              <input
                type="text"
                value={config.footer.copyright}
                onChange={(e) => updateCopyright(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
          </div>
        </div>
      )}

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
              onClick={resetToDefault}
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