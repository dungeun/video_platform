/**
 * Formatting utilities for shipping module
 */

import { Address, DeliveryStatus } from '../types';

/**
 * Format address for display
 */
export const addressFormatter = {
  /**
   * Format full address
   */
  format(address: Address): string {
    const parts = [
      address.province,
      address.city,
      address.district,
      address.street,
      address.detail,
      address.building
    ].filter(Boolean);

    return parts.join(' ');
  },

  /**
   * Format postal code
   */
  formatPostalCode(postalCode: string): string {
    return postalCode.replace(/(\d{3})(\d{2})/, '$1-$2');
  },

  /**
   * Format phone number
   */
  formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (digits.length === 10) {
      if (digits.startsWith('02')) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
      } else {
        return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      }
    }
    
    return phone;
  }
};

/**
 * Format delivery status for display
 */
export function formatDeliveryStatus(status: DeliveryStatus): string {
  const statusMap: Record<DeliveryStatus, string> = {
    'PENDING': '접수대기',
    'RECEIVED': '접수완료',
    'PICKUP_READY': '집하준비',
    'PICKED_UP': '집하완료',
    'IN_TRANSIT': '이동중',
    'OUT_FOR_DELIVERY': '배송출발',
    'DELIVERED': '배송완료',
    'FAILED': '배송실패',
    'RETURNED': '반송',
    'EXCEPTION': '예외상황'
  };

  return statusMap[status] || status;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format date/time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}