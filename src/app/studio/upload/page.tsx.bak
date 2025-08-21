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
import PageLayout from '@/components/layouts/PageLayout'

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
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState<string>('준비 중...')
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([])

  const steps: UploadStep[] = [
    { id: 'upload', title: '파일 업로드', status: currentStep === 0 ? 'current' : currentStep > 0 ? 'completed' : 'waiting' },
    { id: 'metadata', title: '비디오 정보', status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'waiting' },
    { id: 'processing', title: '처리 중', status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'waiting' },
    { id: 'complete', title: '완료', status: currentStep === 3 ? 'completed' : 'waiting' }
  ]

  const handleFileUploadComplete = useCallback((url: string, file: File, thumbnails?: string[]) => {
    console.log('Upload completed:', { url, fileName: file.name, thumbnails })
    setUploadedVideoUrl(url)
    setUploadedFile(file)
    if (thumbnails && thumbnails.length > 0) {
      setGeneratedThumbnails(thumbnails)
    }
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

  const handleThumbnailGenerated = useCallback((thumbnails: string[]) => {
    console.log('Thumbnails generated:', thumbnails)
    setGeneratedThumbnails(thumbnails)
  }, [])

  const handleMetadataSubmit = useCallback(async (metadata: VideoMetadata) => {
    if (!uploadedVideoUrl || !uploadedFile) {
      setProcessingError('업로드된 파일이 없습니다.')
      return
    }

    setCurrentStep(2) // 처리 중 단계로 이동
    setIsProcessing(true)
    setProcessingError(null)
    setProcessingProgress(0)
    setProcessingStep('준비 중...')

    try {
      // 진행률 시뮬레이션을 위한 단계들
      const steps = [
        { progress: 10, message: '비디오 정보 검증 중...' },
        { progress: 25, message: '메타데이터 처리 중...' },
        { progress: 40, message: '썸네일 생성 중...' },
        { progress: 60, message: '비디오 인코딩 준비 중...' },
        { progress: 80, message: '데이터베이스 저장 중...' },
        { progress: 95, message: '최종 처리 중...' },
        { progress: 100, message: '완료!' }
      ]

      // 각 단계별로 진행률 업데이트
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        setProcessingProgress(step.progress)
        setProcessingStep(step.message)
        
        // 마지막 단계가 아니면 잠시 대기
        if (i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800))
        }
      }

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
      
      // 썸네일 처리 - 자동 생성된 썸네일이나 사용자 업로드 썸네일
      if (metadata.thumbnail) {
        if (metadata.thumbnail instanceof File) {
          // 사용자가 직접 업로드한 파일
          formData.append('thumbnail', metadata.thumbnail)
        } else if (typeof metadata.thumbnail === 'string') {
          // 자동 생성된 썸네일 URL
          formData.append('autoThumbnailUrl', metadata.thumbnail)
        }
      }

      const response = await fetch('/api/videos/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || localStorage.getItem('accessToken')}`,
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
      }, 1000)

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
    <PageLayout showFooter={false}>
      {/* 서브 히어로 섹션 */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white border-b border-gray-700">
        <div className="px-6 py-8">
          <div className="max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">
              🎬 비디오 업로드
            </h1>
            <p className="text-base text-white/80 mb-6">
              TUS 프로토콜을 활용한 안정적이고 빠른 대용량 파일 업로드
            </p>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <div className="px-6 py-8 flex-1">

        {/* 진행 단계 */}
        <div className="bg-gray-800 rounded-xl shadow-sm mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">업로드 진행 상황</h2>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    {getStepIcon(step, index)}
                    <span className={`text-sm mt-2 ${step.status === 'current' ? 'font-medium text-indigo-400' : step.status === 'completed' ? 'text-green-400' : 'text-gray-400'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${step.status === 'completed' ? 'bg-green-400' : 'bg-gray-600'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 단계별 콘텐츠 */}
        <div className="space-y-6">
          {/* 1단계: 파일 업로드 */}
          {currentStep === 0 && (
            <div className="bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-indigo-400" />
                  1단계: 비디오 파일 업로드
                </h3>
                <TUSFileUploader
                  accept="video/*"
                  maxSizeBytes={2 * 1024 * 1024 * 1024} // 2GB
                  onUploadComplete={handleFileUploadComplete}
                  onUploadStart={handleFileUploadStart}
                  onUploadError={handleFileUploadError}
                  onThumbnailGenerated={handleThumbnailGenerated}
                  autoGenerateThumbnails={true}
                  metadata={{
                    category: 'video',
                    source: 'web_upload'
                  }}
                />
              </div>
            </div>
          )}

          {/* 2단계: 비디오 정보 입력 */}
          {currentStep === 1 && (
            <div className="bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6">2단계: 비디오 정보 입력</h3>
                {uploadedFile && (
                  <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="font-medium text-green-300">업로드 완료</p>
                        <p className="text-sm text-green-400">{uploadedFile.name}</p>
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
                  generatedThumbnails={generatedThumbnails}
                />
              </div>
            </div>
          )}

          {/* 3단계: 처리 중 */}
          {currentStep === 2 && (
            <div className="bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-400" />
                  3단계: 비디오 처리 중
                </h3>
                <div className="text-center py-8">
                  {/* 진행률 표시 */}
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-indigo-400 mb-2">
                      {processingProgress}%
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-indigo-300 font-medium mb-4">
                      {processingStep}
                    </p>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-2">비디오를 처리하고 있습니다...</h3>
                  <p className="text-gray-300 mb-6">
                    비디오 정보가 저장되고 시스템에서 처리 중입니다. 잠시만 기다려주세요.
                  </p>
                  
                  <div className="space-y-2 text-sm text-left max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">파일 업로드 완료</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">메타데이터 저장 완료</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {processingProgress < 100 ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      )}
                      <span className="text-gray-300">
                        {processingProgress < 100 ? '비디오 처리 중...' : '비디오 처리 완료'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4단계: 완료 */}
          {currentStep === 3 && (
            <div className="bg-gray-800 rounded-xl shadow-sm">
              <div className="p-8">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-400 mb-2">업로드 완료!</h2>
                  <p className="text-gray-300 mb-6">
                    비디오가 성공적으로 업로드되어 처리가 완료되었습니다.
                  </p>
                  
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={handleGoToVideo} 
                      disabled={!videoId}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      비디오 보기
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleUploadAnother}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      새 비디오 업로드
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/studio/videos')}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      비디오 관리
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
              <div className="p-6">
                <h3 className="font-medium text-indigo-300 mb-2">💡 업로드 팁</h3>
                <ul className="text-sm text-indigo-200 space-y-1">
                  <li>• TUS 프로토콜을 사용하여 네트워크 오류 시 자동으로 업로드를 재개합니다</li>
                  <li>• 업로드 중 일시정지/재개가 가능합니다</li>
                  <li>• 최적의 화질을 위해 1080p 이상의 해상도를 권장합니다</li>
                  <li>• 파일 크기는 최대 2GB까지 지원합니다</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}