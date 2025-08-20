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

interface TUSFileUploaderProps {
  accept?: string
  maxSizeBytes?: number
  chunkSize?: number
  className?: string
  onUploadComplete?: (url: string, file: File) => void
  onUploadStart?: (file: File) => void
  onUploadError?: (error: Error) => void
  metadata?: Record<string, string>
  disabled?: boolean
}

export default function TUSFileUploader({
  accept = 'video/*',
  maxSizeBytes = 2 * 1024 * 1024 * 1024, // 2GB
  chunkSize = 5 * 1024 * 1024, // 5MB
  className,
  onUploadComplete,
  onUploadStart,
  onUploadError,
  metadata = {},
  disabled = false
}: TUSFileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
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
    onSuccess: (url) => {
      if (selectedFile && onUploadComplete) {
        onUploadComplete(url, selectedFile)
      }
    },
    onError: (err) => {
      onUploadError?.(err)
    }
  })

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
    if (uploadUrl) return '업로드 완료'
    if (isPaused) return '일시 정지'
    if (isUploading) return '업로드 중'
    return '업로드 대기'
  }

  if (uploadUrl) {
    return (
      <Card className={cn("p-6", className)}>
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-medium text-green-700">업로드 완료!</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedFile?.name}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRemoveFile}
              size="sm"
            >
              새 파일 선택
            </Button>
          </div>
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
            "border-2 border-dashed p-8 text-center transition-colors",
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
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  파일을 드래그하여 업로드하거나
                </h3>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  파일 선택
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
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
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* 파일 기본 정보 */}
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
            {(isUploading || isPaused || error) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{uploadInfo.formattedProgress}</span>
                  <span>{uploadInfo.formattedSize}</span>
                </div>
                
                <Progress value={progress} className="h-2" />
                
                {isUploading && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{uploadInfo.formattedSpeed}</span>
                    <span>남은 시간: {uploadInfo.estimatedTimeRemaining}</span>
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
                {!isUploading && !isPaused && !uploadUrl && (
                  <Button onClick={handleUploadStart} disabled={disabled}>
                    <Play className="h-4 w-4 mr-2" />
                    업로드 시작
                  </Button>
                )}
                
                {isUploading && (
                  <Button variant="outline" onClick={pauseUpload}>
                    <Pause className="h-4 w-4 mr-2" />
                    일시정지
                  </Button>
                )}
                
                {isPaused && canResume && (
                  <Button onClick={resumeUpload}>
                    <Play className="h-4 w-4 mr-2" />
                    재개
                  </Button>
                )}
                
                {error && (
                  <Button variant="outline" onClick={retryUpload}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    재시도
                  </Button>
                )}
              </div>
              
              {(isUploading || isPaused) && (
                <Button variant="outline" onClick={cancelUpload}>
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
              )}
            </div>

            {/* TUS 업로드 정보 */}
            {(isUploading || isPaused) && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  청크 기반 업로드 • 네트워크 오류 시 자동 재개 • 일시정지/재개 지원
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}