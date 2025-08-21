'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  File as FileIcon, 
  Play, 
  Pause, 
  X, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive
} from 'lucide-react'
import { useTUSUpload } from '@/hooks/useTUSUpload'
import { cn } from '@/lib/utils'
import { processVideoThumbnails, isVideoFile, isSupportedVideoFormat } from '@/lib/video-processor'

interface TUSFileUploaderProps {
  accept?: string
  maxSizeBytes?: number
  chunkSize?: number
  className?: string
  onUploadComplete?: (url: string, file: File, thumbnails?: string[]) => void
  onUploadStart?: (file: File) => void
  onUploadError?: (error: Error) => void
  onThumbnailGenerated?: (thumbnails: string[]) => void
  metadata?: Record<string, string>
  disabled?: boolean
  autoGenerateThumbnails?: boolean
}

export default function TUSFileUploader({
  accept = 'video/*',
  maxSizeBytes = 2 * 1024 * 1024 * 1024, // 2GB
  chunkSize = 5 * 1024 * 1024, // 5MB
  className,
  onUploadComplete,
  onUploadStart,
  onUploadError,
  onThumbnailGenerated,
  metadata = {},
  disabled = false,
  autoGenerateThumbnails = true
}: TUSFileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [isProcessingThumbnails, setIsProcessingThumbnails] = useState(false)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    isUploading,
    progress,
    error,
    uploadedBytes,
    totalBytes,
    uploadUrl,
    canResume,
    isPaused,
    uploadInfo,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    resetState
  } = useTUSUpload({
    chunkSize,
    metadata,
    onProgress: (uploaded, total) => {
      // 진행률 업데이트는 자동으로 처리됨
    },
    onSuccess: async (url) => {
      if (selectedFile) {
        try {
          let generatedThumbnails: string[] = []
          
          console.log('🔍 썸네일 생성 조건 확인:', {
            autoGenerateThumbnails,
            isVideo: isVideoFile(selectedFile),
            isSupported: isSupportedVideoFormat(selectedFile),
            fileName: selectedFile.name,
            fileType: selectedFile.type
          })
          
          // 비디오 파일이고 자동 썸네일 생성이 활성화된 경우
          if (autoGenerateThumbnails && isVideoFile(selectedFile) && isSupportedVideoFormat(selectedFile)) {
            setIsProcessingThumbnails(true)
            
            try {
              // 비디오 ID를 URL에서 추출 (TUS 업로드 URL 형식에 따라 조정 필요)
              const videoId = extractVideoIdFromUrl(url) || generateTempVideoId()
              
              console.log('🎬 자동 썸네일 생성 시작:', { videoId, fileName: selectedFile.name })
              
              // 토큰 확인
              const token = localStorage.getItem('accessToken') || 
                            document.cookie.split('; ')
                              .find(row => row.startsWith('auth-token='))
                              ?.split('=')[1] ||
                            document.cookie.split('; ')
                              .find(row => row.startsWith('accessToken='))
                              ?.split('=')[1]
              
              if (!token) {
                console.warn('⚠️ 인증 토큰이 없습니다. 썸네일 업로드를 건너뜁니다.')
                // 토큰이 없어도 업로드 완료 콜백은 호출해야 함
                onUploadComplete?.(url, selectedFile, [])
                return
              }
              
              const result = await processVideoThumbnails(selectedFile, videoId, {
                updateMetadata: false  // TUS 업로드 시점에는 비디오가 DB에 없으므로 false
              })
              generatedThumbnails = result.thumbnails
              setThumbnails(generatedThumbnails)
              
              console.log('✅ 썸네일 생성 완료:', generatedThumbnails)
              onThumbnailGenerated?.(generatedThumbnails)
            } catch (thumbnailError) {
              console.warn('⚠️ 썸네일 생성 실패:', thumbnailError)
              
              // 구체적인 에러 정보 표시
              if (thumbnailError instanceof Error) {
                if (thumbnailError.message.includes('로그인') || thumbnailError.message.includes('토큰')) {
                  console.warn('⚠️ 인증 에러: 로그인 상태를 확인해주세요')
                } else if (thumbnailError.message.includes('업로드')) {
                  console.warn('⚠️ 업로드 에러: 네트워크 연결을 확인해주세요')
                } else {
                  console.warn('⚠️ 썸네일 처리 에러:', thumbnailError.message)
                }
              }
              
              // 썸네일 생성 실패는 업로드 자체를 실패로 처리하지 않음
            } finally {
              setIsProcessingThumbnails(false)
            }
          }
          
          onUploadComplete?.(url, selectedFile, generatedThumbnails)
        } catch (error) {
          console.error('업로드 후처리 오류:', error)
          onUploadComplete?.(url, selectedFile)
        }
      }
    },
    onError: (err) => {
      onUploadError?.(err)
    }
  })

  // 헬퍼 함수들
  const extractVideoIdFromUrl = (url: string): string | null => {
    // TUS 업로드 URL에서 비디오 ID 추출
    // 예: /api/upload/tus/abc123def -> abc123def
    const match = url.match(/\/([a-zA-Z0-9-_]+)$/)
    return match ? match[1] : null
  }

  const generateTempVideoId = (): string => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // 파일 크기 검증
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024))
      onUploadError?.(new Error(`파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다`))
      return
    }

    // 파일 타입 검증 (accept 속성 활용)
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          const [category] = type.split('/')
          return file.type.startsWith(category)
        }
        return file.type === type
      })

      if (!isValidType) {
        onUploadError?.(new Error('지원하지 않는 파일 형식입니다'))
        return
      }
    }

    setSelectedFile(file)
    resetState()
    onUploadStart?.(file)
  }, [maxSizeBytes, accept, onUploadError, onUploadStart, resetState])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled, handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  const handleUploadStart = () => {
    if (selectedFile) {
      startUpload(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setThumbnails([])
    setIsProcessingThumbnails(false)
    resetState()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-5 w-5 text-destructive" />
    if (uploadUrl) return <CheckCircle2 className="h-5 w-5 text-green-500" />
    if (isPaused) return <Pause className="h-5 w-5 text-yellow-500" />
    if (isUploading) return <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    return <FileIcon className="h-5 w-5 text-muted-foreground" />
  }

  const getStatusText = () => {
    if (error) return '업로드 실패'
    if (isProcessingThumbnails) return '썸네일 생성 중'
    if (uploadUrl) return '업로드 완료'
    if (isPaused) return '일시 정지'
    if (isUploading) return '업로드 중'
    return '업로드 대기'
  }

  if (uploadUrl) {
    return (
      <Card className={cn("p-6 bg-gray-800 border-gray-700", className)}>
        <CardContent className="p-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-medium text-green-400">업로드 완료!</h3>
                <p className="text-sm text-gray-400">
                  {selectedFile?.name}
                </p>
                {thumbnails.length > 0 && (
                  <p className="text-xs text-green-400">
                    썸네일 {thumbnails.length}개 자동 생성됨
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
              onClick={handleRemoveFile}
              size="sm"
            >
              새 파일 선택
            </Button>
          </div>
          
          {/* 생성된 썸네일 미리보기 */}
          {thumbnails.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-200">생성된 썸네일</h4>
              <div className="flex gap-2 overflow-x-auto">
                {thumbnails.map((thumbnail, index) => (
                  <div key={index} className="flex-shrink-0">
                    <img
                      src={thumbnail}
                      alt={`썸네일 ${index + 1}`}
                      className="w-20 h-12 object-cover rounded border"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 파일 선택 영역 */}
      {!selectedFile && (
        <Card
          className={cn(
            "border-2 border-dashed p-8 text-center transition-colors bg-gray-800 border-gray-600",
            dragOver && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="p-0">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled}
            />
            
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">
                  파일을 드래그하여 업로드하거나
                </h3>
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  파일 선택
                </Button>
              </div>
              
              <p className="text-sm text-gray-400">
                최대 크기: {Math.round(maxSizeBytes / (1024 * 1024))}MB
                <br />
                지원 형식: {accept === 'video/*' ? '비디오 파일' : accept}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 선택된 파일 정보 */}
      {selectedFile && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-4">
            {/* 파일 기본 정보 */}
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-white">{selectedFile.name}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center">
                    <HardDrive className="h-3 w-3 mr-1" />
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {getStatusText()}
                  </span>
                </div>
              </div>
              
              {!isUploading && !uploadUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 진행률 표시 */}
            {(isUploading || isPaused || error || isProcessingThumbnails) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>
                    {isProcessingThumbnails ? '썸네일 생성 중...' : uploadInfo.formattedProgress}
                  </span>
                  <span>{uploadInfo.formattedSize}</span>
                </div>
                
                <Progress 
                  value={isProcessingThumbnails ? 100 : progress} 
                  className="h-2" 
                />
                
                {isUploading && !isProcessingThumbnails && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{uploadInfo.formattedSpeed}</span>
                    <span>남은 시간: {uploadInfo.estimatedTimeRemaining}</span>
                  </div>
                )}
                
                {isProcessingThumbnails && (
                  <div className="text-xs text-blue-400 flex items-center">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    비디오에서 썸네일을 자동 생성하고 있습니다...
                  </div>
                )}
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 컨트롤 버튼 */}
            <div className="flex justify-between">
              <div className="flex space-x-2">
                {!isUploading && !isPaused && !uploadUrl && !isProcessingThumbnails && (
                  <Button onClick={handleUploadStart} disabled={disabled}>
                    <Play className="h-4 w-4 mr-2" />
                    업로드 시작
                  </Button>
                )}
                
                {isUploading && !isProcessingThumbnails && (
                  <Button variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700" onClick={pauseUpload}>
                    <Pause className="h-4 w-4 mr-2" />
                    일시정지
                  </Button>
                )}
                
                {isPaused && canResume && !isProcessingThumbnails && (
                  <Button onClick={resumeUpload}>
                    <Play className="h-4 w-4 mr-2" />
                    재개
                  </Button>
                )}
                
                {error && !isProcessingThumbnails && (
                  <Button variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700" onClick={retryUpload}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    재시도
                  </Button>
                )}
                
                {isProcessingThumbnails && (
                  <Button variant="outline" className="border-gray-600 text-gray-400" disabled>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    처리 중
                  </Button>
                )}
              </div>
              
              {(isUploading || isPaused) && !isProcessingThumbnails && (
                <Button variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700" onClick={cancelUpload}>
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
              )}
            </div>

            {/* TUS 업로드 정보 */}
            {(isUploading || isPaused || isProcessingThumbnails) && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  {isProcessingThumbnails 
                    ? '비디오 분석 중 • 자동 썸네일 생성 • 메타데이터 추출'
                    : '청크 기반 업로드 • 네트워크 오류 시 자동 재개 • 일시정지/재개 지원'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}