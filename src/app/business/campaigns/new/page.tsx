'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Youtube, Save, FolderOpen } from 'lucide-react'

// 플랫폼 아이콘 컴포넌트들
const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
)

const BlogIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.94 14.036c-.233.624-.43 1.2-.606 1.783.96-.697 2.101-1.139 3.418-1.304 2.513-.314 4.746-1.973 5.876-4.058l-1.456-1.455c-.706 1.263-2.188 2.548-4.062 2.805-1.222.167-2.415.642-3.17 1.229zM16 2.5c-1.621 0-3.128.665-4.2 1.737L9.063 6.975c-1.075 1.072-1.737 2.579-1.737 4.2 0 3.268 2.732 6 6 6s6-2.732 6-6-2.732-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.846 0 3.543-.497 5.02-1.327l-1.411-1.411C14.5 19.775 13.295 20 12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8c0 1.295-.225 2.5-.738 3.609l1.411 1.411C21.503 15.543 22 13.846 22 12c0-5.52-4.48-10-10-10z"/>
  </svg>
)

interface CampaignFormData {
  title: string
  description: string
  platform: string
  budget: string
  targetFollowers: string
  startDate: string
  endDate: string
  requirements: string
  hashtags: string
  imageUrl: string
  youtubeUrl: string
}

interface CampaignTemplate {
  id: string
  name: string
  data: Partial<CampaignFormData>
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'INSTAGRAM',
    budget: '',
    targetFollowers: '',
    startDate: '',
    endDate: '',
    requirements: '',
    hashtags: '',
    imageUrl: '',
    youtubeUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()
  
  // 오늘 날짜 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split('T')[0]
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 템플릿 관련 상태
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // 로컬스토리지에서 템플릿 불러오기
  useEffect(() => {
    const savedTemplates = localStorage.getItem('campaignTemplates')
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates))
    }
  }, [])

  // 템플릿 저장
  const saveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: '오류',
        description: '템플릿 이름을 입력해주세요.',
        variant: 'destructive'
      })
      return
    }

    const newTemplate: CampaignTemplate = {
      id: Date.now().toString(),
      name: templateName,
      data: { ...formData }
    }

    const updatedTemplates = [...templates, newTemplate]
    setTemplates(updatedTemplates)
    localStorage.setItem('campaignTemplates', JSON.stringify(updatedTemplates))
    
    setTemplateName('')
    setShowTemplateModal(false)
    toast({
      title: '성공',
      description: '템플릿이 저장되었습니다.'
    })
  }

  // 템플릿 불러오기
  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData({ ...formData, ...template.data })
      setSelectedTemplate(null)
      toast({
        title: '성공',
        description: '템플릿이 적용되었습니다.'
      })
    }
  }

  // 템플릿 삭제
  const deleteTemplate = (templateId: string) => {
    if (confirm('이 템플릿을 삭제하시겠습니까?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId)
      setTemplates(updatedTemplates)
      localStorage.setItem('campaignTemplates', JSON.stringify(updatedTemplates))
    }
  }

  // 스텝 검증
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.title && !!(formData as any).description && !!formData.platform
      case 2:
        if (!formData.budget || !formData.targetFollowers || !formData.startDate || !formData.endDate) {
          return false
        }
        
        // 날짜 유효성 검사
        const startDate = new Date(formData.startDate)
        const endDate = new Date(formData.endDate)
        const todayDate = new Date()
        todayDate.setHours(0, 0, 0, 0)
        
        if (startDate < todayDate) {
          setError('시작일은 오늘 날짜 이후여야 합니다.')
          return false
        }
        
        if (endDate <= startDate) {
          setError('종료일은 시작일 이후여야 합니다.')
          return false
        }
        
        return true
      case 3:
        return true // 선택 사항
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
      setError('')
    } else {
      setError('필수 항목을 모두 입력해주세요.')
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
    setError('')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    setImageUploading(true)
    setError('')

    try {
      // 이미지 리사이즈
      const resizedImage = await resizeImage(file, 800, 600)
      setUploadedImage(resizedImage)
      setFormData({ ...formData, imageUrl: resizedImage })
    } catch (err) {
      setError('이미지 업로드에 실패했습니다.')
    } finally {
      setImageUploading(false)
    }
  }

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // 비율 유지하며 리사이즈
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const extractYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    // 3단계가 아니면 제출하지 않음
    if (currentStep !== 3) {
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/business/campaigns', {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget: parseInt(formData.budget),
          targetFollowers: parseInt(formData.targetFollowers),
          hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(Boolean),
          imageUrl: uploadedImage || formData.imageUrl,
          youtubeUrl: formData.youtubeUrl
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '캠페인 생성에 실패했습니다.')
      }

      const data = await response.json()
      toast({
        title: '성공',
        description: '캠페인이 성공적으로 생성되었습니다.'
      })
      router.push(`/business/campaigns/${data.campaign.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(errorMessage)
      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">새 캠페인 만들기</h1>
              <p className="text-gray-600 mt-2">캠페인 정보를 입력하여 인플루언서를 모집하세요.</p>
            </div>
            
            {/* 템플릿 버튼 */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateModal(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                템플릿 저장
              </Button>
              <Select value={selectedTemplate || ''} onValueChange={(value) => value && loadTemplate(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="템플릿 불러오기" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 스텝 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">캠페인 생성 - {currentStep}/3단계</h2>
            <div className="text-sm text-gray-500">
              {currentStep === 1 && '기본 정보'}
              {currentStep === 2 && '캠페인 조건'}
              {currentStep === 3 && '추가 정보'}
            </div>
          </div>
          <Progress value={(currentStep / 3) * 100} className="w-full" />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} onKeyDown={(e) => {
          if (e.key === 'Enter' && currentStep !== 3) {
            e.preventDefault()
            nextStep()
          }
        }} className="bg-white rounded-xl shadow-sm p-8">
          <div className="space-y-6">
            {/* 스텝 1: 기본 정보 */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">캠페인 제목 *</Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="예: 2025 신제품 런칭 캠페인"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">캠페인 설명 *</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={(formData as any).description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="캠페인의 목적과 내용을 상세히 설명해주세요."
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="platform">플랫폼 *</Label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      <Button
                        type="button"
                        variant={formData.platform === 'INSTAGRAM' ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, platform: 'INSTAGRAM'})}
                        className="h-16 flex flex-col items-center justify-center gap-2"
                      >
                        <InstagramIcon />
                        <span className="text-sm font-medium">Instagram</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.platform === 'YOUTUBE' ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, platform: 'YOUTUBE'})}
                        className="h-16 flex flex-col items-center justify-center gap-2"
                      >
                        <Youtube className="w-6 h-6" />
                        <span className="text-sm font-medium">YouTube</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.platform === 'TIKTOK' ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, platform: 'TIKTOK'})}
                        className="h-16 flex flex-col items-center justify-center gap-2"
                      >
                        <TikTokIcon />
                        <span className="text-sm font-medium">TikTok</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.platform === 'BLOG' ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, platform: 'BLOG'})}
                        className="h-16 flex flex-col items-center justify-center gap-2"
                      >
                        <BlogIcon />
                        <span className="text-sm font-medium">Blog</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 스텝 2: 캠페인 조건 */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">캠페인 조건</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">예산 (원) *</Label>
                  <Input
                    id="budget"
                    type="number"
                    required
                    min="100000"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="1000000"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="targetFollowers">최소 팔로워 수 *</Label>
                  <Input
                    id="targetFollowers"
                    type="number"
                    required
                    min="1000"
                    value={formData.targetFollowers}
                    onChange={(e) => setFormData({...formData, targetFollowers: e.target.value})}
                    placeholder="10000"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">시작일 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    min={today}
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">종료일 *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            )}

            {/* 스텝 3: 추가 정보 */}
            {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">추가 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="requirements">상세 요구사항</Label>
                  <Textarea
                    id="requirements"
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    placeholder="인플루언서에게 요구하는 사항을 자세히 작성해주세요."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="hashtags">해시태그 (쉼표로 구분)</Label>
                  <Input
                    id="hashtags"
                    type="text"
                    value={formData.hashtags}
                    onChange={(e) => setFormData({...formData, hashtags: e.target.value})}
                    placeholder="#신제품, #런칭이벤트, #뷰티"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>대표 이미지</Label>
                  <div className="space-y-4 mt-2">
                    {/* 이미지 업로드 영역 */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 cursor-pointer transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {uploadedImage ? (
                        <div className="relative">
                          <img 
                            src={uploadedImage} 
                            alt="캠페인 대표 이미지" 
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setUploadedImage(null)
                              setFormData({...formData, imageUrl: ''})
                            }}
                            className="absolute top-2 right-2 h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          {imageUploading ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                          ) : (
                            <>
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-600">
                                클릭하여 이미지 업로드
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                JPG, PNG, GIF (최대 5MB)
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* URL 입력 옵션 */}
                    <div className="relative">
                      <Input
                        type="url"
                        value={!uploadedImage ? formData.imageUrl : ''}
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        disabled={!!uploadedImage}
                        placeholder="또는 이미지 URL을 입력하세요"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="youtubeUrl">유튜브 동영상 URL</Label>
                  <div className="space-y-4 mt-2">
                    <div className="relative">
                      <Youtube className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="youtubeUrl"
                        type="url"
                        value={formData.youtubeUrl}
                        onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="pl-10"
                      />
                    </div>
                    
                    {/* 유튜브 미리보기 */}
                    {formData.youtubeUrl && extractYoutubeVideoId(formData.youtubeUrl) && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeVideoId(formData.youtubeUrl)}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1`}
                          className="absolute inset-0 w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                >
                  이전
                </Button>
              )}
            </div>
            
            <div className="flex space-x-4">
              <Button asChild variant="outline">
                <Link href="/business/dashboard">
                  취소
                </Link>
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                >
                  다음
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={loading}
                >
                  {loading ? '생성 중...' : '캠페인 생성'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>

      {/* 템플릿 저장 모달 */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>템플릿 저장</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateName">템플릿 이름</Label>
              <Input
                id="templateName"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="템플릿 이름을 입력하세요"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateModal(false)}
            >
              취소
            </Button>
            <Button onClick={saveTemplate}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}