'use client'

import { useState, useRef, useCallback } from 'react'
// TUS 클라이언트 라이브러리
// npm install tus-js-client 필요

interface TUSUploadOptions {
  endpoint?: string
  chunkSize?: number
  retryDelays?: number[]
  maxParallelUploads?: number
  metadata?: Record<string, string>
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

interface TUSUploadState {
  isUploading: boolean
  progress: number
  error: string | null
  uploadedBytes: number
  totalBytes: number
  uploadUrl: string | null
  canResume: boolean
  isPaused: boolean
}

export function useTUSUpload(options: TUSUploadOptions = {}) {
  const [state, setState] = useState<TUSUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedBytes: 0,
    totalBytes: 0,
    uploadUrl: null,
    canResume: false,
    isPaused: false
  })

  const uploadRef = useRef<any>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    endpoint = 'https://main.one-q.xyz/api/upload/tus', // 프로덕션 서버 강제 설정
    chunkSize = 5 * 1024 * 1024, // 5MB 청크
    retryDelays = [0, 3000, 5000, 10000, 20000],
    maxParallelUploads = 1,
    metadata = {},
    onProgress,
    onSuccess,
    onError
  } = options

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedBytes: 0,
      totalBytes: 0,
      uploadUrl: null,
      canResume: false,
      isPaused: false
    })
  }, [])

  const startUpload = useCallback(async (file: File, additionalMetadata?: Record<string, string>) => {
    if (!file) return

    console.log('🚀 Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      endpoint,
      metadata: { ...metadata, ...additionalMetadata }
    })

    // TUS localStorage 캐시 강제 정리 (localhost:3001 캐시 제거)
    try {
      console.log('🧹 Clearing TUS localStorage cache...')
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('tus::') || key.includes('localhost:3001')) {
          console.log('🗑️ Removing cached TUS key:', key)
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('⚠️ Failed to clear TUS cache:', error)
    }

    setState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      totalBytes: file.size,
      canResume: true,
      isPaused: false
    }))

    // 업로드 중단 컨트롤러
    abortControllerRef.current = new AbortController()

    try {
      // TUS 클라이언트 동적 import 시도
      try {
        console.log('📦 Importing TUS client...')
        const { Upload } = await import('tus-js-client')
        console.log('✅ TUS client imported, starting TUS upload...')
        await startTUSUpload(file, additionalMetadata, Upload)
      } catch (tusError) {
        console.warn('⚠️ TUS client not available, falling back to regular upload:', tusError)
        await startRegularUpload(file, additionalMetadata)
      }

    } catch (error) {
      console.error('❌ Failed to start upload:', error)
      const errorMessage = error instanceof Error ? error.message : '업로드 시작에 실패했습니다'
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }))
      
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [endpoint, chunkSize, retryDelays, metadata, onProgress, onSuccess, onError])

  // TUS 업로드 실행
  const startTUSUpload = async (file: File, additionalMetadata: Record<string, string> = {}, Upload: any) => {
    // 파일 메타데이터 준비
    const fileMetadata = {
      filename: file.name,
      filetype: file.type,
      filesize: file.size.toString(),
      ...metadata,
      ...additionalMetadata
    }

    console.log('🔧 Creating TUS upload instance:', {
      endpoint,
      chunkSize,
      retryDelays,
      metadata: fileMetadata
    })

    // TUS 업로드 인스턴스 생성
    const upload = new Upload(file, {
      endpoint,
      chunkSize,
      retryDelays,
      metadata: fileMetadata,
      
      onError: (error: Error) => {
        console.error('❌ TUS Upload failed:', error)
        setState(prev => ({
          ...prev,
          isUploading: false,
          error: error.message || '업로드 중 오류가 발생했습니다',
          canResume: true
        }))
        onError?.(error)
      },

      onProgress: (bytesUploaded: number, bytesTotal: number) => {
        const progress = Math.round((bytesUploaded / bytesTotal) * 100)
        
        console.log(`📊 Upload progress: ${progress}% (${bytesUploaded}/${bytesTotal} bytes)`)
        
        setState(prev => ({
          ...prev,
          progress,
          uploadedBytes: bytesUploaded,
          totalBytes: bytesTotal
        }))

        onProgress?.(bytesUploaded, bytesTotal)
      },

      onSuccess: () => {
        // TUS 업로드 완료 시 URL은 upload.url에서 가져옴
        const uploadUrl = upload.url || ''
        
        console.log('🎉 TUS Upload completed successfully:', uploadUrl)
        
        setState(prev => ({
          ...prev,
          isUploading: false,
          progress: 100,
          uploadUrl,
          canResume: false
        }))

        onSuccess?.(uploadUrl)
      },

      // localStorage 저장 비활성화 (캐시 문제 방지)
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: true,

      // HTTP 헤더 설정
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    uploadRef.current = upload
    console.log('▶️ Starting TUS upload...')
    await upload.start()
    console.log('🔄 TUS upload process initiated')
  }

  // 일반 업로드 (TUS 미지원 시)
  const startRegularUpload = async (file: File, additionalMetadata: Record<string, string> = {}) => {
    console.log('🔄 Starting regular upload as fallback...')
    
    const formData = new FormData()
    formData.append('file', file)
    
    // 메타데이터 추가
    const allMetadata = { ...metadata, ...additionalMetadata }
    Object.entries(allMetadata).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const fallbackEndpoint = '/api/upload/simple' // 로컬 폴백
    console.log('📡 Using fallback endpoint:', fallbackEndpoint)

    const xhr = new XMLHttpRequest()
    
    // 진행률 이벤트
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        
        setState(prev => ({
          ...prev,
          progress,
          uploadedBytes: event.loaded,
          totalBytes: event.total
        }))

        onProgress?.(event.loaded, event.total)
      }
    })

    // 완료 이벤트
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          const uploadUrl = response.url || response.fileUrl || `${endpoint}/${response.fileId || file.name}`
          
          setState(prev => ({
            ...prev,
            isUploading: false,
            progress: 100,
            uploadUrl,
            canResume: false
          }))

          onSuccess?.(uploadUrl)
        } catch (parseError) {
          throw new Error('서버 응답을 파싱할 수 없습니다')
        }
      } else {
        throw new Error(`업로드 실패: ${xhr.status} ${xhr.statusText}`)
      }
    })

    // 에러 이벤트
    xhr.addEventListener('error', () => {
      throw new Error('네트워크 오류로 업로드에 실패했습니다')
    })

    // 중단 처리
    if (abortControllerRef.current) {
      abortControllerRef.current.signal.addEventListener('abort', () => {
        xhr.abort()
      })
    }

    // 요청 시작
    xhr.open('POST', fallbackEndpoint)
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('accessToken') || ''}`)
    xhr.send(formData)

    // XMLHttpRequest를 ref에 저장 (일시정지 등을 위해)
    uploadRef.current = {
      abort: () => xhr.abort(),
      start: () => {}, // 이미 시작됨
      url: null
    }
  }

  const pauseUpload = useCallback(() => {
    if (uploadRef.current && state.isUploading) {
      uploadRef.current.abort()
      setState(prev => ({
        ...prev,
        isPaused: true,
        isUploading: false
      }))
    }
  }, [state.isUploading])

  const resumeUpload = useCallback(() => {
    if (uploadRef.current && state.isPaused) {
      setState(prev => ({
        ...prev,
        isPaused: false,
        isUploading: true,
        error: null
      }))
      uploadRef.current.start()
    }
  }, [state.isPaused])

  const cancelUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort()
      
      // 지문 제거 (재개 불가능하게 만듦)
      if (uploadRef.current.options && uploadRef.current.options.fingerprint) {
        try {
          const fingerprint = uploadRef.current.options.fingerprint(uploadRef.current.file, uploadRef.current.options)
          localStorage.removeItem(`tus::${fingerprint}::url`)
        } catch (error) {
          console.log('Could not remove fingerprint:', error)
        }
      }

      uploadRef.current = null
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    resetState()
  }, [resetState])

  const retryUpload = useCallback(() => {
    if (uploadRef.current && state.error) {
      setState(prev => ({
        ...prev,
        error: null,
        isUploading: true
      }))
      uploadRef.current.start()
    }
  }, [state.error])

  // 포맷된 업로드 정보
  const uploadInfo = {
    formattedProgress: `${state.progress}%`,
    formattedSpeed: calculateUploadSpeed(state.uploadedBytes, state.totalBytes),
    formattedSize: `${formatBytes(state.uploadedBytes)} / ${formatBytes(state.totalBytes)}`,
    estimatedTimeRemaining: calculateETA(state.uploadedBytes, state.totalBytes)
  }

  return {
    ...state,
    uploadInfo,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    resetState
  }
}

// 헬퍼 함수들
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function calculateUploadSpeed(uploadedBytes: number, totalBytes: number): string {
  // 실제 구현에서는 시간 추적이 필요함
  // 여기서는 간단한 추정치 반환
  if (uploadedBytes === 0) return '0 B/s'
  
  const estimatedSpeed = uploadedBytes / 10 // 10초 가정
  return `${formatBytes(estimatedSpeed)}/s`
}

function calculateETA(uploadedBytes: number, totalBytes: number): string {
  if (uploadedBytes === 0 || uploadedBytes >= totalBytes) return '계산 중...'
  
  const remainingBytes = totalBytes - uploadedBytes
  const estimatedSpeed = uploadedBytes / 10 // 10초 가정
  const remainingSeconds = remainingBytes / estimatedSpeed
  
  if (remainingSeconds < 60) {
    return `${Math.round(remainingSeconds)}초`
  } else if (remainingSeconds < 3600) {
    return `${Math.round(remainingSeconds / 60)}분`
  } else {
    return `${Math.round(remainingSeconds / 3600)}시간`
  }
}