'use client'

import { useState, useEffect } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { useAuth } from '@/hooks/useAuth'
import { 
  Settings, User, Bell, Shield, Palette, Globe, 
  Volume2, Eye, Smartphone, Monitor, Save, 
  LogOut, Trash2, Download, Camera, Mail, Phone, 
  MapPin, Calendar, Key, CreditCard, Plus, X,
  Instagram, Youtube, Twitter, Facebook, Linkedin,
  AlertCircle, Upload, ArrowLeft, CheckCircle,
  Link as LinkIcon
} from 'lucide-react'

const settingsCategories = [
  { id: 'profile', label: '프로필', icon: User },
  { id: 'account', label: '계정 설정', icon: Shield },
  { id: 'payment', label: '정산 정보', icon: CreditCard },
  { id: 'security', label: '보안', icon: Key },
  { id: 'notifications', label: '알림', icon: Bell },
  { id: 'privacy', label: '개인정보', icon: Shield },
  { id: 'appearance', label: '화면 설정', icon: Palette },
  { id: 'language', label: '언어', icon: Globe },
  { id: 'playback', label: '재생 설정', icon: Volume2 },
  { id: 'data', label: '데이터 관리', icon: Download }
]

interface ProfileData {
  // 기본 정보
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | '';
  bio: string;
  avatar: string;
  
  // 인플루언서 정보
  categories: string[];
  location: string;
  languages: string[];
  
  // 소셜 미디어
  socialMedia: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    blog?: string;
    twitter?: string;
    facebook?: string;
  };
  
  // 계정 설정
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const [activeCategory, setActiveCategory] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [avatar, setProfileImage] = useState<File | null>(null)
  const [avatarPreview, setProfileImagePreview] = useState<string>('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 프로필 데이터
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '사용자',
    email: user?.email || 'user@example.com',
    phone: '010-1234-5678',
    birthDate: '1995-05-15',
    gender: '',
    bio: '안녕하세요! 비디오픽에서 활동하고 있습니다.',
    avatar: '/images/profile-default.jpg',
    categories: ['lifestyle'],
    location: '서울특별시',
    languages: ['한국어'],
    socialMedia: {
      instagram: '',
      youtube: '',
      blog: '',
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      marketing: false
    },
    privacy: {
      profilePublic: true,
      showEmail: false,
      showPhone: false
    }
  })

  // 은행 계좌 정보
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: '국민은행',
      accountNumber: '****-****-****-1234',
      accountHolder: user?.name || '사용자',
      isDefault: true
    }
  ])

  // 화면 및 기타 설정
  const [settings, setSettings] = useState({
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

  const categories = [
    { value: 'beauty', label: '뷰티' },
    { value: 'fashion', label: '패션' },
    { value: 'food', label: '음식' },
    { value: 'travel', label: '여행' },
    { value: 'tech', label: '테크' },
    { value: 'lifestyle', label: '라이프스타일' },
    { value: 'sports', label: '스포츠' },
    { value: 'entertainment', label: '엔터테인먼트' }
  ]

  const languages = [
    '한국어', '영어', '중국어', '일본어', '스페인어', '프랑스어'
  ]

  const banks = [
    '국민은행', '신한은행', '우리은행', '하나은행', 'SC제일은행',
    '농협은행', '기업은행', '카카오뱅크', '토스뱅크'
  ]

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 성공 메시지 표시
      alert('설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  }

  const handlePasswordChange = async () => {
    // 비밀번호 유효성 검사
    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setSaving(true);
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      setPasswordError('비밀번호 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      bankName: '',
      accountNumber: '',
      accountHolder: profileData.name,
      isDefault: bankAccounts.length === 0
    };
    setBankAccounts([...bankAccounts, newAccount]);
  }

  const removeBankAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter(account => account.id !== id));
  }

  const updateBankAccount = (id: string, field: keyof BankAccount, value: any) => {
    setBankAccounts(bankAccounts.map(account => 
      account.id === id ? { ...account, [field]: value } : account
    ));
  }

  const setDefaultAccount = (id: string) => {
    setBankAccounts(bankAccounts.map(account => ({
      ...account,
      isDefault: account.id === id
    })));
  }

  useEffect(() => {
    setProfileImagePreview(profileData.avatar);
  }, [])

  const renderSettingsContent = () => {
    switch (activeCategory) {
      case 'profile':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white mb-6">프로필 설정</h2>
            
            {/* 프로필 이미지 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-4">프로필 사진</label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = '/images/profile-placeholder.jpg';
                    }}
                  />
                  <label className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-sm text-gray-400">
                  <p>JPG, PNG 형식 지원</p>
                  <p>최대 5MB</p>
                </div>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">전화번호</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">생년월일</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">성별</label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">선택하지 않음</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">활동 지역</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 소개 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">소개</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="자신을 소개해주세요"
              />
              <p className="mt-1 text-sm text-gray-500">{profileData.bio.length}/500</p>
            </div>

            {/* 카테고리 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">활동 카테고리</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map(category => (
                  <label key={category.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.categories.includes(category.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfileData({
                            ...profileData,
                            categories: [...profileData.categories, category.value]
                          });
                        } else {
                          setProfileData({
                            ...profileData,
                            categories: profileData.categories.filter(c => c !== category.value)
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                    />
                    <span className="text-sm text-gray-300">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 사용 언어 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">사용 가능 언어</label>
              <div className="flex flex-wrap gap-2">
                {languages.map(language => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => {
                      if (profileData.languages.includes(language)) {
                        setProfileData({
                          ...profileData,
                          languages: profileData.languages.filter(l => l !== language)
                        });
                      } else {
                        setProfileData({
                          ...profileData,
                          languages: [...profileData.languages, language]
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      profileData.languages.includes(language)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {/* 소셜 미디어 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">소셜 미디어 계정</label>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.socialMedia.instagram || ''}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      socialMedia: { ...profileData.socialMedia, instagram: e.target.value }
                    })}
                    placeholder="인스타그램 아이디"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Youtube className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.socialMedia.youtube || ''}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      socialMedia: { ...profileData.socialMedia, youtube: e.target.value }
                    })}
                    placeholder="유튜브 채널명"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.socialMedia.blog || ''}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      socialMedia: { ...profileData.socialMedia, blog: e.target.value }
                    })}
                    placeholder="블로그 주소"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'account':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">계정 설정</h2>
            
            {/* 알림 설정 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-white">이메일 알림</p>
                    <p className="text-sm text-gray-400">캠페인 초대, 승인 등 중요한 알림을 이메일로 받습니다</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.notifications.email}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      notifications: { ...profileData.notifications, email: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-white">SMS 알림</p>
                    <p className="text-sm text-gray-400">긴급한 알림을 문자 메시지로 받습니다</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.notifications.sms}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      notifications: { ...profileData.notifications, sms: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-white">푸시 알림</p>
                    <p className="text-sm text-gray-400">앱 푸시 알림을 받습니다</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.notifications.push}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      notifications: { ...profileData.notifications, push: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-white">마케팅 정보 수신</p>
                    <p className="text-sm text-gray-400">이벤트, 프로모션 등 마케팅 정보를 받습니다</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.notifications.marketing}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      notifications: { ...profileData.notifications, marketing: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                  />
                </label>
              </div>
            </div>

            {/* 개인정보 공개 설정 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                개인정보 공개 설정
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-white">프로필 공개</p>
                    <p className="text-sm text-gray-400">다른 사용자가 내 프로필을 볼 수 있습니다</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.privacy.profilePublic}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      privacy: { ...profileData.privacy, profilePublic: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-white">이메일 공개</p>
                    <p className="text-sm text-gray-400">프로필에 이메일 주소를 표시합니다</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.privacy.showEmail}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      privacy: { ...profileData.privacy, showEmail: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-white">전화번호 공개</p>
                    <p className="text-sm text-gray-400">프로필에 전화번호를 표시합니다</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.privacy.showPhone}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      privacy: { ...profileData.privacy, showPhone: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                  />
                </label>
              </div>
            </div>
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">정산 정보</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">정산 계좌 관리</h3>
              <p className="text-sm text-gray-400">캠페인 수익금을 받을 계좌를 등록하세요</p>
            </div>

            <div className="space-y-4 mb-6">
              {bankAccounts.map((account, index) => (
                <div key={account.id} className={`border rounded-lg p-4 ${account.isDefault ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-800'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-white">계좌 {index + 1}</h4>
                      {account.isDefault && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">기본</span>
                      )}
                    </div>
                    {bankAccounts.length > 1 && (
                      <button
                        onClick={() => removeBankAccount(account.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">은행</label>
                      <select
                        value={account.bankName}
                        onChange={(e) => updateBankAccount(account.id, 'bankName', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">은행 선택</option>
                        {banks.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">계좌번호</label>
                      <input
                        type="text"
                        value={account.accountNumber}
                        onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)}
                        placeholder="계좌번호 입력"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">예금주</label>
                      <input
                        type="text"
                        value={account.accountHolder}
                        onChange={(e) => updateBankAccount(account.id, 'accountHolder', e.target.value)}
                        placeholder="예금주명"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {!account.isDefault && (
                    <button
                      onClick={() => setDefaultAccount(account.id)}
                      className="mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium"
                    >
                      기본 계좌로 설정
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addBankAccount}
              className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              계좌 추가
            </button>

            <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-medium mb-1">정산 안내</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-400/80">
                    <li>정산은 캠페인 완료 후 영업일 기준 7일 이내에 진행됩니다</li>
                    <li>사업소득세 3.3%가 원천징수됩니다</li>
                    <li>계좌 정보 변경 시 본인 인증이 필요할 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">보안</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                비밀번호 변경
              </h3>
              
              {passwordError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-600/30 rounded-lg flex items-center gap-2 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  {passwordError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">현재 비밀번호</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">최소 8자 이상, 영문/숫자/특수문자 조합</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={!currentPassword || !newPassword || !confirmPassword || saving}
                className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                비밀번호 변경
              </button>
            </div>

            <div className="border-t border-gray-700 pt-8">
              <h3 className="text-lg font-semibold text-white mb-4">로그인 활동</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">현재 세션</p>
                    <p className="text-sm text-gray-400">Chrome · Seoul, Korea · 2분 전</p>
                  </div>
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded">활성</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Safari · iPhone</p>
                    <p className="text-sm text-gray-400">Seoul, Korea · 2일 전</p>
                  </div>
                  <button className="text-sm text-red-400 hover:text-red-300">로그아웃</button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8 mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">계정 삭제</h3>
              <p className="text-sm text-gray-400 mb-4">
                계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </p>
              <button className="px-4 py-2 border border-red-600/30 text-red-400 rounded-lg hover:bg-red-900/20">
                계정 삭제
              </button>
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
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? '저장 중...' : '설정 저장'}
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