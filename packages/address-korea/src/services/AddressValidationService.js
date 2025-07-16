/**
 * 주소 유효성 검사 서비스
 */
export class AddressValidationService {
    /**
     * 주소 유효성 검사
     */
    validate(address) {
        const errors = [];
        const warnings = [];
        // 필수 필드 검사
        if (!address.zonecode) {
            errors.push('우편번호가 없습니다.');
        }
        else if (!this.isValidPostcode(address.zonecode)) {
            errors.push('유효하지 않은 우편번호 형식입니다.');
        }
        if (!address.address) {
            errors.push('주소가 없습니다.');
        }
        if (!address.sido) {
            errors.push('시/도 정보가 없습니다.');
        }
        if (!address.sigungu) {
            errors.push('시/군/구 정보가 없습니다.');
        }
        // 주소 타입별 검사
        if (address.addressType === 'ROAD') {
            if (!address.roadname) {
                warnings.push('도로명이 없습니다.');
            }
        }
        // 상세 주소 검사
        if (!address.detailAddress) {
            warnings.push('상세 주소가 없습니다. 정확한 배송을 위해 상세 주소를 입력해주세요.');
        }
        // 특수문자 검사
        if (address.detailAddress && this.containsInvalidCharacters(address.detailAddress)) {
            warnings.push('상세 주소에 사용할 수 없는 특수문자가 포함되어 있습니다.');
        }
        // 주소 정규화
        const normalizedAddress = this.normalizeAddress(address);
        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
            normalizedAddress
        };
    }
    /**
     * 우편번호 형식 검사
     */
    isValidPostcode(postcode) {
        // 5자리 새 우편번호
        const newPostcodeRegex = /^\d{5}$/;
        // 6자리 구 우편번호 (하이픈 포함)
        const oldPostcodeRegex = /^\d{3}-?\d{3}$/;
        return newPostcodeRegex.test(postcode) || oldPostcodeRegex.test(postcode);
    }
    /**
     * 특수문자 검사
     */
    containsInvalidCharacters(text) {
        // 한글, 영문, 숫자, 공백, 일부 특수문자만 허용
        const validCharRegex = /^[가-힣a-zA-Z0-9\s\-,./#()]+$/;
        return !validCharRegex.test(text);
    }
    /**
     * 주소 정규화
     */
    normalizeAddress(address) {
        return {
            ...address,
            // 우편번호 정규화 (하이픈 제거)
            zonecode: address.zonecode.replace(/-/g, ''),
            // 주소 텍스트 정규화
            address: this.normalizeText(address.address),
            detailAddress: address.detailAddress ? this.normalizeText(address.detailAddress) : '',
            extraAddress: address.extraAddress ? this.normalizeText(address.extraAddress) : '',
            // 시/도 약어 정규화
            sido: this.normalizeSido(address.sido),
            // 시/군/구 정규화
            sigungu: this.normalizeSigungu(address.sigungu)
        };
    }
    /**
     * 텍스트 정규화
     */
    normalizeText(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ') // 연속된 공백을 하나로
            .replace(/["""]/g, '"') // 특수 따옴표를 일반 따옴표로
            .replace(/[''`]/g, "'"); // 특수 작은따옴표를 일반 작은따옴표로
    }
    /**
     * 시/도 정규화
     */
    normalizeSido(sido) {
        const sidoMap = {
            '서울': '서울특별시',
            '서울시': '서울특별시',
            '부산': '부산광역시',
            '부산시': '부산광역시',
            '대구': '대구광역시',
            '대구시': '대구광역시',
            '인천': '인천광역시',
            '인천시': '인천광역시',
            '광주': '광주광역시',
            '광주시': '광주광역시',
            '대전': '대전광역시',
            '대전시': '대전광역시',
            '울산': '울산광역시',
            '울산시': '울산광역시',
            '세종': '세종특별자치시',
            '세종시': '세종특별자치시',
            '경기': '경기도',
            '강원': '강원도',
            '충북': '충청북도',
            '충남': '충청남도',
            '전북': '전라북도',
            '전남': '전라남도',
            '경북': '경상북도',
            '경남': '경상남도',
            '제주': '제주특별자치도',
            '제주도': '제주특별자치도'
        };
        return sidoMap[sido] || sido;
    }
    /**
     * 시/군/구 정규화
     */
    normalizeSigungu(sigungu) {
        // 시/군/구가 누락된 경우 추가
        if (!sigungu.endsWith('시') && !sigungu.endsWith('군') && !sigungu.endsWith('구')) {
            // 일반적인 패턴 확인
            if (sigungu.includes('시') || sigungu.includes('군') || sigungu.includes('구')) {
                return sigungu;
            }
        }
        return sigungu;
    }
    /**
     * 배송 가능 지역 확인
     */
    isDeliverable(address) {
        // 도서산간 지역 확인
        const remoteAreas = [
            '울릉군',
            '옹진군',
            '신안군',
            '진도군',
            '완도군'
        ];
        return !remoteAreas.some(area => address.sigungu.includes(area));
    }
    /**
     * 주소 완성도 점수 계산
     */
    calculateCompleteness(address) {
        let score = 0;
        const maxScore = 100;
        // 필수 필드 (각 20점)
        if (address.zonecode)
            score += 20;
        if (address.address)
            score += 20;
        if (address.sido)
            score += 20;
        if (address.sigungu)
            score += 20;
        // 선택 필드 (각 10점)
        if (address.detailAddress)
            score += 10;
        if (address.addressType === 'ROAD' && address.roadname)
            score += 5;
        if (address.buildingName)
            score += 5;
        return Math.min(score, maxScore);
    }
}
//# sourceMappingURL=AddressValidationService.js.map