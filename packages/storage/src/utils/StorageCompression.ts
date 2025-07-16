import { Result } from '@repo/core';

export interface CompressionOptions {
  algorithm?: 'gzip' | 'deflate' | 'brotli';
  level?: number; // 1-9
  threshold?: number; // 압축할 최소 크기 (바이트)
}

export interface CompressedData {
  data: string;
  originalSize: number;
  compressedSize: number;
  algorithm: string;
  compressed: boolean;
}

export class StorageCompression {
  private options: Required<CompressionOptions>;

  constructor(options?: CompressionOptions) {
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
  async compress(data: any): Promise<Result<CompressedData>> {
    try {
      const jsonString = JSON.stringify(data);
      const originalSize = new Blob([jsonString]).size;

      // 임계값보다 작으면 압축하지 않음
      if (originalSize < this.options.threshold) {
        return Result.success({
          data: jsonString,
          originalSize,
          compressedSize: originalSize,
          algorithm: 'none',
          compressed: false
        });
      }

      // 브라우저 환경에서 CompressionStream 사용 가능 여부 확인
      if (typeof CompressionStream !== 'undefined') {
        return this.compressWithStream(jsonString, originalSize);
      }

      // CompressionStream이 없는 경우 간단한 압축 구현
      return this.compressWithCustom(jsonString, originalSize);
    } catch (error) {
      return Result.failure('COMPRESSION_FAILED', `압축 실패: ${error}`);
    }
  }

  /**
   * 데이터 압축 해제
   */
  async decompress<T = any>(compressedData: CompressedData): Promise<Result<T>> {
    try {
      // 압축되지 않은 데이터
      if (!compressedData.compressed) {
        const data = JSON.parse(compressedData.data);
        return Result.success(data);
      }

      // 브라우저 환경에서 DecompressionStream 사용
      if (typeof DecompressionStream !== 'undefined') {
        return this.decompressWithStream<T>(compressedData);
      }

      // DecompressionStream이 없는 경우
      return this.decompressWithCustom<T>(compressedData);
    } catch (error) {
      return Result.failure('DECOMPRESSION_FAILED', `압축 해제 실패: ${error}`);
    }
  }

  /**
   * 압축률 계산
   */
  calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize) * 100;
  }

  /**
   * 압축 효율성 평가
   */
  evaluateCompression(data: any): Result<{
    shouldCompress: boolean;
    estimatedRatio: number;
    recommendation: string;
  }> {
    try {
      const jsonString = JSON.stringify(data);
      const size = new Blob([jsonString]).size;

      // 크기가 작으면 압축 불필요
      if (size < this.options.threshold) {
        return Result.success({
          shouldCompress: false,
          estimatedRatio: 0,
          recommendation: '데이터 크기가 작아 압축이 불필요합니다'
        });
      }

      // 엔트로피 기반 압축 가능성 평가
      const entropy = this.calculateEntropy(jsonString);
      const shouldCompress = entropy < 7.5;
      const estimatedRatio = shouldCompress ? (8 - entropy) * 10 : 0;

      return Result.success({
        shouldCompress,
        estimatedRatio,
        recommendation: shouldCompress 
          ? '압축이 효과적일 것으로 예상됩니다'
          : '데이터의 엔트로피가 높아 압축 효과가 적을 수 있습니다'
      });
    } catch (error) {
      return Result.failure('EVALUATION_FAILED', `평가 실패: ${error}`);
    }
  }

  /**
   * CompressionStream을 사용한 압축
   */
  private async compressWithStream(
    data: string, 
    originalSize: number
  ): Promise<Result<CompressedData>> {
    try {
      const encoder = new TextEncoder();
      const input = encoder.encode(data);
      
      const compressionStream = new CompressionStream(this.options.algorithm as CompressionFormat);
      const writer = compressionStream.writable.getWriter();
      writer.write(input);
      writer.close();

      const compressed = await new Response(compressionStream.readable).arrayBuffer();
      const compressedArray = new Uint8Array(compressed);
      
      // Base64로 인코딩
      const base64 = btoa(String.fromCharCode(...compressedArray));
      const compressedSize = base64.length;

      return Result.success({
        data: base64,
        originalSize,
        compressedSize,
        algorithm: this.options.algorithm,
        compressed: true
      });
    } catch (error) {
      return Result.failure('STREAM_COMPRESSION_FAILED', `스트림 압축 실패: ${error}`);
    }
  }

  /**
   * DecompressionStream을 사용한 압축 해제
   */
  private async decompressWithStream<T>(
    compressedData: CompressedData
  ): Promise<Result<T>> {
    try {
      // Base64 디코딩
      const binaryString = atob(compressedData.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const decompressionStream = new DecompressionStream(
        compressedData.algorithm as CompressionFormat
      );
      const writer = decompressionStream.writable.getWriter();
      writer.write(bytes);
      writer.close();

      const decompressed = await new Response(decompressionStream.readable).text();
      const data = JSON.parse(decompressed);

      return Result.success(data);
    } catch (error) {
      return Result.failure('STREAM_DECOMPRESSION_FAILED', `스트림 압축 해제 실패: ${error}`);
    }
  }

  /**
   * 커스텀 압축 구현 (LZ 기반)
   */
  private compressWithCustom(
    data: string, 
    originalSize: number
  ): Result<CompressedData> {
    try {
      const compressed = this.lzCompress(data);
      const compressedSize = compressed.length;

      return Result.success({
        data: compressed,
        originalSize,
        compressedSize,
        algorithm: 'lz',
        compressed: true
      });
    } catch (error) {
      return Result.failure('CUSTOM_COMPRESSION_FAILED', `커스텀 압축 실패: ${error}`);
    }
  }

  /**
   * 커스텀 압축 해제
   */
  private decompressWithCustom<T>(
    compressedData: CompressedData
  ): Result<T> {
    try {
      const decompressed = this.lzDecompress(compressedData.data);
      const data = JSON.parse(decompressed);
      return Result.success(data);
    } catch (error) {
      return Result.failure('CUSTOM_DECOMPRESSION_FAILED', `커스텀 압축 해제 실패: ${error}`);
    }
  }

  /**
   * LZ 압축 알고리즘
   */
  private lzCompress(data: string): string {
    const dict = new Map<string, number>();
    const result: number[] = [];
    let dictSize = 256;
    let w = '';

    // 초기 사전 구축
    for (let i = 0; i < 256; i++) {
      dict.set(String.fromCharCode(i), i);
    }

    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const wc = w + c;

      if (dict.has(wc)) {
        w = wc;
      } else {
        result.push(dict.get(w)!);
        dict.set(wc, dictSize++);
        w = c;
      }
    }

    if (w) {
      result.push(dict.get(w)!);
    }

    // 결과를 문자열로 변환
    return result.map(n => String.fromCharCode(n)).join('');
  }

  /**
   * LZ 압축 해제 알고리즘
   */
  private lzDecompress(compressed: string): string {
    const dict = new Map<number, string>();
    let dictSize = 256;
    let w = String.fromCharCode(compressed.charCodeAt(0));
    let result = w;

    // 초기 사전 구축
    for (let i = 0; i < 256; i++) {
      dict.set(i, String.fromCharCode(i));
    }

    for (let i = 1; i < compressed.length; i++) {
      const k = compressed.charCodeAt(i);
      let entry: string;

      if (dict.has(k)) {
        entry = dict.get(k)!;
      } else if (k === dictSize) {
        entry = w + w[0];
      } else {
        throw new Error('압축 해제 오류: 잘못된 압축 데이터');
      }

      result += entry;
      dict.set(dictSize++, w + entry[0]);
      w = entry;
    }

    return result;
  }

  /**
   * 엔트로피 계산
   */
  private calculateEntropy(data: string): number {
    const freq = new Map<string, number>();
    
    // 문자 빈도 계산
    for (const char of data) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    // 엔트로피 계산
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
  getCompressionStats(compressedData: CompressedData): {
    originalSize: number;
    compressedSize: number;
    ratio: number;
    saved: number;
    algorithm: string;
  } {
    const ratio = this.calculateCompressionRatio(
      compressedData.originalSize,
      compressedData.compressedSize
    );

    return {
      originalSize: compressedData.originalSize,
      compressedSize: compressedData.compressedSize,
      ratio,
      saved: compressedData.originalSize - compressedData.compressedSize,
      algorithm: compressedData.algorithm
    };
  }

  /**
   * 최적 압축 알고리즘 선택
   */
  async selectBestAlgorithm(data: any): Promise<Result<{
    algorithm: string;
    ratio: number;
  }>> {
    const algorithms: Array<'gzip' | 'deflate'> = ['gzip', 'deflate'];
    let bestAlgorithm = this.options.algorithm;
    let bestRatio = 0;

    for (const algorithm of algorithms) {
      const compression = new StorageCompression({ ...this.options, algorithm });
      const result = await compression.compress(data);
      
      if (result.isSuccess) {
        const ratio = this.calculateCompressionRatio(
          result.data.originalSize,
          result.data.compressedSize
        );
        
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestAlgorithm = algorithm;
        }
      }
    }

    return Result.success({ algorithm: bestAlgorithm, ratio: bestRatio });
  }
}

// 압축된 스토리지 프로바이더 래퍼
export class CompressedStorageProvider {
  private provider: any;
  private compression: StorageCompression;

  constructor(provider: any, options?: CompressionOptions) {
    this.provider = provider;
    this.compression = new StorageCompression(options);
  }

  async get<T = any>(key: string): Promise<Result<T | null>> {
    const result = await this.provider.get<CompressedData>(key);
    
    if (result.isFailure || result.data === null) {
      return result as Result<T | null>;
    }

    // CompressedData 형식인지 확인
    if (result.data.compressed !== undefined) {
      const decompressResult = await this.compression.decompress<T>(result.data);
      
      if (decompressResult.isFailure) {
        return Result.success(null);
      }

      return Result.success(decompressResult.data);
    }

    // 압축되지 않은 데이터
    return Result.success(result.data as T);
  }

  async set<T = any>(key: string, value: T, metadata?: any): Promise<Result<void>> {
    const compressResult = await this.compression.compress(value);
    
    if (compressResult.isFailure) {
      return Result.failure('COMPRESSED_SET_FAILED', compressResult.message);
    }

    return this.provider.set(key, compressResult.data, metadata);
  }

  // 나머지 메서드들은 원본 프로바이더에 위임
  async delete(key: string): Promise<Result<void>> {
    return this.provider.delete(key);
  }

  async exists(key: string): Promise<Result<boolean>> {
    return this.provider.exists(key);
  }

  async clear(namespace?: string): Promise<Result<void>> {
    return this.provider.clear(namespace);
  }

  async getCompressionStats(): Promise<Result<{
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageRatio: number;
    itemCount: number;
  }>> {
    try {
      const keysResult = await this.provider.keys();
      if (keysResult.isFailure) {
        return Result.failure('STATS_FAILED', '키 목록 조회 실패');
      }

      let totalOriginalSize = 0;
      let totalCompressedSize = 0;
      let compressedCount = 0;

      for (const key of keysResult.data) {
        const result = await this.provider.get<CompressedData>(key);
        if (result.isSuccess && result.data && result.data.compressed) {
          totalOriginalSize += result.data.originalSize;
          totalCompressedSize += result.data.compressedSize;
          compressedCount++;
        }
      }

      const averageRatio = compressedCount > 0 
        ? this.compression.calculateCompressionRatio(totalOriginalSize, totalCompressedSize)
        : 0;

      return Result.success({
        totalOriginalSize,
        totalCompressedSize,
        averageRatio,
        itemCount: compressedCount
      });
    } catch (error) {
      return Result.failure('STATS_ERROR', `통계 조회 중 오류: ${error}`);
    }
  }
}

export const defaultCompression = new StorageCompression();