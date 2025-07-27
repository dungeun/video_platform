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
  const [searchTerm, setSearchTerm] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
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
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    
    // 프로필 이미지 로드
    if (currentUser) {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/campaigns?search=${encodeURIComponent(searchTerm)}`)
    }
  }

  // 사용자 타입별 대시보드 링크
  const dashboardLink = isAdmin ? '/admin' : isBusiness ? '/business/dashboard' : '/mypage'

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 flex-1">
            <Link href="/">
              <h1 className="text-3xl font-black text-white">
                {config.header.logo.text}
              </h1>
            </Link>
            
            {/* 공통 메뉴 */}
            <nav className="hidden lg:flex items-center gap-6">
              {config.header.menus
                .filter(menu => menu.visible)
                .sort((a, b) => a.order - b.order)
                .map(menu => (
                  <Link 
                    key={menu.id}
                    href={menu.href} 
                    className="hover:opacity-80 transition font-medium text-white"
                  >
                    {menu.label}
                  </Link>
                ))}
            </nav>
          </div>
          
          {/* 검색바 - 가운데 정렬 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 pr-10 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 transition text-sm"
              />
              <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* 사용자 메뉴와 권한별 메뉴 */}
          <nav className="flex items-center gap-6 flex-1 justify-end">
            {/* 권한별 메뉴 - 로그인 전에도 노출 */}
            <div className="hidden lg:flex items-center gap-4">
              {/* 관리자 전용 메뉴 */}
              {isAdmin && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/admin/users" className="hover:opacity-80 transition font-medium text-white text-sm">
                    사용자 관리
                  </Link>
                  <Link href="/admin/campaigns" className="hover:opacity-80 transition font-medium text-white text-sm">
                    캠페인 관리
                  </Link>
                </>
              )}
              
              {/* 인플루언서 전용 메뉴 */}
              {isInfluencer && user && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/mypage" className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs">마이페이지</span>
                  </Link>
                </>
              )}
              
              {/* 업체 전용 메뉴 */}
              {isBusiness && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/business/dashboard" className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-xs">대시보드</span>
                  </Link>
                </>
              )}
            </div>
            
            {user ? (
              <>
                {/* 인플루언서가 아니고 비즈니스도 아닌 경우에만 마이 메뉴 표시 */}
                {!isInfluencer && !isBusiness && (
                  <Link 
                    href={dashboardLink} 
                    className="flex flex-col items-center gap-1 hover:opacity-80 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs">마이</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-xs">로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:opacity-80 transition text-sm text-white">
                  로그인
                </Link>
                <Link href="/register" className="bg-white/20 backdrop-blur px-4 py-2 rounded-full hover:bg-white/30 transition text-sm text-white">
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