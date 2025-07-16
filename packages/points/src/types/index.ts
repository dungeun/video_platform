import { Decimal } from 'decimal.js';

// 포인트 거래 타입
export enum PointTransactionType {
  EARN = 'EARN',           // 적립
  SPEND = 'SPEND',         // 사용
  EXPIRE = 'EXPIRE',       // 만료
  CANCEL = 'CANCEL',       // 취소
  ADJUST = 'ADJUST',       // 조정
  TRANSFER = 'TRANSFER',   // 이관
  REFUND = 'REFUND'        // 환불
}

// 포인트 적립 사유
export enum PointEarnReason {
  PURCHASE = 'PURCHASE',                 // 구매 적립
  REVIEW = 'REVIEW',                     // 리뷰 작성
  PHOTO_REVIEW = 'PHOTO_REVIEW',         // 포토 리뷰
  SIGNUP = 'SIGNUP',                     // 회원가입
  BIRTHDAY = 'BIRTHDAY',                 // 생일 축하
  EVENT = 'EVENT',                       // 이벤트
  COMPENSATION = 'COMPENSATION',         // 보상
  REFERRAL = 'REFERRAL',                 // 추천인
  ATTENDANCE = 'ATTENDANCE',             // 출석체크
  MISSION = 'MISSION',                   // 미션 완료
  GRADE_BENEFIT = 'GRADE_BENEFIT',       // 등급 혜택
  PROMOTION = 'PROMOTION'                // 프로모션
}

// 포인트 사용 사유
export enum PointSpendReason {
  ORDER_PAYMENT = 'ORDER_PAYMENT',       // 주문 결제
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',   // 부분 결제
  GIFT = 'GIFT',                         // 선물하기
  CONVERSION = 'CONVERSION',             // 전환 (예: 쿠폰으로)
  SERVICE_FEE = 'SERVICE_FEE'            // 서비스 이용료
}

// 포인트 상태
export enum PointStatus {
  AVAILABLE = 'AVAILABLE',         // 사용 가능
  PENDING = 'PENDING',             // 대기중 (적립 예정)
  USED = 'USED',                   // 사용됨
  EXPIRED = 'EXPIRED',             // 만료됨
  CANCELLED = 'CANCELLED',         // 취소됨
  LOCKED = 'LOCKED'                // 잠김 (분쟁 중 등)
}

// 포인트 정책 타입
export interface PointPolicy {
  id: string;
  name: string;
  description: string;
  
  // 적립 정책
  earnRules: {
    baseRate: number;                    // 기본 적립률 (%)
    maxRate: number;                     // 최대 적립률 (%)
    minPurchaseAmount?: number;          // 최소 구매 금액
    excludedCategories?: string[];       // 제외 카테고리
    doublePointDays?: number[];          // 더블 포인트 데이 (요일: 0-6)
  };
  
  // 사용 정책
  useRules: {
    minPoints: number;                   // 최소 사용 포인트
    maxPointsPerOrder?: number;          // 주문당 최대 사용 포인트
    maxUsageRate?: number;               // 최대 사용률 (결제 금액의 %)
    unitOfUse: number;                   // 사용 단위 (예: 10포인트 단위)
    excludedProducts?: string[];         // 사용 제외 상품
  };
  
  // 유효기간 정책
  expiryRules: {
    defaultExpiryMonths: number;         // 기본 유효기간 (월)
    extendableExpiryMonths?: number;     // 연장 가능 기간 (월)
    expiryNotificationDays: number[];    // 만료 알림 일수 (예: [30, 7, 1])
    gracePeroidDays?: number;            // 유예 기간 (일)
  };
  
  // 등급별 혜택
  gradeBonus?: {
    [grade: string]: {
      earnRateMultiplier: number;        // 적립률 배수
      birthdayPoints?: number;           // 생일 포인트
      monthlyBonus?: number;             // 월간 보너스
    };
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 포인트 거래 기록
export interface PointTransaction {
  id: string;
  userId: string;
  type: PointTransactionType;
  amount: number;
  balance: number;                      // 거래 후 잔액
  
  // 거래 상세
  reason: PointEarnReason | PointSpendReason | string;
  description: string;
  orderId?: string;
  productId?: string;
  reviewId?: string;
  
  // 유효기간
  earnedAt?: Date;
  expiresAt?: Date;
  
  // 상태 및 메타데이터
  status: PointStatus;
  metadata?: Record<string, any>;
  relatedTransactionId?: string;        // 연관 거래 (취소, 환불 등)
  
  createdAt: Date;
  updatedAt: Date;
}

// 포인트 잔액
export interface PointBalance {
  userId: string;
  
  // 잔액 정보
  totalPoints: number;                   // 총 포인트
  availablePoints: number;               // 사용 가능 포인트
  pendingPoints: number;                 // 적립 예정 포인트
  expiringPoints: number;                // 만료 예정 포인트 (30일 이내)
  
  // 통계
  totalEarned: number;                   // 총 적립 포인트
  totalSpent: number;                    // 총 사용 포인트
  totalExpired: number;                  // 총 만료 포인트
  
  // 최근 업데이트
  lastTransactionAt: Date;
  lastCalculatedAt: Date;
}

// 포인트 만료 정보
export interface PointExpiry {
  userId: string;
  points: number;
  expiresAt: Date;
  transactionIds: string[];
  notificationSent: boolean;
  notificationSentAt?: Date;
}

// 포인트 히스토리 필터
export interface PointHistoryFilter {
  userId: string;
  types?: PointTransactionType[];
  status?: PointStatus[];
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  orderId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

// 포인트 통계
export interface PointStatistics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  // 적립 통계
  earnStats: {
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    topReasons: Array<{
      reason: PointEarnReason;
      amount: number;
      count: number;
    }>;
  };
  
  // 사용 통계
  spendStats: {
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    topReasons: Array<{
      reason: PointSpendReason;
      amount: number;
      count: number;
    }>;
  };
  
  // 만료 통계
  expiryStats: {
    totalAmount: number;
    upcomingAmount: number;
    averageExpiryDays: number;
  };
}

// 포인트 적립 요청
export interface PointEarnRequest {
  userId: string;
  amount: number;
  reason: PointEarnReason;
  description: string;
  orderId?: string;
  productId?: string;
  reviewId?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// 포인트 사용 요청
export interface PointSpendRequest {
  userId: string;
  amount: number;
  reason: PointSpendReason;
  description: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

// 포인트 정책 검증 결과
export interface PolicyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  appliedRules: string[];
}

// 포인트 예측 정보
export interface PointForecast {
  userId: string;
  
  // 예측 기간
  forecastDate: Date;
  
  // 예상 잔액
  expectedBalance: number;
  expectedExpiry: number;
  expectedEarnings: number;
  
  // 추천 액션
  recommendations: Array<{
    action: 'USE' | 'SAVE' | 'CONVERT';
    amount: number;
    reason: string;
    deadline?: Date;
  }>;
}