import { Result } from '@company/core';
export interface CompressionOptions {
    algorithm?: 'gzip' | 'deflate' | 'brotli';
    level?: number;
    threshold?: number;
}
export interface CompressedData {
    data: string;
    originalSize: number;
    compressedSize: number;
    algorithm: string;
    compressed: boolean;
}
export declare class StorageCompression {
    private options;
    constructor(options?: CompressionOptions);
    /**
     * 데이터 압축
     */
    compress(data: any): Promise<Result<CompressedData>>;
    /**
     * 데이터 압축 해제
     */
    decompress<T = any>(compressedData: CompressedData): Promise<Result<T>>;
    /**
     * 압축률 계산
     */
    calculateCompressionRatio(originalSize: number, compressedSize: number): number;
    /**
     * 압축 효율성 평가
     */
    evaluateCompression(data: any): Result<{
        shouldCompress: boolean;
        estimatedRatio: number;
        recommendation: string;
    }>;
    /**
     * CompressionStream을 사용한 압축
     */
    private compressWithStream;
    /**
     * DecompressionStream을 사용한 압축 해제
     */
    private decompressWithStream;
    /**
     * 커스텀 압축 구현 (LZ 기반)
     */
    private compressWithCustom;
    /**
     * 커스텀 압축 해제
     */
    private decompressWithCustom;
    /**
     * LZ 압축 알고리즘
     */
    private lzCompress;
    /**
     * LZ 압축 해제 알고리즘
     */
    private lzDecompress;
    /**
     * 엔트로피 계산
     */
    private calculateEntropy;
    /**
     * 압축 통계
     */
    getCompressionStats(compressedData: CompressedData): {
        originalSize: number;
        compressedSize: number;
        ratio: number;
        saved: number;
        algorithm: string;
    };
    /**
     * 최적 압축 알고리즘 선택
     */
    selectBestAlgorithm(data: any): Promise<Result<{
        algorithm: string;
        ratio: number;
    }>>;
}
export declare class CompressedStorageProvider {
    private provider;
    private compression;
    constructor(provider: any, options?: CompressionOptions);
    get<T = any>(key: string): Promise<Result<T | null>>;
    set<T = any>(key: string, value: T, metadata?: any): Promise<Result<void>>;
    delete(key: string): Promise<Result<void>>;
    exists(key: string): Promise<Result<boolean>>;
    clear(namespace?: string): Promise<Result<void>>;
    getCompressionStats(): Promise<Result<{
        totalOriginalSize: number;
        totalCompressedSize: number;
        averageRatio: number;
        itemCount: number;
    }>>;
}
export declare const defaultCompression: StorageCompression;
//# sourceMappingURL=StorageCompression.d.ts.map