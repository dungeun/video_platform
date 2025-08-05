'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CampaignsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect campaigns to categories for video platform
    router.replace('/categories')
  }, [router])
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>카테고리 페이지로 이동 중...</p>
      </div>
    </div>
  )
}
