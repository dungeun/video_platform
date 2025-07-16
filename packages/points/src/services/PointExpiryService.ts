import { EventEmitter } from '@modules/core';
import { StorageManager } from '@modules/storage';
import { 
  PointTransaction, 
  PointTransactionType, 
  PointStatus,
  PointExpiry
} from '../types';
import { addDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export class PointExpiryService extends EventEmitter {
  private storage: StorageManager;
  private readonly STORAGE_KEY = 'point_expiry_queue';
  private expiryCheckInterval: NodeJS.Timeout | null = null;

  constructor(storage: StorageManager) {
    super();
    this.storage = storage;
  }

  /**
   * 만료 체크 시작
   */
  startExpiryCheck(intervalHours: number = 24): void {
    this.stopExpiryCheck();
    
    // 즉시 한 번 실행
    this.processExpiredPoints();
    
    // 주기적 실행
    this.expiryCheckInterval = setInterval(() => {
      this.processExpiredPoints();
    }, intervalHours * 60 * 60 * 1000);
  }

  /**
   * 만료 체크 중지
   */
  stopExpiryCheck(): void {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
      this.expiryCheckInterval = null;
    }
  }

  /**
   * 만료된 포인트 처리
   */
  async processExpiredPoints(): Promise<void> {
    const transactions = await this.getExpiringTransactions();
    const now = new Date();
    const expiredPoints: PointTransaction[] = [];

    for (const transaction of transactions) {
      if (transaction.expiresAt && new Date(transaction.expiresAt) <= now) {
        expiredPoints.push(transaction);
      }
    }

    if (expiredPoints.length > 0) {
      this.emit('points:expiring:batch', expiredPoints);
      
      // 그룹화하여 사용자별로 처리
      const grouped = this.groupByUser(expiredPoints);
      
      for (const [userId, userTransactions] of Object.entries(grouped)) {
        const totalAmount = userTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        this.emit('points:expired', {
          userId,
          amount: totalAmount,
          transactions: userTransactions
        });
      }
    }
  }

  /**
   * 만료 예정 포인트 조회
   */
  async getExpiringPoints(userId: string, days: number = 30): Promise<{
    points: PointExpiry[];
    totalAmount: number;
    byDate: Map<string, number>;
  }> {
    const transactions = await this.getUserTransactions(userId);
    const now = new Date();
    const checkDate = addDays(now, days);
    
    const expiringTransactions = transactions.filter(t => 
      t.type === PointTransactionType.EARN &&
      t.status === PointStatus.AVAILABLE &&
      t.expiresAt &&
      new Date(t.expiresAt) > now &&
      new Date(t.expiresAt) <= checkDate
    );

    // 날짜별 그룹화
    const byDate = new Map<string, number>();
    const expiryGroups = new Map<string, PointExpiry>();

    for (const transaction of expiringTransactions) {
      const expiryDate = startOfDay(new Date(transaction.expiresAt!));
      const dateKey = expiryDate.toISOString();
      
      // 날짜별 합계
      byDate.set(dateKey, (byDate.get(dateKey) || 0) + transaction.amount);
      
      // 만료 정보 그룹화
      if (!expiryGroups.has(dateKey)) {
        expiryGroups.set(dateKey, {
          userId,
          points: 0,
          expiresAt: expiryDate,
          transactionIds: [],
          notificationSent: false
        });
      }
      
      const group = expiryGroups.get(dateKey)!;
      group.points += transaction.amount;
      group.transactionIds.push(transaction.id);
    }

    const points = Array.from(expiryGroups.values());
    const totalAmount = points.reduce((sum, p) => sum + p.points, 0);

    return {
      points,
      totalAmount,
      byDate
    };
  }

  /**
   * 만료 알림 전송
   */
  async sendExpiryNotifications(daysBeforeExpiry: number[] = [30, 7, 1]): Promise<void> {
    const allTransactions = await this.getAllTransactions();
    const now = new Date();
    const notificationQueue: Array<{
      userId: string;
      points: number;
      expiresAt: Date;
      daysRemaining: number;
    }> = [];

    // 각 알림 기간에 대해 체크
    for (const days of daysBeforeExpiry) {
      const targetDate = startOfDay(addDays(now, days));
      const targetDateEnd = endOfDay(targetDate);

      const expiringOnDate = allTransactions.filter(t =>
        t.type === PointTransactionType.EARN &&
        t.status === PointStatus.AVAILABLE &&
        t.expiresAt &&
        new Date(t.expiresAt) >= targetDate &&
        new Date(t.expiresAt) <= targetDateEnd
      );

      // 사용자별 그룹화
      const grouped = this.groupByUser(expiringOnDate);
      
      for (const [userId, transactions] of Object.entries(grouped)) {
        const totalPoints = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        notificationQueue.push({
          userId,
          points: totalPoints,
          expiresAt: new Date(transactions[0].expiresAt!),
          daysRemaining: days
        });
      }
    }

    // 알림 전송
    for (const notification of notificationQueue) {
      this.emit('points:expiry:notification', notification);
      
      // 알림 전송 기록
      await this.recordNotification(
        notification.userId,
        notification.expiresAt,
        notification.daysRemaining
      );
    }
  }

  /**
   * 포인트 유효기간 연장
   */
  async extendExpiry(
    userId: string, 
    criteria: { 
      minAmount?: number; 
      transactionIds?: string[];
      extensionMonths: number;
    }
  ): Promise<{
    extendedCount: number;
    totalAmount: number;
  }> {
    const transactions = await this.getUserTransactions(userId);
    let targetTransactions = transactions.filter(t =>
      t.type === PointTransactionType.EARN &&
      t.status === PointStatus.AVAILABLE &&
      t.expiresAt
    );

    // 기준에 따라 필터링
    if (criteria.transactionIds?.length) {
      targetTransactions = targetTransactions.filter(t =>
        criteria.transactionIds!.includes(t.id)
      );
    }

    if (criteria.minAmount) {
      targetTransactions = targetTransactions.filter(t =>
        t.amount >= criteria.minAmount!
      );
    }

    let extendedCount = 0;
    let totalAmount = 0;

    for (const transaction of targetTransactions) {
      const newExpiry = new Date(transaction.expiresAt!);
      newExpiry.setMonth(newExpiry.getMonth() + criteria.extensionMonths);
      
      // 연장 이벤트 발생
      this.emit('points:expiry:extended', {
        userId,
        transactionId: transaction.id,
        oldExpiry: transaction.expiresAt,
        newExpiry,
        amount: transaction.amount
      });

      extendedCount++;
      totalAmount += transaction.amount;
    }

    return {
      extendedCount,
      totalAmount
    };
  }

  /**
   * 만료 예정 포인트 요약
   */
  async getExpirySummary(userId: string): Promise<{
    next30Days: number;
    next60Days: number;
    next90Days: number;
    thisYear: number;
    nextYear: number;
    schedule: Array<{
      month: string;
      amount: number;
    }>;
  }> {
    const transactions = await this.getUserTransactions(userId);
    const now = new Date();
    const endOfThisYear = new Date(now.getFullYear(), 11, 31);
    const endOfNextYear = new Date(now.getFullYear() + 1, 11, 31);

    const summary = {
      next30Days: 0,
      next60Days: 0,
      next90Days: 0,
      thisYear: 0,
      nextYear: 0,
      schedule: new Map<string, number>()
    };

    for (const transaction of transactions) {
      if (
        transaction.type !== PointTransactionType.EARN ||
        transaction.status !== PointStatus.AVAILABLE ||
        !transaction.expiresAt
      ) {
        continue;
      }

      const expiryDate = new Date(transaction.expiresAt);
      const daysUntilExpiry = differenceInDays(expiryDate, now);

      // 기간별 집계
      if (daysUntilExpiry <= 30) {
        summary.next30Days += transaction.amount;
      }
      if (daysUntilExpiry <= 60) {
        summary.next60Days += transaction.amount;
      }
      if (daysUntilExpiry <= 90) {
        summary.next90Days += transaction.amount;
      }

      // 연도별 집계
      if (expiryDate <= endOfThisYear) {
        summary.thisYear += transaction.amount;
      } else if (expiryDate <= endOfNextYear) {
        summary.nextYear += transaction.amount;
      }

      // 월별 집계
      const monthKey = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}`;
      summary.schedule.set(
        monthKey,
        (summary.schedule.get(monthKey) || 0) + transaction.amount
      );
    }

    return {
      ...summary,
      schedule: Array.from(summary.schedule.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month))
    };
  }

  /**
   * Private methods
   */
  private async getAllTransactions(): Promise<PointTransaction[]> {
    // 실제로는 PointTransactionService를 통해 조회
    return await this.storage.get<PointTransaction[]>('point_transactions') || [];
  }

  private async getUserTransactions(userId: string): Promise<PointTransaction[]> {
    const all = await this.getAllTransactions();
    return all.filter(t => t.userId === userId);
  }

  private async getExpiringTransactions(): Promise<PointTransaction[]> {
    const all = await this.getAllTransactions();
    return all.filter(t => 
      t.type === PointTransactionType.EARN &&
      t.status === PointStatus.AVAILABLE &&
      t.expiresAt
    );
  }

  private groupByUser(transactions: PointTransaction[]): Record<string, PointTransaction[]> {
    return transactions.reduce((groups, transaction) => {
      if (!groups[transaction.userId]) {
        groups[transaction.userId] = [];
      }
      groups[transaction.userId].push(transaction);
      return groups;
    }, {} as Record<string, PointTransaction[]>);
  }

  private async recordNotification(
    userId: string,
    expiresAt: Date,
    daysRemaining: number
  ): Promise<void> {
    const notifications = await this.storage.get<any[]>('expiry_notifications') || [];
    notifications.push({
      userId,
      expiresAt,
      daysRemaining,
      sentAt: new Date()
    });
    await this.storage.set('expiry_notifications', notifications);
  }
}