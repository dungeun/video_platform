import { Decimal } from 'decimal.js';
import { PointTransaction, PointTransactionType, PointStatus } from '../types';

/**
 * 포인트 계산 유틸리티
 */

// 포인트 합계 계산
export const calculateTotalPoints = (transactions: PointTransaction[]): number => {
  return transactions.reduce((total, transaction) => {
    if (transaction.status === PointStatus.CANCELLED) return total;
    
    switch (transaction.type) {
      case PointTransactionType.EARN:
      case PointTransactionType.REFUND:
        return total + transaction.amount;
      case PointTransactionType.SPEND:
      case PointTransactionType.EXPIRE:
        return total + transaction.amount; // 음수로 저장됨
      default:
        return total;
    }
  }, 0);
};

// 사용 가능 포인트 계산
export const calculateAvailablePoints = (transactions: PointTransaction[]): number => {
  return transactions
    .filter(t => 
      t.status === PointStatus.AVAILABLE &&
      (t.type === PointTransactionType.EARN || t.type === PointTransactionType.REFUND)
    )
    .reduce((total, t) => total + t.amount, 0);
};

// 대기 중인 포인트 계산
export const calculatePendingPoints = (transactions: PointTransaction[]): number => {
  return transactions
    .filter(t => 
      t.status === PointStatus.PENDING &&
      t.type === PointTransactionType.EARN
    )
    .reduce((total, t) => total + t.amount, 0);
};

// 만료 예정 포인트 계산 (특정 기간 내)
export const calculateExpiringPoints = (
  transactions: PointTransaction[],
  days: number = 30
): number => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return transactions
    .filter(t => {
      if (t.type !== PointTransactionType.EARN || 
          t.status !== PointStatus.AVAILABLE ||
          !t.expiresAt) {
        return false;
      }
      
      const expiryDate = new Date(t.expiresAt);
      return expiryDate > now && expiryDate <= futureDate;
    })
    .reduce((total, t) => total + t.amount, 0);
};

// 포인트 적립률 계산
export const calculateEarnRate = (
  purchaseAmount: number,
  earnedPoints: number
): number => {
  if (purchaseAmount === 0) return 0;
  return new Decimal(earnedPoints)
    .dividedBy(purchaseAmount)
    .times(100)
    .toDecimalPlaces(2)
    .toNumber();
};

// 포인트 사용률 계산
export const calculateUsageRate = (
  orderAmount: number,
  usedPoints: number
): number => {
  if (orderAmount === 0) return 0;
  return new Decimal(usedPoints)
    .dividedBy(orderAmount)
    .times(100)
    .toDecimalPlaces(2)
    .toNumber();
};

// 포인트 유효기간 계산 (일 단위)
export const calculateDaysUntilExpiry = (expiryDate: Date | string): number => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// 포인트 사용 가능 금액 계산 (정책 적용)
export const calculateMaxUsablePoints = (
  orderAmount: number,
  availablePoints: number,
  maxUsageRate?: number,
  maxPointsPerOrder?: number
): number => {
  let maxUsable = availablePoints;
  
  // 최대 사용률 적용
  if (maxUsageRate) {
    const maxByRate = Math.floor(orderAmount * maxUsageRate / 100);
    maxUsable = Math.min(maxUsable, maxByRate);
  }
  
  // 주문당 최대 사용 포인트 적용
  if (maxPointsPerOrder) {
    maxUsable = Math.min(maxUsable, maxPointsPerOrder);
  }
  
  return maxUsable;
};

// 포인트 단위 조정 (사용 단위에 맞춤)
export const adjustToUnit = (points: number, unit: number): number => {
  return Math.floor(points / unit) * unit;
};

// 월별 포인트 통계 계산
export const calculateMonthlyStats = (
  transactions: PointTransaction[],
  year: number,
  month: number
): {
  earned: number;
  spent: number;
  expired: number;
  netChange: number;
} => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.createdAt);
    return date >= startDate && date <= endDate;
  });
  
  const stats = monthTransactions.reduce((acc, t) => {
    switch (t.type) {
      case PointTransactionType.EARN:
      case PointTransactionType.REFUND:
        acc.earned += t.amount;
        acc.netChange += t.amount;
        break;
      case PointTransactionType.SPEND:
        acc.spent += Math.abs(t.amount);
        acc.netChange += t.amount;
        break;
      case PointTransactionType.EXPIRE:
        acc.expired += Math.abs(t.amount);
        acc.netChange += t.amount;
        break;
    }
    return acc;
  }, {
    earned: 0,
    spent: 0,
    expired: 0,
    netChange: 0
  });
  
  return stats;
};

// 포인트 만료 스케줄 계산
export const calculateExpirySchedule = (
  transactions: PointTransaction[]
): Array<{
  date: Date;
  amount: number;
  transactionCount: number;
}> => {
  const scheduleMap = new Map<string, {
    date: Date;
    amount: number;
    transactionCount: number;
  }>();
  
  transactions
    .filter(t => 
      t.type === PointTransactionType.EARN &&
      t.status === PointStatus.AVAILABLE &&
      t.expiresAt
    )
    .forEach(t => {
      const expiryDate = new Date(t.expiresAt!);
      const dateKey = expiryDate.toISOString().split('T')[0];
      
      if (!scheduleMap.has(dateKey)) {
        scheduleMap.set(dateKey, {
          date: expiryDate,
          amount: 0,
          transactionCount: 0
        });
      }
      
      const schedule = scheduleMap.get(dateKey)!;
      schedule.amount += t.amount;
      schedule.transactionCount += 1;
    });
  
  return Array.from(scheduleMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

// 포인트 가치 계산 (원화 환산)
export const calculatePointValue = (
  points: number,
  conversionRate: number = 1 // 1포인트 = 1원
): number => {
  return points * conversionRate;
};

// 필요 포인트 계산 (목표 금액에 도달하기 위한)
export const calculateRequiredPoints = (
  currentPoints: number,
  targetAmount: number,
  conversionRate: number = 1
): number => {
  const targetPoints = targetAmount / conversionRate;
  return Math.max(0, targetPoints - currentPoints);
};