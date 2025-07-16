import React, { useState, useEffect } from 'react';
import {
  NotificationPreferences as INotificationPreferences,
  NotificationType,
  ChannelPreference
} from '../types';

interface NotificationPreferencesProps {
  userId: string;
  preferences?: INotificationPreferences;
  categories?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  onSave: (preferences: INotificationPreferences) => Promise<void>;
  className?: string;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  preferences: initialPreferences,
  categories = [],
  onSave,
  className = ''
}) => {
  const [preferences, setPreferences] = useState<INotificationPreferences>(
    initialPreferences || {
      userId,
      channels: {
        email: { enabled: true, categories: {} },
        sms: { enabled: true, categories: {} },
        push: { enabled: true, categories: {} },
        inApp: { enabled: true, categories: {} }
      },
      quiet: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'Asia/Seoul'
      },
      locale: 'ko',
      timezone: 'Asia/Seoul'
    }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChannelToggle = (channel: keyof typeof preferences.channels) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          enabled: !prev.channels[channel].enabled
        }
      }
    }));
  };

  const handleCategoryToggle = (
    channel: keyof typeof preferences.channels,
    categoryId: string
  ) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          categories: {
            ...prev.channels[channel].categories,
            [categoryId]: !prev.channels[channel].categories[categoryId]
          }
        }
      }
    }));
  };

  const handleQuietHoursToggle = () => {
    setPreferences(prev => ({
      ...prev,
      quiet: {
        ...prev.quiet,
        enabled: !prev.quiet.enabled
      }
    }));
  };

  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    setPreferences(prev => ({
      ...prev,
      quiet: {
        ...prev.quiet,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      await onSave(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const channels = [
    { key: 'email', label: '이메일', icon: '✉️' },
    { key: 'sms', label: 'SMS', icon: '💬' },
    { key: 'push', label: '푸시 알림', icon: '🔔' },
    { key: 'inApp', label: '인앱 알림', icon: '📱' }
  ];

  return (
    <div className={`notification-preferences ${className}`}>
      <div className="space-y-6">
        {/* Channel Preferences */}
        <div>
          <h3 className="text-lg font-semibold mb-4">알림 채널 설정</h3>
          <div className="space-y-4">
            {channels.map(channel => (
              <div key={channel.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{channel.icon}</span>
                    <span className="font-medium">{channel.label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.channels[channel.key as keyof typeof preferences.channels].enabled}
                      onChange={() => handleChannelToggle(channel.key as keyof typeof preferences.channels)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Category preferences */}
                {preferences.channels[channel.key as keyof typeof preferences.channels].enabled && categories.length > 0 && (
                  <div className="mt-3 pl-4 space-y-2">
                    <p className="text-sm text-gray-600 mb-2">알림 카테고리:</p>
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-blue-600 focus:ring-blue-500"
                          checked={preferences.channels[channel.key as keyof typeof preferences.channels].categories[category.id] !== false}
                          onChange={() => handleCategoryToggle(channel.key as keyof typeof preferences.channels, category.id)}
                        />
                        <span className="text-sm">{category.name}</span>
                        {category.description && (
                          <span className="text-xs text-gray-500">({category.description})</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">방해 금지 시간</h3>
              <p className="text-sm text-gray-600 mt-1">
                설정된 시간에는 알림을 받지 않습니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.quiet.enabled}
                onChange={handleQuietHoursToggle}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.quiet.enabled && (
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작 시간
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={preferences.quiet.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료 시간
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={preferences.quiet.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          {saved && (
            <span className="text-green-600 flex items-center">
              ✓ 저장되었습니다
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              saving
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};