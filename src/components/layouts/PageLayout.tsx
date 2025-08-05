'use client'

import { ReactNode, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'

interface PageLayoutProps {
  children: ReactNode
  headerVariant?: 'default' | 'transparent'
  showFooter?: boolean
  showSidebar?: boolean
}

export default function PageLayout({ 
  children, 
  headerVariant = 'default',
  showFooter = true,
  showSidebar = true
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header 
        variant={headerVariant} 
        onSidebarToggle={handleSidebarToggle}
        onMobileSidebarToggle={handleMobileSidebarToggle}
      />
      
      <div className="flex flex-1">
        {showSidebar && (
          <>
            {/* Desktop Sidebar */}
            <Sidebar 
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
              isMobile={false}
            />
            {/* Mobile Sidebar */}
            <Sidebar 
              isCollapsed={false}
              onToggle={handleMobileSidebarToggle}
              isMobile={true}
              isOpen={isMobileSidebarOpen}
            />
          </>
        )}
        
        <main 
          className={`
            flex-1 transition-all duration-300 ease-in-out pt-16
            ${showSidebar ? 'lg:ml-60 lg:w-[calc(100%-15rem)]' : ''}
            ${showSidebar && isSidebarCollapsed ? 'lg:ml-16 lg:w-[calc(100%-4rem)]' : ''}
          `}
        >
          {children}
        </main>
      </div>
      
      {showFooter && <Footer />}
    </div>
  )
}