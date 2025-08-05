'use client'

import { useState } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { useAuth } from '@/hooks/useAuth'
import { 
  Settings, User, Bell, Shield, Palette, Globe, 
  Volume2, Eye, Smartphone, Monitor, Save, 
  LogOut, Trash2, Download
} from 'lucide-react'

const settingsCategories = [
  { id: 'profile', label: '프로필', icon: User },
  { id: 'notifications', label: '알림', icon: Bell },
  { id: 'privacy', label: '개인정보', icon: Shield },
  { id: 'appearance', label: '화면 설정', icon: Palette },
  { id: 'language', label: '언어', icon: Globe },
  { id: 'playback', label: '재생 설정', icon: Volume2 },
  { id: 'data', label: '데이터 관리', icon: Download }
]

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const [activeCategory, setActiveCategory] = useState('profile')
  const [settings, setSettings] = useState({
    // 프로필 설정
    displayName: user?.name || '',
    bio: '',
    website: '',
    location: '',
    
    // 알림 설정
    emailNotifications: true,
    pushNotifications: true,
    liveNotifications: true,
    commentNotifications: true,
    likeNotifications: false,
    
    // 개인정보 설정
    profileVisibility: 'public',
    showEmail: false,
    showSubscriptions: true,
    allowMessages: true,
    
    // 화면 설정
    theme: 'dark',
    autoplay: true,
    hdDefault: true,
    captions: false,
    
    // 언어 설정
    language: 'ko',
    
    // 재생 설정
    volume: 80,
    playbackSpeed: 1.0,
    autoplayNext: true,
    
    // 데이터 관리
    downloadQuality: 'hd',
    offlineDownloads: false
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = () => {
    // 설정 저장 로직
    console.log('Settings saved:', settings)
    alert('설정이 저장되었습니다!')
  }

  const renderSettingsContent = () => {
    switch (activeCategory) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">프로필 설정</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  표시 이름
                </label>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => handleSettingChange('displayName', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  위치
                </label>
                <input
                  type="text"
                  value={settings.location}
                  onChange={(e) => handleSettingChange('location', e.target.value)}
                  placeholder="예: 서울, 대한민국"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                소개
              </label>
              <textarea
                value={settings.bio}
                onChange={(e) => handleSettingChange('bio', e.target.value)}
                placeholder="자신을 소개해보세요..."
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                웹사이트
              </label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => handleSettingChange('website', e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">알림 설정</h2>
            
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: '이메일 알림', desc: '중요한 업데이트를 이메일로 받습니다' },
                { key: 'pushNotifications', label: '푸시 알림', desc: '브라우저 푸시 알림을 받습니다' },
                { key: 'liveNotifications', label: '라이브 알림', desc: '구독한 채널의 라이브 시작 시 알림' },
                { key: 'commentNotifications', label: '댓글 알림', desc: '내 영상에 댓글이 달릴 때 알림' },
                { key: 'likeNotifications', label: '좋아요 알림', desc: '내 영상에 좋아요가 눌릴 때 알림' }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">{label}</h3>
                    <p className="text-gray-400 text-sm">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key as keyof typeof settings] as boolean}
                      onChange={(e) => handleSettingChange(key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )
        
      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">개인정보 설정</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  프로필 공개 범위
                </label>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="public">공개</option>
                  <option value="followers">팔로워만</option>
                  <option value="private">비공개</option>
                </select>
              </div>
              
              <div className="space-y-4">
                {[
                  { key: 'showEmail', label: '이메일 주소 공개', desc: '다른 사용자가 내 이메일을 볼 수 있습니다' },
                  { key: 'showSubscriptions', label: '구독 목록 공개', desc: '다른 사용자가 내 구독 목록을 볼 수 있습니다' },
                  { key: 'allowMessages', label: '메시지 허용', desc: '다른 사용자가 나에게 메시지를 보낼 수 있습니다' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium">{label}</h3>
                      <p className="text-gray-400 text-sm">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[key as keyof typeof settings] as boolean}
                        onChange={(e) => handleSettingChange(key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">화면 설정</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  테마
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: '라이트', icon: '☀️' },
                    { value: 'dark', label: '다크', icon: '🌙' },
                    { value: 'auto', label: '자동', icon: '⚙️' }
                  ].map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => handleSettingChange('theme', value)}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        settings.theme === value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="text-white text-sm">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { key: 'autoplay', label: '자동 재생', desc: '영상을 자동으로 재생합니다' },
                  { key: 'hdDefault', label: 'HD 기본 설정', desc: '기본적으로 고화질로 재생합니다' },
                  { key: 'captions', label: '자막 표시', desc: '자막이 있는 영상에서 자막을 표시합니다' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium">{label}</h3>
                      <p className="text-gray-400 text-sm">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[key as keyof typeof settings] as boolean}
                        onChange={(e) => handleSettingChange(key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 'language':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">언어 설정</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                표시 언어
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        )
        
      case 'playback':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">재생 설정</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  볼륨: {settings.volume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => handleSettingChange('volume', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  재생 속도
                </label>
                <select
                  value={settings.playbackSpeed}
                  onChange={(e) => handleSettingChange('playbackSpeed', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1.0}>1.0x (기본)</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={1.75}>1.75x</option>
                  <option value={2.0}>2.0x</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">다음 영상 자동 재생</h3>
                  <p className="text-gray-400 text-sm">현재 영상이 끝나면 다음 영상을 자동으로 재생합니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoplayNext}
                    onChange={(e) => handleSettingChange('autoplayNext', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )
        
      case 'data':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">데이터 관리</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  다운로드 품질
                </label>
                <select
                  value={settings.downloadQuality}
                  onChange={(e) => handleSettingChange('downloadQuality', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="sd">SD (480p)</option>
                  <option value="hd">HD (720p)</option>
                  <option value="fhd">Full HD (1080p)</option>
                  <option value="4k">4K (2160p)</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">오프라인 다운로드</h3>
                  <p className="text-gray-400 text-sm">영상을 다운로드하여 오프라인에서 시청할 수 있습니다</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.offlineDownloads}
                    onChange={(e) => handleSettingChange('offlineDownloads', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-white font-medium mb-4">계정 관리</h3>
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    내 데이터 다운로드
                  </button>
                  <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" />
                    계정 로그아웃
                  </button>
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    계정 삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-400">설정 페이지에 접근하려면 로그인해주세요.</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">⚙️ 설정</h1>
                <p className="text-gray-400">계정과 앱 설정을 관리하세요</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 사이드바 */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-gray-800 rounded-lg p-4">
                <nav className="space-y-2">
                  {settingsCategories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          activeCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        {category.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex-1">
              <div className="bg-gray-800 rounded-lg p-6">
                {renderSettingsContent()}
                
                {/* 저장 버튼 */}
                <div className="flex justify-end mt-8 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleSaveSettings}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    설정 저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}