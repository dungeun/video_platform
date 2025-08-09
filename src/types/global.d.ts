/**
 * 전역 타입 정의
 * any 타입을 대체하는 구체적인 타입들
 */

// 기본 타입
export type ID = string;
export type Timestamp = string | Date;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

// API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 사용자 타입
export interface User {
  id: ID;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  profileImage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type UserRole = 'USER' | 'INFLUENCER' | 'BUSINESS' | 'ADMIN';

export interface AuthUser extends User {
  token: string;
  refreshToken?: string;
}

// 캠페인 타입
export interface Campaign {
  id: ID;
  businessId: ID;
  title: string;
  description: string;
  platform: Platform;
  budget: number;
  targetFollowers: number;
  startDate: Timestamp;
  endDate: Timestamp;
  status: CampaignStatus;
  requirements?: string;
  categories: string[];
  images: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Platform = 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK' | 'ALL';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// 비디오 타입
export interface Video {
  id: ID;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  views: number;
  likes: number;
  dislikes: number;
  channelId: ID;
  channelName: string;
  uploadDate: Timestamp;
  tags?: string[];
  category?: string;
  isLive?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 결제 타입
export interface Payment {
  id: ID;
  userId: ID;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT' | 'MOBILE';

// 컨텐츠 타입
export interface Content {
  id: ID;
  campaignId: ID;
  creatorId: ID;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: MediaType;
  status: ContentStatus;
  views?: number;
  engagement?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'MIXED';
export type ContentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

// 정산 타입
export interface Settlement {
  id: ID;
  userId: ID;
  amount: number;
  fee: number;
  netAmount: number;
  status: SettlementStatus;
  period: string;
  processedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type SettlementStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// 폼 타입
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file';
  value?: unknown;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

// 이벤트 타입
export interface CustomEvent<T = unknown> {
  type: string;
  payload?: T;
  timestamp: Timestamp;
  source?: string;
}

// 설정 타입
export interface AppConfig {
  apiUrl: string;
  socketUrl?: string;
  publicUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    enableChat: boolean;
    enablePayments: boolean;
    enableAnalytics: boolean;
    enableNotifications: boolean;
  };
  limits: {
    maxFileSize: number;
    maxUploadSize: number;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
}

// UI 설정 타입
export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  layout: {
    header: {
      visible: boolean;
      height: number;
      fixed: boolean;
    };
    sidebar: {
      visible: boolean;
      width: number;
      collapsed: boolean;
    };
    footer: {
      visible: boolean;
      height: number;
    };
  };
  sections: {
    [key: string]: {
      enabled: boolean;
      order: number;
      config?: Record<string, unknown>;
    };
  };
}

// 에러 핸들링 타입
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 유틸리티 타입
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;
export type AsyncResult<T> = Promise<ApiResponse<T>>;

// 타입 가드
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'role' in obj
  );
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

// 전역 Window 확장
declare global {
  interface Window {
    __NEXT_DATA__?: {
      props: Record<string, unknown>;
      page: string;
      query: Record<string, string>;
    };
    gtag?: (...args: unknown[]) => void;
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
    };
    __originalConsole?: Console;
  }
}

export {};