'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import ImageUpload from '@/components/admin/ImageUpload'
import { apiGet, apiPut } from '@/lib/api/client'

interface SystemSettings {
  general: {
    siteName: string
    siteDescription: string
    supportEmail: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    emailVerificationRequired: boolean
  }
  website: {
    logo: string
    favicon: string
    primaryColor: string
    secondaryColor: string
    footerEnabled: boolean
    footerText: string
    footerLinks: Array<{
      title: string
      url: string
      newWindow: boolean
    }>
    socialLinks: {
      facebook: string
      twitter: string
      instagram: string
      youtube: string
      linkedin: string
    }
    seo: {
      metaTitle: string
      metaDescription: string
      metaKeywords: string
      ogImage: string
    }
    analytics: {
      googleAnalyticsId: string
      facebookPixelId: string
      hotjarId: string
    }
  }
  payments: {
    platformFeeRate: number
    minimumPayout: number
    paymentMethods: string[]
    autoPayoutEnabled: boolean
    payoutSchedule: string
  }
  content: {
    maxFileSize: number
    allowedFileTypes: string[]
    contentModerationEnabled: boolean
    autoApprovalEnabled: boolean
    maxCampaignDuration: number
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    notificationDelay: number
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'LinkPick',
      siteDescription: '인플루언서 마케팅 플랫폼',
      supportEmail: 'support@linkpick.com',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true
    },
    website: {
      logo: '/logo.png',
      favicon: '/favicon.ico',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      footerEnabled: true,
      footerText: '© 2024 LinkPick. All rights reserved.',
      footerLinks: [
        { title: '이용약관', url: '/terms', newWindow: false },
        { title: '개인정보처리방침', url: '/privacy', newWindow: false },
        { title: '고객지원', url: '/support', newWindow: false },
        { title: '회사소개', url: '/about', newWindow: false }
      ],
      socialLinks: {
        facebook: 'https://facebook.com/linkpick',
        twitter: 'https://twitter.com/linkpick',
        instagram: 'https://instagram.com/linkpick',
        youtube: 'https://youtube.com/linkpick',
        linkedin: 'https://linkedin.com/company/linkpick'
      },
      seo: {
        metaTitle: 'LinkPick - 인플루언서 마케팅 플랫폼',
        metaDescription: '최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다.',
        metaKeywords: '인플루언서, 마케팅, 브랜드, 광고, 소셜미디어',
        ogImage: '/og-image.jpg'
      },
      analytics: {
        googleAnalyticsId: '',
        facebookPixelId: '',
        hotjarId: ''
      }
    },
    payments: {
      platformFeeRate: 15,
      minimumPayout: 10000,
      paymentMethods: ['bank_transfer', 'paypal'],
      autoPayoutEnabled: true,
      payoutSchedule: 'monthly'
    },
    content: {
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'png', 'gif', 'mp4', 'mov'],
      contentModerationEnabled: true,
      autoApprovalEnabled: false,
      maxCampaignDuration: 90
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notificationDelay: 5
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setInitialLoading(true)
      const response = await apiGet('/api/admin/settings')

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        setError('설정을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('설정을 불러오는데 실패했습니다.')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiPut('/api/admin/settings', settings)

      if (response.ok) {
        setSuccess('설정이 성공적으로 저장되었습니다.')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error('설정 저장에 실패했습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
            <p className="text-gray-600 mt-1">플랫폼의 전반적인 설정을 관리합니다</p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '저장중...' : '설정 저장'}
          </button>
        </div>

        {/* 알림 메시지 */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 일반 설정 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">일반 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사이트 이름
              </label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사이트 설명
              </label>
              <textarea
                rows={3}
                value={settings.general.siteDescription}
                onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객지원 이메일
              </label>
              <input
                type="email"
                value={settings.general.supportEmail}
                onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.general.maintenanceMode}
                  onChange={(e) => handleInputChange('general', 'maintenanceMode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  유지보수 모드
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.general.registrationEnabled}
                  onChange={(e) => handleInputChange('general', 'registrationEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  회원가입 허용
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.general.emailVerificationRequired}
                  onChange={(e) => handleInputChange('general', 'emailVerificationRequired', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  이메일 인증 필수
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 웹사이트 설정 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">웹사이트 설정</h2>
          
          {/* 브랜딩 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">브랜딩</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ImageUpload
                    value={settings.website.logo}
                    onChange={(value) => handleInputChange('website', 'logo', value)}
                    label="로고 이미지"
                    accept="image/*"
                    maxSize={2}
                    dimensions={{
                      height: 40,
                      aspectRatio: '16:9'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    헤더에 표시될 로고입니다. 높이 40px에 최적화됩니다.
                  </p>
                </div>
                <div>
                  <ImageUpload
                    value={settings.website.favicon}
                    onChange={(value) => handleInputChange('website', 'favicon', value)}
                    label="파비콘"
                    accept="image/*"
                    maxSize={1}
                    dimensions={{
                      width: 32,
                      height: 32
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    브라우저 탭에 표시될 아이콘입니다. 32x32px 정사각형이 권장됩니다.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메인 컬러
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={settings.website.primaryColor}
                      onChange={(e) => handleInputChange('website', 'primaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.website.primaryColor}
                      onChange={(e) => handleInputChange('website', 'primaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보조 컬러
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={settings.website.secondaryColor}
                      onChange={(e) => handleInputChange('website', 'secondaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.website.secondaryColor}
                      onChange={(e) => handleInputChange('website', 'secondaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 설정 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">푸터 설정</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.website.footerEnabled}
                    onChange={(e) => handleInputChange('website', 'footerEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    푸터 표시
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    푸터 텍스트
                  </label>
                  <input
                    type="text"
                    value={settings.website.footerText}
                    onChange={(e) => handleInputChange('website', 'footerText', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="© 2024 LinkPick. All rights reserved."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    푸터 링크
                  </label>
                  <div className="space-y-2">
                    {settings.website.footerLinks.map((link, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => {
                              const newLinks = [...settings.website.footerLinks]
                              newLinks[index].title = e.target.value
                              handleInputChange('website', 'footerLinks', newLinks)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="링크 제목"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...settings.website.footerLinks]
                              newLinks[index].url = e.target.value
                              handleInputChange('website', 'footerLinks', newLinks)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="URL"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={link.newWindow}
                              onChange={(e) => {
                                const newLinks = [...settings.website.footerLinks]
                                newLinks[index].newWindow = e.target.checked
                                handleInputChange('website', 'footerLinks', newLinks)
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-1 text-xs text-gray-700">새창</label>
                          </div>
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => {
                              const newLinks = settings.website.footerLinks.filter((_, i) => i !== index)
                              handleInputChange('website', 'footerLinks', newLinks)
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newLinks = [...settings.website.footerLinks, { title: '', url: '', newWindow: false }]
                        handleInputChange('website', 'footerLinks', newLinks)
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + 링크 추가
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 소셜 미디어 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">소셜 미디어</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.facebook}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, facebook: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://facebook.com/linkpick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.instagram}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, instagram: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://instagram.com/linkpick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.twitter}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, twitter: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://twitter.com/linkpick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.youtube}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, youtube: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/linkpick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.linkedin}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, linkedin: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/company/linkpick"
                  />
                </div>
              </div>
            </div>

            {/* SEO 설정 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">SEO 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메타 제목
                  </label>
                  <input
                    type="text"
                    value={settings.website.seo.metaTitle}
                    onChange={(e) => {
                      const newSeo = { ...settings.website.seo, metaTitle: e.target.value }
                      handleInputChange('website', 'seo', newSeo)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="LinkPick - 인플루언서 마케팅 플랫폼"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메타 설명
                  </label>
                  <textarea
                    rows={3}
                    value={settings.website.seo.metaDescription}
                    onChange={(e) => {
                      const newSeo = { ...settings.website.seo, metaDescription: e.target.value }
                      handleInputChange('website', 'seo', newSeo)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메타 키워드
                  </label>
                  <input
                    type="text"
                    value={settings.website.seo.metaKeywords}
                    onChange={(e) => {
                      const newSeo = { ...settings.website.seo, metaKeywords: e.target.value }
                      handleInputChange('website', 'seo', newSeo)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="인플루언서, 마케팅, 브랜드, 광고, 소셜미디어"
                  />
                </div>
                <div>
                  <ImageUpload
                    value={settings.website.seo.ogImage}
                    onChange={(value) => {
                      const newSeo = { ...settings.website.seo, ogImage: value }
                      handleInputChange('website', 'seo', newSeo)
                    }}
                    label="OG 이미지"
                    accept="image/*"
                    maxSize={5}
                    dimensions={{
                      width: 1200,
                      height: 630,
                      aspectRatio: '1.91:1'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    소셜 미디어에서 공유될 때 표시되는 이미지입니다. 1200x630px 권장.
                  </p>
                </div>
              </div>
            </div>

            {/* 분석 도구 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">분석 도구</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    value={settings.website.analytics.googleAnalyticsId}
                    onChange={(e) => {
                      const newAnalytics = { ...settings.website.analytics, googleAnalyticsId: e.target.value }
                      handleInputChange('website', 'analytics', newAnalytics)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="GA-XXXXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    value={settings.website.analytics.facebookPixelId}
                    onChange={(e) => {
                      const newAnalytics = { ...settings.website.analytics, facebookPixelId: e.target.value }
                      handleInputChange('website', 'analytics', newAnalytics)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotjar ID
                  </label>
                  <input
                    type="text"
                    value={settings.website.analytics.hotjarId}
                    onChange={(e) => {
                      const newAnalytics = { ...settings.website.analytics, hotjarId: e.target.value }
                      handleInputChange('website', 'analytics', newAnalytics)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234567"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 결제 설정 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 설정</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  플랫폼 수수료 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.payments.platformFeeRate}
                  onChange={(e) => handleInputChange('payments', 'platformFeeRate', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최소 출금액 (원)
                </label>
                <input
                  type="number"
                  min="1000"
                  value={settings.payments.minimumPayout}
                  onChange={(e) => handleInputChange('payments', 'minimumPayout', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정산 주기
              </label>
              <select
                value={settings.payments.payoutSchedule}
                onChange={(e) => handleInputChange('payments', 'payoutSchedule', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="weekly">주간</option>
                <option value="monthly">월간</option>
                <option value="quarterly">분기별</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.payments.autoPayoutEnabled}
                onChange={(e) => handleInputChange('payments', 'autoPayoutEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                자동 정산 활성화
              </label>
            </div>
          </div>
        </div>

        {/* 콘텐츠 설정 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">콘텐츠 설정</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 파일 크기 (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.content.maxFileSize}
                  onChange={(e) => handleInputChange('content', 'maxFileSize', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 캠페인 기간 (일)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.content.maxCampaignDuration}
                  onChange={(e) => handleInputChange('content', 'maxCampaignDuration', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                허용된 파일 형식
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {['jpg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx'].map(type => (
                  <div key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.content.allowedFileTypes.includes(type)}
                      onChange={(e) => {
                        const currentTypes = settings.content.allowedFileTypes
                        const newTypes = e.target.checked
                          ? [...currentTypes, type]
                          : currentTypes.filter(t => t !== type)
                        handleInputChange('content', 'allowedFileTypes', newTypes)
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 uppercase">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.content.contentModerationEnabled}
                  onChange={(e) => handleInputChange('content', 'contentModerationEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  콘텐츠 검토 활성화
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.content.autoApprovalEnabled}
                  onChange={(e) => handleInputChange('content', 'autoApprovalEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  자동 승인 활성화
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  이메일 알림
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  SMS 알림
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => handleInputChange('notifications', 'pushNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  푸시 알림
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                알림 지연 시간 (분)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.notifications.notificationDelay}
                onChange={(e) => handleInputChange('notifications', 'notificationDelay', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}