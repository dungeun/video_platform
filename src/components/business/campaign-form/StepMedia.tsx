import { useRef, useState } from 'react'
import Image from 'next/image'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Upload, X, Youtube, ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StepMediaProps {
  formData: {
    headerImageUrl: string
    thumbnailImageUrl: string
    youtubeUrl: string
  }
  setFormData: (data: any) => void
  productImages: string[]
  setProductImages: (images: string[]) => void
}

// YouTube 동영상 ID 추출 함수
function extractYoutubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export default function StepMedia({ formData, setFormData, productImages, setProductImages }: StepMediaProps) {
  const { toast } = useToast()
  const headerImageRef = useRef<HTMLInputElement>(null)
  const thumbnailImageRef = useRef<HTMLInputElement>(null)
  const productImageRefs = useRef<(HTMLInputElement | null)[]>([null, null, null])
  const [uploadingHeader, setUploadingHeader] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingProduct, setUploadingProduct] = useState<boolean[]>([false, false, false])

  const handleImageUpload = async (
    file: File,
    type: 'header' | 'thumbnail' | 'product',
    index?: number
  ) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: '오류',
        description: '이미지 파일만 업로드 가능합니다.',
        variant: 'destructive'
      })
      return
    }

    // Set uploading state
    if (type === 'header') setUploadingHeader(true)
    else if (type === 'thumbnail') setUploadingThumbnail(true)
    else if (type === 'product' && index !== undefined) {
      const newUploading = [...uploadingProduct]
      newUploading[index] = true
      setUploadingProduct(newUploading)
    }

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('type', 'campaign')  // 파일 타입 추가

    try {
      // 사용자 정보 가져오기
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token') || ''
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || user?.userId || ''
        },
        body: formDataUpload
      })

      if (!response.ok) throw new Error('Upload failed')
      
      const data = await response.json()
      
      // Update state based on type
      if (type === 'header') {
        setFormData({ ...formData, headerImageUrl: data.url })
        toast({
          title: '성공',
          description: '헤더 배경 이미지가 업로드되었습니다.'
        })
      } else if (type === 'thumbnail') {
        setFormData({ ...formData, thumbnailImageUrl: data.url })
        toast({
          title: '성공',
          description: '썸네일 이미지가 업로드되었습니다.'
        })
      } else if (type === 'product' && index !== undefined) {
        const newImages = [...productImages]
        newImages[index] = data.url
        setProductImages(newImages)
        toast({
          title: '성공',
          description: `상품 이미지 ${index + 1}이 업로드되었습니다.`
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: '오류',
        description: '이미지 업로드에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      // Reset uploading state
      if (type === 'header') setUploadingHeader(false)
      else if (type === 'thumbnail') setUploadingThumbnail(false)
      else if (type === 'product' && index !== undefined) {
        const newUploading = [...uploadingProduct]
        newUploading[index] = false
        setUploadingProduct(newUploading)
      }
    }
  }

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleImageUpload(file, 'header')
  }

  const handleThumbnailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleImageUpload(file, 'thumbnail')
  }

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (file) await handleImageUpload(file, 'product', index)
  }

  const removeProductImage = (index: number) => {
    const newImages = [...productImages]
    newImages[index] = ''
    setProductImages(newImages)
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">이미지 및 미디어</h2>
      <div className="space-y-8">
        {/* 헤더 배경 이미지 */}
        <div>
          <Label htmlFor="headerImage">상세페이지 헤더 배경 이미지</Label>
          <p className="text-sm text-gray-500 mb-2">캠페인 상세 페이지 상단에 표시되는 대형 배경 이미지입니다. (권장: 1920x600px)</p>
          <div className="mt-2">
            {formData.headerImageUrl ? (
              <div className="relative w-full aspect-[16/5] rounded-lg overflow-hidden">
                <Image
                  src={formData.headerImageUrl}
                  alt="헤더 배경 이미지"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({...formData, headerImageUrl: ''})}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => headerImageRef.current?.click()}
                className="w-full aspect-[16/5] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {uploadingHeader ? '업로드 중...' : '클릭하여 이미지 업로드'}
                </p>
              </div>
            )}
            <input
              ref={headerImageRef}
              type="file"
              accept="image/*"
              onChange={handleHeaderImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* 썸네일 이미지 */}
        <div>
          <Label htmlFor="thumbnailImage">썸네일 이미지</Label>
          <p className="text-sm text-gray-500 mb-2">목록에서 표시되는 대표 이미지입니다. (권장: 600x400px)</p>
          <div className="mt-2">
            {formData.thumbnailImageUrl ? (
              <div className="relative w-full max-w-sm aspect-[3/2] rounded-lg overflow-hidden">
                <Image
                  src={formData.thumbnailImageUrl}
                  alt="썸네일 이미지"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({...formData, thumbnailImageUrl: ''})}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => thumbnailImageRef.current?.click()}
                className="w-full max-w-sm aspect-[3/2] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  {uploadingThumbnail ? '업로드 중...' : '클릭하여 이미지 업로드'}
                </p>
              </div>
            )}
            <input
              ref={thumbnailImageRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* 상품소개 이미지 */}
        <div>
          <Label>상품소개 이미지 (3장)</Label>
          <p className="text-sm text-gray-500 mb-2">상품을 소개하는 이미지 3장을 업로드해주세요. (권장: 800x800px)</p>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {productImages.map((image, index) => (
              <div key={index}>
                {image ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`상품 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeProductImage(index)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => productImageRefs.current[index]?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">
                      {uploadingProduct[index] ? '업로드 중...' : `이미지 ${index + 1}`}
                    </p>
                  </div>
                )}
                <input
                  ref={el => productImageRefs.current[index] = el}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProductImageUpload(e, index)}
                  className="hidden"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 유튜브 URL */}
        <div>
          <Label htmlFor="youtubeUrl">유튜브 영상 URL (선택)</Label>
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
    </>
  )
}