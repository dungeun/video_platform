/**
 * Korean Address Types
 * 한국 주소 시스템 타입 정의
 */

// 주소 타입
export type AddressType = 'ROAD' | 'JIBUN' | 'ENGLISH';

// 행정구역 레벨
export type AdministrativeLevel = 
  | 'SIDO'        // 시/도
  | 'SIGUNGU'     // 시/군/구
  | 'EUPMYEONDONG' // 읍/면/동
  | 'RI';         // 리

// 우편번호 타입
export interface PostalCode {
  zonecode: string;        // 5자리 우편번호
  postcode?: string;       // 구 우편번호 (6자리)
  postcodeSeq?: string;    // 우편번호 일련번호
}

// 도로명 주소
export interface RoadAddress {
  address: string;              // 전체 도로명 주소
  addressEnglish?: string;      // 영문 도로명 주소
  roadAddress: string;          // 도로명 주소
  roadAddressEnglish?: string;  // 영문 도로명 주소
  roadname: string;             // 도로명
  roadnameCode: string;         // 도로명 코드
  roadnameEnglish?: string;     // 영문 도로명
  buildingName?: string;        // 건물명
  buildingCode?: string;        // 건물 관리번호
  apartment?: 'Y' | 'N';        // 공동주택 여부
  sido: string;                 // 시/도
  sigungu: string;              // 시/군/구
  sigunguCode: string;          // 시/군/구 코드
  bname: string;                // 법정동/면/읍
  bcode: string;                // 법정동 코드
}

// 지번 주소
export interface JibunAddress {
  address: string;              // 전체 지번 주소
  addressEnglish?: string;      // 영문 지번 주소
  jibunAddress: string;         // 지번 주소
  jibunAddressEnglish?: string; // 영문 지번 주소
  sido: string;                 // 시/도
  sigungu: string;              // 시/군/구
  sigunguCode: string;          // 시/군/구 코드
  bname: string;                // 법정동/면/읍
  bname1?: string;              // 법정동/면/읍 (읍/면인 경우)
  bname2?: string;              // 법정동/면/읍 (동/리인 경우)
  bcode: string;                // 법정동 코드
  hname?: string;               // 행정동 이름
  query?: string;               // 검색어
}

// 좌표 정보
export interface Coordinates {
  x: string | number;  // 경도 (longitude)
  y: string | number;  // 위도 (latitude)
}

// 주소 검색 결과
export interface AddressSearchResult extends PostalCode {
  userSelectedType: AddressType;        // 사용자가 선택한 주소 타입
  noSelected?: 'Y' | 'N';              // 연관 주소에서 선택 안함
  userLanguageType?: 'K' | 'E';        // 검색된 주소 언어 타입
  
  // 도로명 주소 정보
  roadAddress: string;
  roadAddressEnglish?: string;
  jibunAddress: string;
  jibunAddressEnglish?: string;
  
  // 공통 정보
  sido: string;
  sigungu: string;
  sigunguCode: string;
  roadnameCode?: string;
  bcode: string;
  buildingCode?: string;
  buildingName?: string;
  apartment?: 'Y' | 'N';
  
  // 추가 정보
  bname: string;
  bname1?: string;
  bname2?: string;
  hname?: string;
  roadname?: string;
  query?: string;
  
  // 주소 타입별 전체 주소
  address: string;        // 선택된 타입의 전체 주소
  addressEnglish?: string;
  autoRoadAddress?: string;
  autoRoadAddressEnglish?: string;
  autoJibunAddress?: string;
  autoJibunAddressEnglish?: string;
}

// 주소 컴포넌트
export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// 상세 주소 정보
export interface DetailedAddress {
  zonecode: string;             // 우편번호
  address: string;              // 기본 주소
  addressType: AddressType;     // 주소 타입
  detailAddress?: string;       // 상세 주소
  extraAddress?: string;        // 참고 항목
  englishAddress?: string;      // 영문 주소
  
  // 구성 요소
  sido: string;                 // 시/도
  sigungu: string;              // 시/군/구
  bname: string;                // 법정동/면/읍
  roadname?: string;            // 도로명
  buildingName?: string;        // 건물명
  
  // 코드
  sigunguCode: string;          // 시/군/구 코드
  bcode: string;                // 법정동 코드
  roadnameCode?: string;        // 도로명 코드
  buildingCode?: string;        // 건물 관리번호
  
  // 좌표
  coordinates?: Coordinates;
}

// 주소 검색 옵션
export interface AddressSearchOptions {
  q?: string;                   // 검색어
  count?: number;               // 검색 결과 수
  currentPage?: number;         // 현재 페이지
  theme?: DaumPostcodeTheme;    // 테마 설정
  hideEngBtn?: boolean;         // 영문 버튼 숨김
  hideMapBtn?: boolean;         // 지도 버튼 숨김
  shorthand?: boolean;          // 시/도 약어 사용
  animation?: boolean;          // 애니메이션 사용
  autoMapping?: boolean;        // 자동 매핑
  autoClose?: boolean;          // 자동 닫기
  useSuggest?: boolean;         // 추천 검색어 사용
  width?: string | number;      // 너비
  height?: string | number;     // 높이
  maxSuggestItems?: number;     // 최대 추천 항목 수
  showMoreHName?: boolean;      // 행정동 더보기
  submitMode?: boolean;         // submit 모드
  useBannerLink?: boolean;      // 배너 링크 사용
}

// Daum 우편번호 서비스 테마
export interface DaumPostcodeTheme {
  bgColor?: string;             // 바탕 배경색
  searchBgColor?: string;       // 검색창 배경색
  contentBgColor?: string;      // 본문 배경색
  pageBgColor?: string;         // 페이지 배경색
  textColor?: string;           // 기본 글자색
  queryTextColor?: string;      // 검색창 글자색
  postcodeTextColor?: string;   // 우편번호 글자색
  emphTextColor?: string;       // 강조 글자색
  outlineColor?: string;        // 테두리
}

// 주소 유효성 검사 결과
export interface AddressValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  normalizedAddress?: DetailedAddress;
}

// 주소 포맷 옵션
export interface AddressFormatOptions {
  type?: AddressType;
  includePostcode?: boolean;
  includeDetails?: boolean;
  includeExtra?: boolean;
  useShorthand?: boolean;
  separator?: string;
}

// 지오코딩 결과
export interface GeocodingResult {
  address: string;
  coordinates: Coordinates;
  accuracy: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
  source: 'KAKAO' | 'NAVER' | 'GOOGLE';
}

// 역지오코딩 결과
export interface ReverseGeocodingResult {
  coordinates: Coordinates;
  address: DetailedAddress;
  nearbyPlaces?: Array<{
    name: string;
    distance: number;
    category: string;
  }>;
}

// 주소 자동완성 제안
export interface AddressSuggestion {
  text: string;
  highlightedText?: string;
  address: Partial<AddressSearchResult>;
  score?: number;
}

// 주소 검색 이벤트
export interface AddressSearchEvent {
  type: 'search' | 'select' | 'close' | 'error';
  data?: AddressSearchResult;
  error?: Error;
}

// 주소 입력 필드 props
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

// 주소 검색 모달 props
export interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (address: AddressSearchResult) => void;
  options?: AddressSearchOptions;
  className?: string;
}

// Export type guards
export const isRoadAddress = (address: any): address is RoadAddress => {
  return address && typeof address.roadAddress === 'string';
};

export const isJibunAddress = (address: any): address is JibunAddress => {
  return address && typeof address.jibunAddress === 'string';
};

export const isDetailedAddress = (address: any): address is DetailedAddress => {
  return address && 
    typeof address.zonecode === 'string' &&
    typeof address.address === 'string';
};