/**
 * CJ대한통운 API specific types
 */

export interface CJApiConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  timeout?: number;
}

export interface CJTrackingRequest {
  slipNo: string; // 운송장번호
  schSlpNo?: string; // 조회용 운송장번호
}

export interface CJTrackingResponse {
  result: 'Y' | 'N';
  message: string;
  parcelResultMap: {
    resultList: CJTrackingResult[];
  };
}

export interface CJTrackingResult {
  nsDlvNm: string;        // 배송단계명
  crgNm: string;          // 물품명
  crgSt: string;          // 화물상태
  dlvyDTime: string;      // 배송일시
  empImgNm?: string;      // 배송기사 이미지
  nowLoc: string;         // 현재위치
  orgNm: string;          // 출발지명
  rcvrNm: string;         // 수령인명
  rgmeBranNm: string;     // 등록지점명
  scanNm: string;         // 스캔명
  telno1: string;         // 전화번호1
  telno2: string;         // 전화번호2
}

export interface CJCostRequest {
  sndZipNo: string;       // 보내는 우편번호
  rcvZipNo: string;       // 받는 우편번호
  itemWeight: number;     // 중량(kg)
  itemQty: number;        // 수량
  itemWidth?: number;     // 가로(cm)
  itemLength?: number;    // 세로(cm)
  itemHeight?: number;    // 높이(cm)
  svcCd?: string;        // 서비스코드
}

export interface CJCostResponse {
  result: 'Y' | 'N';
  message: string;
  fare: {
    basicFare: number;    // 기본요금
    distFare: number;     // 거리할증
    sizeFare: number;     // 크기할증
    totalFare: number;    // 총요금
  };
}

// Status mapping
export const CJ_STATUS_MAP: Record<string, string> = {
  '집하': 'PICKED_UP',
  '이동중': 'IN_TRANSIT',
  '배송출발': 'OUT_FOR_DELIVERY',
  '배송완료': 'DELIVERED',
  '미배송': 'FAILED',
  '반송': 'RETURNED'
};