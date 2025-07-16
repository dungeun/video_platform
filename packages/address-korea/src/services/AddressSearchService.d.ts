/**
 * 주소 검색 서비스
 * Kakao Local API를 사용한 주소 검색
 */
import type { AddressSearchResult, AddressSuggestion, Coordinates, DetailedAddress } from '../types';
export interface SearchOptions {
    query: string;
    page?: number;
    size?: number;
    addressType?: 'ROAD' | 'JIBUN' | 'ALL';
}
export declare class AddressSearchService {
    private kakaoApiKey?;
    private cache;
    private cacheTimeout;
    constructor(kakaoApiKey?: string);
    /**
     * 주소 검색
     */
    search(options: SearchOptions): Promise<AddressSearchResult[]>;
    /**
     * 주소 자동완성
     */
    getSuggestions(query: string, limit?: number): Promise<AddressSuggestion[]>;
    /**
     * 좌표로 주소 검색 (역지오코딩)
     */
    reverseGeocode(coordinates: Coordinates): Promise<DetailedAddress | null>;
    /**
     * Kakao API를 사용한 주소 검색
     */
    private searchWithKakaoAPI;
    /**
     * Kakao API 결과 변환
     */
    private transformKakaoResults;
    /**
     * 텍스트 하이라이트
     */
    private highlightText;
    /**
     * 검색 스코어 계산
     */
    private calculateScore;
    /**
     * 캐시 키 생성
     */
    private getCacheKey;
    /**
     * 캐시에서 가져오기
     */
    private getFromCache;
    /**
     * 캐시에 저장
     */
    private setCache;
    /**
     * 캐시 초기화
     */
    clearCache(): void;
}
//# sourceMappingURL=AddressSearchService.d.ts.map