/**
 * Daum 우편번호 서비스
 * Daum Postcode API 통합
 */
export class DaumPostcodeService {
    constructor() {
        this.scriptLoaded = false;
        this.scriptLoading = false;
        this.loadPromise = null;
    }
    static getInstance() {
        if (!DaumPostcodeService.instance) {
            DaumPostcodeService.instance = new DaumPostcodeService();
        }
        return DaumPostcodeService.instance;
    }
    /**
     * Daum Postcode 스크립트 로드
     */
    async loadScript() {
        if (this.scriptLoaded)
            return;
        if (this.scriptLoading && this.loadPromise) {
            return this.loadPromise;
        }
        this.scriptLoading = true;
        this.loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
            script.async = true;
            script.onload = () => {
                this.scriptLoaded = true;
                this.scriptLoading = false;
                resolve();
            };
            script.onerror = () => {
                this.scriptLoading = false;
                reject(new Error('Failed to load Daum Postcode script'));
            };
            document.head.appendChild(script);
        });
        return this.loadPromise;
    }
    /**
     * 주소 검색 팝업 열기
     */
    async openSearch(options) {
        await this.loadScript();
        return new Promise((resolve, reject) => {
            if (!window.daum || !window.daum.Postcode) {
                reject(new Error('Daum Postcode not loaded'));
                return;
            }
            const theme = this.createTheme(options?.theme);
            new window.daum.Postcode({
                oncomplete: (data) => {
                    const result = {
                        // 기본 정보
                        userSelectedType: data.userSelectedType,
                        zonecode: data.zonecode,
                        // 도로명 주소
                        roadAddress: data.roadAddress,
                        roadAddressEnglish: data.roadAddressEnglish,
                        // 지번 주소
                        jibunAddress: data.jibunAddress,
                        jibunAddressEnglish: data.jibunAddressEnglish,
                        // 선택된 주소
                        address: data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress,
                        addressEnglish: data.userSelectedType === 'R'
                            ? data.roadAddressEnglish
                            : data.jibunAddressEnglish,
                        // 공통 정보
                        sido: data.sido,
                        sigungu: data.sigungu,
                        sigunguCode: data.sigunguCode,
                        bcode: data.bcode,
                        bname: data.bname,
                        bname1: data.bname1,
                        bname2: data.bname2,
                        hname: data.hname,
                        // 도로명 추가 정보
                        roadname: data.roadname,
                        roadnameCode: data.roadnameCode,
                        buildingCode: data.buildingCode,
                        buildingName: data.buildingName,
                        apartment: data.apartment,
                        // 검색어
                        query: data.query,
                        // 자동 완성 주소
                        autoRoadAddress: data.autoRoadAddress,
                        autoRoadAddressEnglish: data.autoRoadAddressEnglish,
                        autoJibunAddress: data.autoJibunAddress,
                        autoJibunAddressEnglish: data.autoJibunAddressEnglish
                    };
                    resolve(result);
                },
                onclose: (state) => {
                    if (state === 'FORCE_CLOSE') {
                        reject(new Error('User closed the popup'));
                    }
                },
                // 옵션 설정
                theme: theme,
                hideEngBtn: options?.hideEngBtn,
                hideMapBtn: options?.hideMapBtn,
                shorthand: options?.shorthand,
                animation: options?.animation,
                autoMapping: options?.autoMapping,
                autoClose: options?.autoClose !== false,
                useSuggest: options?.useSuggest !== false,
                width: options?.width,
                height: options?.height,
                maxSuggestItems: options?.maxSuggestItems || 10,
                showMoreHName: options?.showMoreHName,
                submitMode: options?.submitMode,
                useBannerLink: options?.useBannerLink !== false
            }).open();
        });
    }
    /**
     * 임베드 모드로 주소 검색
     */
    async embedSearch(elementId, options) {
        await this.loadScript();
        return new Promise((resolve, reject) => {
            if (!window.daum || !window.daum.Postcode) {
                reject(new Error('Daum Postcode not loaded'));
                return;
            }
            const element = document.getElementById(elementId);
            if (!element) {
                reject(new Error(`Element with id ${elementId} not found`));
                return;
            }
            const theme = this.createTheme(options?.theme);
            new window.daum.Postcode({
                oncomplete: (data) => {
                    const result = {
                        userSelectedType: data.userSelectedType,
                        zonecode: data.zonecode,
                        roadAddress: data.roadAddress,
                        roadAddressEnglish: data.roadAddressEnglish,
                        jibunAddress: data.jibunAddress,
                        jibunAddressEnglish: data.jibunAddressEnglish,
                        address: data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress,
                        addressEnglish: data.userSelectedType === 'R'
                            ? data.roadAddressEnglish
                            : data.jibunAddressEnglish,
                        sido: data.sido,
                        sigungu: data.sigungu,
                        sigunguCode: data.sigunguCode,
                        bcode: data.bcode,
                        bname: data.bname,
                        bname1: data.bname1,
                        bname2: data.bname2,
                        hname: data.hname,
                        roadname: data.roadname,
                        roadnameCode: data.roadnameCode,
                        buildingCode: data.buildingCode,
                        buildingName: data.buildingName,
                        apartment: data.apartment,
                        query: data.query,
                        autoRoadAddress: data.autoRoadAddress,
                        autoRoadAddressEnglish: data.autoRoadAddressEnglish,
                        autoJibunAddress: data.autoJibunAddress,
                        autoJibunAddressEnglish: data.autoJibunAddressEnglish
                    };
                    resolve(result);
                },
                theme: theme,
                width: '100%',
                height: '100%',
                hideEngBtn: options?.hideEngBtn,
                hideMapBtn: options?.hideMapBtn,
                shorthand: options?.shorthand,
                animation: options?.animation,
                autoMapping: options?.autoMapping,
                useSuggest: options?.useSuggest !== false,
                maxSuggestItems: options?.maxSuggestItems || 10,
                showMoreHName: options?.showMoreHName,
                submitMode: options?.submitMode,
                useBannerLink: options?.useBannerLink !== false
            }).embed(element);
        });
    }
    /**
     * 테마 생성
     */
    createTheme(theme) {
        if (!theme) {
            return this.getDefaultTheme();
        }
        return {
            bgColor: theme.bgColor,
            searchBgColor: theme.searchBgColor,
            contentBgColor: theme.contentBgColor,
            pageBgColor: theme.pageBgColor,
            textColor: theme.textColor,
            queryTextColor: theme.queryTextColor,
            postcodeTextColor: theme.postcodeTextColor,
            emphTextColor: theme.emphTextColor,
            outlineColor: theme.outlineColor
        };
    }
    /**
     * 기본 테마
     */
    getDefaultTheme() {
        return {
            bgColor: '#FFFFFF',
            searchBgColor: '#FFFFFF',
            contentBgColor: '#FFFFFF',
            pageBgColor: '#FAFAFA',
            textColor: '#333333',
            queryTextColor: '#222222',
            postcodeTextColor: '#FA4256',
            emphTextColor: '#008BD3',
            outlineColor: '#E0E0E0'
        };
    }
    /**
     * 다크 테마
     */
    static getDarkTheme() {
        return {
            bgColor: '#1F2937',
            searchBgColor: '#374151',
            contentBgColor: '#1F2937',
            pageBgColor: '#111827',
            textColor: '#F3F4F6',
            queryTextColor: '#F9FAFB',
            postcodeTextColor: '#F87171',
            emphTextColor: '#60A5FA',
            outlineColor: '#4B5563'
        };
    }
    /**
     * 스크립트 언로드
     */
    unload() {
        const script = document.querySelector('script[src*="daumcdn.net/mapjsapi/bundle/postcode"]');
        if (script) {
            script.remove();
        }
        this.scriptLoaded = false;
        this.scriptLoading = false;
        this.loadPromise = null;
    }
}
//# sourceMappingURL=DaumPostcodeService.js.map