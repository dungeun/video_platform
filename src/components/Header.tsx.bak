'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ChevronDown, User as UserIcon, LogOut, Settings, Menu } from 'lucide-react'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'

interface HeaderProps {
  variant?: 'default' | 'transparent'
  onSidebarToggle?: () => void
  onMobileSidebarToggle?: () => void
}

export default function Header({ variant = 'default', onSidebarToggle, onMobileSidebarToggle }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { config, siteName, loadSettingsFromAPI } = useUIConfigStore()
  const { user, isAuthenticated, logout } = useAuth()
  
  // 기본 메뉴 설정 (config가 아직 로드되지 않았을 때 사용)
  const defaultMenus = [
    { id: '1', label: '홈', href: '/', order: 1, visible: true },
    { id: '2', label: '인기', href: '/trending', order: 2, visible: true },
    { id: '3', label: '최신', href: '/new', order: 3, visible: true },
    { id: '4', label: '랭킹', href: '/ranking', order: 4, visible: true },
    { id: '5', label: '라이브', href: '/live', order: 5, visible: true },
    { id: '6', label: '비디오', href: '/videos', order: 6, visible: true },
    { id: '7', label: '카테고리', href: '/categories', order: 7, visible: true },
    { id: '8', label: '커뮤니티', href: '/community', order: 8, visible: true },
  ]
  
  const isTransparent = variant === 'transparent'
  
  // 사용자 타입 확인
  const userType = user?.type?.toUpperCase()
  const isInfluencer = !user || userType === 'INFLUENCER' || userType === 'USER'
  const isBusiness = userType === 'BUSINESS'
  const isAdmin = userType === 'ADMIN'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    if (isTransparent) {
      window.addEventListener('scroll', handleScroll)
    }
    
    // 프로필 이미지 로드
    if (user) {
      // localStorage에서 프로필 이미지 가져오기
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setProfileImage(profile.avatar || null)
        } catch (e) {
          console.error('Failed to parse profile:', e)
        }
      }
    }
    
    // UI 설정 로드
    console.log('Header: Loading UI settings...');
    loadSettingsFromAPI()
    
    return () => {
      if (isTransparent) {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isTransparent, user])

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
  }

  const isActive = (path: string) => pathname === path


  // 사용자 타입별 대시보드 링크
  const dashboardLink = isAdmin ? '/admin' : isBusiness ? '/studio/dashboard' : '/mypage'

  return (
    <header className="bg-gray-800 border-b border-gray-700 text-white fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8 flex-1">
            {/* Sidebar Toggle Button - Desktop */}
            <button
              onClick={onSidebarToggle}
              className="hidden lg:block p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 touch-manipulation"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Mobile Hamburger Menu */}
            <button
              onClick={onMobileSidebarToggle}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200 touch-manipulation"
              aria-label="Toggle mobile sidebar"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <Link href="/" className="touch-manipulation">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {siteName}
              </h1>
            </Link>
            
            {/* 공통 메뉴 - 데스크톱에서만 표시 */}
            <nav className="hidden lg:flex items-center gap-6">
              {(config.header?.menus || defaultMenus)
                .filter(menu => menu.visible)
                .sort((a, b) => a.order - b.order)
                .map(menu => (
                  <Link 
                    key={menu.id}
                    href={menu.href} 
                    className="hover:opacity-80 transition font-medium text-white touch-manipulation"
                  >
                    {menu.label}
                  </Link>
                ))}
            </nav>
          </div>
          

          {/* 사용자 메뉴와 권한별 메뉴 */}
          <nav className="flex items-center gap-3 sm:gap-6 flex-1 justify-end">
            {/* 권한별 메뉴 - 데스크톱에서만 표시 */}
            <div className="hidden lg:flex items-center gap-4">
              {/* 관리자 전용 메뉴 */}
              {isAdmin && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/admin" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    관리자
                  </Link>
                  <Link href="/admin/users" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    사용자
                  </Link>
                  <Link href="/admin/videos" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    비디오
                  </Link>
                  <Link href="/admin/creators" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    크리에이터
                  </Link>
                  <Link href="/admin/analytics" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    분석
                  </Link>
                  <Link href="/admin/settings" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    설정
                  </Link>
                </>
              )}
              
              {/* 인플루언서 전용 메뉴 */}
              {isInfluencer && user && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/studio" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    스튜디오
                  </Link>
                  <Link href="/mypage" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    마이페이지
                  </Link>
                  <Link href="/settings" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    설정
                  </Link>
                </>
              )}
              
              {/* 업체 전용 메뉴 */}
              {isBusiness && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/studio/dashboard" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    스튜디오
                  </Link>
                  <Link href="/studio/upload" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    업로드
                  </Link>
                  <Link href="/studio/videos" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    비디오관리
                  </Link>
                  <Link href="/studio/earnings" className="hover:opacity-80 transition font-medium text-white text-sm touch-manipulation">
                    수익
                  </Link>
                </>
              )}
            </div>
            
            {isAuthenticated && user ? (
              <>
                {/* 모바일에서는 아이콘만, 데스크톱에서는 아이콘+텍스트 */}
                {/* 인플루언서가 아니고 비즈니스도 아닌 경우에만 마이 메뉴 표시 */}
                {!isInfluencer && !isBusiness && (
                  <Link 
                    href={dashboardLink} 
                    className="flex flex-col items-center gap-1 hover:opacity-80 transition touch-manipulation"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs hidden sm:inline">마이</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="flex flex-col items-center gap-1 hover:opacity-80 transition touch-manipulation">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-xs hidden sm:inline">로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:opacity-80 transition text-xs sm:text-sm text-white touch-manipulation">
                  로그인
                </Link>
                <Link href="/register" className="bg-white/20 backdrop-blur px-3 sm:px-4 py-2 rounded-full hover:bg-white/30 transition text-xs sm:text-sm text-white touch-manipulation">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}