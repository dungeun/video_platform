'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface VideoThumbnailsProps {
  videoId: string
  currentThumbnail: string
  onThumbnailSelect?: (thumbnailPath: string) => void
  editable?: boolean
}

export default function VideoThumbnails({
  videoId,
  currentThumbnail,
  onThumbnailSelect,
  editable = false
}: VideoThumbnailsProps) {
  const [selectedThumbnail, setSelectedThumbnail] = useState(currentThumbnail)

  // 자동 생성된 썸네일 경로들
  const thumbnailPaths = [
    `/uploads/thumbnails/${videoId}_thumb_0.jpg`, // 10%
    `/uploads/thumbnails/${videoId}_thumb_1.jpg`, // 30%
    `/uploads/thumbnails/${videoId}_thumb_2.jpg`, // 50%
    `/uploads/thumbnails/${videoId}_thumb_3.jpg`, // 70%
    `/uploads/thumbnails/${videoId}_thumb_4.jpg`  // 90%
  ]

  const thumbnailLabels = ['10%', '30%', '50%', '70%', '90%']

  const handleThumbnailSelect = (thumbnailPath: string) => {
    setSelectedThumbnail(thumbnailPath)
    if (onThumbnailSelect) {
      onThumbnailSelect(thumbnailPath)
    }
  }

  if (!editable) {
    // 편집 모드가 아닐 때는 현재 썸네일만 표시
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={currentThumbnail || '/images/video-placeholder.jpg'}
          alt="Video thumbnail"
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/images/video-placeholder.jpg'
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 현재 선택된 썸네일 미리보기 */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 썸네일</h4>
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={selectedThumbnail || '/images/video-placeholder.jpg'}
            alt="Selected thumbnail"
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/images/video-placeholder.jpg'
            }}
          />
        </div>
      </Card>

      {/* 썸네일 선택 옵션들 */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          자동 생성된 썸네일 (비디오 구간별)
        </h4>
        
        <div className="grid grid-cols-5 gap-2">
          {thumbnailPaths.map((path, index) => (
            <div key={index} className="space-y-1">
              <button
                onClick={() => handleThumbnailSelect(path)}
                className={`
                  relative aspect-video w-full rounded-md overflow-hidden 
                  border-2 transition-all hover:scale-105
                  ${selectedThumbnail === path 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Image
                  src={path}
                  alt={`Thumbnail at ${thumbnailLabels[index]}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 20vw, 10vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/video-placeholder.jpg'
                  }}
                />
              </button>
              
              <p className="text-xs text-center text-gray-500">
                {thumbnailLabels[index]}
              </p>
            </div>
          ))}
        </div>

        {/* 커스텀 썸네일 업로드 옵션 */}
        <div className="mt-4 pt-4 border-t">
          <h5 className="text-sm font-medium text-gray-600 mb-2">
            커스텀 썸네일 업로드
          </h5>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // 커스텀 썸네일 업로드 로직 구현
                  console.log('Custom thumbnail selected:', file)
                  // TODO: 파일 업로드 및 썸네일 설정
                }
              }}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG 파일만 업로드 가능 (최대 5MB)
          </p>
        </div>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            // 선택된 썸네일 저장 API 호출
            console.log('Saving thumbnail:', selectedThumbnail)
          }}
          className="px-6"
        >
          썸네일 저장
        </Button>
      </div>
    </div>
  )
}