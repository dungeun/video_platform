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
  description?: string
  data: Partial<CampaignFormData>
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platforms: [],
    budget: '',
    targetFollowers: '',
    startDate: '',
    endDate: '',
    requirements: '',
    hashtags: '',
    imageUrl: '',
    youtubeUrl: '',
    maxApplicants: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()
  const [paymentInfo, setPaymentInfo] = useState({
    campaignBudget: 0,
    platformFee: 0,
    vat: 0,
    totalAmount: 0
  })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CARD')
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)
  
  // 오늘 날짜 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split('T')[0]
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 상세 이미지 관련 상태
  const [detailImages, setDetailImages] = useState<string[]>([])
  const [detailImageUploading, setDetailImageUploading] = useState(false)
  const detailFileInputRef = useRef<HTMLInputElement>(null)
  
  // 템플릿 관련 상태
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // DB에서 템플릿 불러오기
  useEffect(() => {
    loadTemplatesFromDB()
  }, [])
  
  // 비용 계산
  useEffect(() => {
    if (formData.budget) {
      const budget = Number(formData.budget)
      
      // 신용카드는 부가세 포함, 계좌이체/현금은 부가세 별도
      let vat = 0
      let total = budget
      
      if (selectedPaymentMethod !== 'CARD') {
        vat = budget * 0.1  // VAT 10%
        total = budget + vat
      }
      
      setPaymentInfo({
        campaignBudget: budget,
        platformFee: 0,  // 플랫폼 수수료 제거
        vat: vat,
        totalAmount: total
      })
    }
  }, [formData.budget, selectedPaymentMethod])

  const loadTemplatesFromDB = async () => {
    setLoadingTemplates(true)
    try {
      const response = await fetch('/api/business/campaign-templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      } else {
        const errorData = await response.json()
        console.error('Failed to load templates:', errorData)
        if (errorData.details) {
          console.error('Error details:', errorData.details)
        }
        if (errorData.stack) {
          console.error('Stack trace:', errorData.stack)
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // 템플릿 저장
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: '오류',
        description: '템플릿 이름을 입력해주세요.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/business/campaign-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          data: formData,
          isDefault: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        await loadTemplatesFromDB() // 템플릿 목록 새로고침
        
        setTemplateName('')
        setTemplateDescription('')
        setShowTemplateModal(false)
        toast({
          title: '성공',
          description: '템플릿이 저장되었습니다.'
        })
      } else {
        throw new Error('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: '오류',
        description: '템플릿 저장에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 템플릿 불러오기
  const loadTemplate = async (templateId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/business/campaign-templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const templateData = data.template.data as CampaignFormData
        // Handle backward compatibility for platform field
        if ((templateData as any).platform && !(templateData as any).platforms) {
          (templateData as any).platforms = [(templateData as any).platform]
        }
        setFormData({ ...formData, ...templateData })
        setSelectedTemplate(null)
        toast({
          title: '성공',
          description: '템플릿이 적용되었습니다.'
        })
      } else {
        throw new Error('Failed to load template')
      }
    } catch (error) {
      console.error('Error loading template:', error)
      toast({
        title: '오류',
        description: '템플릿 불러오기에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 템플릿 삭제
  const deleteTemplate = async (templateId: string) => {
    if (confirm('이 템플릿을 삭제하시겠습니까?')) {
      setLoading(true)
      try {
        const response = await fetch(`/api/business/campaign-templates?id=${templateId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })

        if (response.ok) {
          await loadTemplatesFromDB() // 템플릿 목록 새로고침
          toast({
            title: '성공',
            description: '템플릿이 삭제되었습니다.'
          })
        } else {
          throw new Error('Failed to delete template')
        }
      } catch (error) {
        console.error('Error deleting template:', error)
        toast({
          title: '오류',
          description: '템플릿 삭제에 실패했습니다.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  // 스텝 검증
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title) {
          setError('캠페인 제목을 입력해주세요.')
          return false
        }
        if (!(formData as any).description) {
          setError('캠페인 설명을 입력해주세요.')
          return false
        }
        if (!formData.platforms || formData.platforms.length === 0) {
          setError('최소 하나의 플랫폼을 선택해주세요.')
          return false
        }
        return true
      case 2:
        if (!formData.budget) {
          setError('예산을 입력해주세요.')
          return false
        }
        if (!formData.targetFollowers) {
          setError('최소 팔로워 수를 입력해주세요.')
          return false
        }
        if (!formData.maxApplicants) {
          setError('모집 인원수를 입력해주세요.')
          return false
        }
        if (!formData.startDate) {
          setError('시작일을 선택해주세요.')
          return false
        }
        if (!formData.endDate) {
          setError('지원 마감일을 선택해주세요.')
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

    // 파일 크기 검증 (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('파일 크기는 15MB 이하여야 합니다.')
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

  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미 2개의 상세 이미지가 있는 경우
    if (detailImages.length >= 2) {
      setError('상세 이미지는 최대 2개까지 업로드 가능합니다.')
      return
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 검증 (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('파일 크기는 15MB 이하여야 합니다.')
      return
    }

    setDetailImageUploading(true)
    setError('')

    try {
      // 이미지 리사이즈
      const resizedImage = await resizeImage(file, 1200, 1200)
      setDetailImages([...detailImages, resizedImage])
    } catch (err) {
      setError('이미지 업로드에 실패했습니다.')
    } finally {
      setDetailImageUploading(false)
    }
  }

  const removeDetailImage = (index: number) => {
    setDetailImages(detailImages.filter((_, i) => i !== index))
  }

  const extractYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    // 4단계가 아니면 제출하지 않음
    if (currentStep !== 4) {
      return
    }
    
    setLoading(true)
    setError('')

    try {
      // 1. 먼저 캠페인 생성 (결제 전 상태로)
      const campaignResponse = await fetch('/api/business/campaigns', {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...formData,
          budget: parseInt(formData.budget),
          targetFollowers: parseInt(formData.targetFollowers),
          maxApplicants: parseInt(formData.maxApplicants),
          rewardAmount: Math.floor(parseInt(formData.budget) * 0.8 / parseInt(formData.maxApplicants)), // 수수료 20% 제외하고 인원수로 나눔
          hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(Boolean),
          imageUrl: uploadedImage || formData.imageUrl,
          detailImages: detailImages,
          youtubeUrl: formData.youtubeUrl,
          platform: formData.platforms[0] || 'INSTAGRAM', // For backward compatibility
          platforms: formData.platforms,
          isPaid: false // 결제 전 상태
        }),
      })

      if (!campaignResponse.ok) {
        const data = await campaignResponse.json()
        throw new Error(data.error || '캠페인 생성에 실패했습니다.')
      }

      const campaignData = await campaignResponse.json()
      const campaignId = campaignData.campaign.id
      setCreatedCampaignId(campaignId)
      
      // 2. 결제 요청 생성
      
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          campaignId: campaignId,
          amount: paymentInfo.totalAmount,
          paymentMethod: selectedPaymentMethod
        })
      })
      
      if (!paymentResponse.ok) {
        const error = await paymentResponse.json()
        throw new Error(error.error || '결제 요청 생성에 실패했습니다.')
      }
      
      const paymentData = await paymentResponse.json()
      
      // 3. 현금 결제인 경우 바로 완료 처리
      if (selectedPaymentMethod === 'CASH') {
        // 테스트 결제 완료 처리
        const completeResponse = await fetch('/api/payments/test-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            orderId: paymentData.payment.orderId,
            paymentKey: 'TEST_' + Date.now(),
            amount: paymentInfo.totalAmount
          })
        })
        
        if (!completeResponse.ok) {
          const error = await completeResponse.json()
          throw new Error(error.error || '결제 완료 처리에 실패했습니다.')
        }
        
        // 성공 페이지로 리다이렉트
        toast({
          title: '결제 완료',
          description: '캠페인이 성공적으로 생성되었습니다.',
        })
        
        router.push(`/business/campaigns/${campaignId}`)
        return
      }
      
      // 4. 토스페이먼츠 결제창 호출 (카드/계좌이체)
      const { loadTossPayments } = await import('@tosspayments/payment-sdk')
      const tossPayments = await loadTossPayments(paymentData.clientKey)
      
      // 결제 요청
      await tossPayments.requestPayment(selectedPaymentMethod === 'CARD' ? '카드' : '계좌이체', {
        amount: paymentData.paymentRequest.amount,
        orderId: paymentData.paymentRequest.orderId,
        orderName: paymentData.paymentRequest.orderName,
        customerName: paymentData.paymentRequest.customerName,
        successUrl: paymentData.paymentRequest.successUrl,
        failUrl: paymentData.paymentRequest.failUrl
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(errorMessage)
      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive'
      })
      
      // 결제 실패 시 생성된 캠페인 삭제 (선택사항)
      if (createdCampaignId) {
        try {
          await fetch(`/api/business/campaigns/${createdCampaignId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          })
        } catch (deleteError) {
          console.error('캠페인 삭제 실패:', deleteError)
        }
      }
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
                  <SelectValue placeholder={loadingTemplates ? "로딩 중..." : "템플릿 불러오기"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      저장된 템플릿이 없습니다.
                    </div>
                  ) : (
                    templates.map(template => (
                      <div key={template.id} className="relative group">
                        <SelectItem value={template.id}>
                          <div className="pr-8">
                            <div className="font-medium">{template.name}</div>
                            {template.description && (
                              <div className="text-xs text-gray-500">{template.description}</div>
                            )}
                            {template.isDefault && (
                              <span className="text-xs text-blue-600 ml-2">기본</span>
                            )}
                          </div>
                        </SelectItem>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTemplate(template.id)
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 스텝 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">캠페인 생성 - {currentStep}/4단계</h2>
            <div className="text-sm text-gray-500">
              {currentStep === 1 && '기본 정보'}
              {currentStep === 2 && '캠페인 조건'}
              {currentStep === 3 && '추가 정보'}
              {currentStep === 4 && '결제 정보'}
            </div>
          </div>
          <Progress value={(currentStep / 4) * 100} className="w-full" />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} onKeyDown={(e) => {
          if (e.key === 'Enter' && currentStep !== 4) {
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
                    <Label>플랫폼 * (복수 선택 가능)</Label>
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      <Button
                        type="button"
                        variant={formData.platforms.includes('INSTAGRAM') ? 'default' : 'outline'}
                        onClick={() => {
                          if (formData.platforms.includes('INSTAGRAM')) {
                            setFormData({...formData, platforms: formData.platforms.filter(p => p !== 'INSTAGRAM')})
                          } else {
                            setFormData({...formData, platforms: [...formData.platforms, 'INSTAGRAM']})
                          }
                        }}
                        className="h-16 flex flex-col items-center justify-center gap-2"
                      >
                        <InstagramIcon />
                        <span className="text-sm font-medium">Instagram</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.platforms.includes('YOUTUBE') ? 'default' : 'outline'}
                        onClick={() => {
                          if (formData.platforms.includes('YOUTUBE')) {
                            setFormData({...formData, platforms: formData.platforms.filter(p => p !== 'YOUTUBE')})
                          } else {
                            setFormData({...formData, platforms: [...formData.platforms, 'YOUTUBE']})
                          }
                        }}
                        className="h-16 flex flex-col items-center justify-center gap-2"
                      >
                        <Youtube className="w-6 h-6" />
                        <span className="text-sm font-medium">YouTube</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.platforms.includes('TIKTOK') ? 'default' : 'outline'}
                        onClick={() => {
                          if (formData.platforms.includes('TIKTOK')) {
                            setFormData({...formData, platforms: formData.platforms.filter(p => p !== 'TIKTOK')})
                          } else {
                            setFormData({...formData, platforms: [...formData.platforms, 'TIKTOK']})
                          }
                        }}
                        className="h-16 flex flex-col items-center justify-center gap-2"
                      >
                        <TikTokIcon />
                        <span className="text-sm font-medium">TikTok</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.platforms.includes('BLOG') ? 'default' : 'outline'}
                        onClick={() => {
                          if (formData.platforms.includes('BLOG')) {
                            setFormData({...formData, platforms: formData.platforms.filter(p => p !== 'BLOG')})
                          } else {
                            setFormData({...formData, platforms: [...formData.platforms, 'BLOG']})
                          }
                        }}
                        className="h-16 flex flex-col items-center justify-center gap-2"
                      >
                        <BlogIcon />
                        <span className="text-sm font-medium">Blog</span>
                      </Button>
                    </div>
                    {formData.platforms.length === 0 && (
                      <p className="text-sm text-red-600 mt-2">최소 하나의 플랫폼을 선택해주세요.</p>
                    )}
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
                  <p className="text-xs text-gray-500 mt-1">전체 캠페인 예산을 입력하세요</p>
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
                  <Label htmlFor="maxApplicants">모집 인원수 *</Label>
                  <Input
                    id="maxApplicants"
                    type="number"
                    required
                    min="1"
                    max="1000"
                    value={formData.maxApplicants}
                    onChange={(e) => setFormData({...formData, maxApplicants: e.target.value})}
                    placeholder="10"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">최대 모집할 인플루언서 수</p>
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
                  <Label htmlFor="endDate">지원 마감일 *</Label>
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
              
              {/* 예상 비용 계산 */}
              {formData.budget && formData.maxApplicants && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-sm text-blue-900 mb-2">예상 비용 계산</h3>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>전체 예산</span>
                      <span>₩{Number(formData.budget).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>플랫폼 수수료 (20%)</span>
                      <span>₩{Math.floor(Number(formData.budget) * 0.2).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>인플루언서 지원금 총액</span>
                      <span>₩{Math.floor(Number(formData.budget) * 0.8).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium text-blue-900">
                        <span>인플루언서 1명당 지원금</span>
                        <span>₩{Math.floor(Number(formData.budget) * 0.8 / Number(formData.maxApplicants)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                                JPG, PNG, GIF (최대 15MB)
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
                  <Label>상세 이미지 (최대 2개)</Label>
                  <div className="space-y-4 mt-2">
                    {/* 상세 이미지 그리드 */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* 업로드된 이미지들 */}
                      {detailImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={image} 
                            alt={`상세 이미지 ${index + 1}`} 
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeDetailImage(index)}
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {/* 업로드 버튼 (최대 2개) */}
                      {detailImages.length < 2 && (
                        <div 
                          onClick={() => detailFileInputRef.current?.click()}
                          className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 cursor-pointer transition-colors h-48 flex items-center justify-center"
                        >
                          <input
                            ref={detailFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleDetailImageUpload}
                            className="hidden"
                          />
                          
                          <div className="text-center">
                            {detailImageUploading ? (
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            ) : (
                              <>
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">
                                  상세 이미지 추가
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  JPG, PNG, GIF (최대 15MB)
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      상세 이미지는 캠페인의 제품이나 서비스를 자세히 보여주는 이미지를 업로드해주세요.
                    </p>
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
            
            {/* 스텝 4: 결제 정보 */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">결제 정보</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-4">캠페인 비용 상세</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">캠페인 예산</span>
                      <span className="font-medium">₩{paymentInfo.campaignBudget.toLocaleString()}</span>
                    </div>
                    {selectedPaymentMethod !== 'CARD' && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">부가세 (VAT 10%)</span>
                        <span className="font-medium">₩{paymentInfo.vat.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold text-lg">
                        총 결제 금액
                        {selectedPaymentMethod === 'CARD' && <span className="text-sm font-normal text-gray-600 ml-2">(부가세 포함)</span>}
                      </span>
                      <span className="font-bold text-xl text-indigo-600">₩{paymentInfo.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">결제 안내</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>결제 완료 후 캠페인이 검토 및 승인됩니다.</li>
                        <li>캠페인 승인 후 인플루언서 모집이 시작됩니다.</li>
                        <li>캠페인 취소 시 수수료를 제외한 금액이 환불됩니다.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>결제 방법</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <label className="relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="CARD" 
                          checked={selectedPaymentMethod === 'CARD'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="mr-3" 
                        />
                        <div>
                          <p className="font-medium">신용/체크카드</p>
                          <p className="text-sm text-gray-500">부가세 포함</p>
                        </div>
                      </label>
                      <label className="relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="BANK_TRANSFER" 
                          checked={selectedPaymentMethod === 'BANK_TRANSFER'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="mr-3" 
                        />
                        <div>
                          <p className="font-medium">계좌이체</p>
                          <p className="text-sm text-gray-500">부가세 별도</p>
                        </div>
                      </label>
                      <label className="relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="CASH" 
                          checked={selectedPaymentMethod === 'CASH'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="mr-3" 
                        />
                        <div>
                          <p className="font-medium">현금 결제</p>
                          <p className="text-sm text-gray-500">부가세 별도</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-start">
                      <input type="checkbox" className="mt-1 mr-2" required />
                      <span className="text-sm text-gray-600">
                        결제 진행에 동의하며, <a href="/terms" className="text-indigo-600 hover:underline">이용약관</a> 및{' '}
                        <a href="/refund-policy" className="text-indigo-600 hover:underline">환불정책</a>을 확인하였습니다.
                      </span>
                    </label>
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
              
              {currentStep < 4 ? (
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
                  {loading ? '결제하기' : '결제하기'}
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
            <div>
              <Label htmlFor="templateDescription">설명 (선택사항)</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="템플릿에 대한 설명을 입력하세요"
                className="mt-2"
                rows={3}
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