import { useState, useEffect, useCallback } from 'react';
import { PointExpiry } from '../types';
import { PointExpiryService } from '../services';
import { StorageManager } from '@modules/storage';

interface UsePointExpiryOptions {
  userId: string;
  autoCheck?: boolean;
  checkInterval?: number; // hours
}

interface UsePointExpiryReturn {
  expiringPoints: {
    points: PointExpiry[];
    totalAmount: number;
    byDate: Map<string, number>;
  };
  expirySummary: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
    thisYear: number;
    nextYear: number;
    schedule: Array<{ month: string; amount: number }>;
  } | null;
  loading: boolean;
  error: Error | null;
  
  // Actions
  checkExpiry: (days?: number) => Promise<void>;
  extendExpiry: (criteria: {
    minAmount?: number;
    transactionIds?: string[];
    extensionMonths: number;
  }) => Promise<{ extendedCount: number; totalAmount: number }>;
  sendNotifications: (daysBeforeExpiry?: number[]) => Promise<void>;
  
  // Management
  startAutoCheck: (intervalHours?: number) => void;
  stopAutoCheck: () => void;
}

export const usePointExpiry = (options: UsePointExpiryOptions): UsePointExpiryReturn => {
  const { userId, autoCheck = false, checkInterval = 24 } = options;
  
  const [storage] = useState(() => new StorageManager());
  const [expiryService] = useState(() => new PointExpiryService(storage));
  
  const [expiringPoints, setExpiringPoints] = useState<{
    points: PointExpiry[];
    totalAmount: number;
    byDate: Map<string, number>;
  }>({
    points: [],
    totalAmount: 0,
    byDate: new Map()
  });
  
  const [expirySummary, setExpirySummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 만료 체크
  const checkExpiry = useCallback(async (days: number = 30) => {
    try {
      setLoading(true);
      const result = await expiryService.getExpiringPoints(userId, days);
      setExpiringPoints(result);
      
      // 요약 정보도 로드
      const summary = await expiryService.getExpirySummary(userId);
      setExpirySummary(summary);
      
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, expiryService]);

  // 유효기간 연장
  const extendExpiry = useCallback(async (criteria: {
    minAmount?: number;
    transactionIds?: string[];
    extensionMonths: number;
  }): Promise<{ extendedCount: number; totalAmount: number }> => {
    try {
      const result = await expiryService.extendExpiry(userId, criteria);
      
      // 연장 후 재체크
      await checkExpiry();
      
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [userId, expiryService, checkExpiry]);

  // 알림 전송
  const sendNotifications = useCallback(async (
    daysBeforeExpiry: number[] = [30, 7, 1]
  ): Promise<void> => {
    try {
      await expiryService.sendExpiryNotifications(daysBeforeExpiry);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [expiryService]);

  // 자동 체크 시작
  const startAutoCheck = useCallback((intervalHours: number = checkInterval) => {
    expiryService.startExpiryCheck(intervalHours);
  }, [expiryService, checkInterval]);

  // 자동 체크 중지
  const stopAutoCheck = useCallback(() => {
    expiryService.stopExpiryCheck();
  }, [expiryService]);

  // 초기 로드
  useEffect(() => {
    checkExpiry();
  }, []);

  // 자동 체크 설정
  useEffect(() => {
    if (autoCheck) {
      startAutoCheck();
      return () => stopAutoCheck();
    }
  }, [autoCheck, startAutoCheck, stopAutoCheck]);

  // 이벤트 리스너
  useEffect(() => {
    const handleExpiryNotification = (data: any) => {
      console.log('Expiry notification:', data);
    };

    const handlePointsExpired = (data: any) => {
      console.log('Points expired:', data);
      // 만료 후 재체크
      checkExpiry();
    };

    const handleExpiryExtended = (data: any) => {
      console.log('Expiry extended:', data);
    };

    expiryService.on('points:expiry:notification', handleExpiryNotification);
    expiryService.on('points:expired', handlePointsExpired);
    expiryService.on('points:expiry:extended', handleExpiryExtended);

    return () => {
      expiryService.off('points:expiry:notification', handleExpiryNotification);
      expiryService.off('points:expired', handlePointsExpired);
      expiryService.off('points:expiry:extended', handleExpiryExtended);
    };
  }, [expiryService, checkExpiry]);

  return {
    expiringPoints,
    expirySummary,
    loading,
    error,
    checkExpiry,
    extendExpiry,
    sendNotifications,
    startAutoCheck,
    stopAutoCheck
  };
};