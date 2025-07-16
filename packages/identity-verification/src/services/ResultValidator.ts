import {
  UserIdentity,
  VerificationResult,
  VerificationErrorCode
} from '../types';

/**
 * 본인인증 결과 검증 서비스
 * 인증 결과의 유효성을 검증하고 데이터 무결성을 확인
 */
export class ResultValidator {
  /**
   * 인증 결과 전체 검증
   */
  validateResult(result: VerificationResult): boolean {
    if (!result) {
      console.error('[Result Validator] Result is null or undefined');
      return false;
    }

    // 기본 필드 검증
    if (!result.verificationId || !result.timestamp) {
      console.error('[Result Validator] Missing required fields');
      return false;
    }

    // 성공한 경우 신원 정보 검증
    if (result.success && result.identity) {
      return this.validateIdentity(result.identity);
    }

    // 실패한 경우 오류 정보 검증
    if (!result.success && result.error) {
      return this.validateError(result.error);
    }

    return true;
  }

  /**
   * 사용자 신원 정보 검증
   */
  validateIdentity(identity: UserIdentity): boolean {
    // CI 검증 (88자리)
    if (!this.validateCI(identity.ci)) {
      console.error('[Result Validator] Invalid CI');
      return false;
    }

    // DI 검증 (64자리, 선택사항)
    if (identity.di && !this.validateDI(identity.di)) {
      console.error('[Result Validator] Invalid DI');
      return false;
    }

    // 이름 검증
    if (!this.validateName(identity.name)) {
      console.error('[Result Validator] Invalid name');
      return false;
    }

    // 생년월일 검증
    if (!this.validateBirthDate(identity.birthDate)) {
      console.error('[Result Validator] Invalid birth date');
      return false;
    }

    // 성별 검증
    if (!['M', 'F'].includes(identity.gender)) {
      console.error('[Result Validator] Invalid gender');
      return false;
    }

    // 휴대폰 번호 검증
    if (!this.validatePhoneNumber(identity.phoneNumber)) {
      console.error('[Result Validator] Invalid phone number');
      return false;
    }

    // 성인 여부와 생년월일 일치성 검증
    const calculatedAdult = this.calculateAdult(identity.birthDate);
    if (identity.isAdult !== calculatedAdult) {
      console.error('[Result Validator] Adult status mismatch');
      return false;
    }

    return true;
  }

  /**
   * CI (Connecting Information) 검증
   * 88자리 Base64 인코딩된 문자열
   */
  private validateCI(ci: string): boolean {
    if (!ci || typeof ci !== 'string') {
      return false;
    }

    // CI는 88자리여야 함
    if (ci.length !== 88) {
      return false;
    }

    // Base64 문자만 포함해야 함
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(ci);
  }

  /**
   * DI (Duplication Information) 검증
   * 64자리 Base64 인코딩된 문자열
   */
  private validateDI(di: string): boolean {
    if (!di || typeof di !== 'string') {
      return false;
    }

    // DI는 64자리여야 함
    if (di.length !== 64) {
      return false;
    }

    // Base64 문자만 포함해야 함
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(di);
  }

  /**
   * 이름 검증
   */
  private validateName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    // 최소 2자 이상
    if (name.length < 2) {
      return false;
    }

    // 한글, 영문만 허용 (공백 포함)
    const nameRegex = /^[가-힣a-zA-Z\s]+$/;
    return nameRegex.test(name);
  }

  /**
   * 생년월일 검증
   */
  private validateBirthDate(birthDate: string): boolean {
    if (!birthDate || typeof birthDate !== 'string') {
      return false;
    }

    // YYYYMMDD 형식
    if (!/^\d{8}$/.test(birthDate)) {
      return false;
    }

    const year = parseInt(birthDate.substring(0, 4));
    const month = parseInt(birthDate.substring(4, 6));
    const day = parseInt(birthDate.substring(6, 8));

    // 날짜 유효성 검증
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day) {
      return false;
    }

    // 미래 날짜 불가
    if (date > new Date()) {
      return false;
    }

    // 너무 오래된 날짜 불가 (150년 이상)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 150);
    if (date < minDate) {
      return false;
    }

    return true;
  }

  /**
   * 휴대폰 번호 검증
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    // 숫자만 추출
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');

    // 010, 011, 016, 017, 018, 019로 시작하는 10-11자리
    const phoneRegex = /^01[016789]\d{7,8}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * 성인 여부 계산
   */
  private calculateAdult(birthDate: string): boolean {
    const year = parseInt(birthDate.substring(0, 4));
    const month = parseInt(birthDate.substring(4, 6));
    const day = parseInt(birthDate.substring(6, 8));
    
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age >= 19; // 한국 성인 기준
  }

  /**
   * 오류 정보 검증
   */
  private validateError(error: any): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    // 오류 코드 검증
    if (!error.code || !Object.values(VerificationErrorCode).includes(error.code)) {
      return false;
    }

    // 오류 메시지 검증
    if (!error.message || typeof error.message !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * 데이터 무결성 검증
   * 실제 환경에서는 서명 검증 등 추가 보안 검증 필요
   */
  validateIntegrity(data: any, signature?: string): boolean {
    // TODO: 실제 구현에서는 HMAC이나 RSA 서명 검증 구현
    // 예시:
    // const expectedSignature = this.generateSignature(data);
    // return signature === expectedSignature;
    
    return true;
  }

  /**
   * 타임스탬프 검증
   * 인증 결과가 너무 오래되지 않았는지 확인
   */
  validateTimestamp(timestamp: Date, maxAgeMinutes: number = 10): boolean {
    const now = new Date();
    const age = now.getTime() - timestamp.getTime();
    const maxAge = maxAgeMinutes * 60 * 1000;
    
    return age <= maxAge;
  }

  /**
   * 주민등록번호 유효성 검증 (마스킹된 형태)
   * 실제 주민등록번호는 저장하지 않고 검증만 수행
   */
  validateMaskedRRN(maskedRRN: string): boolean {
    // 형식: YYMMDD-*******
    const rrnRegex = /^\d{6}-\*{7}$/;
    if (!rrnRegex.test(maskedRRN)) {
      return false;
    }

    const birthPart = maskedRRN.substring(0, 6);
    const year = parseInt(birthPart.substring(0, 2));
    const month = parseInt(birthPart.substring(2, 4));
    const day = parseInt(birthPart.substring(4, 6));

    // 월 검증
    if (month < 1 || month > 12) {
      return false;
    }

    // 일 검증
    if (day < 1 || day > 31) {
      return false;
    }

    return true;
  }
}