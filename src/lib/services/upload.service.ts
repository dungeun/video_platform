import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'
import sharp from 'sharp'

export interface UploadResult {
  url: string
  filename: string
  size: number
  type: string
}

export interface ImageResizeOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface VideoProcessOptions {
  generateThumbnail?: boolean
  thumbnailTime?: number // seconds
  maxDuration?: number // seconds
  quality?: 'low' | 'medium' | 'high'
}

// Video file constants
export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/mov',
  'video/quicktime'
] as const

export const MAX_VIDEO_SIZE_MB = 10 * 1024 // 10GB
export const MAX_IMAGE_SIZE_MB = 15

export class UploadService {
  private uploadDir = join(process.cwd(), 'public', 'uploads')

  constructor() {
    this.ensureUploadDir()
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true })
    } catch (error) {
      console.error('Upload directory creation failed:', error)
    }
  }

  /**
   * 파일 업로드 처리 (이미지 및 비디오 지원)
   */
  async uploadFile(
    file: File,
    subfolder: string = '',
    options?: ImageResizeOptions | VideoProcessOptions
  ): Promise<UploadResult> {
    try {
      // 파일 타입 및 크기 검증
      this.validateFile(file)

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 파일명 생성 (timestamp + random)
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 10)
      const extension = file.name.split('.').pop()?.toLowerCase()
      const filename = `${timestamp}_${randomString}.${extension}`

      // 업로드 경로 설정
      const uploadPath = subfolder 
        ? join(this.uploadDir, subfolder)
        : this.uploadDir

      await mkdir(uploadPath, { recursive: true })

      let processedBuffer: Buffer = buffer
      let thumbnailUrl: string | undefined

      // 이미지 파일인 경우 리사이징 처리
      if (this.isImageFile(file.type)) {
        processedBuffer = await this.resizeImage(buffer, options as ImageResizeOptions) as Buffer
      }

      // 비디오 파일인 경우 썸네일 생성
      if (this.isVideoFile(file.type) && (options as VideoProcessOptions)?.generateThumbnail) {
        const filePath = join(uploadPath, filename)
        await writeFile(filePath, processedBuffer)
        
        thumbnailUrl = await this.generateVideoThumbnail(
          filePath, 
          uploadPath, 
          timestamp, 
          (options as VideoProcessOptions)?.thumbnailTime || 1
        )
      } else if (!this.isVideoFile(file.type)) {
        // 비디오가 아닌 경우에만 파일 저장 (비디오는 위에서 이미 저장됨)
        const filePath = join(uploadPath, filename)
        await writeFile(filePath, processedBuffer)
      }

      // URL 생성
      const url = subfolder 
        ? `/uploads/${subfolder}/${filename}`
        : `/uploads/${filename}`

      const result: UploadResult & { thumbnailUrl?: string } = {
        url,
        filename,
        size: processedBuffer.length,
        type: file.type
      }

      if (thumbnailUrl) {
        result.thumbnailUrl = thumbnailUrl
      }

      return result
    } catch (error) {
      console.error('File upload failed:', error)
      throw new Error('파일 업로드에 실패했습니다.')
    }
  }

  /**
   * Base64 이미지 업로드 처리
   */
  async uploadBase64Image(
    base64Data: string,
    subfolder: string = '',
    options?: ImageResizeOptions
  ): Promise<UploadResult> {
    try {
      // Base64 데이터 파싱
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (!matches) {
        throw new Error('Invalid base64 data')
      }

      const mimeType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')

      // 파일명 생성
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 10)
      const extension = mimeType.split('/')[1] || 'jpg'
      const filename = `${timestamp}_${randomString}.${extension}`

      // 업로드 경로 설정
      const uploadPath = subfolder 
        ? join(this.uploadDir, subfolder)
        : this.uploadDir

      await mkdir(uploadPath, { recursive: true })

      let processedBuffer: Buffer = buffer

      // 이미지 리사이징 처리
      if (this.isImageMimeType(mimeType)) {
        processedBuffer = await this.resizeImage(buffer, options) as Buffer
      }

      // 파일 저장
      const filePath = join(uploadPath, filename)
      await writeFile(filePath, processedBuffer)

      // URL 생성
      const url = subfolder 
        ? `/uploads/${subfolder}/${filename}`
        : `/uploads/${filename}`

      return {
        url,
        filename,
        size: processedBuffer.length,
        type: mimeType
      }
    } catch (error) {
      console.error('Base64 upload failed:', error)
      throw new Error('이미지 업로드에 실패했습니다.')
    }
  }

  /**
   * 이미지 리사이징
   */
  private async resizeImage(
    buffer: Buffer,
    options?: ImageResizeOptions
  ): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer)

      // 리사이징 옵션 적용
      if (options?.width || options?.height) {
        sharpInstance = sharpInstance.resize({
          width: options.width,
          height: options.height,
          fit: 'cover',
          position: 'center'
        })
      }

      // 포맷 변환
      if (options?.format) {
        switch (options.format) {
          case 'jpeg':
            sharpInstance = sharpInstance.jpeg({ 
              quality: options.quality || 80 
            })
            break
          case 'png':
            sharpInstance = sharpInstance.png({ 
              quality: options.quality || 80 
            })
            break
          case 'webp':
            sharpInstance = sharpInstance.webp({ 
              quality: options.quality || 80 
            })
            break
        }
      }

      return await sharpInstance.toBuffer()
    } catch (error) {
      console.error('Image resize failed:', error)
      return buffer // 리사이징 실패 시 원본 반환
    }
  }

  /**
   * 이미지 파일 타입 체크
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * 이미지 MIME 타입 체크
   */
  private isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * FormData에서 파일 추출
   */
  async extractFileFromFormData(request: NextRequest): Promise<File | null> {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file || !file.size) {
        return null
      }

      return file
    } catch (error) {
      console.error('FormData extraction failed:', error)
      return null
    }
  }

  /**
   * 다중 파일 업로드
   */
  async uploadMultipleFiles(
    files: File[],
    subfolder: string = '',
    options?: ImageResizeOptions
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, subfolder, options)
        results.push(result)
      } catch (error) {
        console.error(`File upload failed for ${file.name}:`, error)
        // 개별 파일 실패는 무시하고 계속 진행
      }
    }

    return results
  }

  /**
   * 파일 검증 (타입 및 크기)
   */
  private validateFile(file: File): void {
    if (this.isVideoFile(file.type)) {
      if (!this.validateFileSize(file, MAX_VIDEO_SIZE_MB)) {
        throw new Error(`비디오 파일 크기는 ${MAX_VIDEO_SIZE_MB}MB를 초과할 수 없습니다.`)
      }
      if (!this.validateVideoType(file)) {
        throw new Error('지원되지 않는 비디오 형식입니다.')
      }
    } else if (this.isImageFile(file.type)) {
      if (!this.validateFileSize(file, MAX_IMAGE_SIZE_MB)) {
        throw new Error(`이미지 파일 크기는 ${MAX_IMAGE_SIZE_MB}MB를 초과할 수 없습니다.`)
      }
      if (!this.validateImageType(file)) {
        throw new Error('지원되지 않는 이미지 형식입니다.')
      }
    } else {
      throw new Error('지원되지 않는 파일 형식입니다.')
    }
  }

  /**
   * 파일 크기 제한 체크
   */
  validateFileSize(file: File, maxSizeInMB: number = 15): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    return file.size <= maxSizeInBytes
  }

  /**
   * 이미지 파일 타입 체크
   */
  validateImageType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    return allowedTypes.includes(file.type)
  }

  /**
   * 비디오 파일 타입 체크
   */
  validateVideoType(file: File): boolean {
    return VIDEO_MIME_TYPES.includes(file.type as any)
  }

  /**
   * 허용된 파일 타입 체크 (Legacy)
   */
  validateFileType(file: File, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): boolean {
    return allowedTypes.includes(file.type)
  }

  /**
   * 비디오 파일 여부 확인
   */
  private isVideoFile(mimeType: string): boolean {
    return mimeType.startsWith('video/')
  }

  /**
   * 비디오 썸네일 생성
   */
  private async generateVideoThumbnail(
    videoPath: string,
    outputDir: string,
    timestamp: number,
    timeInSeconds: number = 1
  ): Promise<string> {
    try {
      // FFmpeg가 설치되지 않은 경우를 대비한 fallback
      // 실제 프로덕션에서는 FFmpeg 또는 다른 비디오 처리 라이브러리 사용
      const thumbnailFilename = `${timestamp}_thumbnail.jpg`
      const thumbnailPath = join(outputDir, thumbnailFilename)
      
      // 임시로 기본 썸네일 생성 (실제로는 FFmpeg 사용해야 함)
      const { spawn } = await import('child_process')
      
      return new Promise((resolve, reject) => {
        // FFmpeg 명령어: 비디오에서 썸네일 추출
        const ffmpeg = spawn('ffmpeg', [
          '-i', videoPath,
          '-ss', timeInSeconds.toString(),
          '-vframes', '1',
          '-f', 'image2',
          '-y', // 덮어쓰기
          thumbnailPath
        ])

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            const thumbnailUrl = `/uploads/${outputDir.split('/').pop()}/${thumbnailFilename}`
            resolve(thumbnailUrl)
          } else {
            console.warn('FFmpeg 썸네일 생성 실패, 기본 썸네일 사용')
            resolve('/images/video-default-thumbnail.jpg')
          }
        })

        ffmpeg.on('error', (error) => {
          console.warn('FFmpeg 실행 실패:', error.message)
          resolve('/images/video-default-thumbnail.jpg')
        })
      })
    } catch (error) {
      console.warn('썸네일 생성 실패:', error)
      return '/images/video-default-thumbnail.jpg'
    }
  }

  /**
   * 비디오 전용 업로드 메서드
   */
  async uploadVideo(
    file: File,
    subfolder: string = 'videos',
    options?: VideoProcessOptions
  ): Promise<UploadResult & { thumbnailUrl?: string }> {
    if (!this.isVideoFile(file.type)) {
      throw new Error('비디오 파일만 업로드할 수 있습니다.')
    }

    const defaultOptions: VideoProcessOptions = {
      generateThumbnail: true,
      thumbnailTime: 1,
      quality: 'medium',
      ...options
    }

    return await this.uploadFile(file, subfolder, defaultOptions)
  }
}

// 싱글톤 인스턴스
export const uploadService = new UploadService()