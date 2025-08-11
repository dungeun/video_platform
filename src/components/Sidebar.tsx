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
  
  // DB에서 불러온 설정이 있으면 사용, 없으면 기본값 사용
  const mainMenuItems = sidebar?.mainMenu?.filter(item => item.visible).sort((a, b) => a.order - b.order) || [
    { id: 'home', label: '홈', href: '/', icon: 'Home', order: 1, visible: true, section: 'main' },
    { id: 'live', label: '라이브', href: '/live', icon: 'Tv', order: 2, visible: true, section: 'main' },
    { id: 'videos', label: '동영상', href: '/videos', icon: 'Video', order: 3, visible: true, section: 'main' },
    { id: 'trending', label: '인기 영상', href: '/trending', icon: 'Fire', order: 4, visible: true, section: 'main' },
    { id: 'new', label: '신규 영상', href: '/new', icon: 'Plus', order: 5, visible: true, section: 'main' },
  ]
  
  const categoryItems = sidebar?.categoryMenu?.filter(item => item.visible).sort((a, b) => a.order - b.order) || [
    { id: 'realestate', label: '부동산', href: '/category/realestate', icon: 'Building', order: 1, visible: true, section: 'category' },
    { id: 'stock', label: '주식', href: '/category/stock', icon: 'TrendingUp', order: 2, visible: true, section: 'category' },
    { id: 'car', label: '자동차', href: '/category/car', icon: 'Car', order: 3, visible: true, section: 'category' },
    { id: 'food', label: '음식', href: '/category/food', icon: 'UtensilsCrossed', order: 4, visible: true, section: 'category' },
    { id: 'travel', label: '여행', href: '/category/travel', icon: 'Plane', order: 5, visible: true, section: 'category' },
    { id: 'game', label: '게임', href: '/category/game', icon: 'Gamepad2', order: 6, visible: true, section: 'category' },
  ]
  
  const settingsItems = sidebar?.settingsMenu?.filter(item => item.visible).sort((a, b) => a.order - b.order) || [
    { id: 'settings', label: '설정', href: '/settings', icon: 'Settings', order: 1, visible: true, section: 'settings' },
    { id: 'help', label: '도움말', href: '/help', icon: 'HelpCircle', order: 2, visible: true, section: 'settings' },
    { id: 'feedback', label: '의견 보내기', href: '/feedback', icon: 'MessageSquare', order: 3, visible: true, section: 'settings' },
  ]
  
  // 구독 채널은 나중에 사용자별 데이터로 교체 예정
  const subscribedChannels = sidebar?.subscribedChannels?.filter(item => item.visible).sort((a, b) => a.order - b.order) || [
    { id: 'channel1', name: '지창경', avatar: 'https://i.pravatar.cc/24?img=2', isLive: true, order: 1, visible: true },
    { id: 'channel2', name: '자랑맨', avatar: 'https://i.pravatar.cc/24?img=3', isLive: false, order: 2, visible: true },
    { id: 'channel3', name: '인순효그', avatar: 'https://i.pravatar.cc/24?img=4', isLive: false, order: 3, visible: true },
    { id: 'channel4', name: '주식왕', avatar: 'https://i.pravatar.cc/24?img=5', isLive: false, order: 4, visible: true },
  ]

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId)
    if (isMobile && onToggle) {
      onToggle()
    }
  }

  const SidebarContent = () => (
    <div className="sidebar-content overflow-y-auto h-full">
      {/* Main Menu Section */}
      <div className="px-4 py-4">
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
                ${activeItem === item.id ? 'bg-blue-600/20 text-white border-l-4 border-blue-500 pl-2 sm:pl-3' : ''}
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

      {/* Divider */}
      {(!isCollapsed || isMobile) && (
        <div className="h-px bg-gray-700 mx-3 my-4"></div>
      )}

      {/* Category Section */}
      {categoryItems.length > 0 && (
        <div className="px-4 py-2">
          {(!isCollapsed || isMobile) && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
              카테고리
            </p>
          )}
          {categoryItems.map((item) => {
            const IconComponent = getIcon(item.icon)
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleItemClick(item.id)}
                className={`
                  flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200
                  text-gray-300 hover:bg-gray-700 hover:text-white
                  ${activeItem === item.id ? 'bg-blue-600/20 text-white border-l-4 border-blue-500 pl-3' : ''}
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
      )}

      {/* Divider */}
      {(!isCollapsed || isMobile) && (
        <div className="h-px bg-gray-700 mx-3 my-4"></div>
      )}

      {/* Settings Section */}
      {settingsItems.length > 0 && (
        <div className="px-4 py-2">
          {settingsItems.map((item) => {
            const IconComponent = getIcon(item.icon)
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleItemClick(item.id)}
                className={`
                  flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200
                  text-gray-300 hover:bg-gray-700 hover:text-white
                  ${activeItem === item.id ? 'bg-blue-600/20 text-white border-l-4 border-blue-500 pl-3' : ''}
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
      )}

      {/* Divider */}
      {(!isCollapsed || isMobile) && subscribedChannels.length > 0 && (
        <div className="h-px bg-gray-700 mx-3 my-4"></div>
      )}

      {/* Subscribed Channels Section */}
      {subscribedChannels.length > 0 && (
        <div className="px-4 py-2">
          {(!isCollapsed || isMobile) && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
              구독 채널
            </p>
          )}
          {subscribedChannels.map((channel) => (
            <Link
              key={channel.id}
              href={`/channel/${channel.id}`}
              onClick={() => handleItemClick(channel.id)}
              className={`
                flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200
                text-gray-300 hover:bg-gray-700 hover:text-white relative
                ${activeItem === channel.id ? 'bg-blue-600/20 text-white border-l-4 border-blue-500 pl-3' : ''}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <img 
                src={channel.avatar} 
                alt={channel.name}
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
              {(!isCollapsed || isMobile) && (
                <>
                  <span className="ml-3 text-sm font-medium whitespace-nowrap">
                    {channel.name}
                  </span>
                  {channel.isLive && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </>
              )}
            </Link>
          ))}
          
          {/* More button */}
          <button
            onClick={() => handleItemClick('more')}
            className={`
              flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200
              text-gray-300 hover:bg-gray-700 hover:text-white w-full
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <ChevronDown className="text-xl flex-shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="ml-3 text-sm font-medium whitespace-nowrap">
                더보기
              </span>
            )}
          </button>
        </div>
      )}
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
