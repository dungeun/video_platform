import { Result } from '@repo/core';

export interface CompressionOptions {
  algorithm?: 'gzip' | 'deflate' | 'brotli' | 'lz4';
  level?: number; // 1-9, 높을수록 압축률 높음
  threshold?: number; // 압축할 최소 크기 (바이트)
}

export class CacheCompressor {
  private options: CompressionOptions;

  constructor(options: CompressionOptions = {}) {
    this.options = {
      algorithm: 'gzip',
      level: 6,
      threshold: 1024, // 1KB 이상만 압축
      ...options
    };
  }

  /**
   * 데이터 압축
   */
  async compress(data: string): Promise<Result<string>> {
    try {
      // 임계값 확인
      if (data.length < this.options.threshold!) {
        return Result.success(data);
      }

      // 브라우저 환경에서는 CompressionStream API 사용
      if (typeof CompressionStream !== 'undefined') {
        return this.compressWithStream(data);
      }

      // Node.js 환경에서는 zlib 사용 (별도 처리 필요)
      // 여기서는 간단한 압축 알고리즘 구현
      return this.compressWithCustomAlgorithm(data);
    } catch (error) {
      return Result.failure('COMPRESSION_FAILED', `압축 실패: ${error}`);
    }
  }

  /**
   * 압축 해제
   */
  async decompress(data: string): Promise<Result<string>> {
    try {
      // 압축되지 않은 데이터 확인
      if (!this.isCompressed(data)) {
        return Result.success(data);
      }

      // 브라우저 환경에서는 DecompressionStream API 사용
      if (typeof DecompressionStream !== 'undefined') {
        return this.decompressWithStream(data);
      }

      // 커스텀 알고리즘으로 압축 해제
      return this.decompressWithCustomAlgorithm(data);
    } catch (error) {
      return Result.failure('DECOMPRESSION_FAILED', `압축 해제 실패: ${error}`);
    }
  }

  /**
   * 압축률 계산
   */
  calculateCompressionRatio(original: string, compressed: string): number {
    if (original.length === 0) return 0;
    return ((original.length - compressed.length) / original.length) * 100;
  }

  /**
   * 압축 가능 여부 확인
   */
  isCompressible(data: string): boolean {
    // 이미 압축된 데이터인지 확인
    if (this.isCompressed(data)) return false;
    
    // 크기가 임계값보다 작은지 확인
    if (data.length < this.options.threshold!) return false;
    
    // 엔트로피 기반 압축 가능성 확인
    const entropy = this.calculateEntropy(data);
    return entropy < 7.5; // 높은 엔트로피는 압축이 어려움
  }

  /**
   * 브라우저 CompressionStream API 사용
   */
  private async compressWithStream(data: string): Promise<Result<string>> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const input = encoder.encode(data);
      const compressionStream = new CompressionStream('gzip');
      
      const writer = compressionStream.writable.getWriter();
      writer.write(input);
      writer.close();
      
      const compressed = await new Response(compressionStream.readable).arrayBuffer();
      const compressedArray = new Uint8Array(compressed);
      
      // Base64로 인코딩하여 문자열로 저장
      const base64 = btoa(String.fromCharCode(...compressedArray));
      
      return Result.success(this.wrapCompressed(base64, 'gzip'));
    } catch (error) {
      return Result.failure('STREAM_COMPRESSION_FAILED', `스트림 압축 실패: ${error}`);
    }
  }

  /**
   * 브라우저 DecompressionStream API 사용
   */
  private async decompressWithStream(data: string): Promise<Result<string>> {
    try {
      const wrapped = this.unwrapCompressed(data);
      if (!wrapped) {
        return Result.success(data);
      }
      
      // Base64 디코딩
      const binaryString = atob(wrapped.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const decompressionStream = new DecompressionStream('gzip');
      const writer = decompressionStream.writable.getWriter();
      writer.write(bytes);
      writer.close();
      
      const decompressed = await new Response(decompressionStream.readable).text();
      
      return Result.success(decompressed);
    } catch (error) {
      return Result.failure('STREAM_DECOMPRESSION_FAILED', `스트림 압축 해제 실패: ${error}`);
    }
  }

  /**
   * 커스텀 압축 알고리즘 (LZ 기반 간단한 구현)
   */
  private compressWithCustomAlgorithm(data: string): Result<string> {
    try {
      const dict = new Map<string, number>();
      const result: number[] = [];
      let dictSize = 256;
      let w = '';
      
      for (let i = 0; i < data.length; i++) {
        const c = data[i];
        const wc = w + c;
        
        if (dict.has(wc)) {
          w = wc;
        } else {
          result.push(dict.get(w) ?? w.charCodeAt(0));
          dict.set(wc, dictSize++);
          w = c;
        }
      }
      
      if (w) {
        result.push(dict.get(w) ?? w.charCodeAt(0));
      }
      
      // 결과를 Base64로 인코딩
      const compressed = result.map(n => String.fromCharCode(n)).join('');
      const base64 = btoa(compressed);
      
      return Result.success(this.wrapCompressed(base64, 'lz'));
    } catch (error) {
      return Result.failure('CUSTOM_COMPRESSION_FAILED', `커스텀 압축 실패: ${error}`);
    }
  }

  /**
   * 커스텀 압축 해제 알고리즘
   */
  private decompressWithCustomAlgorithm(data: string): Result<string> {
    try {
      const wrapped = this.unwrapCompressed(data);
      if (!wrapped || wrapped.algorithm !== 'lz') {
        return Result.success(data);
      }
      
      const compressed = atob(wrapped.data);
      const dict = new Map<number, string>();
      let dictSize = 256;
      let w = String.fromCharCode(compressed.charCodeAt(0));
      let result = w;
      
      for (let i = 1; i < compressed.length; i++) {
        const k = compressed.charCodeAt(i);
        let entry: string;
        
        if (k < 256) {
          entry = String.fromCharCode(k);
        } else if (dict.has(k)) {
          entry = dict.get(k)!;
        } else if (k === dictSize) {
          entry = w + w[0];
        } else {
          return Result.failure('DECOMPRESSION_ERROR', '압축 해제 오류');
        }
        
        result += entry;
        dict.set(dictSize++, w + entry[0]);
        w = entry;
      }
      
      return Result.success(result);
    } catch (error) {
      return Result.failure('CUSTOM_DECOMPRESSION_FAILED', `커스텀 압축 해제 실패: ${error}`);
    }
  }

  /**
   * 압축된 데이터 래핑
   */
  private wrapCompressed(data: string, algorithm: string): string {
    return JSON.stringify({
      _compressed: true,
      _algorithm: algorithm,
      _version: '1.0',
      data
    });
  }

  /**
   * 압축된 데이터 언래핑
   */
  private unwrapCompressed(data: string): { algorithm: string; data: string } | null {
    try {
      const parsed = JSON.parse(data);
      if (parsed._compressed) {
        return {
          algorithm: parsed._algorithm,
          data: parsed.data
        };
      }
    } catch {
      // JSON이 아니면 압축되지 않은 데이터
    }
    return null;
  }

  /**
   * 압축 여부 확인
   */
  private isCompressed(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      return parsed._compressed === true;
    } catch {
      return false;
    }
  }

  /**
   * 엔트로피 계산 (압축 가능성 평가)
   */
  private calculateEntropy(data: string): number {
    const freq = new Map<string, number>();
    
    for (const char of data) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    
    let entropy = 0;
    const len = data.length;
    
    for (const count of freq.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }

  /**
   * 압축 통계
   */
  getCompressionStats(original: string, compressed: string): {
    originalSize: number;
    compressedSize: number;
    ratio: number;
    saved: number;
  } {
    const originalSize = new Blob([original]).size;
    const compressedSize = new Blob([compressed]).size;
    const ratio = this.calculateCompressionRatio(original, compressed);
    const saved = originalSize - compressedSize;
    
    return {
      originalSize,
      compressedSize,
      ratio,
      saved
    };
  }
}

export const defaultCompressor = new CacheCompressor();