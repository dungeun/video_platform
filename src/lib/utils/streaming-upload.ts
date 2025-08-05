import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export interface StreamingUploadOptions {
  chunkSize?: number; // 청크 크기 (바이트)
  maxFileSize?: number; // 최대 파일 크기 (바이트)
  onProgress?: (progress: number) => void; // 진행률 콜백
}

export class StreamingUploader {
  private uploadDir: string;
  private tempDir: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'public', 'uploads');
    this.tempDir = join(process.cwd(), 'temp');
  }

  /**
   * 스트리밍 방식으로 대용량 파일 업로드
   */
  async uploadLargeFile(
    file: File,
    subfolder: string = '',
    options: StreamingUploadOptions = {}
  ): Promise<{ url: string; filename: string; size: number }> {
    const {
      chunkSize = 1024 * 1024 * 5, // 5MB 청크
      maxFileSize = 1024 * 1024 * 1024 * 10, // 10GB
      onProgress
    } = options;

    // 파일 크기 검증
    if (file.size > maxFileSize) {
      throw new Error(`파일 크기가 너무 큽니다. 최대 ${Math.floor(maxFileSize / (1024 * 1024 * 1024))}GB까지 지원됩니다.`);
    }

    // 디렉토리 생성
    const uploadPath = subfolder 
      ? join(this.uploadDir, subfolder)
      : this.uploadDir;
    
    await mkdir(uploadPath, { recursive: true });
    await mkdir(this.tempDir, { recursive: true });

    // 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split('.').pop()?.toLowerCase();
    const filename = `${timestamp}_${randomString}.${extension}`;
    const finalPath = join(uploadPath, filename);
    const tempPath = join(this.tempDir, `temp_${filename}`);

    try {
      // 파일을 청크 단위로 읽어 임시 파일에 쓰기
      const reader = file.stream().getReader();
      const writeStream = createWriteStream(tempPath);
      
      let uploadedBytes = 0;
      let chunk: ReadableStreamReadResult<Uint8Array>;

      while (!(chunk = await reader.read()).done) {
        const buffer = Buffer.from(chunk.value);
        
        // 청크 크기 제한 확인
        if (buffer.length > chunkSize) {
          throw new Error(`청크 크기가 너무 큽니다. 최대 ${chunkSize} 바이트까지 지원됩니다.`);
        }

        // 임시 파일에 쓰기
        await new Promise<void>((resolve, reject) => {
          writeStream.write(buffer, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });

        uploadedBytes += buffer.length;

        // 진행률 콜백 호출
        if (onProgress) {
          const progress = (uploadedBytes / file.size) * 100;
          onProgress(Math.min(progress, 100));
        }
      }

      // 쓰기 스트림 종료
      await new Promise<void>((resolve, reject) => {
        writeStream.end((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // 임시 파일을 최종 위치로 이동
      await pipeline(
        createReadStream(tempPath),
        createWriteStream(finalPath)
      );

      // 임시 파일 삭제
      try {
        const { unlink } = await import('fs/promises');
        await unlink(tempPath);
      } catch (error) {
        console.warn('임시 파일 삭제 실패:', error);
      }

      // URL 생성
      const url = subfolder 
        ? `/uploads/${subfolder}/${filename}`
        : `/uploads/${filename}`;

      return {
        url,
        filename,
        size: file.size
      };

    } catch (error) {
      // 오류 발생 시 임시 파일 정리
      try {
        const { unlink } = await import('fs/promises');
        await unlink(tempPath);
        await unlink(finalPath);
      } catch (cleanupError) {
        console.warn('파일 정리 실패:', cleanupError);
      }

      throw error;
    }
  }

  /**
   * 청크 업로드 지원 (멀티파트 업로드)
   */
  async uploadChunked(
    chunks: Uint8Array[],
    filename: string,
    subfolder: string = ''
  ): Promise<{ url: string; filename: string; size: number }> {
    // 디렉토리 생성
    const uploadPath = subfolder 
      ? join(this.uploadDir, subfolder)
      : this.uploadDir;
    
    await mkdir(uploadPath, { recursive: true });

    // 파일 경로 설정
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = filename.split('.').pop()?.toLowerCase();
    const finalFilename = `${timestamp}_${randomString}.${extension}`;
    const finalPath = join(uploadPath, finalFilename);

    try {
      const writeStream = createWriteStream(finalPath);
      let totalSize = 0;

      // 청크들을 순서대로 쓰기
      for (const chunk of chunks) {
        await new Promise<void>((resolve, reject) => {
          writeStream.write(Buffer.from(chunk), (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        totalSize += chunk.length;
      }

      // 쓰기 스트림 종료
      await new Promise<void>((resolve, reject) => {
        writeStream.end((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // URL 생성
      const url = subfolder 
        ? `/uploads/${subfolder}/${finalFilename}`
        : `/uploads/${finalFilename}`;

      return {
        url,
        filename: finalFilename,
        size: totalSize
      };

    } catch (error) {
      // 오류 발생 시 파일 정리
      try {
        const { unlink } = await import('fs/promises');
        await unlink(finalPath);
      } catch (cleanupError) {
        console.warn('파일 정리 실패:', cleanupError);
      }

      throw error;
    }
  }

  /**
   * 업로드 진행률 추적을 위한 유틸리티
   */
  static formatProgress(uploaded: number, total: number): string {
    const percentage = Math.round((uploaded / total) * 100);
    const uploadedMB = Math.round(uploaded / (1024 * 1024));
    const totalMB = Math.round(total / (1024 * 1024));
    
    return `${percentage}% (${uploadedMB}MB / ${totalMB}MB)`;
  }

  /**
   * 파일 크기를 인간이 읽기 쉬운 형태로 변환
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// 싱글톤 인스턴스
export const streamingUploader = new StreamingUploader();