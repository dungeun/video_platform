"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPhoneNumber = formatPhoneNumber;
exports.formatBirthDate = formatBirthDate;
exports.maskPhoneNumber = maskPhoneNumber;
exports.maskName = maskName;
exports.maskRRN = maskRRN;
exports.maskCI = maskCI;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.birthDateToAge = birthDateToAge;
exports.formatGender = formatGender;
exports.formatCarrier = formatCarrier;
exports.formatVerificationMethod = formatVerificationMethod;
/**
 * 휴대폰 번호 포맷팅
 */
function formatPhoneNumber(value) {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    // 길이에 따라 포맷팅
    if (numbers.length <= 3) {
        return numbers;
    }
    else if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    else if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
}
/**
 * 생년월일 포맷팅
 */
function formatBirthDate(value) {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    // 최대 8자리까지만
    return numbers.slice(0, 8);
}
/**
 * 휴대폰 번호 마스킹
 */
function maskPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-****-${cleaned.slice(6)}`;
    }
    else if (cleaned.length === 11) {
        return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`;
    }
    return phoneNumber;
}
/**
 * 이름 마스킹
 */
function maskName(name) {
    if (name.length <= 2) {
        return name.charAt(0) + '*';
    }
    const firstChar = name.charAt(0);
    const lastChar = name.charAt(name.length - 1);
    const maskLength = name.length - 2;
    return firstChar + '*'.repeat(maskLength) + lastChar;
}
/**
 * 주민등록번호 마스킹
 */
function maskRRN(rrn) {
    // 앞 6자리만 표시
    const cleaned = rrn.replace(/[^0-9]/g, '');
    if (cleaned.length >= 6) {
        return `${cleaned.slice(0, 6)}-*******`;
    }
    return rrn;
}
/**
 * CI 마스킹
 */
function maskCI(ci) {
    if (ci.length <= 20) {
        return ci;
    }
    // 앞 10자리와 뒤 10자리만 표시
    return `${ci.slice(0, 10)}...${ci.slice(-10)}`;
}
/**
 * 날짜 포맷팅
 */
function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * 날짜/시간 포맷팅
 */
function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dateStr = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}:${seconds}`;
}
/**
 * 생년월일을 나이로 변환
 */
function birthDateToAge(birthDate) {
    if (!/^\d{8}$/.test(birthDate)) {
        return 0;
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
    return age;
}
/**
 * 성별 텍스트 변환
 */
function formatGender(gender) {
    switch (gender) {
        case 'M':
        case '1':
        case '3':
            return '남성';
        case 'F':
        case '2':
        case '4':
            return '여성';
        default:
            return gender;
    }
}
/**
 * 통신사 이름 변환
 */
function formatCarrier(carrier) {
    const carrierNames = {
        'SKT': 'SK텔레콤',
        'KT': 'KT',
        'LGU': 'LG유플러스',
        'MVNO': '알뜰폰'
    };
    return carrierNames[carrier] || carrier;
}
/**
 * 인증 수단 이름 변환
 */
function formatVerificationMethod(method) {
    const methodNames = {
        'PASS': 'PASS 인증',
        'MOBILE_CARRIER': '휴대폰 인증',
        'KAKAO': '카카오 인증',
        'NAVER': '네이버 인증',
        'TOSS': '토스 인증',
        'PAYCO': '페이코 인증',
        'KB': 'KB국민은행 인증'
    };
    return methodNames[method] || method;
}
//# sourceMappingURL=formatters.js.map