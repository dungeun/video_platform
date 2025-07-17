'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/lib/auth'
import { apiGet, apiPut } from '@/lib/api/client'
import { ArrowLeft, Upload, X, Youtube } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EditCampaignPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const currentUser = AuthService.getCurrentUser()
        
        if (!currentUser) {
          const storedUser = localStorage.getItem('user')
          if (!storedUser) {
            router.push('/login')
            return
          }
          
          const parsedUser = JSON.parse(storedUser)
          AuthService.login(parsedUser.type, parsedUser)
        }
        
        const userType = currentUser?.type?.toUpperCase()
        
        if (userType !== 'BUSINESS' && userType !== 'ADMIN') {
          router.push('/login')
          return
        }
        
        // 캠페인 데이터 가져오기
        const response = await apiGet(`/api/business/campaigns/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: '오류',
              description: '캠페인을 찾을 수 없습니다.',
              variant: 'destructive'
            })
            router.push('/business/campaigns')
            return
          }
          throw new Error('캠페인 데이터 로드 실패')
        }
        
        const data = await response.json()
        const campaign = data.campaign
        
        // 폼 데이터 설정
        setFormData({
          title: campaign.title,
          description: (campaign as any).description,
          platform: (campaign as any).category,
          budget: campaign.budget.toString(),
          targetFollowers: (campaign as any).targetFollowers.toString(),
          startDate: new Date(campaign.startDate).toISOString().split('T')[0],
          endDate: new Date(campaign.endDate).toISOString().split('T')[0],
          requirements: campaign.requirements || '',
          hashtags: Array.isArray(campaign.hashtags) ? campaign.hashtags.join(', ') : '',
          imageUrl: campaign.imageUrl || '',
          youtubeUrl: campaign.youtubeUrl || ''
        })
        
        if (campaign.imageUrl) {
          setUploadedImage(campaign.imageUrl)
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('캠페인 데이터 로드 실패:', error)
        toast({
          title: '오류',
          description: '캠페인 정보를 불러오는데 실패했습니다.',
          variant: 'destructive'
        })
        router.push('/business/campaigns')
      }
    }
    
    fetchCampaignData()
  }, [params.id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      toast({
        title: '오류',
        description: '이미지 파일만 업로드 가능합니다.',
        variant: 'destructive'
      })
      return
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '오류',
        description: '파일 크기는 5MB 이하여야 합니다.',
        variant: 'destructive'
      })
      return
    }

    setImageUploading(true)

    try {
      // 이미지 리사이즈
      const resizedImage = await resizeImage(file, 800, 600)
      setUploadedImage(resizedImage)
      setFormData({ ...formData, imageUrl: resizedImage })
    } catch (err) {
      toast({
        title: '오류',
        description: '이미지 업로드에 실패했습니다.',
        variant: 'destructive'
      })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await apiPut(`/api/business/campaigns/${params.id}`, {
        ...formData,
        budget: parseInt(formData.budget),
        targetFollowers: parseInt(formData.targetFollowers),
        hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(Boolean),
        imageUrl: uploadedImage || formData.imageUrl
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '캠페인 수정에 실패했습니다.')
      }

      toast({
        title: '성공',
        description: '캠페인이 성공적으로 수정되었습니다.'
      })
      router.push(`/business/campaigns/${params.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.'
      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href={`/business/campaigns/${params.id}`} 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            캠페인 상세로 돌아가기
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">캠페인 수정</h1>
          <p className="text-gray-600 mt-2">캠페인 정보를 수정하세요.</p>
        </div>

        {/* 수정 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">캠페인 제목 *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
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
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="platform">플랫폼 *</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData({...formData, platform: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="TIKTOK">TikTok</SelectItem>
                  <SelectItem value="BLOG">Blog</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="startDate">시작일 *</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
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
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="requirements">상세 요구사항</Label>
              <Textarea
                id="requirements"
                rows={3}
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
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
              <div className="relative mt-2">
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
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button asChild variant="outline">
              <Link href={`/business/campaigns/${params.id}`}>
                취소
              </Link>
            </Button>
            
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? '저장 중...' : '캠페인 수정'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}