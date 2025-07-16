/**
 * @company/api-client - 요청 빌더
 * HTTP 요청 설정 구성
 */

import { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { HttpRequestConfig, ApiClientConfig } from '../types';
import { Logger } from '@company/core';

export class RequestBuilder {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('RequestBuilder');
  }

  /**
   * Axios 요청 설정 빌드
   */
  public build(
    requestConfig: HttpRequestConfig,
    clientConfig: ApiClientConfig
  ): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      method: requestConfig.method || 'GET',
      baseURL: requestConfig.baseURL || clientConfig.baseURL,
      headers: this.buildHeaders(requestConfig, clientConfig),
      params: requestConfig.params,
      data: requestConfig.data,
      timeout: requestConfig.timeout || clientConfig.timeout || 30000,
      withCredentials: requestConfig.withCredentials ?? clientConfig.withCredentials ?? false,
      responseType: requestConfig.responseType || 'json',
      responseEncoding: requestConfig.responseEncoding || 'utf8',
      maxRedirects: requestConfig.maxRedirects || clientConfig.maxRedirects || 5,
      maxContentLength: requestConfig.maxContentLength || Infinity,
      maxBodyLength: requestConfig.maxBodyLength || Infinity,
      validateStatus: (requestConfig.validateStatus || clientConfig.validateStatus) as any,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'brackets' })
    };

    // URL은 별도로 설정 (undefined 체크)
    if (requestConfig.url) {
      config.url = requestConfig.url;
    }

    // 인증 설정
    if (requestConfig.auth) {
      config.auth = requestConfig.auth;
    }

    // 진행 상황 콜백
    if (requestConfig.onUploadProgress) {
      config.onUploadProgress = requestConfig.onUploadProgress as any;
    }

    if (requestConfig.onDownloadProgress) {
      config.onDownloadProgress = requestConfig.onDownloadProgress as any;
    }

    // 변환 함수
    if (clientConfig.transformRequest) {
      config.transformRequest = clientConfig.transformRequest;
    }

    if (clientConfig.transformResponse) {
      config.transformResponse = clientConfig.transformResponse;
    }

    return config;
  }

  /**
   * 헤더 빌드
   */
  private buildHeaders(
    requestConfig: HttpRequestConfig,
    clientConfig: ApiClientConfig
  ): Record<string, string | string[] | number | boolean> {
    const headers: Record<string, string | string[] | number | boolean> = {
      ...clientConfig.headers,
      ...requestConfig.headers
    };

    // Content-Type 자동 설정
    if (requestConfig.data && !headers['Content-Type']) {
      if (requestConfig.data instanceof FormData) {
        // FormData의 경우 브라우저가 자동으로 설정하도록 제거
        delete headers['Content-Type'];
      } else if (typeof requestConfig.data === 'object') {
        headers['Content-Type'] = 'application/json';
      }
    }

    // Accept 헤더 기본값
    if (!headers['Accept']) {
      headers['Accept'] = 'application/json, text/plain, */*';
    }

    return headers;
  }

  /**
   * FormData 빌드
   */
  public buildFormData(data: Record<string, any>): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item instanceof File || item instanceof Blob) {
            formData.append(`${key}[${index}]`, item);
          } else {
            formData.append(`${key}[${index}]`, String(item));
          }
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    return formData;
  }

  /**
   * URL 파라미터 빌드
   */
  public buildUrlParams(params: Record<string, any>): string {
    return qs.stringify(params, {
      arrayFormat: 'brackets',
      skipNulls: true,
      encode: true
    });
  }

  /**
   * 전체 URL 빌드
   */
  public buildFullUrl(
    baseURL: string,
    path: string,
    params?: Record<string, any>
  ): string {
    // baseURL 정규화
    const normalizedBase = baseURL.replace(/\/$/, '');
    
    // path 정규화
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // URL 조합
    let fullUrl = `${normalizedBase}${normalizedPath}`;
    
    // 파라미터 추가
    if (params && Object.keys(params).length > 0) {
      const queryString = this.buildUrlParams(params);
      fullUrl += `?${queryString}`;
    }
    
    return fullUrl;
  }

  /**
   * 요청 바디 직렬화
   */
  public serializeBody(data: any, contentType?: string): any {
    if (!data) {
      return data;
    }

    // FormData는 그대로 반환
    if (data instanceof FormData) {
      return data;
    }

    // Blob, ArrayBuffer 등은 그대로 반환
    if (
      data instanceof Blob ||
      data instanceof ArrayBuffer ||
      data instanceof DataView ||
      data instanceof URLSearchParams
    ) {
      return data;
    }

    // application/x-www-form-urlencoded
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      return qs.stringify(data);
    }

    // 기본값: JSON
    if (typeof data === 'object') {
      return JSON.stringify(data);
    }

    return data;
  }

  /**
   * 파일 업로드를 위한 설정 빌드
   */
  public buildUploadConfig(
    file: File | Blob,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    onProgress?: (percent: number) => void
  ): HttpRequestConfig {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const config: HttpRequestConfig = {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const total = progressEvent.total || 0;
        const loaded = progressEvent.loaded;
        const percent = total > 0 ? Math.round((loaded * 100) / total) : 0;
        onProgress(percent);
      };
    }

    return config;
  }
}