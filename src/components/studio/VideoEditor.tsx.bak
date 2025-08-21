'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Save, Calendar, Eye, EyeOff, Link, Globe, Tag } from 'lucide-react'

interface Video {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  duration: number
  status: 'published' | 'draft' | 'scheduled' | 'processing'
  visibility: 'public' | 'private' | 'unlisted'
  uploadedAt: string
  publishedAt?: string
  scheduledAt?: string
  views: number
  likes: number
  comments: number
  revenue: number
  category?: string
  tags?: string[]
}

interface VideoEditorProps {
  video: Video
  onSave: (videoId: string, updates: Partial<Video>) => void
  onCancel: () => void
}

export default function VideoEditor({ video, onSave, onCancel }: VideoEditorProps) {
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description,
    category: video.category || 'general',
    tags: video.tags || [],
    visibility: video.visibility,
    status: video.status,
    scheduledAt: video.scheduledAt || '',
    thumbnailUrl: video.thumbnailUrl
  })
  
  const [tagInput, setTagInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState(video.thumbnailUrl)

  // 자동 생성된 썸네일 로드
  useEffect(() => {
    loadAutoThumbnails()
  }, [video.id])

  const loadAutoThumbnails = async () => {
    try {
      const response = await fetch(`/api/videos/${video.id}/thumbnails`)
      if (response.ok) {
        const data = await response.json()
        setThumbnails(data.thumbnails || [])
      }
    } catch (error) {
      console.error('Failed to load thumbnails:', error)
    }
  }

  // 태그 추가
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // 커스텀 썸네일 업로드
  const handleThumbnailUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('thumbnail', file)

    try {
      const response = await fetch(`/api/videos/${video.id}/thumbnail`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedThumbnail(data.thumbnailUrl)
        setFormData(prev => ({ ...prev, thumbnailUrl: data.thumbnailUrl }))
      }
    } catch (error) {
      console.error('Failed to upload thumbnail:', error)
      alert('썸네일 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // 저장
  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    setIsSaving(true)
    
    const updates: Partial<Video> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      tags: formData.tags,
      visibility: formData.visibility,
      status: formData.status,
      thumbnailUrl: selectedThumbnail
    }

    if (formData.status === 'scheduled' && formData.scheduledAt) {
      updates.scheduledAt = formData.scheduledAt
    }

    await onSave(video.id, updates)
    setIsSaving(false)
  }

  const categories = [
    { value: 'general', label: '일반' },
    { value: 'gaming', label: '게임' },
    { value: 'music', label: '음악' },
    { value: 'education', label: '교육' },
    { value: 'entertainment', label: '엔터테인먼트' },
    { value: 'sports', label: '스포츠' },
    { value: 'tech', label: '기술' },
    { value: 'news', label: '뉴스' },
    { value: 'lifestyle', label: '라이프스타일' },
    { value: 'cooking', label: '요리' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">비디오 편집</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 왼쪽: 기본 정보 */}
            <div className="space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  maxLength={100}
                />
                <p className="mt-1 text-sm text-gray-500">{formData.title.length}/100</p>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  maxLength={5000}
                />
                <p className="mt-1 text-sm text-gray-500">{formData.description.length}/5000</p>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  태그
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="태그 입력 후 Enter"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 오른쪽: 썸네일 및 설정 */}
            <div className="space-y-6">
              {/* 썸네일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  썸네일
                </label>
                
                {/* 현재 썸네일 */}
                <div className="mb-4">
                  <img
                    src={selectedThumbnail || '/placeholder-video.jpg'}
                    alt="Current thumbnail"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                </div>

                {/* 자동 생성 썸네일 */}
                {thumbnails.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">자동 생성된 썸네일</p>
                    <div className="grid grid-cols-3 gap-2">
                      {thumbnails.map((thumb, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedThumbnail(thumb)}
                          className={`relative aspect-video rounded overflow-hidden border-2 ${
                            selectedThumbnail === thumb ? 'border-red-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={thumb}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 커스텀 썸네일 업로드 */}
                <div>
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {isUploading ? '업로드 중...' : '커스텀 썸네일 업로드'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              {/* 공개 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  공개 설정
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as Video['visibility'] }))}
                      className="text-red-600"
                    />
                    <Eye className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">전체 공개</p>
                      <p className="text-sm text-gray-500">모든 사용자가 볼 수 있습니다</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visibility"
                      value="unlisted"
                      checked={formData.visibility === 'unlisted'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as Video['visibility'] }))}
                      className="text-red-600"
                    />
                    <Link className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">일부 공개</p>
                      <p className="text-sm text-gray-500">링크를 가진 사용자만 볼 수 있습니다</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={formData.visibility === 'private'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as Video['visibility'] }))}
                      className="text-red-600"
                    />
                    <EyeOff className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium">비공개</p>
                      <p className="text-sm text-gray-500">나만 볼 수 있습니다</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 게시 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  게시 상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Video['status'] }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="published">즉시 공개</option>
                  <option value="draft">초안 저장</option>
                  <option value="scheduled">예약 공개</option>
                </select>
              </div>

              {/* 예약 공개 날짜 */}
              {formData.status === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    예약 날짜 및 시간
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button
              onClick={onCancel}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.title.trim()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}