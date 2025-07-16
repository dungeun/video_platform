/**
 * @repo/api-client - 요청 빌더
 * HTTP 요청 설정 구성
 */
import { AxiosRequestConfig } from 'axios';
import { HttpRequestConfig, ApiClientConfig } from '../types';
export declare class RequestBuilder {
    private logger;
    constructor();
    /**
     * Axios 요청 설정 빌드
     */
    build(requestConfig: HttpRequestConfig, clientConfig: ApiClientConfig): AxiosRequestConfig;
    /**
     * 헤더 빌드
     */
    private buildHeaders;
    /**
     * FormData 빌드
     */
    buildFormData(data: Record<string, any>): FormData;
    /**
     * URL 파라미터 빌드
     */
    buildUrlParams(params: Record<string, any>): string;
    /**
     * 전체 URL 빌드
     */
    buildFullUrl(baseURL: string, path: string, params?: Record<string, any>): string;
    /**
     * 요청 바디 직렬화
     */
    serializeBody(data: any, contentType?: string): any;
    /**
     * 파일 업로드를 위한 설정 빌드
     */
    buildUploadConfig(file: File | Blob, fieldName?: string, additionalData?: Record<string, any>, onProgress?: (percent: number) => void): HttpRequestConfig;
}
//# sourceMappingURL=RequestBuilder.d.ts.map