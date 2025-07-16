import { useState, useEffect, useCallback } from 'react';
import { 
  PointBalance,
  PointTransaction,
  PointEarnRequest,
  PointSpendRequest,
  PointHistoryFilter,
  PointStatistics,
  PointExpiry
} from '../types';
import {
  PointTransactionService,
  PointBalanceService,
  PointExpiryService,
  PointHistoryService,
  PointPolicyEngine
} from '../services';
import { StorageManager } from '@modules/storage';

interface UsePointsOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UsePointsReturn {
  // 잔액
  balance: PointBalance | null;
  balanceLoading: boolean;
  
  // 거래
  earnPoints: (request: Omit<PointEarnRequest, 'userId'>) => Promise<PointTransaction>;
  spendPoints: (request: Omit<PointSpendRequest, 'userId'>) => Promise<PointTransaction>;
  
  // 히스토리
  history: PointTransaction[];
  historyLoading: boolean;
  historyPagination: any;
  loadHistory: (filter?: Partial<PointHistoryFilter>) => Promise<void>;
  
  // 통계
  statistics: PointStatistics | null;
  loadStatistics: (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => Promise<void>;
  
  // 만료
  expiringPoints: PointExpiry[];
  loadExpiringPoints: (days?: number) => Promise<void>;
  
  // 정책
  policy: any;
  
  // 새로고침
  refresh: () => Promise<void>;
  
  // 에러
  error: Error | null;
}

export const usePoints = (options: UsePointsOptions): UsePointsReturn => {
  const { userId, autoRefresh = true, refreshInterval = 60000 } = options;

  // Services
  const [storage] = useState(() => new StorageManager());
  const [balanceService] = useState(() => new PointBalanceService(storage));
  const [policyEngine] = useState(() => new PointPolicyEngine(storage));
  const [transactionService] = useState(() => 
    new PointTransactionService(storage, balanceService, policyEngine)
  );
  const [expiryService] = useState(() => new PointExpiryService(storage));
  const [historyService] = useState(() => new PointHistoryService(storage));

  // State
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState<any>(null);
  const [statistics, setStatistics] = useState<PointStatistics | null>(null);
  const [expiringPoints, setExpiringPoints] = useState<PointExpiry[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // 잔액 로드
  const loadBalance = useCallback(async () => {
    try {
      setBalanceLoading(true);
      const userBalance = await balanceService.getBalance(userId);
      setBalance(userBalance);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setBalanceLoading(false);
    }
  }, [userId, balanceService]);

  // 히스토리 로드
  const loadHistory = useCallback(async (filter?: Partial<PointHistoryFilter>) => {
    try {
      setHistoryLoading(true);
      const result = await historyService.getTransactionHistory({
        userId,
        ...filter
      });
      setHistory(result.transactions);
      setHistoryPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setHistoryLoading(false);
    }
  }, [userId, historyService]);

  // 통계 로드
  const loadStatistics = useCallback(async (
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ) => {
    try {
      const stats = await historyService.getStatistics(userId, period);
      setStatistics(stats);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [userId, historyService]);

  // 만료 예정 포인트 로드
  const loadExpiringPoints = useCallback(async (days: number = 30) => {
    try {
      const result = await expiryService.getExpiringPoints(userId, days);
      setExpiringPoints(result.points);
      
      // 잔액에 만료 예정 포인트 업데이트
      await balanceService.updateExpiringPoints(userId, result.totalAmount);
      
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [userId, expiryService, balanceService]);

  // 포인트 적립
  const earnPoints = useCallback(async (
    request: Omit<PointEarnRequest, 'userId'>
  ): Promise<PointTransaction> => {
    try {
      const transaction = await transactionService.earnPoints({
        ...request,
        userId
      });
      
      // 자동 새로고침
      if (autoRefresh) {
        await refresh();
      }
      
      return transaction;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [userId, transactionService, autoRefresh]);

  // 포인트 사용
  const spendPoints = useCallback(async (
    request: Omit<PointSpendRequest, 'userId'>
  ): Promise<PointTransaction> => {
    try {
      const transaction = await transactionService.spendPoints({
        ...request,
        userId
      });
      
      // 자동 새로고침
      if (autoRefresh) {
        await refresh();
      }
      
      return transaction;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [userId, transactionService, autoRefresh]);

  // 전체 새로고침
  const refresh = useCallback(async () => {
    await Promise.all([
      loadBalance(),
      loadHistory(),
      loadExpiringPoints()
    ]);
  }, [loadBalance, loadHistory, loadExpiringPoints]);

  // 초기 로드
  useEffect(() => {
    refresh();
  }, []);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  // 이벤트 리스너
  useEffect(() => {
    const handlePointsEarned = () => refresh();
    const handlePointsSpent = () => refresh();
    const handlePointsExpired = () => refresh();

    transactionService.on('points:earned', handlePointsEarned);
    transactionService.on('points:spent', handlePointsSpent);
    transactionService.on('points:expired', handlePointsExpired);

    return () => {
      transactionService.off('points:earned', handlePointsEarned);
      transactionService.off('points:spent', handlePointsSpent);
      transactionService.off('points:expired', handlePointsExpired);
    };
  }, [transactionService, refresh]);

  return {
    balance,
    balanceLoading,
    earnPoints,
    spendPoints,
    history,
    historyLoading,
    historyPagination,
    loadHistory,
    statistics,
    loadStatistics,
    expiringPoints,
    loadExpiringPoints,
    policy: policyEngine.getActivePolicy(),
    refresh,
    error
  };
};