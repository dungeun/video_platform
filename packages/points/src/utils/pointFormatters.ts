import { format, formatDistance, formatRelative } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  PointTransactionType, 
  PointStatus, 
  PointEarnReason, 
  PointSpendReason 
} from '../types';

/**
 * 포인트 포맷팅 유틸리티
 */

// 숫자 포맷팅 (천 단위 콤마)
export const formatNumber = (value: number): string => {
  return value.toLocaleString('ko-KR');
};

// 포인트 포맷팅
export const formatPoints = (points: number, showSign: boolean = false): string => {
  const formatted = formatNumber(Math.abs(points));
  const sign = showSign && points > 0 ? '+' : '';
  return `${sign}${points < 0 ? '-' : ''}${formatted} P`;
};

// 금액 포맷팅 (원화)
export const formatCurrency = (amount: number): string => {
  return `${formatNumber(amount)}원`;
};

// 퍼센트 포맷팅
export const formatPercent = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

// 날짜 포맷팅
export const formatDate = (date: Date | string, formatString: string = 'yyyy년 MM월 dd일'): string => {
  return format(new Date(date), formatString, { locale: ko });
};

// 날짜/시간 포맷팅
export const formatDateTime = (date: Date | string): string => {
  return format(new Date(date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
};

// 상대 시간 포맷팅
export const formatRelativeTime = (date: Date | string): string => {
  return formatRelative(new Date(date), new Date(), { locale: ko });
};

// 남은 기간 포맷팅
export const formatTimeRemaining = (date: Date | string): string => {
  return formatDistance(new Date(date), new Date(), { 
    locale: ko,
    addSuffix: true 
  });
};

// 거래 타입 라벨
export const getTransactionTypeLabel = (type: PointTransactionType): string => {
  const labels: Record<PointTransactionType, string> = {
    [PointTransactionType.EARN]: '적립',
    [PointTransactionType.SPEND]: '사용',
    [PointTransactionType.EXPIRE]: '만료',
    [PointTransactionType.CANCEL]: '취소',
    [PointTransactionType.ADJUST]: '조정',
    [PointTransactionType.TRANSFER]: '이관',
    [PointTransactionType.REFUND]: '환불'
  };
  return labels[type] || type;
};

// 포인트 상태 라벨
export const getPointStatusLabel = (status: PointStatus): string => {
  const labels: Record<PointStatus, string> = {
    [PointStatus.AVAILABLE]: '사용가능',
    [PointStatus.PENDING]: '대기중',
    [PointStatus.USED]: '사용완료',
    [PointStatus.EXPIRED]: '만료',
    [PointStatus.CANCELLED]: '취소',
    [PointStatus.LOCKED]: '잠김'
  };
  return labels[status] || status;
};

// 적립 사유 라벨
export const getEarnReasonLabel = (reason: PointEarnReason | string): string => {
  const labels: Record<PointEarnReason, string> = {
    [PointEarnReason.PURCHASE]: '구매 적립',
    [PointEarnReason.REVIEW]: '리뷰 작성',
    [PointEarnReason.PHOTO_REVIEW]: '포토 리뷰',
    [PointEarnReason.SIGNUP]: '회원가입',
    [PointEarnReason.BIRTHDAY]: '생일 축하',
    [PointEarnReason.EVENT]: '이벤트',
    [PointEarnReason.COMPENSATION]: '보상',
    [PointEarnReason.REFERRAL]: '추천인',
    [PointEarnReason.ATTENDANCE]: '출석체크',
    [PointEarnReason.MISSION]: '미션 완료',
    [PointEarnReason.GRADE_BENEFIT]: '등급 혜택',
    [PointEarnReason.PROMOTION]: '프로모션'
  };
  return labels[reason as PointEarnReason] || reason;
};

// 사용 사유 라벨
export const getSpendReasonLabel = (reason: PointSpendReason | string): string => {
  const labels: Record<PointSpendReason, string> = {
    [PointSpendReason.ORDER_PAYMENT]: '주문 결제',
    [PointSpendReason.PARTIAL_PAYMENT]: '부분 결제',
    [PointSpendReason.GIFT]: '선물하기',
    [PointSpendReason.CONVERSION]: '전환',
    [PointSpendReason.SERVICE_FEE]: '서비스 이용료'
  };
  return labels[reason as PointSpendReason] || reason;
};

// 거래 설명 생성
export const generateTransactionDescription = (
  type: PointTransactionType,
  reason: string,
  metadata?: Record<string, any>
): string => {
  let description = '';

  switch (type) {
    case PointTransactionType.EARN:
      description = getEarnReasonLabel(reason);
      if (metadata?.productName) {
        description += ` - ${metadata.productName}`;
      }
      break;
    
    case PointTransactionType.SPEND:
      description = getSpendReasonLabel(reason);
      if (metadata?.orderId) {
        description += ` (주문번호: ${metadata.orderId})`;
      }
      break;
    
    case PointTransactionType.EXPIRE:
      description = '포인트 만료';
      break;
    
    case PointTransactionType.CANCEL:
      description = '거래 취소';
      if (metadata?.originalDescription) {
        description += ` - ${metadata.originalDescription}`;
      }
      break;
    
    case PointTransactionType.REFUND:
      description = '포인트 환불';
      if (metadata?.orderId) {
        description += ` (주문번호: ${metadata.orderId})`;
      }
      break;
    
    default:
      description = getTransactionTypeLabel(type);
  }

  return description;
};

// 만료일 표시 포맷
export const formatExpiryDate = (expiryDate: Date | string): {
  text: string;
  isUrgent: boolean;
  daysRemaining: number;
} => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let text = '';
  let isUrgent = false;

  if (daysRemaining < 0) {
    text = '만료됨';
    isUrgent = true;
  } else if (daysRemaining === 0) {
    text = '오늘 만료';
    isUrgent = true;
  } else if (daysRemaining === 1) {
    text = '내일 만료';
    isUrgent = true;
  } else if (daysRemaining <= 7) {
    text = `${daysRemaining}일 후 만료`;
    isUrgent = true;
  } else if (daysRemaining <= 30) {
    text = `${daysRemaining}일 후 만료`;
    isUrgent = false;
  } else {
    text = formatDate(expiry, 'yyyy년 MM월 dd일 만료');
    isUrgent = false;
  }

  return { text, isUrgent, daysRemaining };
};

// 기간 요약 포맷
export const formatPeriodSummary = (
  startDate: Date | string,
  endDate: Date | string
): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 같은 연도인 경우
  if (start.getFullYear() === end.getFullYear()) {
    // 같은 월인 경우
    if (start.getMonth() === end.getMonth()) {
      return format(start, 'yyyy년 MM월 dd일', { locale: ko }) + 
             ' ~ ' + 
             format(end, 'dd일', { locale: ko });
    } else {
      return format(start, 'MM월 dd일', { locale: ko }) + 
             ' ~ ' + 
             format(end, 'MM월 dd일', { locale: ko });
    }
  } else {
    return format(start, 'yyyy년 MM월 dd일', { locale: ko }) + 
           ' ~ ' + 
           format(end, 'yyyy년 MM월 dd일', { locale: ko });
  }
};

// 큰 숫자 축약 표시
export const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};