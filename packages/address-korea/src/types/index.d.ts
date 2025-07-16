/**
 * Korean Address Types
 * 한국 주소 시스템 타입 정의
 */
export type AddressType = 'ROAD' | 'JIBUN' | 'ENGLISH';
export type AdministrativeLevel = 'SIDO' | 'SIGUNGU' | 'EUPMYEONDONG' | 'RI';
export interface PostalCode {
    zonecode: string;
    postcode?: string;
    postcodeSeq?: string;
}
export interface RoadAddress {
    address: string;
    addressEnglish?: string;
    roadAddress: string;
    roadAddressEnglish?: string;
    roadname: string;
    roadnameCode: string;
    roadnameEnglish?: string;
    buildingName?: string;
    buildingCode?: string;
    apartment?: 'Y' | 'N';
    sido: string;
    sigungu: string;
    sigunguCode: string;
    bname: string;
    bcode: string;
}
export interface JibunAddress {
    address: string;
    addressEnglish?: string;
    jibunAddress: string;
    jibunAddressEnglish?: string;
    sido: string;
    sigungu: string;
    sigunguCode: string;
    bname: string;
    bname1?: string;
    bname2?: string;
    bcode: string;
    hname?: string;
    query?: string;
}
export interface Coordinates {
    x: string | number;
    y: string | number;
}
export interface AddressSearchResult extends PostalCode {
    userSelectedType: AddressType;
    noSelected?: 'Y' | 'N';
    userLanguageType?: 'K' | 'E';
    roadAddress: string;
    roadAddressEnglish?: string;
    jibunAddress: string;
    jibunAddressEnglish?: string;
    sido: string;
    sigungu: string;
    sigunguCode: string;
    roadnameCode?: string;
    bcode: string;
    buildingCode?: string;
    buildingName?: string;
    apartment?: 'Y' | 'N';
    bname: string;
    bname1?: string;
    bname2?: string;
    hname?: string;
    roadname?: string;
    query?: string;
    address: string;
    addressEnglish?: string;
    autoRoadAddress?: string;
    autoRoadAddressEnglish?: string;
    autoJibunAddress?: string;
    autoJibunAddressEnglish?: string;
}
export interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}
export interface DetailedAddress {
    zonecode: string;
    address: string;
    addressType: AddressType;
    detailAddress?: string;
    extraAddress?: string;
    englishAddress?: string;
    sido: string;
    sigungu: string;
    bname: string;
    roadname?: string;
    buildingName?: string;
    sigunguCode: string;
    bcode: string;
    roadnameCode?: string;
    buildingCode?: string;
    coordinates?: Coordinates;
}
export interface AddressSearchOptions {
    q?: string;
    count?: number;
    currentPage?: number;
    theme?: DaumPostcodeTheme;
    hideEngBtn?: boolean;
    hideMapBtn?: boolean;
    shorthand?: boolean;
    animation?: boolean;
    autoMapping?: boolean;
    autoClose?: boolean;
    useSuggest?: boolean;
    width?: string | number;
    height?: string | number;
    maxSuggestItems?: number;
    showMoreHName?: boolean;
    submitMode?: boolean;
    useBannerLink?: boolean;
}
export interface DaumPostcodeTheme {
    bgColor?: string;
    searchBgColor?: string;
    contentBgColor?: string;
    pageBgColor?: string;
    textColor?: string;
    queryTextColor?: string;
    postcodeTextColor?: string;
    emphTextColor?: string;
    outlineColor?: string;
}
export interface AddressValidationResult {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
    normalizedAddress?: DetailedAddress;
}
export interface AddressFormatOptions {
    type?: AddressType;
    includePostcode?: boolean;
    includeDetails?: boolean;
    includeExtra?: boolean;
    useShorthand?: boolean;
    separator?: string;
}
export interface GeocodingResult {
    address: string;
    coordinates: Coordinates;
    accuracy: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
    source: 'KAKAO' | 'NAVER' | 'GOOGLE';
}
export interface ReverseGeocodingResult {
    coordinates: Coordinates;
    address: DetailedAddress;
    nearbyPlaces?: Array<{
        name: string;
        distance: number;
        category: string;
    }>;
}
export interface AddressSuggestion {
    text: string;
    highlightedText?: string;
    address: Partial<AddressSearchResult>;
    score?: number;
}
export interface AddressSearchEvent {
    type: 'search' | 'select' | 'close' | 'error';
    data?: AddressSearchResult;
    error?: Error;
}
export interface AddressInputProps {
    value?: DetailedAddress;
    onChange?: (address: DetailedAddress) => void;
    onSearch?: () => void;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
    showPostcode?: boolean;
    showDetails?: boolean;
    showExtra?: boolean;
    addressType?: AddressType;
}
export interface AddressSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (address: AddressSearchResult) => void;
    options?: AddressSearchOptions;
    className?: string;
}
export declare const isRoadAddress: (address: any) => address is RoadAddress;
export declare const isJibunAddress: (address: any) => address is JibunAddress;
export declare const isDetailedAddress: (address: any) => address is DetailedAddress;
//# sourceMappingURL=index.d.ts.map