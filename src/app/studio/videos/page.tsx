import React from 'react'
import { Metadata } from 'next'
import StudioVideoManagement from '@/components/studio/StudioVideoManagement'

export const metadata: Metadata = {
  title: '동영상 관리 | 스튜디오',
  description: '동영상 업로드, 편집 및 관리'
}

export default function StudioVideosPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">동영상 관리</h1>
        <p className="text-gray-600 mt-1">
          동영상을 업로드하고 편집하세요. 자동으로 썸네일이 생성되며 모든 디바이스에서 재생 가능합니다.
        </p>
      </div>

      <StudioVideoManagement />
    </div>
  )
}