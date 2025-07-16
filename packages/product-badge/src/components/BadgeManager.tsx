import React, { useState } from 'react';
import { Badge } from './Badge';
import type { Badge as BadgeType, BadgeRule } from '../types';
import { badgePresets } from '../utils/badgePresets';

interface BadgeManagerProps {
  rules: BadgeRule[];
  onSaveRule: (rule: BadgeRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string) => void;
}

export const BadgeManager: React.FC<BadgeManagerProps> = ({
  rules,
  onSaveRule,
  onDeleteRule,
  onToggleRule
}) => {
  const [editingRule, setEditingRule] = useState<BadgeRule | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      onSaveRule(editingRule);
      setEditingRule(null);
      setShowForm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">뱃지 규칙 관리</h2>
        <button
          onClick={() => {
            setEditingRule({
              id: `rule-${Date.now()}`,
              name: '',
              type: 'new',
              conditions: [],
              badge: { text: 'NEW', color: '#ffffff', bgColor: '#ef4444' },
              priority: 10,
              isActive: true
            });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          새 규칙 추가
        </button>
      </div>

      {/* Rule List */}
      <div className="space-y-4 mb-6">
        {rules.map((rule) => (
          <div 
            key={rule.id} 
            className={`p-4 border rounded-lg ${rule.isActive ? 'border-gray-300' : 'border-gray-200 opacity-50'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge 
                  badge={{ ...rule.badge, id: rule.id, type: rule.type }}
                  size="sm"
                />
                <div>
                  <h3 className="font-medium">{rule.name}</h3>
                  <p className="text-sm text-gray-600">
                    우선순위: {rule.priority} | 조건: {rule.conditions.length}개
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleRule(rule.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    rule.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {rule.isActive ? '활성' : '비활성'}
                </button>
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setShowForm(true);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  수정
                </button>
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rule Form */}
      {showForm && editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingRule.id.startsWith('rule-') ? '새 규칙' : '규칙 수정'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Rule Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">규칙 이름</label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                {/* Badge Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">뱃지 타입</label>
                  <select
                    value={editingRule.type}
                    onChange={(e) => {
                      const type = e.target.value as BadgeType['type'];
                      const preset = badgePresets[type];
                      setEditingRule({
                        ...editingRule,
                        type,
                        badge: preset ? {
                          text: preset.text,
                          color: preset.color,
                          bgColor: preset.bgColor,
                          icon: preset.icon
                        } : editingRule.badge
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {Object.keys(badgePresets).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Badge Text */}
                <div>
                  <label className="block text-sm font-medium mb-1">뱃지 텍스트</label>
                  <input
                    type="text"
                    value={editingRule.badge.text}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      badge: { ...editingRule.badge, text: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium mb-1">우선순위</label>
                  <input
                    type="number"
                    value={editingRule.priority}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      priority: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="1"
                    max="100"
                  />
                </div>

                {/* Badge Preview */}
                <div>
                  <label className="block text-sm font-medium mb-1">미리보기</label>
                  <div className="p-4 bg-gray-100 rounded">
                    <Badge 
                      badge={{ ...editingRule.badge, id: 'preview', type: editingRule.type }}
                      size="md"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRule(null);
                    setShowForm(false);
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};