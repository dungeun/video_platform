'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Home, 
  Tv, 
  Video, 
  TrendingUp as Fire, 
  Plus,
  Building,
  TrendingUp,
  Car,
  UtensilsCrossed,
  Plane,
  Gamepad2,
  Settings,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  Menu
} from 'lucide-react'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  isMobile?: boolean
  isOpen?: boolean
}

export default function Sidebar({ isCollapsed = false, onToggle, isMobile = false, isOpen = false }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('home')
  const { config, loadSettingsFromAPI } = useUIConfigStore()

  useEffect(() => {
    loadSettingsFromAPI()
  }, [])

  // Icon mapping for dynamic icon names
  const iconMap: { [key: string]: any } = {
    Home,
    Tv,
    Video,
    Fire,
    Plus,
    Building,
    TrendingUp,
    Car,
    UtensilsCrossed,
    Plane,
    Gamepad2,
    Settings,
    HelpCircle,
    MessageSquare,
  }

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Home
  }

  const { sidebar } = config
  
  // DB에서 불러온 설정이 있으면 사용, 없으면 기본값 사용 - 핵심 메뉴만 유지
  const mainMenuItems = sidebar?.mainMenu?.filter(item => item.visible).sort((a, b) => a.order - b.order) || [
    { id: 'home', label: '홈', href: '/', icon: 'Home', order: 1, visible: true, section: 'main' },
    { id: 'videos', label: '동영상', href: '/videos', icon: 'Video', order: 2, visible: true, section: 'main' },
    { id: 'live', label: '라이브', href: '/live', icon: 'Tv', order: 3, visible: true, section: 'main' },
    { id: 'trending', label: '인기', href: '/trending', icon: 'Fire', order: 4, visible: true, section: 'main' },
  ]
  
  // 카테고리는 주요 3개만 유지
  const categoryItems = sidebar?.categoryMenu?.filter(item => item.visible).sort((a, b) => a.order - b.order) || [
    { id: 'realestate', label: '부동산', href: '/category/realestate', icon: 'Building', order: 1, visible: true, section: 'category' },
    { id: 'stock', label: '주식', href: '/category/stock', icon: 'TrendingUp', order: 2, visible: true, section: 'category' },
    { id: 'car', label: '자동차', href: '/category/car', icon: 'Car', order: 3, visible: true, section: 'category' },
  ]
  
  // 설정 메뉴는 설정만 유지
  const settingsItems = sidebar?.settingsMenu?.filter(item => item.visible).sort((a, b) => a.order - b.order) || [
    { id: 'settings', label: '설정', href: '/settings', icon: 'Settings', order: 1, visible: true, section: 'settings' },
  ]
  
  // 구독 채널 섹션 제거

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId)
    if (isMobile && onToggle) {
      onToggle()
    }
  }

  const SidebarContent = () => (
    <div className="sidebar-content overflow-y-auto h-full">
      {/* 통합된 메뉴 섹션 - 구분선 없이 모든 메뉴를 하나로 */}
      <div className="px-4 py-4">
        {/* Main Menu Items */}
        {mainMenuItems.map((item) => {
          const IconComponent = getIcon(item.icon)
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleItemClick(item.id)}
              className={`
                flex items-center px-3 sm:px-4 py-3 mb-1 rounded-lg transition-all duration-200
                text-gray-300 hover:bg-gray-700 hover:text-white touch-manipulation
                ${activeItem === item.id ? 'bg-blue-600/20 text-white' : ''}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <IconComponent className="text-xl flex-shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}

        {/* Category Items - 구분 없이 바로 연결 */}
        {categoryItems.map((item) => {
          const IconComponent = getIcon(item.icon)
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleItemClick(item.id)}
              className={`
                flex items-center px-3 sm:px-4 py-3 mb-1 rounded-lg transition-all duration-200
                text-gray-300 hover:bg-gray-700 hover:text-white touch-manipulation
                ${activeItem === item.id ? 'bg-blue-600/20 text-white' : ''}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <IconComponent className="text-xl flex-shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}

        {/* Settings Items - 맨 아래에 간단히 */}
        {settingsItems.map((item) => {
          const IconComponent = getIcon(item.icon)
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleItemClick(item.id)}
              className={`
                flex items-center px-3 sm:px-4 py-3 mb-1 rounded-lg transition-all duration-200
                text-gray-300 hover:bg-gray-700 hover:text-white touch-manipulation
                ${activeItem === item.id ? 'bg-blue-600/20 text-white' : ''}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <IconComponent className="text-xl flex-shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )

  // Mobile overlay
  if (isMobile && isOpen) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
        {/* Mobile Sidebar */}
        <aside className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-gray-800 border-r border-gray-700 z-50 lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold text-lg">메뉴</h2>
            <button 
              onClick={onToggle} 
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 touch-manipulation"
              aria-label="Close menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <SidebarContent />
        </aside>
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside 
      className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-800 border-r border-gray-700 
        transition-all duration-300 ease-in-out z-30 hidden lg:block
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      <SidebarContent />
    </aside>
  )
}
