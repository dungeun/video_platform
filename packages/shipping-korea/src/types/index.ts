/**
 * @company/shipping-korea
 * Core types for Korean domestic delivery services
 */

// Carrier types
export type CarrierCode = 'CJ' | 'HANJIN' | 'LOTTE' | 'POST_OFFICE' | 'LOGEN';

export interface CarrierInfo {
  code: CarrierCode;
  name: string;
  displayName: string;
  apiEndpoint: string;
  supportedServices: ShippingService[];
  businessHours: BusinessHours;
  customerServiceNumber: string;
}

// Shipping service types
export type ShippingService = 
  | 'STANDARD'      // 일반택배
  | 'EXPRESS'       // 익일특급
  | 'SAME_DAY'      // 당일배송
  | 'DAWN'          // 새벽배송
  | 'INSTALLATION' // 설치배송
  | 'FRESH'        // 신선배송
  | 'INTERNATIONAL'; // 국제배송

// Tracking types
export interface TrackingRequest {
  carrier: CarrierCode;
  trackingNumber: string;
  options?: TrackingOptions;
}

export interface TrackingOptions {
  includeDetails?: boolean;
  language?: 'ko' | 'en';
  timezone?: string;
}

export interface TrackingInfo {
  carrier: CarrierCode;
  trackingNumber: string;
  status: DeliveryStatus;
  currentLocation: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  recipient?: RecipientInfo;
  sender?: SenderInfo;
  product?: ProductInfo;
  history: TrackingHistory[];
  signature?: SignatureInfo;
}

export interface TrackingHistory {
  timestamp: Date;
  status: DeliveryStatus;
  location: string;
  description: string;
  details?: string;
  branch?: BranchInfo;
  driver?: DriverInfo;
}

// Delivery status types
export type DeliveryStatus = 
  | 'PENDING'           // 접수대기
  | 'RECEIVED'          // 접수완료
  | 'PICKUP_READY'      // 집하준비
  | 'PICKED_UP'         // 집하완료
  | 'IN_TRANSIT'        // 이동중
  | 'OUT_FOR_DELIVERY'  // 배송출발
  | 'DELIVERED'         // 배송완료
  | 'FAILED'            // 배송실패
  | 'RETURNED'          // 반송
  | 'EXCEPTION';        // 예외상황

// Shipping cost types
export interface ShippingCostRequest {
  carrier: CarrierCode;
  service: ShippingService;
  origin: Address;
  destination: Address;
  package: PackageInfo;
  options?: ShippingOptions;
}

export interface ShippingCostResponse {
  carrier: CarrierCode;
  service: ShippingService;
  baseCost: number;
  additionalCharges: AdditionalCharge[];
  totalCost: number;
  currency: 'KRW';
  estimatedDays: number;
  cutoffTime?: string;
}

export interface AdditionalCharge {
  type: ChargeType;
  amount: number;
  description: string;
}

export type ChargeType = 
  | 'OVERSIZE'        // 부피과대
  | 'OVERWEIGHT'      // 중량초과
  | 'REMOTE_AREA'     // 도서산간
  | 'HANDLING'        // 취급수수료
  | 'INSURANCE'       // 보험료
  | 'COD'             // 착불수수료
  | 'WEEKEND'         // 주말할증
  | 'HOLIDAY';        // 공휴일할증

// Package and address types
export interface PackageInfo {
  weight: number; // kg
  dimensions: Dimensions;
  value?: number;
  description?: string;
  fragile?: boolean;
  specialHandling?: string[];
}

export interface Dimensions {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
}

export interface Address {
  postalCode: string;
  province: string;    // 시/도
  city: string;        // 시/군/구
  district?: string;   // 읍/면/동
  street: string;      // 도로명주소
  detail?: string;     // 상세주소
  building?: string;   // 건물명
  phone: string;
  name: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  carrier: CarrierCode;
  trackingNumber: string;
  timestamp: Date;
  data: any;
  signature: string;
}

export type WebhookEventType = 
  | 'STATUS_CHANGED'
  | 'DELIVERY_COMPLETED'
  | 'DELIVERY_FAILED'
  | 'EXCEPTION_OCCURRED';

// Rate limiting types
export interface RateLimitConfig {
  carrier: CarrierCode;
  endpoint: string;
  limit: number;
  window: number; // seconds
  strategy: 'SLIDING_WINDOW' | 'FIXED_WINDOW';
}

// Additional info types
export interface BusinessHours {
  weekdays: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
  holidays?: boolean;
}

export interface TimeRange {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface RecipientInfo {
  name: string;
  phone: string;
  relation?: string;
}

export interface SenderInfo {
  name: string;
  phone: string;
  company?: string;
}

export interface ProductInfo {
  name: string;
  quantity: number;
  category?: string;
}

export interface BranchInfo {
  code: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface DriverInfo {
  name: string;
  phone: string;
  vehicle?: string;
}

export interface SignatureInfo {
  signedBy: string;
  signedAt: Date;
  imageUrl?: string;
}

export interface ShippingOptions {
  insurance?: boolean;
  insuranceValue?: number;
  cod?: boolean;
  codAmount?: number;
  preferredDeliveryDate?: Date;
  preferredDeliveryTime?: TimeRange;
  specialInstructions?: string;
}

// Batch processing types
export interface BatchTrackingRequest {
  requests: TrackingRequest[];
  options?: BatchOptions;
}

export interface BatchOptions {
  parallel?: number;
  retryFailed?: boolean;
  timeout?: number;
}

export interface BatchTrackingResponse {
  results: BatchResult<TrackingInfo>[];
  summary: BatchSummary;
}

export interface BatchResult<T> {
  request: any;
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface BatchSummary {
  total: number;
  successful: number;
  failed: number;
  duration: number;
}