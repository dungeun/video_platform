import React, { useState } from 'react';
import {
  NotificationType,
  NotificationRequest,
  NotificationPriority
} from '../types';

interface TestSenderProps {
  templates?: Array<{
    id: string;
    name: string;
    type: NotificationType;
    variables: string[];
  }>;
  onSend: (request: NotificationRequest) => Promise<{
    success: boolean;
    error?: string;
    messageId?: string;
  }>;
  className?: string;
}

export const TestSender: React.FC<TestSenderProps> = ({
  templates = [],
  onSend,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    type: NotificationType.EMAIL,
    recipient: {
      email: '',
      phone: '',
      userId: ''
    },
    templateId: '',
    customContent: false,
    content: {
      subject: '',
      body: ''
    },
    variables: {} as Record<string, string>,
    priority: NotificationPriority.NORMAL
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
    messageId?: string;
  } | null>(null);

  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  const handleTypeChange = (type: NotificationType) => {
    setFormData(prev => ({
      ...prev,
      type,
      templateId: '',
      variables: {}
    }));
    setResult(null);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const variables: Record<string, string> = {};
    
    if (template) {
      template.variables.forEach(v => {
        variables[v] = '';
      });
    }
    
    setFormData(prev => ({
      ...prev,
      templateId,
      variables,
      customContent: false
    }));
  };

  const handleSend = async () => {
    setSending(true);
    setResult(null);

    try {
      const request: NotificationRequest = {
        type: formData.type,
        recipient: formData.recipient,
        priority: formData.priority
      };

      if (formData.customContent) {
        request.content = formData.content;
      } else if (formData.templateId) {
        request.templateId = formData.templateId;
        request.variables = formData.variables;
      }

      const response = await onSend(request);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setSending(false);
    }
  };

  const isValidRecipient = () => {
    switch (formData.type) {
      case NotificationType.EMAIL:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipient.email);
      case NotificationType.SMS:
        return /^[0-9]{10,15}$/.test(formData.recipient.phone.replace(/\D/g, ''));
      default:
        return true;
    }
  };

  return (
    <div className={`test-sender ${className}`}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">알림 테스트 전송</h3>
          <p className="text-sm text-gray-600 mb-4">
            알림을 테스트로 전송하여 템플릿과 설정을 확인할 수 있습니다.
          </p>
        </div>

        {/* Notification Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            알림 유형
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.values(NotificationType).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData.type === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === NotificationType.EMAIL && '이메일'}
                {type === NotificationType.SMS && 'SMS'}
                {type === NotificationType.PUSH && '푸시 알림'}
                {type === NotificationType.IN_APP && '인앱 알림'}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            수신자
          </label>
          {formData.type === NotificationType.EMAIL && (
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="test@example.com"
              value={formData.recipient.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                recipient: { ...prev.recipient, email: e.target.value }
              }))}
            />
          )}
          {formData.type === NotificationType.SMS && (
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-1234-5678"
              value={formData.recipient.phone}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                recipient: { ...prev.recipient, phone: e.target.value }
              }))}
            />
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            우선순위
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              priority: e.target.value as NotificationPriority
            }))}
          >
            <option value={NotificationPriority.LOW}>낮음</option>
            <option value={NotificationPriority.NORMAL}>보통</option>
            <option value={NotificationPriority.HIGH}>높음</option>
            <option value={NotificationPriority.URGENT}>긴급</option>
          </select>
        </div>

        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            콘텐츠 유형
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2"
                checked={!formData.customContent}
                onChange={() => setFormData(prev => ({ ...prev, customContent: false }))}
              />
              <span className="text-sm">템플릿 사용</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="mr-2"
                checked={formData.customContent}
                onChange={() => setFormData(prev => ({ ...prev, customContent: true }))}
              />
              <span className="text-sm">직접 입력</span>
            </label>
          </div>
        </div>

        {/* Template Selection */}
        {!formData.customContent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              템플릿 선택
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">템플릿을 선택하세요</option>
              {templates
                .filter(t => t.type === formData.type)
                .map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
            </select>

            {/* Template Variables */}
            {selectedTemplate && selectedTemplate.variables.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">템플릿 변수</p>
                {selectedTemplate.variables.map(variable => (
                  <div key={variable} className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 w-32">
                      {`{{${variable}}}`}:
                    </label>
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      value={formData.variables[variable] || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        variables: {
                          ...prev.variables,
                          [variable]: e.target.value
                        }
                      }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Content */}
        {formData.customContent && (
          <div className="space-y-4">
            {formData.type === NotificationType.EMAIL && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.content.subject}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, subject: e.target.value }
                  }))}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                value={formData.content.body}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  content: { ...prev.content, body: e.target.value }
                }))}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-md ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <h4 className="font-medium mb-1">
              {result.success ? '전송 성공' : '전송 실패'}
            </h4>
            {result.messageId && (
              <p className="text-sm">메시지 ID: {result.messageId}</p>
            )}
            {result.error && (
              <p className="text-sm">오류: {result.error}</p>
            )}
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !isValidRecipient() || (!formData.templateId && !formData.customContent)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              sending || !isValidRecipient() || (!formData.templateId && !formData.customContent)
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sending ? '전송 중...' : '테스트 전송'}
          </button>
        </div>
      </div>
    </div>
  );
};