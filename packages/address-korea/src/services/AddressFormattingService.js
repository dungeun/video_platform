/**
 * 주소 포맷팅 서비스
 */
export class AddressFormattingService {
    /**
     * 주소 포맷팅
     */
    format(address, options) {
        const opts = {
            type: address.addressType,
            includePostcode: true,
            includeDetails: true,
            includeExtra: true,
            useShorthand: false,
            separator: ' ',
            ...options
        };
        const parts = [];
        // 우편번호
        if (opts.includePostcode && address.zonecode) {
            parts.push(`(${address.zonecode})`);
        }
        // 기본 주소
        if (address.address) {
            if (opts.useShorthand) {
                parts.push(this.toShorthand(address.address));
            }
            else {
                parts.push(address.address);
            }
        }
        // 상세 주소
        if (opts.includeDetails && address.detailAddress) {
            parts.push(address.detailAddress);
        }
        // 참고 항목
        if (opts.includeExtra && address.extraAddress) {
            parts.push(address.extraAddress);
        }
        return parts.join(opts.separator);
    }
    /**
     * 검색 결과를 상세 주소로 변환
     */
    toDetailedAddress(result) {
        const isRoad = result.userSelectedType === 'ROAD';
        return {
            zonecode: result.zonecode,
            address: result.address,
            addressType: isRoad ? 'ROAD' : 'JIBUN',
            detailAddress: '',
            extraAddress: this.generateExtraAddress(result),
            englishAddress: result.addressEnglish,
            sido: result.sido,
            sigungu: result.sigungu,
            bname: result.bname,
            roadname: result.roadname,
            buildingName: result.buildingName,
            sigunguCode: result.sigunguCode,
            bcode: result.bcode,
            roadnameCode: result.roadnameCode,
            buildingCode: result.buildingCode
        };
    }
    /**
     * 참고 항목 생성
     */
    generateExtraAddress(result) {
        const extras = [];
        // 법정동명
        if (result.bname && result.bname !== '') {
            extras.push(result.bname);
        }
        // 건물명
        if (result.buildingName && result.buildingName !== '') {
            extras.push(result.buildingName);
        }
        return extras.length > 0 ? `(${extras.join(', ')})` : '';
    }
    /**
     * 주소를 한 줄로 포맷팅
     */
    toSingleLine(address, includePostcode = true) {
        return this.format(address, {
            includePostcode,
            separator: ' '
        });
    }
    /**
     * 주소를 여러 줄로 포맷팅
     */
    toMultiLine(address, includePostcode = true) {
        const lines = [];
        if (includePostcode && address.zonecode) {
            lines.push(`우편번호: ${address.zonecode}`);
        }
        if (address.address) {
            lines.push(address.address);
        }
        if (address.detailAddress) {
            lines.push(address.detailAddress);
        }
        if (address.extraAddress) {
            lines.push(address.extraAddress);
        }
        return lines;
    }
    /**
     * 배송 라벨용 포맷팅
     */
    toShippingLabel(address) {
        const lines = [
            `[${address.zonecode}]`,
            address.address,
            address.detailAddress || '',
            address.extraAddress || ''
        ].filter(Boolean);
        return lines.join('\n');
    }
    /**
     * 영문 주소 포맷팅
     */
    toEnglish(address) {
        if (address.englishAddress) {
            return address.englishAddress;
        }
        // 영문 주소가 없는 경우 한글 주소를 역순으로 배치
        const parts = [
            address.detailAddress,
            address.bname,
            address.sigungu,
            address.sido,
            'Korea',
            address.zonecode
        ].filter(Boolean);
        return parts.join(', ');
    }
    /**
     * 약어 변환
     */
    toShorthand(address) {
        const replacements = {
            '서울특별시': '서울',
            '부산광역시': '부산',
            '대구광역시': '대구',
            '인천광역시': '인천',
            '광주광역시': '광주',
            '대전광역시': '대전',
            '울산광역시': '울산',
            '세종특별자치시': '세종',
            '경기도': '경기',
            '강원도': '강원',
            '충청북도': '충북',
            '충청남도': '충남',
            '전라북도': '전북',
            '전라남도': '전남',
            '경상북도': '경북',
            '경상남도': '경남',
            '제주특별자치도': '제주'
        };
        let result = address;
        Object.entries(replacements).forEach(([full, short]) => {
            result = result.replace(full, short);
        });
        return result;
    }
    /**
     * 주소 비교
     */
    isSameAddress(addr1, addr2) {
        return (addr1.zonecode === addr2.zonecode &&
            addr1.address === addr2.address &&
            addr1.detailAddress === addr2.detailAddress);
    }
    /**
     * 주소 일부 마스킹
     */
    maskAddress(address, maskDetails = true) {
        const parts = [];
        // 우편번호는 그대로
        if (address.zonecode) {
            parts.push(`(${address.zonecode})`);
        }
        // 기본 주소는 그대로
        parts.push(address.address);
        // 상세 주소 마스킹
        if (maskDetails && address.detailAddress) {
            const masked = address.detailAddress
                .split(' ')
                .map((word, index) => index === 0 ? word : '*'.repeat(word.length))
                .join(' ');
            parts.push(masked);
        }
        else if (address.detailAddress) {
            parts.push(address.detailAddress);
        }
        return parts.join(' ');
    }
    /**
     * 주소 요약 (모바일용)
     */
    summarize(address, maxLength = 30) {
        const full = this.toSingleLine(address, false);
        if (full.length <= maxLength) {
            return full;
        }
        // 시/군/구와 상세주소 중심으로 요약
        const summary = [
            address.sigungu,
            address.bname,
            address.detailAddress?.split(' ')[0]
        ].filter(Boolean).join(' ');
        if (summary.length > maxLength) {
            return summary.substring(0, maxLength - 3) + '...';
        }
        return summary;
    }
}
//# sourceMappingURL=AddressFormattingService.js.map