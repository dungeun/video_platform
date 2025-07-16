/**
 * 지오코딩 서비스
 * 주소를 좌표로, 좌표를 주소로 변환
 */
import type { DetailedAddress, Coordinates, GeocodingResult, ReverseGeocodingResult } from '../types';
export declare class GeocodingService {
    private kakaoApiKey?;
    private cache;
    private cacheTimeout;
    constructor(kakaoApiKey?: string);
    /**
     * 주소를 좌표로 변환 (지오코딩)
     */
    geocode(address: string | DetailedAddress): Promise<GeocodingResult | null>;
    /**
     * 좌표를 주소로 변환 (역지오코딩)
     */
    reverseGeocode(coordinates: Coordinates): Promise<ReverseGeocodingResult | null>;
    /**
     * 두 좌표 간 거리 계산 (미터 단위)
     */
    calculateDistance(coord1: Coordinates, coord2: Coordinates): number;
    /**
     * 좌표가 한국 내에 있는지 확인
     */
    isInKorea(coordinates: Coordinates): boolean;
    /**
     * Kakao API를 사용한 지오코딩
     */
    private geocodeWithKakao;
    /**
     * Kakao API를 사용한 역지오코딩
     */
    private reverseGeocodeWithKakao;
    /**
     * 주변 장소 검색
     */
    private searchNearbyPlaces;
    /**
     * 정확도 판단
     */
    private determineAccuracy;
    /**
     * 도를 라디안으로 변환
     */
    private toRadians;
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
//# sourceMappingURL=GeocodingService.d.ts.map