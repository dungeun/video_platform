'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'
import { ChevronDown, User as UserIcon, LogOut, Settings } from 'lucide-react'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'

interface HeaderProps {
  variant?: 'default' | 'transparent'
}

export default function Header({ variant = 'default' }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { config, loadSettingsFromAPI } = useUIConfigStore()
  
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
    
    // 로그인 상태 확인
    setUser(AuthService.getCurrentUser())
    
    // UI 설정 로드
    loadSettingsFromAPI()
    
    return () => {
      if (isTransparent) {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isTransparent])

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
    AuthService.logout()
    setUser(null)
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  const headerClasses = isTransparent 
    ? `fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`
    : 'bg-white border-b shadow-sm'

  const logoClasses = isTransparent
    ? scrolled 
      ? 'text-indigo-600'
      : 'text-white'
    : 'text-indigo-600'

  const linkClasses = (active = false) => {
    if (isTransparent) {
      return `font-medium transition-colors ${
        active 
          ? scrolled ? 'text-indigo-600' : 'text-indigo-300'
          : scrolled 
            ? 'text-gray-700 hover:text-indigo-600' 
            : 'text-white/90 hover:text-white'
      }`
    }
    return `font-medium transition-colors ${
      active ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
    }`
  }

  const textClasses = isTransparent
    ? scrolled ? 'text-gray-700' : 'text-white/90'
    : 'text-gray-700'

  // 사용자 타입별 대시보드 링크
  const dashboardLink = isAdmin ? '/admin' : isBusiness ? '/business/dashboard' : '/mypage'

  return (
    <header className={headerClasses}>
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <h1 className={`text-2xl font-bold ${logoClasses}`}>
                {config.header.logo.text}
              </h1>
            </Link>
            
            {/* 공통 메뉴 - UI Config에서 가져옴 */}
            <div className="hidden lg:flex items-center space-x-6">
              {config.header.menus
                .filter(menu => menu.visible)
                .sort((a, b) => a.order - b.order)
                .map(menu => (
                  <Link 
                    key={menu.id}
                    href={menu.href} 
                    className={linkClasses(isActive(menu.href))}
                  >
                    {menu.label}
                  </Link>
                ))}
              
              {/* 관리자 전용 메뉴 */}
              {isAdmin && (
                <>
                  <div className={`h-4 w-px ${isTransparent && !scrolled ? 'bg-white/30' : 'bg-gray-300'}`} />
                  <Link href="/admin/users" className={linkClasses(isActive('/admin/users'))}>
                    사용자 관리
                  </Link>
                  <Link href="/admin/campaigns" className={linkClasses(isActive('/admin/campaigns'))}>
                    캠페인 관리
                  </Link>
                </>
              )}
              
              {/* 업체 전용 메뉴 */}
              {isBusiness && (
                <>
                  <div className={`h-4 w-px ${isTransparent && !scrolled ? 'bg-white/30' : 'bg-gray-300'}`} />
                  <Link href="/business/campaigns" className={linkClasses(isActive('/business/campaigns'))}>
                    내 캠페인
                  </Link>
                  <Link href="/business/applications" className={linkClasses(isActive('/business/applications'))}>
                    지원자 관리
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-2 hover:opacity-80 transition-opacity ${textClasses}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium hidden sm:block">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* 드롭다운 메뉴 */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border overflow-hidden">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          관리자
                        </span>
                      )}
                      {isBusiness && (
                        <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          비즈니스
                        </span>
                      )}
                    </div>
                    
                    <div className="py-1">
                      <Link
                        href={dashboardLink}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        {isAdmin ? '관리자 대시보드' : isBusiness ? '대시보드' : '마이페이지'}
                      </Link>
                      
                      <Link
                        href="/mypage?tab=settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        프로필 설정
                      </Link>
                    </div>
                    
                    <div className="border-t">
                      <button
                        onClick={() => {
                          handleLogout()
                          setShowDropdown(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className={linkClasses()}>
                  로그인
                </Link>
                <Link 
                  href="/register" 
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}