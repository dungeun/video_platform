/**
 * 비디오 처리 및 썸네일 생성 유틸리티
 */

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  format: string
  bitrate: number
  fps: number
}

export interface ThumbnailOptions {
  count?: number          // 생성할 썸네일 개수 (기본: 3)
  timestamps?: number[]   // 특정 시점의 썸네일 (초 단위)
  width?: number         // 썸네일 너비 (기본: 320)
  height?: number        // 썸네일 높이 (기본: 180)
  format?: 'jpg' | 'png' | 'webp'  // 썸네일 포맷 (기본: jpg)
}

/**
 * 브라우저에서 비디오 메타데이터 추출
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        format: file.type,
        bitrate: 0, // 브라우저에서는 정확한 비트레이트 추출 어려움
        fps: 0      // 브라우저에서는 FPS 추출 어려움
      }
      
      URL.revokeObjectURL(url)
      resolve(metadata)
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('비디오 메타데이터를 읽을 수 없습니다'))
    }
    
    video.src = url
  })
}

/**
 * 브라우저에서 비디오 썸네일 생성
 */
export async function generateThumbnails(
  file: File, 
  options: ThumbnailOptions = {}
): Promise<Blob[]> {
  const {
    count = 3,
    timestamps,
    width = 320,
    height = 180,
    format = 'jpg'
  } = options

  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다'))
        return
      }

      // 캔버스 크기 설정
      canvas.width = width
      canvas.height = height

      const url = URL.createObjectURL(file)
      video.src = url
      video.preload = 'metadata'

      await new Promise((loadResolve, loadReject) => {
        video.onloadedmetadata = () => loadResolve(void 0)
        video.onerror = () => loadReject(new Error('비디오를 로드할 수 없습니다'))
      })

      const duration = video.duration
      const thumbnails: Blob[] = []

      // 썸네일 생성할 시점들 계산
      const timePoints = timestamps || Array.from(
        { length: count }, 
        (_, i) => (duration / (count + 1)) * (i + 1)
      )

      for (const time of timePoints) {
        try {
          // 특정 시점으로 이동
          video.currentTime = Math.min(time, duration - 0.1)
          
          await new Promise((seekResolve) => {
            video.onseeked = () => seekResolve(void 0)
          })

          // 비디오 프레임을 캔버스에 그리기
          ctx.drawImage(video, 0, 0, width, height)

          // 캔버스를 Blob으로 변환
          const blob = await new Promise<Blob>((blobResolve, blobReject) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  blobResolve(blob)
                } else {
                  blobReject(new Error('썸네일 생성 실패'))
                }
              },
              `image/${format}`,
              format === 'jpg' ? 0.8 : undefined
            )
          })

          thumbnails.push(blob)
        } catch (error) {
          console.warn(`썸네일 생성 실패 (${time}초):`, error)
        }
      }

      URL.revokeObjectURL(url)
      
      if (thumbnails.length === 0) {
        reject(new Error('썸네일을 생성할 수 없습니다'))
      } else {
        resolve(thumbnails)
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 썸네일을 서버에 업로드
 */
export async function uploadThumbnail(
  thumbnail: Blob, 
  videoId: string, 
  index: number = 0
): Promise<string> {
  const formData = new FormData()
  formData.append('thumbnail', thumbnail, `thumbnail_${videoId}_${index}.jpg`)
  formData.append('videoId', videoId)
  formData.append('index', index.toString())

  // 토큰 가져오기 (localStorage와 쿠키 모두 확인)
  const token = localStorage.getItem('accessToken') || 
                document.cookie.split('; ')
                  .find(row => row.startsWith('auth-token='))
                  ?.split('=')[1] ||
                document.cookie.split('; ')
                  .find(row => row.startsWith('accessToken='))
                  ?.split('=')[1]

  console.log('🔑 업로드용 토큰 확인:', { hasToken: !!token, tokenLength: token?.length })

  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch('/api/videos/thumbnail', {
    method: 'POST',
    headers,
    body: formData
  })

  console.log('📡 썸네일 업로드 응답:', { 
    status: response.status, 
    statusText: response.statusText,
    ok: response.ok 
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ 썸네일 업로드 에러 응답:', errorText)
    
    let errorMessage = '썸네일 업로드 실패'
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error || errorJson.message || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    
    throw new Error(errorMessage)
  }

  const result = await response.json()
  return result.thumbnailUrl
}

/**
 * 비디오 업로드 완료 후 자동 썸네일 생성 및 업로드
 */
export async function processVideoThumbnails(
  file: File,
  videoId: string,
  options: ThumbnailOptions & { updateMetadata?: boolean } = {}
): Promise<{
  metadata: VideoMetadata
  thumbnails: string[]
  primaryThumbnail: string
}> {
  try {
    console.log('🎬 비디오 처리 시작:', { videoId, fileName: file.name })

    // 1. 비디오 메타데이터 추출
    const metadata = await extractVideoMetadata(file)
    console.log('📊 메타데이터 추출 완료:', metadata)

    // 2. 썸네일 생성
    const thumbnailBlobs = await generateThumbnails(file, {
      count: 3,
      width: 320,
      height: 180,
      format: 'jpg',
      ...options
    })
    console.log('🖼️ 썸네일 생성 완료:', thumbnailBlobs.length)

    // 3. 썸네일 업로드
    const thumbnailPromises = thumbnailBlobs.map((blob, index) =>
      uploadThumbnail(blob, videoId, index)
    )
    
    const thumbnailUrls = await Promise.all(thumbnailPromises)
    console.log('☁️ 썸네일 업로드 완료:', thumbnailUrls)

    // 4. 비디오 메타데이터 업데이트 (옵션)
    // TUS 업로드 시점에는 비디오가 아직 DB에 생성되지 않았으므로 기본값은 false
    if (options.updateMetadata) {
      await updateVideoMetadata(videoId, metadata, thumbnailUrls[0])
      console.log('✅ 비디오 메타데이터 업데이트 완료')
    }

    return {
      metadata,
      thumbnails: thumbnailUrls,
      primaryThumbnail: thumbnailUrls[0]
    }
  } catch (error) {
    console.error('❌ 비디오 처리 실패:', error)
    throw error
  }
}

/**
 * 비디오 메타데이터 업데이트
 */
async function updateVideoMetadata(
  videoId: string, 
  metadata: VideoMetadata, 
  thumbnailUrl: string
): Promise<void> {
  // 토큰 가져오기 (localStorage와 쿠키 모두 확인)
  const token = localStorage.getItem('accessToken') || 
                document.cookie.split('; ')
                  .find(row => row.startsWith('auth-token='))
                  ?.split('=')[1] ||
                document.cookie.split('; ')
                  .find(row => row.startsWith('accessToken='))
                  ?.split('=')[1]

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api/videos/${videoId}/metadata`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      duration: Math.round(metadata.duration),
      width: metadata.width,
      height: metadata.height,
      thumbnailUrl,
      status: 'published'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ 메타데이터 업데이트 에러:', errorText)
    
    let errorMessage = '메타데이터 업데이트 실패'
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error || errorJson.message || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    
    throw new Error(errorMessage)
  }
}

/**
 * 파일이 비디오인지 확인
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

/**
 * 지원되는 비디오 포맷인지 확인
 */
export function isSupportedVideoFormat(file: File): boolean {
  const supportedFormats = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime',
    'video/x-msvideo',  // AVI alternative
    'video/x-matroska', // MKV
    'video/mpeg',       // MPEG
    'video/3gpp',       // 3GP
    'video/3gpp2'       // 3G2
  ]
  
  // MIME 타입이 비어있거나 application/octet-stream인 경우 확장자로 체크
  if (!file.type || file.type === 'application/octet-stream') {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'mpeg', 'mpg', '3gp', '3g2']
    return videoExtensions.includes(extension || '')
  }
  
  return supportedFormats.includes(file.type)
}