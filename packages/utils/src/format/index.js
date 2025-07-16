/**
 * @company/utils - 포맷팅 유틸리티
 */
// ===== 숫자 포맷팅 =====
/**
 * 숫자에 천 단위 구분자 추가
 */
export function formatNumber(num, locale = 'ko-KR', options) {
    try {
        if (typeof num !== 'number' || isNaN(num)) {
            return { success: false, error: '유효한 숫자가 아닙니다' };
        }
        const formatter = new Intl.NumberFormat(locale, options);
        const formatted = formatter.format(num);
        return { success: true, data: formatted };
    }
    catch (error) {
        return { success: false, error: `숫자 포맷팅 실패: ${error}` };
    }
}
/**
 * 통화 포맷팅
 */
export function formatCurrency(amount, currency = 'KRW', locale = 'ko-KR') {
    try {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return { success: false, error: '유효한 금액이 아닙니다' };
        }
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        });
        const formatted = formatter.format(amount);
        return { success: true, data: formatted };
    }
    catch (error) {
        return { success: false, error: `통화 포맷팅 실패: ${error}` };
    }
}
/**
 * 백분율 포맷팅
 */
export function formatPercentage(value, decimals = 2, locale = 'ko-KR') {
    try {
        if (typeof value !== 'number' || isNaN(value)) {
            return { success: false, error: '유효한 값이 아닙니다' };
        }
        if (decimals < 0) {
            return { success: false, error: '소수점 자릿수는 0 이상이어야 합니다' };
        }
        const formatter = new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        const formatted = formatter.format(value);
        return { success: true, data: formatted };
    }
    catch (error) {
        return { success: false, error: `백분율 포맷팅 실패: ${error}` };
    }
}
/**
 * 파일 크기 포맷팅
 */
export function formatFileSize(bytes, decimals = 2) {
    try {
        if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
            return { success: false, error: '유효한 바이트 수가 아닙니다' };
        }
        if (decimals < 0) {
            return { success: false, error: '소수점 자릿수는 0 이상이어야 합니다' };
        }
        if (bytes === 0) {
            return { success: true, data: '0 Bytes' };
        }
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const value = bytes / Math.pow(k, i);
        const formatted = `${value.toFixed(decimals)} ${sizes[i]}`;
        return { success: true, data: formatted };
    }
    catch (error) {
        return { success: false, error: `파일 크기 포맷팅 실패: ${error}` };
    }
}
// ===== 전화번호 포맷팅 =====
/**
 * 한국 전화번호 포맷팅
 */
export function formatKoreanPhoneNumber(phoneNumber) {
    try {
        if (typeof phoneNumber !== 'string') {
            return { success: false, error: '전화번호가 문자열이 아닙니다' };
        }
        // 숫자만 추출
        const numbers = phoneNumber.replace(/[^\d]/g, '');
        if (numbers.length < 10 || numbers.length > 11) {
            return { success: false, error: '유효하지 않은 전화번호 길이입니다' };
        }
        let formatted;
        if (numbers.length === 10) {
            // 지역번호 2자리 (예: 02-1234-5678)
            formatted = `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        }
        else if (numbers.length === 11) {
            if (numbers.startsWith('02')) {
                // 서울 지역번호 (예: 02-1234-5678)
                formatted = `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
            }
            else {
                // 휴대폰 번호 (예: 010-1234-5678)
                formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
            }
        }
        else {
            return { success: false, error: '지원하지 않는 전화번호 형식입니다' };
        }
        return { success: true, data: formatted };
    }
    catch (error) {
        return { success: false, error: `전화번호 포맷팅 실패: ${error}` };
    }
}
// ===== 주민등록번호 포맷팅 =====
/**
 * 주민등록번호 포맷팅 (마스킹 옵션)
 */
export function formatKoreanSSN(ssn, mask = true) {
    try {
        if (typeof ssn !== 'string') {
            return { success: false, error: '주민등록번호가 문자열이 아닙니다' };
        }
        const numbers = ssn.replace(/[^\d]/g, '');
        if (numbers.length !== 13) {
            return { success: false, error: '주민등록번호는 13자리여야 합니다' };
        }
        const firstPart = numbers.slice(0, 6);
        const secondPart = numbers.slice(6);
        if (mask) {
            const maskedSecondPart = secondPart[0] + '*'.repeat(6);
            return { success: true, data: `${firstPart}-${maskedSecondPart}` };
        }
        else {
            return { success: true, data: `${firstPart}-${secondPart}` };
        }
    }
    catch (error) {
        return { success: false, error: `주민등록번호 포맷팅 실패: ${error}` };
    }
}
// ===== 카드번호 포맷팅 =====
/**
 * 신용카드 번호 포맷팅 (마스킹 옵션)
 */
export function formatCreditCardNumber(cardNumber, mask = true) {
    try {
        if (typeof cardNumber !== 'string') {
            return { success: false, error: '카드번호가 문자열이 아닙니다' };
        }
        const numbers = cardNumber.replace(/[^\d]/g, '');
        if (numbers.length < 13 || numbers.length > 19) {
            return { success: false, error: '유효하지 않은 카드번호 길이입니다' };
        }
        // 4자리씩 그룹화
        const groups = [];
        for (let i = 0; i < numbers.length; i += 4) {
            groups.push(numbers.slice(i, i + 4));
        }
        if (mask && groups.length >= 3) {
            // 첫 번째와 마지막 그룹만 표시
            const maskedGroups = [
                groups[0],
                ...groups.slice(1, -1).map(() => '****'),
                groups[groups.length - 1]
            ];
            return { success: true, data: maskedGroups.join('-') };
        }
        else {
            return { success: true, data: groups.join('-') };
        }
    }
    catch (error) {
        return { success: false, error: `카드번호 포맷팅 실패: ${error}` };
    }
}
// ===== 텍스트 마스킹 =====
/**
 * 이메일 마스킹
 */
export function maskEmail(email) {
    try {
        if (typeof email !== 'string') {
            return { success: false, error: '이메일이 문자열이 아닙니다' };
        }
        const emailRegex = /^([^@]+)@(.+)$/;
        const match = email.match(emailRegex);
        if (!match) {
            return { success: false, error: '유효하지 않은 이메일 형식입니다' };
        }
        const [, localPart, domain] = match;
        if (localPart.length <= 3) {
            const masked = localPart[0] + '*'.repeat(localPart.length - 1);
            return { success: true, data: `${masked}@${domain}` };
        }
        else {
            const masked = localPart.slice(0, 2) + '*'.repeat(localPart.length - 3) + localPart.slice(-1);
            return { success: true, data: `${masked}@${domain}` };
        }
    }
    catch (error) {
        return { success: false, error: `이메일 마스킹 실패: ${error}` };
    }
}
/**
 * 이름 마스킹
 */
export function maskName(name) {
    try {
        if (typeof name !== 'string') {
            return { success: false, error: '이름이 문자열이 아닙니다' };
        }
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            return { success: false, error: '이름이 비어있습니다' };
        }
        if (trimmedName.length === 1) {
            return { success: true, data: '*' };
        }
        else if (trimmedName.length === 2) {
            return { success: true, data: trimmedName[0] + '*' };
        }
        else {
            return { success: true, data: trimmedName[0] + '*'.repeat(trimmedName.length - 2) + trimmedName.slice(-1) };
        }
    }
    catch (error) {
        return { success: false, error: `이름 마스킹 실패: ${error}` };
    }
}
// ===== JSON 포맷팅 =====
/**
 * JSON 예쁘게 포맷팅
 */
export function formatJSON(obj, indent = 2) {
    try {
        if (indent < 0) {
            return { success: false, error: '들여쓰기는 0 이상이어야 합니다' };
        }
        const formatted = JSON.stringify(obj, null, indent);
        return { success: true, data: formatted };
    }
    catch (error) {
        return { success: false, error: `JSON 포맷팅 실패: ${error}` };
    }
}
/**
 * JSON 압축 (공백 제거)
 */
export function compactJSON(obj) {
    try {
        const compacted = JSON.stringify(obj);
        return { success: true, data: compacted };
    }
    catch (error) {
        return { success: false, error: `JSON 압축 실패: ${error}` };
    }
}
// ===== URL 포맷팅 =====
/**
 * URL 쿼리 파라미터 포맷팅
 */
export function formatQueryParams(params) {
    try {
        if (typeof params !== 'object' || params === null) {
            return { success: false, error: '파라미터가 객체가 아닙니다' };
        }
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined) {
                searchParams.append(key, String(value));
            }
        }
        return { success: true, data: searchParams.toString() };
    }
    catch (error) {
        return { success: false, error: `쿼리 파라미터 포맷팅 실패: ${error}` };
    }
}
/**
 * URL 정규화
 */
export function normalizeUrl(url) {
    try {
        if (typeof url !== 'string') {
            return { success: false, error: 'URL이 문자열이 아닙니다' };
        }
        const urlObj = new URL(url);
        // 기본 포트 제거
        if ((urlObj.protocol === 'http:' && urlObj.port === '80') ||
            (urlObj.protocol === 'https:' && urlObj.port === '443')) {
            urlObj.port = '';
        }
        // 끝의 슬래시 제거 (루트 경로가 아닌 경우)
        if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
            urlObj.pathname = urlObj.pathname.slice(0, -1);
        }
        // 쿼리 파라미터 정렬
        const sortedParams = new URLSearchParams();
        const params = Array.from(urlObj.searchParams.entries()).sort();
        params.forEach(([key, value]) => sortedParams.append(key, value));
        urlObj.search = sortedParams.toString();
        return { success: true, data: urlObj.toString() };
    }
    catch (error) {
        return { success: false, error: `URL 정규화 실패: ${error}` };
    }
}
// ===== 주소 포맷팅 =====
/**
 * 한국 주소 포맷팅
 */
export function formatKoreanAddress(address) {
    try {
        if (typeof address !== 'object' || address === null) {
            return { success: false, error: '주소가 객체가 아닙니다' };
        }
        const { zipCode, state, city, district, street, detail } = address;
        if (!city || !street) {
            return { success: false, error: '시/군/구와 도로명은 필수입니다' };
        }
        const parts = [];
        if (zipCode) {
            parts.push(`(${zipCode})`);
        }
        if (state) {
            parts.push(state);
        }
        parts.push(city);
        if (district) {
            parts.push(district);
        }
        parts.push(street);
        if (detail) {
            parts.push(detail);
        }
        return { success: true, data: parts.join(' ') };
    }
    catch (error) {
        return { success: false, error: `주소 포맷팅 실패: ${error}` };
    }
}
// ===== 시간 포맷팅 =====
/**
 * 상대적 시간 포맷팅 (예: "2시간 전")
 */
export function formatRelativeTime(date, baseDate = new Date()) {
    try {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return { success: false, error: '유효하지 않은 날짜입니다' };
        }
        if (!(baseDate instanceof Date) || isNaN(baseDate.getTime())) {
            return { success: false, error: '유효하지 않은 기준 날짜입니다' };
        }
        const diffMs = baseDate.getTime() - date.getTime();
        const absDiffMs = Math.abs(diffMs);
        const isPast = diffMs > 0;
        const units = [
            { name: '년', ms: 365 * 24 * 60 * 60 * 1000 },
            { name: '개월', ms: 30 * 24 * 60 * 60 * 1000 },
            { name: '일', ms: 24 * 60 * 60 * 1000 },
            { name: '시간', ms: 60 * 60 * 1000 },
            { name: '분', ms: 60 * 1000 },
            { name: '초', ms: 1000 }
        ];
        for (const unit of units) {
            const value = Math.floor(absDiffMs / unit.ms);
            if (value >= 1) {
                const suffix = isPast ? '전' : '후';
                return { success: true, data: `${value}${unit.name} ${suffix}` };
            }
        }
        return { success: true, data: '방금' };
    }
    catch (error) {
        return { success: false, error: `상대적 시간 포맷팅 실패: ${error}` };
    }
}
//# sourceMappingURL=index.js.map