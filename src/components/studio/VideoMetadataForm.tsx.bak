'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Image as ImageIcon, 
  Tag, 
  Eye, 
  EyeOff, 
  DollarSign,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  X,
  Upload
} from 'lucide-react'

export interface VideoMetadata {
  title: string
  description: string
  category: string
  tags: string[]
  visibility: 'public' | 'unlisted' | 'private' | 'scheduled'
  scheduledAt?: string
  thumbnail?: File | string
  isCommentsEnabled: boolean
  isRatingsEnabled: boolean
  isMonetizationEnabled: boolean
  ageRestriction: boolean
  language: string
  license: string
}

interface VideoMetadataFormProps {
  initialData?: Partial<VideoMetadata>
  onSubmit: (metadata: VideoMetadata) => void
  onSave?: (metadata: VideoMetadata) => void
  isSubmitting?: boolean
  showAdvanced?: boolean
  className?: string
  generatedThumbnails?: string[]
}

const categories = [
  { value: 'entertainment', label: '엔터테인먼트' },
  { value: 'education', label: '교육' },
  { value: 'gaming', label: '게임' },
  { value: 'music', label: '음악' },
  { value: 'sports', label: '스포츠' },
  { value: 'technology', label: '기술' },
  { value: 'cooking', label: '요리' },
  { value: 'travel', label: '여행' },
  { value: 'vlog', label: '일상/브이로그' },
  { value: 'news', label: '뉴스' },
  { value: 'comedy', label: '코미디' },
  { value: 'beauty', label: '뷰티' },
  { value: 'health', label: '건강' },
  { value: 'art', label: '예술' },
  { value: 'science', label: '과학' },
  { value: 'other', label: '기타' }
]

const languages = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' }
]

const licenses = [
  { value: 'standard', label: '표준 YouTube 라이선스' },
  { value: 'creative_commons', label: 'Creative Commons' }
]

export default function VideoMetadataForm({
  initialData = {},
  onSubmit,
  onSave,
  isSubmitting = false,
  showAdvanced = true,
  className,
  generatedThumbnails = []
}: VideoMetadataFormProps) {
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    category: '',
    tags: [],
    visibility: 'public',
    thumbnail: undefined,
    isCommentsEnabled: true,
    isRatingsEnabled: true,
    isMonetizationEnabled: false,
    ageRestriction: false,
    language: 'ko',
    license: 'standard',
    ...initialData
  })

  const [tagInput, setTagInput] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<number>(-1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 자동 생성된 썸네일이 있고 사용자가 아직 선택하지 않았으면 첫 번째 썸네일을 자동 선택
  React.useEffect(() => {
    if (generatedThumbnails.length > 0 && selectedThumbnailIndex === -1 && !metadata.thumbnail) {
      setSelectedThumbnailIndex(0)
      setMetadata(prev => ({ ...prev, thumbnail: generatedThumbnails[0] }))
      setThumbnailPreview(generatedThumbnails[0])
    }
  }, [generatedThumbnails, selectedThumbnailIndex, metadata.thumbnail])

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!metadata.title.trim()) {
      newErrors.title = '제목은 필수입니다'
    } else if (metadata.title.length > 100) {
      newErrors.title = '제목은 100자를 초과할 수 없습니다'
    }

    if (metadata.description.length > 5000) {
      newErrors.description = '설명은 5000자를 초과할 수 없습니다'
    }

    if (metadata.tags.length > 15) {
      newErrors.tags = '태그는 15개를 초과할 수 없습니다'
    }

    if (metadata.visibility === 'scheduled' && !metadata.scheduledAt) {
      newErrors.scheduledAt = '예약 게시를 선택한 경우 날짜와 시간을 설정해야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [metadata])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(metadata)
    }
  }

  const handleSave = () => {
    if (validateForm() && onSave) {
      onSave(metadata)
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, thumbnail: '썸네일 크기는 5MB를 초과할 수 없습니다' }))
        return
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, thumbnail: '이미지 파일만 업로드할 수 있습니다' }))
        return
      }

      setMetadata(prev => ({ ...prev, thumbnail: file }))
      setSelectedThumbnailIndex(-1) // 생성된 썸네일 선택 해제
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // 에러 제거
      setErrors(prev => {
        const { thumbnail, ...rest } = prev
        return rest
      })
    }
  }

  const handleGeneratedThumbnailSelect = (index: number) => {
    setSelectedThumbnailIndex(index)
    setMetadata(prev => ({ ...prev, thumbnail: generatedThumbnails[index] }))
    setThumbnailPreview(generatedThumbnails[index])
    
    // 에러 제거
    setErrors(prev => {
      const { thumbnail, ...rest } = prev
      return rest
    })
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !metadata.tags.includes(tag) && metadata.tags.length < 15) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
      
      // 태그 에러 제거
      setErrors(prev => {
        const { tags, ...rest } = prev
        return rest
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* 기본 정보 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-200">제목 *</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="비디오 제목을 입력하세요"
                maxLength={100}
                className={`bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 ${errors.title ? 'border-destructive' : ''}`}
              />
              <div className="flex justify-between text-sm">
                {errors.title && (
                  <span className="text-destructive">{errors.title}</span>
                )}
                <span className={`ml-auto ${metadata.title.length > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {metadata.title.length}/100
                </span>
              </div>
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-200">설명</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="비디오에 대한 설명을 입력하세요"
                rows={4}
                maxLength={5000}
                className={`bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 ${errors.description ? 'border-destructive' : ''}`}
              />
              <div className="flex justify-between text-sm">
                {errors.description && (
                  <span className="text-destructive">{errors.description}</span>
                )}
                <span className={`ml-auto ${metadata.description.length > 4500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {metadata.description.length}/5000
                </span>
              </div>
            </div>

            {/* 카테고리와 언어 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-200">카테고리</Label>
                <Select value={metadata.category} onValueChange={(value) => 
                  setMetadata(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="카테고리 선택" className="text-gray-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-gray-600">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-gray-200">언어</Label>
                <Select value={metadata.language} onValueChange={(value) => 
                  setMetadata(prev => ({ ...prev, language: value }))
                }>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="text-white hover:bg-gray-600">
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 썸네일 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ImageIcon className="h-5 w-5" />
              썸네일
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 자동 생성된 썸네일 */}
            {generatedThumbnails.length > 0 && (
              <div className="space-y-3">
                <Label className="text-gray-200 text-sm font-medium">자동 생성된 썸네일</Label>
                <div className="grid grid-cols-3 gap-3">
                  {generatedThumbnails.map((thumbnail, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedThumbnailIndex === index
                          ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => handleGeneratedThumbnailSelect(index)}
                    >
                      <img
                        src={thumbnail}
                        alt={`자동 생성 썸네일 ${index + 1}`}
                        className="w-full h-16 object-cover"
                      />
                      {selectedThumbnailIndex === index && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-blue-500 rounded-full p-1">
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 현재 선택된 썸네일 미리보기 */}
            <div className="flex items-center gap-4">
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="썸네일 미리보기"
                    className="w-32 h-18 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-gray-900 hover:bg-gray-800"
                    onClick={() => {
                      setMetadata(prev => ({ ...prev, thumbnail: undefined }))
                      setThumbnailPreview(null)
                      setSelectedThumbnailIndex(-1)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-18 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
              
              <div className="flex-1">
                <Label htmlFor="thumbnail" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-200">
                    <Upload className="h-4 w-4" />
                    직접 업로드
                  </div>
                </Label>
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-600 text-gray-200 hover:bg-gray-700"
                  onClick={() => document.getElementById('thumbnail')?.click()}
                >
                  파일 선택
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  1280x720 권장, 최대 5MB
                </p>
                {errors.thumbnail && (
                  <p className="text-xs text-destructive mt-1">{errors.thumbnail}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 태그 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Tag className="h-5 w-5" />
              태그
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="태그 입력 후 Enter"
                disabled={metadata.tags.length >= 15}
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Button
                type="button"
                variant="outline"
                className="border-gray-600 text-gray-200 hover:bg-gray-700"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || metadata.tags.length >= 15}
              >
                추가
              </Button>
            </div>
            
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 bg-gray-700 text-gray-200 border-gray-600"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              {errors.tags && (
                <span className="text-destructive">{errors.tags}</span>
              )}
              <span className={`ml-auto ${metadata.tags.length > 12 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {metadata.tags.length}/15
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 공개 설정 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Eye className="h-5 w-5" />
              공개 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-200">공개 범위</Label>
              <Select value={metadata.visibility} onValueChange={(value: any) => 
                setMetadata(prev => ({ ...prev, visibility: value }))
              }>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="public" className="text-white hover:bg-gray-600">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      공개 - 누구나 시청 가능
                    </div>
                  </SelectItem>
                  <SelectItem value="unlisted" className="text-white hover:bg-gray-600">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      일부 공개 - 링크를 아는 사람만
                    </div>
                  </SelectItem>
                  <SelectItem value="private" className="text-white hover:bg-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      비공개 - 본인만
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled" className="text-white hover:bg-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      예약 게시
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 예약 게시 설정 */}
            {metadata.visibility === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt" className="text-gray-200">게시 일시</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={metadata.scheduledAt || ''}
                  onChange={(e) => setMetadata(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className={`bg-gray-700 border-gray-600 text-white ${errors.scheduledAt ? 'border-destructive' : ''}`}
                />
                {errors.scheduledAt && (
                  <p className="text-sm text-destructive">{errors.scheduledAt}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 고급 설정 */}
        {showAdvanced && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">고급 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="comments" className="text-gray-200">댓글 허용</Label>
                    <p className="text-sm text-gray-400">시청자가 댓글을 작성할 수 있습니다</p>
                  </div>
                  <Switch
                    id="comments"
                    checked={metadata.isCommentsEnabled}
                    onCheckedChange={(checked) => 
                      setMetadata(prev => ({ ...prev, isCommentsEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ratings" className="text-gray-200">평가 허용</Label>
                    <p className="text-sm text-gray-400">시청자가 좋아요/싫어요를 표시할 수 있습니다</p>
                  </div>
                  <Switch
                    id="ratings"
                    checked={metadata.isRatingsEnabled}
                    onCheckedChange={(checked) => 
                      setMetadata(prev => ({ ...prev, isRatingsEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="monetization" className="text-gray-200">수익 창출</Label>
                    <p className="text-sm text-gray-400">광고를 통한 수익 창출을 허용합니다</p>
                  </div>
                  <Switch
                    id="monetization"
                    checked={metadata.isMonetizationEnabled}
                    onCheckedChange={(checked) => 
                      setMetadata(prev => ({ ...prev, isMonetizationEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="age-restriction" className="text-gray-200">연령 제한</Label>
                    <p className="text-sm text-gray-400">18세 이상만 시청 가능</p>
                  </div>
                  <Switch
                    id="age-restriction"
                    checked={metadata.ageRestriction}
                    onCheckedChange={(checked) => 
                      setMetadata(prev => ({ ...prev, ageRestriction: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">라이선스</Label>
                <Select value={metadata.license} onValueChange={(value) => 
                  setMetadata(prev => ({ ...prev, license: value }))
                }>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {licenses.map((license) => (
                      <SelectItem key={license.value} value={license.value} className="text-white hover:bg-gray-600">
                        {license.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 전체 에러 메시지 */}
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              입력한 정보를 다시 확인해주세요.
            </AlertDescription>
          </Alert>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-between">
          {onSave && (
            <Button
              type="button"
              variant="outline"
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              임시저장
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button
              type="submit"
              disabled={isSubmitting || !metadata.title.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  업로드 중...
                </>
              ) : (
                '업로드 완료'
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}