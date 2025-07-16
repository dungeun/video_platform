/**
 * Carrier information utilities
 */

import { CarrierCode, CarrierInfo, ShippingService } from '../types';

export const carrierInfo: Record<CarrierCode, CarrierInfo> = {
  CJ: {
    code: 'CJ',
    name: 'CJ대한통운',
    displayName: 'CJ대한통운',
    apiEndpoint: 'https://api.cjlogistics.com',
    supportedServices: ['STANDARD', 'EXPRESS', 'SAME_DAY', 'DAWN'],
    businessHours: {
      weekdays: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '13:00' }
    },
    customerServiceNumber: '1588-1255'
  },
  HANJIN: {
    code: 'HANJIN',
    name: '한진택배',
    displayName: '한진택배',
    apiEndpoint: 'https://api.hanjin.co.kr',
    supportedServices: ['STANDARD', 'EXPRESS'],
    businessHours: {
      weekdays: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '13:00' }
    },
    customerServiceNumber: '1588-0011'
  },
  LOTTE: {
    code: 'LOTTE',
    name: '롯데택배',
    displayName: '롯데글로벌로지스',
    apiEndpoint: 'https://api.lotteglogis.com',
    supportedServices: ['STANDARD', 'EXPRESS', 'FRESH'],
    businessHours: {
      weekdays: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '13:00' }
    },
    customerServiceNumber: '1588-2121'
  },
  POST_OFFICE: {
    code: 'POST_OFFICE',
    name: '우체국택배',
    displayName: '우체국택배',
    apiEndpoint: 'https://api.epost.go.kr',
    supportedServices: ['STANDARD', 'EXPRESS'],
    businessHours: {
      weekdays: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '13:00' }
    },
    customerServiceNumber: '1588-1300'
  },
  LOGEN: {
    code: 'LOGEN',
    name: '로젠택배',
    displayName: '로젠택배',
    apiEndpoint: 'https://api.ilogen.com',
    supportedServices: ['STANDARD', 'EXPRESS'],
    businessHours: {
      weekdays: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '13:00' }
    },
    customerServiceNumber: '1588-9988'
  }
};

/**
 * Get carrier info by code
 */
export function getCarrierInfo(code: CarrierCode): CarrierInfo | undefined {
  return carrierInfo[code];
}

/**
 * Check if service is supported by carrier
 */
export function isServiceSupported(
  carrier: CarrierCode,
  service: ShippingService
): boolean {
  const info = carrierInfo[carrier];
  return info ? info.supportedServices.includes(service) : false;
}

/**
 * Get tracking URL
 */
export function getTrackingUrl(carrier: CarrierCode, trackingNumber: string): string {
  const urls: Record<CarrierCode, (tn: string) => string> = {
    CJ: (tn) => `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${tn}`,
    HANJIN: (tn) => `https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLvl=1&wblnumText2=${tn}`,
    LOTTE: (tn) => `https://www.lotteglogis.com/mobile/reservation/tracking/index?InvNo=${tn}`,
    POST_OFFICE: (tn) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${tn}`,
    LOGEN: (tn) => `https://www.ilogen.com/web/personal/trace/${tn}`
  };

  return urls[carrier]?.(trackingNumber) || '#';
}