import { 
  PointEarnRequest, 
  PointSpendRequest,
  PointPolicy,
  PointTransaction,
  PointStatus,
  PointTransactionType
} from '../types';

/**
 * 포인트 검증 유틸리티
 */

// 적립 요청 유효성 검증
export const validateEarnRequest = (request: PointEarnRequest): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!request.userId) {
    errors.push('사용자 ID가 필요합니다');
  }

  if (!request.amount || request.amount <= 0) {
    errors.push('적립 금액은 0보다 커야 합니다');
  }

  if (!request.reason) {
    errors.push('적립 사유가 필요합니다');
  }

  if (!request.description) {
    errors.push('적립 설명이 필요합니다');
  }

  // 금액 한도 검증 (예: 1회 최대 100만 포인트)
  if (request.amount > 1000000) {
    errors.push('1회 적립 한도는 1,000,000 포인트입니다');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 사용 요청 유효성 검증
export const validateSpendRequest = (request: PointSpendRequest): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!request.userId) {
    errors.push('사용자 ID가 필요합니다');
  }

  if (!request.amount || request.amount <= 0) {
    errors.push('사용 금액은 0보다 커야 합니다');
  }

  if (!request.reason) {
    errors.push('사용 사유가 필요합니다');
  }

  if (!request.description) {
    errors.push('사용 설명이 필요합니다');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 포인트 사용 가능 여부 검증
export const canUsePoints = (
  availablePoints: number,
  requestedAmount: number,
  policy?: PointPolicy
): {
  canUse: boolean;
  reason?: string;
} => {
  // 잔액 부족
  if (availablePoints < requestedAmount) {
    return {
      canUse: false,
      reason: '포인트가 부족합니다'
    };
  }

  // 정책 검증
  if (policy) {
    // 최소 사용 포인트
    if (requestedAmount < policy.useRules.minPoints) {
      return {
        canUse: false,
        reason: `최소 ${policy.useRules.minPoints} 포인트부터 사용 가능합니다`
      };
    }

    // 사용 단위
    if (requestedAmount % policy.useRules.unitOfUse !== 0) {
      return {
        canUse: false,
        reason: `${policy.useRules.unitOfUse} 포인트 단위로 사용 가능합니다`
      };
    }
  }

  return { canUse: true };
};

// 포인트 만료 여부 검증
export const isPointExpired = (transaction: PointTransaction): boolean => {
  if (!transaction.expiresAt) return false;
  return new Date(transaction.expiresAt) < new Date();
};

// 포인트 사용 가능 상태 검증
export const isPointAvailable = (transaction: PointTransaction): boolean => {
  return (
    transaction.status === PointStatus.AVAILABLE &&
    !isPointExpired(transaction) &&
    transaction.amount > 0
  );
};

// 정책 유효성 검증
export const validatePolicy = (policy: Partial<PointPolicy>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 적립 규칙 검증
  if (policy.earnRules) {
    if (policy.earnRules.baseRate < 0 || policy.earnRules.baseRate > 100) {
      errors.push('기본 적립률은 0-100% 사이여야 합니다');
    }

    if (policy.earnRules.maxRate < policy.earnRules.baseRate) {
      errors.push('최대 적립률은 기본 적립률보다 작을 수 없습니다');
    }

    if (policy.earnRules.minPurchaseAmount && policy.earnRules.minPurchaseAmount < 0) {
      errors.push('최소 구매 금액은 0보다 작을 수 없습니다');
    }
  }

  // 사용 규칙 검증
  if (policy.useRules) {
    if (policy.useRules.minPoints < 0) {
      errors.push('최소 사용 포인트는 0보다 작을 수 없습니다');
    }

    if (policy.useRules.unitOfUse <= 0) {
      errors.push('사용 단위는 0보다 커야 합니다');
    }

    if (policy.useRules.maxUsageRate && 
        (policy.useRules.maxUsageRate < 0 || policy.useRules.maxUsageRate > 100)) {
      errors.push('최대 사용률은 0-100% 사이여야 합니다');
    }
  }

  // 만료 규칙 검증
  if (policy.expiryRules) {
    if (policy.expiryRules.defaultExpiryMonths <= 0) {
      errors.push('기본 유효기간은 0보다 커야 합니다');
    }

    if (policy.expiryRules.extendableExpiryMonths && 
        policy.expiryRules.extendableExpiryMonths < 0) {
      errors.push('연장 가능 기간은 0보다 작을 수 없습니다');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 거래 유효성 검증
export const validateTransaction = (transaction: PointTransaction): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 필수 필드
  if (!transaction.userId) {
    errors.push('사용자 ID가 필요합니다');
  }

  if (!transaction.type) {
    errors.push('거래 타입이 필요합니다');
  }

  if (transaction.amount === undefined || transaction.amount === null) {
    errors.push('거래 금액이 필요합니다');
  }

  // 거래 타입별 검증
  switch (transaction.type) {
    case PointTransactionType.EARN:
      if (transaction.amount <= 0) {
        errors.push('적립 금액은 양수여야 합니다');
      }
      break;
    
    case PointTransactionType.SPEND:
      if (transaction.amount >= 0) {
        errors.push('사용 금액은 음수여야 합니다');
      }
      break;
  }

  // 만료일 검증
  if (transaction.expiresAt && transaction.earnedAt) {
    if (new Date(transaction.expiresAt) <= new Date(transaction.earnedAt)) {
      errors.push('만료일은 적립일보다 미래여야 합니다');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 주문 금액 대비 포인트 사용 비율 검증
export const validatePointUsageRatio = (
  orderAmount: number,
  pointAmount: number,
  maxUsageRate?: number
): {
  isValid: boolean;
  maxAllowed?: number;
  currentRate?: number;
} => {
  if (!maxUsageRate) {
    return { isValid: true };
  }

  const currentRate = (pointAmount / orderAmount) * 100;
  const maxAllowed = Math.floor(orderAmount * maxUsageRate / 100);

  return {
    isValid: pointAmount <= maxAllowed,
    maxAllowed,
    currentRate
  };
};

// 포인트 잔액 일관성 검증
export const validateBalanceConsistency = (
  transactions: PointTransaction[]
): {
  isConsistent: boolean;
  expectedBalance: number;
  issues: string[];
} => {
  const issues: string[] = [];
  let calculatedBalance = 0;

  // 시간순 정렬
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedTransactions.forEach((transaction, index) => {
    // 취소된 거래는 스킵
    if (transaction.status === PointStatus.CANCELLED) {
      return;
    }

    // 잔액 계산
    if (transaction.type === PointTransactionType.EARN || 
        transaction.type === PointTransactionType.REFUND) {
      calculatedBalance += transaction.amount;
    } else if (transaction.type === PointTransactionType.SPEND ||
               transaction.type === PointTransactionType.EXPIRE) {
      calculatedBalance += transaction.amount; // 음수로 저장됨
    }

    // 거래 후 잔액과 계산된 잔액 비교
    if (Math.abs(transaction.balance - calculatedBalance) > 0.01) {
      issues.push(
        `거래 ${transaction.id}: 기록된 잔액(${transaction.balance})과 ` +
        `계산된 잔액(${calculatedBalance})이 일치하지 않습니다`
      );
    }
  });

  return {
    isConsistent: issues.length === 0,
    expectedBalance: calculatedBalance,
    issues
  };
};