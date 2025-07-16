import { VerificationRequest, VerificationMethod } from '../types';

/**
 * 폼 데이터 검증
 */
export function validateForm(data: VerificationRequest): Record<string, string> {
  const errors: Record<string, string> = {};

  // 이름 검증
  if (!data.name || data.name.trim().length < 2) {
    errors.name = '이름을 2자 이상 입력해주세요.';
  } else if (!/^[가-힣a-zA-Z\s]+$/.test(data.name)) {
    errors.name = '이름은 한글 또는 영문만 입력 가능합니다.';
  }

  // 생년월일 검증
  if (!data.birthDate) {
    errors.birthDate = '생년월일을 입력해주세요.';
  } else if (!isValidBirthDate(data.birthDate)) {
    errors.birthDate = '올바른 생년월일을 입력해주세요. (YYYYMMDD)';
  }

  // 휴대폰 번호 검증
  if (!data.phoneNumber) {
    errors.phoneNumber = '휴대폰 번호를 입력해주세요.';
  } else if (!isValidPhoneNumber(data.phoneNumber)) {
    errors.phoneNumber = '올바른 휴대폰 번호를 입력해주세요.';
  }

  // 통신사 인증인 경우 통신사 필수
  if (data.method === VerificationMethod.MOBILE_CARRIER && !data.carrier) {
    errors.carrier = '통신사를 선택해주세요.';
  }

  return errors;
}

/**
 * 생년월일 유효성 검사
 */
export function isValidBirthDate(birthDate: string): boolean {
  // 8자리 숫자인지 확인
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

  // 150년 이상 과거 날짜 불가
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (date < minDate) {
    return false;
  }

  return true;
}

/**
 * 휴대폰 번호 유효성 검사
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/[^0-9]/g, '');
  return /^01[0-9]{8,9}$/.test(cleaned);
}

/**
 * 주민등록번호 유효성 검사 (앞자리만)
 */
export function isValidRRNPrefix(rrnPrefix: string): boolean {
  if (!/^\d{6}$/.test(rrnPrefix)) {
    return false;
  }

  const year = parseInt(rrnPrefix.substring(0, 2));
  const month = parseInt(rrnPrefix.substring(2, 4));
  const day = parseInt(rrnPrefix.substring(4, 6));

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

/**
 * 이름 유효성 검사
 */
export function isValidName(name: string): boolean {
  // 최소 2자 이상
  if (name.length < 2) {
    return false;
  }

  // 한글, 영문, 공백만 허용
  return /^[가-힣a-zA-Z\s]+$/.test(name);
}

/**
 * 성인 여부 확인
 */
export function isAdult(birthDate: string): boolean {
  if (!isValidBirthDate(birthDate)) {
    return false;
  }

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
 * 외국인 등록번호 유효성 검사
 */
export function isValidForeignerNumber(number: string): boolean {
  // 13자리 숫자인지 확인
  if (!/^\d{13}$/.test(number)) {
    return false;
  }

  // 생년월일 부분 검증
  const birthDate = number.substring(0, 6);
  const genderDigit = parseInt(number.charAt(6));

  // 외국인 성별 코드는 5, 6, 7, 8
  if (![5, 6, 7, 8].includes(genderDigit)) {
    return false;
  }

  // 생년월일 유효성 검사
  const century = genderDigit <= 6 ? '19' : '20';
  const fullBirthDate = century + birthDate;
  
  return isValidBirthDate(fullBirthDate);
}