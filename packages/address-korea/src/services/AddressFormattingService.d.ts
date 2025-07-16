/**
 * 주소 포맷팅 서비스
 */
import type { DetailedAddress, AddressFormatOptions, AddressSearchResult } from '../types';
export declare class AddressFormattingService {
    /**
     * 주소 포맷팅
     */
    format(address: DetailedAddress, options?: AddressFormatOptions): string;
    /**
     * 검색 결과를 상세 주소로 변환
     */
    toDetailedAddress(result: AddressSearchResult): DetailedAddress;
    /**
     * 참고 항목 생성
     */
    private generateExtraAddress;
    /**
     * 주소를 한 줄로 포맷팅
     */
    toSingleLine(address: DetailedAddress, includePostcode?: boolean): string;
    /**
     * 주소를 여러 줄로 포맷팅
     */
    toMultiLine(address: DetailedAddress, includePostcode?: boolean): string[];
    /**
     * 배송 라벨용 포맷팅
     */
    toShippingLabel(address: DetailedAddress): string;
    /**
     * 영문 주소 포맷팅
     */
    toEnglish(address: DetailedAddress): string;
    /**
     * 약어 변환
     */
    private toShorthand;
    /**
     * 주소 비교
     */
    isSameAddress(addr1: DetailedAddress, addr2: DetailedAddress): boolean;
    /**
     * 주소 일부 마스킹
     */
    maskAddress(address: DetailedAddress, maskDetails?: boolean): string;
    /**
     * 주소 요약 (모바일용)
     */
    summarize(address: DetailedAddress, maxLength?: number): string;
}
//# sourceMappingURL=AddressFormattingService.d.ts.map