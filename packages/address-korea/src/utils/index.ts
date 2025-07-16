/**
 * @module @repo/address-korea/utils
 * @description Utility functions for Korean address handling
 */

export const addressUtils = {
  formatPostcode: (postcode: string): string => {
    return postcode.replace(/(\d{3})(\d{2})/, '$1-$2');
  },
  
  validatePostcode: (postcode: string): boolean => {
    return /^\d{5}$/.test(postcode.replace(/-/g, ''));
  },
  
  parseAddress: (fullAddress: string) => {
    const parts = fullAddress.split(' ');
    return {
      sido: parts[0] || '',
      sigungu: parts[1] || '',
      dong: parts.slice(2).join(' ') || ''
    };
  },
  
  buildFullAddress: (
    roadAddress: string,
    detailAddress?: string,
    extraAddress?: string
  ): string => {
    const parts = [roadAddress];
    if (detailAddress) parts.push(detailAddress);
    if (extraAddress) parts.push(`(${extraAddress})`);
    return parts.join(' ');
  }
};