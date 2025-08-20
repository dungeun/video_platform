'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import TUSFileUploader from '@/components/studio/TUSFileUploader'
import VideoMetadataForm, { VideoMetadata } from '@/components/studio/VideoMetadataForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface UploadStep {
  id: string
  title: string
  status: 'waiting' | 'current' | 'completed' | 'error'
}

export default function StudioUpload() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)

  const steps: UploadStep[] = [
    { id: 'upload', title: '파일 업로드', status: currentStep === 0 ? 'current' : currentStep > 0 ? 'completed' : 'waiting' },
    { id: 'metadata', title: '비디오 정보', status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'waiting' },
    { id: 'processing', title: '처리 중', status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'waiting' },
    { id: 'complete', title: '완료', status: currentStep === 3 ? 'completed' : 'waiting' }
  ]

  const handleFileUploadComplete = useCallback((url: string, file: File) => {
    console.log('Upload completed:', { url, fileName: file.name })
    setUploadedVideoUrl(url)
    setUploadedFile(file)
    setCurrentStep(1) // 메타데이터 입력 단계로 이동
  }, [])

  const handleFileUploadStart = useCallback((file: File) => {
    console.log('Upload started:', { fileName: file.name, size: file.size })
    setUploadedFile(file)
  }, [])

  const handleFileUploadError = useCallback((error: Error) => {
    console.error('Upload failed:', error)
    setProcessingError(error.message)
  }, [])

  const handleMetadataSubmit = useCallback(async (metadata: VideoMetadata) => {
    if (!uploadedVideoUrl || !uploadedFile) {
      setProcessingError('업로드된 파일이 없습니다.')
      return
    }

    setCurrentStep(2) // 처리 중 단계로 이동
    setIsProcessing(true)
    setProcessingError(null)

    try {
      // 비디오 정보를 서버에 저장
      const formData = new FormData()
      formData.append('videoUrl', uploadedVideoUrl)
      formData.append('title', metadata.title)
      formData.append('description', metadata.description)
      formData.append('category', metadata.category)
      formData.append('tags', JSON.stringify(metadata.tags))
      formData.append('visibility', metadata.visibility)
      formData.append('language', metadata.language)
      formData.append('isCommentsEnabled', metadata.isCommentsEnabled.toString())
      formData.append('isRatingsEnabled', metadata.isRatingsEnabled.toString())
      formData.append('isMonetizationEnabled', metadata.isMonetizationEnabled.toString())
      formData.append('ageRestriction', metadata.ageRestriction.toString())
      formData.append('license', metadata.license)
      
      if (metadata.scheduledAt) {
        formData.append('scheduledAt', metadata.scheduledAt)
      }
      
      if (metadata.thumbnail && metadata.thumbnail instanceof File) {
        formData.append('thumbnail', metadata.thumbnail)
      }

      const response = await fetch('/api/videos/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('비디오 정보 저장에 실패했습니다')
      }

      const result = await response.json()
      setVideoId(result.videoId)
      
      // 완료 단계로 이동
      setTimeout(() => {
        setCurrentStep(3)
        setIsProcessing(false)
      }, 2000)

    } catch (error) {
      console.error('Video creation failed:', error)
      setProcessingError(error instanceof Error ? error.message : '비디오 처리 중 오류가 발생했습니다')
      setIsProcessing(false)
    }
  }, [uploadedVideoUrl, uploadedFile])

  const handleMetadataSave = useCallback(async (metadata: VideoMetadata) => {
    // 임시저장 로직
    try {
      localStorage.setItem('video-draft', JSON.stringify(metadata))
      console.log('Draft saved to localStorage')
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [])

  const getStepIcon = (step: UploadStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    } else if (step.status === 'current') {
      return <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{index + 1}</div>
    } else if (step.status === 'error') {
      return <AlertTriangle className="h-5 w-5 text-destructive" />
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 bg-background text-muted-foreground flex items-center justify-center text-xs">{index + 1}</div>
    }
  }

  const handleGoToVideo = () => {
    if (videoId) {
      router.push(`/watch/${videoId}`)
    }
  }

  const handleUploadAnother = () => {
    setCurrentStep(0)
    setUploadedFile(null)
    setUploadedVideoUrl(null)
    setVideoId(null)
    setProcessingError(null)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">비디오 업로드</h1>
          <p className="text-muted-foreground">
            TUS 프로토콜을 활용한 안정적이고 빠른 대용량 파일 업로드
          </p>
        </div>

        {/* 진행 단계 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>업로드 진행 상황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    {getStepIcon(step, index)}
                    <span className={`text-sm mt-2 ${step.status === 'current' ? 'font-medium text-primary' : step.status === 'completed' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${step.status === 'completed' ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 단계별 콘텐츠 */}
        <div className="space-y-6">
          {/* 1단계: 파일 업로드 */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  1단계: 비디오 파일 업로드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TUSFileUploader
                  accept="video/*"
                  maxSizeBytes={2 * 1024 * 1024 * 1024} // 2GB
                  onUploadComplete={handleFileUploadComplete}
                  onUploadStart={handleFileUploadStart}
                  onUploadError={handleFileUploadError}
                  metadata={{
                    category: 'video',
                    source: 'web_upload'
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* 2단계: 비디오 정보 입력 */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>2단계: 비디오 정보 입력</CardTitle>
              </CardHeader>
              <CardContent>
                {uploadedFile && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">업로드 완료</p>
                        <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <VideoMetadataForm
                  initialData={{
                    title: uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, '') : '',
                    ...(() => {
                      try {
                        const draft = localStorage.getItem('video-draft')
                        return draft ? JSON.parse(draft) : {}
                      } catch {
                        return {}
                      }
                    })()
                  }}
                  onSubmit={handleMetadataSubmit}
                  onSave={handleMetadataSave}
                  isSubmitting={isProcessing}
                />
              </CardContent>
            </Card>
          )}

          {/* 3단계: 처리 중 */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  3단계: 비디오 처리 중
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium mb-2">비디오를 처리하고 있습니다...</h3>
                  <p className="text-muted-foreground mb-6">
                    비디오 정보가 저장되고 시스템에서 처리 중입니다. 잠시만 기다려주세요.
                  </p>
                  
                  <div className="space-y-2 text-sm text-left max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>파일 업로드 완료</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>메타데이터 저장 완료</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>비디오 인코딩 중...</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4단계: 완료 */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-700 mb-2">업로드 완료!</h2>
                  <p className="text-muted-foreground mb-6">
                    비디오가 성공적으로 업로드되어 처리가 완료되었습니다.
                  </p>
                  
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleGoToVideo} disabled={!videoId}>
                      비디오 보기
                    </Button>
                    <Button variant="outline" onClick={handleUploadAnother}>
                      새 비디오 업로드
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/studio/videos')}>
                      비디오 관리
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 에러 메시지 */}
          {processingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{processingError}</AlertDescription>
            </Alert>
          )}

          {/* 업로드 팁 */}
          {currentStep === 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-medium text-blue-900 mb-2">💡 업로드 팁</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• TUS 프로토콜을 사용하여 네트워크 오류 시 자동으로 업로드를 재개합니다</li>
                  <li>• 업로드 중 일시정지/재개가 가능합니다</li>
                  <li>• 최적의 화질을 위해 1080p 이상의 해상도를 권장합니다</li>
                  <li>• 파일 크기는 최대 2GB까지 지원합니다</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}