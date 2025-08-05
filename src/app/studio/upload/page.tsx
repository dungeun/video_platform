'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Film, Image, FileText, AlertCircle, X, CheckCircle } from 'lucide-react'
import { AuthService } from '@/lib/auth'

export default function StudioUpload() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    visibility: 'public'
  })

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB 제한
        setUploadError('파일 크기는 2GB를 초과할 수 없습니다.')
        return
      }
      setVideoFile(file)
      setUploadError(null)
      
      // 파일 이름에서 제목 자동 설정
      const titleFromFile = file.name.replace(/\.[^/.]+$/, "")
      setVideoData(prev => ({ ...prev, title: titleFromFile }))
    }
  }, [])

  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        setUploadError('썸네일 크기는 10MB를 초과할 수 없습니다.')
        return
      }
      setThumbnailFile(file)
      setUploadError(null)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!videoFile) {
      setUploadError('비디오 파일을 선택해주세요.')
      return
    }

    if (!videoData.title.trim()) {
      setUploadError('제목을 입력해주세요.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile)
      }
      formData.append('title', videoData.title)
      formData.append('description', videoData.description)
      formData.append('category', videoData.category)
      formData.append('tags', videoData.tags)
      formData.append('visibility', videoData.visibility)

      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          setUploadProgress(Math.round(percentComplete))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          setUploadSuccess(true)
          setTimeout(() => {
            router.push(`/videos/${response.videoId}`)
          }, 2000)
        } else {
          throw new Error('업로드 실패')
        }
      })

      xhr.addEventListener('error', () => {
        throw new Error('네트워크 오류')
      })

      const token = AuthService.getToken()
      xhr.open('POST', '/api/upload/video')
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('업로드 중 오류가 발생했습니다.')
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">비디오 업로드</h1>

        {uploadSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-green-800 mb-2">업로드 완료!</h2>
            <p className="text-green-600">비디오가 성공적으로 업로드되었습니다.</p>
            <p className="text-sm text-green-500 mt-2">잠시 후 비디오 페이지로 이동합니다...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 비디오 업로드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Film className="w-5 h-5 mr-2" />
                비디오 파일
              </h2>
              
              {!videoFile ? (
                <label className="block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 cursor-pointer transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1">클릭하여 비디오 파일 선택</p>
                    <p className="text-sm text-gray-500">MP4, AVI, MOV 등 (최대 2GB)</p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Film className="w-8 h-8 text-indigo-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{videoFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* 썸네일 업로드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2" />
                썸네일 이미지 (선택사항)
              </h2>
              
              {!thumbnailFile ? (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 cursor-pointer transition-colors">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1">클릭하여 썸네일 선택</p>
                    <p className="text-sm text-gray-500">JPG, PNG 등 (최대 10MB)</p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Image className="w-8 h-8 text-indigo-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{thumbnailFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(thumbnailFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThumbnailFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* 비디오 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                비디오 정보
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={videoData.title}
                    onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="비디오 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={videoData.description}
                    onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    placeholder="비디오에 대한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <select
                    value={videoData.category}
                    onChange={(e) => setVideoData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="entertainment">엔터테인먼트</option>
                    <option value="education">교육</option>
                    <option value="gaming">게임</option>
                    <option value="music">음악</option>
                    <option value="sports">스포츠</option>
                    <option value="tech">기술</option>
                    <option value="cooking">요리</option>
                    <option value="travel">여행</option>
                    <option value="vlog">일상</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    태그
                  </label>
                  <input
                    type="text"
                    value={videoData.tags}
                    onChange={(e) => setVideoData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="태그를 쉼표로 구분하여 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    공개 설정
                  </label>
                  <select
                    value={videoData.visibility}
                    onChange={(e) => setVideoData(prev => ({ ...prev, visibility: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="public">공개</option>
                    <option value="unlisted">일부 공개</option>
                    <option value="private">비공개</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 오류 메시지 */}
            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{uploadError}</p>
              </div>
            )}

            {/* 업로드 진행 상태 */}
            {uploading && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">업로드 중...</span>
                  <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/studio/dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={uploading}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || !videoFile}
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}