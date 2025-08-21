'use client'

import React, { useState, useCallback } from 'react'
import { Upload } from 'tus-js-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import VideoThumbnails from './VideoThumbnails'

interface VideoUploadProps {
  onUploadComplete?: (videoData: any) => void
  maxFileSize?: number // bytes
}

export default function VideoUpload({ 
  onUploadComplete,
  maxFileSize = 10 * 1024 * 1024 * 1024 // 10GB default
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [uploadId, setUploadId] = useState<string>('')
  const [videoData, setVideoData] = useState<any>(null)
  const [processingStatus, setProcessingStatus] = useState<string>('')

  // 파일 업로드 처리
  const handleFileUpload = useCallback((file: File) => {
    if (file.size > maxFileSize) {
      alert(`파일 크기가 너무 큽니다. 최대 ${maxFileSize / (1024 * 1024 * 1024)}GB까지 업로드 가능합니다.`)
      return
    }

    // TUS localStorage 캐시 강제 정리 (localhost:3001 캐시 제거)
    try {
      console.log('🧹 Clearing TUS localStorage cache...')
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('tus::') || key.includes('localhost:3001')) {
          console.log('🗑️ Removing cached TUS key:', key)
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('⚠️ Failed to clear TUS cache:', error)
    }

    const metadata = {
      filename: file.name,
      filetype: file.type,
      title: file.name.replace(/\.[^/.]+$/, ''), // 확장자 제거
      description: '',
      category: 'general'
    }

    const upload = new Upload(file, {
      endpoint: 'https://main.one-q.xyz/api/upload/tus', // 자체 구현 TUS 서버로 변경
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: metadata,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      // localStorage 저장 비활성화 (캐시 문제 방지)
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: true,
      onError: (error) => {
        console.error('Upload failed:', error)
        setUploadStatus('업로드 실패: ' + error.message)
        setIsUploading(false)
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
        setUploadProgress(percentage)
        setUploadStatus(`업로드 중... ${percentage}%`)
      },
      onSuccess: () => {
        console.log('Upload completed successfully')
        setUploadStatus('업로드 완료! 비디오 처리 중...')
        setIsUploading(false)
        
        // 업로드 완료 후 상태 확인 시작
        if (upload.url) {
          const uploadId = upload.url.split('/').pop()!
          setUploadId(uploadId)
          startStatusPolling(uploadId)
        }
      }
    })

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('업로드 시작...')
    upload.start()

  }, [maxFileSize])

  // 업로드 상태 폴링
  const startStatusPolling = useCallback((uploadId: string) => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/upload/status/${uploadId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          switch (data.status) {
            case 'PROCESSING':
              setProcessingStatus('비디오 메타데이터 추출 중...')
              setTimeout(pollStatus, 2000)
              break
            case 'COMPLETED':
              setProcessingStatus('처리 완료!')
              setVideoData(data.video)
              if (onUploadComplete) {
                onUploadComplete(data.video)
              }
              break
            case 'FAILED':
              setProcessingStatus('처리 실패: ' + data.errorMessage)
              break
            default:
              setTimeout(pollStatus, 2000)
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
        setProcessingStatus('상태 확인 중 오류 발생')
      }
    }

    pollStatus()
  }, [onUploadComplete])

  // 파일 드롭 처리
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => file.type.startsWith('video/'))
    
    if (videoFile) {
      handleFileUpload(videoFile)
    } else {
      alert('비디오 파일만 업로드 가능합니다.')
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (videoData) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">업로드 완료</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* 비디오 정보 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  defaultValue={videoData.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  defaultValue={videoData.description}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="비디오에 대한 설명을 입력하세요..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">파일 크기:</span> {formatFileSize(videoData.fileSize)}
                </div>
                <div>
                  <span className="font-medium">재생 시간:</span> {Math.floor(videoData.duration / 60)}분 {videoData.duration % 60}초
                </div>
                <div>
                  <span className="font-medium">해상도:</span> {videoData.width} x {videoData.height}
                </div>
                <div>
                  <span className="font-medium">상태:</span> 
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                    videoData.status === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {videoData.status === 'PUBLISHED' ? '게시됨' : '처리 중'}
                  </span>
                </div>
              </div>
            </div>

            {/* 썸네일 관리 */}
            <div>
              <VideoThumbnails
                videoId={videoData.id}
                currentThumbnail={videoData.thumbnailUrl}
                editable={true}
                onThumbnailSelect={(thumbnail) => {
                  console.log('Selected thumbnail:', thumbnail)
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setVideoData(null)
                setUploadProgress(0)
                setUploadStatus('')
                setProcessingStatus('')
              }}
            >
              새 동영상 업로드
            </Button>

            <div className="flex gap-2">
              <Button variant="outline">
                임시 저장
              </Button>
              <Button>
                게시
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">동영상 업로드</h3>

        {/* 드래그 앤 드롭 영역 */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isUploading 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          {isUploading ? (
            <div className="space-y-4">
              <div className="text-blue-600">
                <svg className="w-12 h-12 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              
              <div>
                <p className="text-lg font-medium text-blue-600">{uploadStatus}</p>
                {processingStatus && (
                  <p className="text-sm text-gray-600 mt-1">{processingStatus}</p>
                )}
              </div>

              <Progress 
                value={uploadProgress} 
                className="w-full max-w-md mx-auto"
              />

              <p className="text-sm text-gray-500">
                업로드를 중단하지 마세요. 대용량 파일은 시간이 오래 걸릴 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-gray-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-700">
                  동영상 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  최대 {maxFileSize / (1024 * 1024 * 1024)}GB까지 업로드 가능<br/>
                  MP4, AVI, MOV, MKV, WebM 등 지원
                </p>
              </div>

              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file)
                  }
                }}
                className="hidden"
                id="video-upload"
              />
              
              <Button
                onClick={() => document.getElementById('video-upload')?.click()}
                className="mx-auto"
              >
                파일 선택
              </Button>
            </div>
          )}
        </div>

        {/* 업로드 팁 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">업로드 팁</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 업로드 중에는 브라우저를 닫지 마세요</li>
            <li>• 네트워크 연결이 끊어져도 업로드가 자동으로 재시작됩니다</li>
            <li>• 업로드 완료 후 자동으로 썸네일이 생성됩니다</li>
            <li>• HLS 변환으로 모든 디바이스에서 재생 가능합니다</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}