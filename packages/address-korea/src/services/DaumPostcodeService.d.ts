/**
 * Daum 우편번호 서비스
 * Daum Postcode API 통합
 */
import type { AddressSearchResult, AddressSearchOptions, DaumPostcodeTheme } from '../types';
declare global {
    interface Window {
        daum: any;
    }
}
export declare class DaumPostcodeService {
    private static instance;
    private scriptLoaded;
    private scriptLoading;
    private loadPromise;
    private constructor();
    static getInstance(): DaumPostcodeService;
    /**
     * Daum Postcode 스크립트 로드
     */
    private loadScript;
    /**
     * 주소 검색 팝업 열기
     */
    openSearch(options?: AddressSearchOptions): Promise<AddressSearchResult>;
    /**
     * 임베드 모드로 주소 검색
     */
    embedSearch(elementId: string, options?: AddressSearchOptions): Promise<AddressSearchResult>;
    /**
     * 테마 생성
     */
    private createTheme;
    /**
     * 기본 테마
     */
    private getDefaultTheme;
    /**
     * 다크 테마
     */
    static getDarkTheme(): DaumPostcodeTheme;
    /**
     * 스크립트 언로드
     */
    unload(): void;
}
//# sourceMappingURL=DaumPostcodeService.d.ts.map