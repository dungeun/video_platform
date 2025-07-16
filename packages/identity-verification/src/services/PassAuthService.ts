import axios, { AxiosInstance } from 'axios';
import {
  PassAuthConfig,
  VerificationRequest,
  VerificationResponse,
  VerificationResult,
  VerificationStatus,
  VerificationErrorCode,
  UserIdentity,
  VerificationMethod
} from '../types';

/**
 * PASS 인증 서비스
 * 한국 통신 3사 PASS 앱을 통한 본인인증 처리
 */
export class PassAuthService {
  private client: AxiosInstance;
  private config: PassAuthConfig;

  constructor(config: PassAuthConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiEndpoint,
      timeout: (config.timeout || 30) * 1000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Id': config.serviceId,
        'X-Service-Key': config.serviceKey
      }
    });

    this.setupInterceptors();
  }

  /**
   * 인터셉터 설정
   */
  private setupInterceptors(): void {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // 요청 로깅
        console.log(`[PASS Auth] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[PASS Auth] Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[PASS Auth] Response: ${response.status}`);
        return response;
      },
      async (error) => {
        console.error('[PASS Auth] Response Error:', error);
        
        // 재시도 로직
        if (error.config && !error.config.__isRetryRequest) {
          error.config.__isRetryRequest = true;
          error.config.__retryCount = error.config.__retryCount || 0;
          
          if (error.config.__retryCount < (this.config.maxRetries || 3)) {
            error.config.__retryCount++;
            return this.client(error.config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * PASS 인증 요청
   */
  async requestVerification(request: VerificationRequest): Promise<VerificationResponse> {
    try {
      // 요청 데이터 검증
      this.validateRequest(request);

      // PASS 인증 요청 데이터 구성
      const passRequest = {
        serviceId: this.config.serviceId,
        userName: request.name,
        userBirthDate: request.birthDate,
        userGender: request.gender,
        userPhone: this.formatPhoneNumber(request.phoneNumber),
        carrier: request.carrier,
        nationality: request.nationality || 'korean',
        returnUrl: request.returnUrl || this.config.callbackUrl,
        options: {
          checkDuplicate: request.options?.checkDuplicate || false,
          requireAdult: request.options?.requireAdult || false,
          expiresIn: request.options?.expiresIn || 300,
          customMessage: request.options?.customMessage
        }
      };

      // API 호출
      const response = await this.client.post('/auth/request', passRequest);
      
      // 응답 데이터 변환
      return {
        verificationId: response.data.authId,
        status: VerificationStatus.IN_PROGRESS,
        token: response.data.authToken,
        authUrl: response.data.authUrl,
        expiresAt: new Date(Date.now() + (request.options?.expiresIn || 300) * 1000)
      };
    } catch (error) {
      console.error('[PASS Auth] Request verification error:', error);
      return {
        verificationId: '',
        status: VerificationStatus.FAILED,
        error: this.handleError(error)
      };
    }
  }

  /**
   * 인증 상태 확인
   */
  async checkStatus(verificationId: string): Promise<VerificationResponse> {
    try {
      const response = await this.client.get(`/auth/status/${verificationId}`);
      
      return {
        verificationId,
        status: this.mapStatus(response.data.status),
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined
      };
    } catch (error) {
      console.error('[PASS Auth] Check status error:', error);
      return {
        verificationId,
        status: VerificationStatus.FAILED,
        error: this.handleError(error)
      };
    }
  }

  /**
   * 인증 결과 조회
   */
  async getResult(verificationId: string, token: string): Promise<VerificationResult> {
    try {
      const response = await this.client.post('/auth/result', {
        authId: verificationId,
        authToken: token
      });

      if (response.data.success) {
        const identity: UserIdentity = {
          ci: response.data.ci,
          di: response.data.di,
          name: response.data.userName,
          birthDate: response.data.userBirthDate,
          gender: response.data.userGender,
          phoneNumber: response.data.userPhone,
          carrier: response.data.carrier,
          nationality: response.data.nationality,
          isAdult: this.checkAdult(response.data.userBirthDate),
          verifiedAt: new Date(),
          verificationMethod: VerificationMethod.PASS
        };

        return {
          success: true,
          verificationId,
          identity,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          verificationId,
          error: {
            code: VerificationErrorCode.VERIFICATION_FAILED,
            message: response.data.message || '인증에 실패했습니다.'
          },
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('[PASS Auth] Get result error:', error);
      return {
        success: false,
        verificationId,
        error: this.handleError(error),
        timestamp: new Date()
      };
    }
  }

  /**
   * 인증 취소
   */
  async cancelVerification(verificationId: string): Promise<boolean> {
    try {
      await this.client.post(`/auth/cancel/${verificationId}`);
      return true;
    } catch (error) {
      console.error('[PASS Auth] Cancel verification error:', error);
      return false;
    }
  }

  /**
   * 요청 데이터 검증
   */
  private validateRequest(request: VerificationRequest): void {
    // 이름 검증
    if (!request.name || request.name.length < 2) {
      throw new Error('올바른 이름을 입력해주세요.');
    }

    // 생년월일 검증
    if (!this.isValidBirthDate(request.birthDate)) {
      throw new Error('올바른 생년월일을 입력해주세요. (YYYYMMDD)');
    }

    // 휴대폰 번호 검증
    if (!this.isValidPhoneNumber(request.phoneNumber)) {
      throw new Error('올바른 휴대폰 번호를 입력해주세요.');
    }
  }

  /**
   * 생년월일 유효성 검사
   */
  private isValidBirthDate(birthDate: string): boolean {
    if (!/^\d{8}$/.test(birthDate)) return false;
    
    const year = parseInt(birthDate.substring(0, 4));
    const month = parseInt(birthDate.substring(4, 6));
    const day = parseInt(birthDate.substring(6, 8));
    
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day &&
           date <= new Date();
  }

  /**
   * 휴대폰 번호 유효성 검사
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    return /^01[0-9]{8,9}$/.test(cleaned);
  }

  /**
   * 휴대폰 번호 포맷팅
   */
  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return cleaned;
  }

  /**
   * 성인 여부 확인
   */
  private checkAdult(birthDate: string): boolean {
    const year = parseInt(birthDate.substring(0, 4));
    const month = parseInt(birthDate.substring(4, 6));
    const day = parseInt(birthDate.substring(6, 8));
    
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    
    if (age > 19) return true;
    if (age < 19) return false;
    
    // 19세인 경우 월일 비교
    return today.getMonth() > birth.getMonth() ||
           (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  }

  /**
   * 상태 매핑
   */
  private mapStatus(apiStatus: string): VerificationStatus {
    const statusMap: Record<string, VerificationStatus> = {
      'PENDING': VerificationStatus.IN_PROGRESS,
      'PROCESSING': VerificationStatus.VERIFYING,
      'SUCCESS': VerificationStatus.SUCCESS,
      'FAILED': VerificationStatus.FAILED,
      'EXPIRED': VerificationStatus.EXPIRED,
      'CANCELLED': VerificationStatus.CANCELLED
    };
    
    return statusMap[apiStatus] || VerificationStatus.FAILED;
  }

  /**
   * 오류 처리
   */
  private handleError(error: any): any {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      if (status === 400) {
        return {
          code: VerificationErrorCode.INVALID_REQUEST,
          message: data?.message || '잘못된 요청입니다.'
        };
      } else if (status === 429) {
        return {
          code: VerificationErrorCode.RATE_LIMIT_EXCEEDED,
          message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
        };
      } else if (status === 503) {
        return {
          code: VerificationErrorCode.SERVICE_UNAVAILABLE,
          message: '서비스를 일시적으로 사용할 수 없습니다.'
        };
      }
    }
    
    return {
      code: VerificationErrorCode.UNKNOWN_ERROR,
      message: error.message || '알 수 없는 오류가 발생했습니다.'
    };
  }
}