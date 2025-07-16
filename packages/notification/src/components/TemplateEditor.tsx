import React, { useState, useEffect } from 'react';
import {
  NotificationTemplate,
  NotificationType,
  TemplateVariable
} from '../types';

interface TemplateEditorProps {
  template?: NotificationTemplate;
  onSave: (template: Partial<NotificationTemplate>) => Promise<void>;
  onValidate?: (content: string) => { valid: boolean; error?: string; variables?: string[] };
  className?: string;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onValidate,
  className = ''
}) => {
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>({
    name: '',
    type: NotificationType.EMAIL,
    subject: '',
    content: '',
    language: 'ko',
    variables: [],
    ...template
  });
  const [preview, setPreview] = useState('');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const languages = [
    { code: 'ko', name: '한국어' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' }
  ];

  const variableExamples: Record<string, any> = {
    userName: '홍길동',
    userEmail: 'user@example.com',
    orderNumber: 'ORD-2024-0001',
    amount: 50000,
    date: new Date().toISOString(),
    productName: '샘플 상품',
    companyName: '우리 회사'
  };

  useEffect(() => {
    if (formData.content) {
      const variables = extractVariables(formData.content);
      setFormData(prev => ({ ...prev, variables }));
      
      // Set default preview variables
      const defaultVars: Record<string, string> = {};
      variables.forEach(v => {
        defaultVars[v] = variableExamples[v] || `{{${v}}}`;
      });
      setPreviewVariables(defaultVars);
    }
  }, [formData.content]);

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{[\s]*([a-zA-Z_$][a-zA-Z0-9_$\.]*)[\s]*\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    
    if (onValidate) {
      const validation = onValidate(content);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, content: validation.error || 'Invalid template' }));
      } else {
        setErrors(prev => ({ ...prev, content: '' }));
      }
    }
  };

  const generatePreview = () => {
    let previewContent = formData.content || '';
    
    Object.entries(previewVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      previewContent = previewContent.replace(regex, value);
    });
    
    setPreview(previewContent);
    setShowPreview(true);
  };

  const handleSave = async () => {
    // Validate
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = '템플릿 이름을 입력하세요';
    }
    if (!formData.content) {
      newErrors.content = '템플릿 내용을 입력하세요';
    }
    if (formData.type === NotificationType.EMAIL && !formData.subject) {
      newErrors.subject = '이메일 제목을 입력하세요';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`template-editor ${className}`}>
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              템플릿 이름 *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="예: 주문 확인 이메일"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              알림 유형 *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                type: e.target.value as NotificationType 
              }))}
            >
              <option value={NotificationType.EMAIL}>이메일</option>
              <option value={NotificationType.SMS}>SMS</option>
              <option value={NotificationType.PUSH}>푸시 알림</option>
              <option value={NotificationType.IN_APP}>인앱 알림</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            언어
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.language}
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Email Subject */}
        {formData.type === NotificationType.EMAIL && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 제목 *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="예: {{companyName}} - 주문 확인 (주문번호: {{orderNumber}})"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>
        )}

        {/* Template Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            템플릿 내용 *
          </label>
          <textarea
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={10}
            value={formData.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={`안녕하세요 {{userName}}님,

주문해 주셔서 감사합니다. 
주문번호: {{orderNumber}}
결제금액: {{currency amount "KRW" "ko-KR"}}

감사합니다.`}
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content}</p>
          )}
        </div>

        {/* Variables */}
        {formData.variables && formData.variables.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              사용된 변수 ({formData.variables.length}개)
            </h4>
            <div className="flex flex-wrap gap-2">
              {formData.variables.map(variable => (
                <span
                  key={variable}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                >
                  {`{{${variable}}}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preview Section */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">미리보기</h4>
            <button
              type="button"
              onClick={generatePreview}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            >
              미리보기 생성
            </button>
          </div>

          {showPreview && formData.variables && formData.variables.length > 0 && (
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  미리보기 변수 값 설정
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {formData.variables.map(variable => (
                    <div key={variable} className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600 w-32">
                        {`{{${variable}}}`}:
                      </label>
                      <input
                        type="text"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        value={previewVariables[variable] || ''}
                        onChange={(e) => setPreviewVariables(prev => ({
                          ...prev,
                          [variable]: e.target.value
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">결과</h5>
                {formData.type === NotificationType.EMAIL && formData.subject && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">제목: </span>
                    <span className="font-medium">{formData.subject}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm">{preview}</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              saving
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? '저장 중...' : '템플릿 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};