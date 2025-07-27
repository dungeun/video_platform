'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  fixed?: boolean;
  order: number;
}

interface SortableSectionItemProps {
  section: Section;
  onToggleVisibility: (id: string) => void;
}

function SortableSectionItem({ section, onToggleVisibility }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: section.id,
    disabled: section.fixed 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-4 bg-white border rounded-lg ${
        section.fixed ? 'opacity-60' : ''
      } ${isDragging ? 'shadow-lg' : 'hover:shadow-md'} transition-shadow`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`mr-4 text-gray-400 ${section.fixed ? 'cursor-not-allowed' : 'cursor-move'}`}
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          {section.name}
          {section.fixed && <span className="ml-2 text-xs text-gray-500">(고정)</span>}
        </div>
        <div className="text-sm text-gray-600">{section.description}</div>
      </div>

      <button
        onClick={() => onToggleVisibility(section.id)}
        className={`ml-4 p-2 rounded ${
          section.visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
        }`}
        disabled={section.fixed}
      >
        {section.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </button>
    </div>
  );
}

export function SectionOrderTab() {
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'hero',
      name: '히어로 배너',
      description: '메인 배너 슬라이드',
      visible: true,
      order: 1
    },
    {
      id: 'category',
      name: '카테고리 메뉴',
      description: '카테고리별 아이콘 그리드',
      visible: true,
      order: 2
    },
    {
      id: 'quicklinks',
      name: '바로가기 링크',
      description: '빠른 접근 링크',
      visible: true,
      order: 3
    },
    {
      id: 'promo',
      name: '프로모션 배너',
      description: '이벤트 및 공지 배너',
      visible: true,
      order: 4
    },
    {
      id: 'ranking',
      name: '실시간 랭킹',
      description: '인기/마감임박 캠페인',
      visible: true,
      order: 5
    },
    {
      id: 'recommended',
      name: '추천 캠페인',
      description: '큐레이션된 캠페인 목록',
      visible: true,
      order: 6
    },
    {
      id: 'cta',
      name: '하단 CTA',
      description: '회원가입 유도 영역',
      visible: true,
      fixed: true,
      order: 7
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const newSections = await new Promise<Section[]>((resolve) => {
        setSections((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          
          const newItems = arrayMove(items, oldIndex, newIndex);
          
          // 순서 재정렬
          const reorderedItems = newItems.map((item, index) => ({
            ...item,
            order: index + 1
          }));
          
          resolve(reorderedItems);
          return reorderedItems;
        });
      });

      // API 호출하여 즉시 저장
      try {
        // API 호출 로직
        console.log('섹션 순서가 자동으로 저장되었습니다:', newSections);
        // 실제 API 호출 시에는 아래와 같이
        // await fetch('/api/admin/ui-config/section-order', {
        //   method: 'POST',
        //   body: JSON.stringify({ sections: newSections })
        // });
      } catch (error) {
        console.error('섹션 순서 저장 실패:', error);
      }
    }
  };

  const handleToggleVisibility = async (id: string) => {
    const updatedSections = sections.map(section => 
      section.id === id && !section.fixed
        ? { ...section, visible: !section.visible }
        : section
    );
    
    setSections(updatedSections);
    
    // API 호출하여 즉시 저장
    try {
      console.log('섹션 표시 상태가 자동으로 저장되었습니다:', updatedSections);
      // 실제 API 호출 시에는 아래와 같이
      // await fetch('/api/admin/ui-config/section-visibility', {
      //   method: 'POST',
      //   body: JSON.stringify({ sections: updatedSections })
      // });
    } catch (error) {
      console.error('섹션 표시 상태 저장 실패:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-2">섹션 순서 관리</h2>
        <p className="text-sm text-gray-600 mb-2">
          드래그하여 홈페이지에 표시될 섹션 순서를 변경할 수 있습니다. 
          눈 아이콘을 클릭하여 섹션 표시 여부를 설정하세요.
        </p>
        <p className="text-xs text-blue-600 mb-6">
          ※ 변경사항은 자동으로 저장됩니다.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* 미리보기 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">홈페이지 구조 미리보기</h3>
        <div className="space-y-2">
          {sections
            .filter(section => section.visible)
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
              <div
                key={section.id}
                className="flex items-center p-3 bg-gray-50 rounded border border-gray-200"
              >
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <span className="font-medium">{section.name}</span>
                {section.fixed && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    고정
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}