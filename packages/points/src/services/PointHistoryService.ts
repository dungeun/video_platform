import { EventEmitter } from '@modules/core';
import { StorageManager } from '@modules/storage';
import {
  PointTransaction,
  PointTransactionType,
  PointStatistics,
  PointEarnReason,
  PointSpendReason,
  PointHistoryFilter,
  PointForecast
} from '../types';
import { startOfDay, endOfDay, subDays, addDays, format } from 'date-fns';

export class PointHistoryService extends EventEmitter {
  private storage: StorageManager;
  private readonly TRANSACTION_KEY = 'point_transactions';
  private readonly STATS_KEY = 'point_statistics';

  constructor(storage: StorageManager) {
    super();
    this.storage = storage;
  }

  /**
   * 거래 내역 조회
   */
  async getTransactionHistory(filter: PointHistoryFilter): Promise<{
    transactions: PointTransaction[];
    summary: {
      totalEarned: number;
      totalSpent: number;
      totalExpired: number;
      netChange: number;
    };
    pagination: {
      total: number;
      page: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const allTransactions = await this.getAllTransactions();
    
    // 필터링
    let filtered = this.applyFilters(allTransactions, filter);
    
    // 요약 계산
    const summary = this.calculateSummary(filtered);
    
    // 정렬
    filtered = this.sortTransactions(filtered, filter.sortBy, filter.sortOrder);
    
    // 페이징
    const pagination = this.paginate(filtered, filter.page || 1, filter.limit || 20);

    return {
      transactions: pagination.items,
      summary,
      pagination: {
        total: filtered.length,
        page: pagination.page,
        totalPages: pagination.totalPages,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev
      }
    };
  }

  /**
   * 통계 조회
   */
  async getStatistics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<PointStatistics> {
    const transactions = await this.getUserTransactions(userId);
    const now = new Date();
    
    // 기간별 필터링
    const filteredTransactions = this.filterByPeriod(transactions, period, now);
    
    // 적립 통계
    const earnStats = this.calculateEarnStatistics(filteredTransactions);
    
    // 사용 통계
    const spendStats = this.calculateSpendStatistics(filteredTransactions);
    
    // 만료 통계
    const expiryStats = this.calculateExpiryStatistics(filteredTransactions);

    const statistics: PointStatistics = {
      userId,
      period,
      earnStats,
      spendStats,
      expiryStats
    };

    // 통계 저장
    await this.saveStatistics(userId, period, statistics);

    return statistics;
  }

  /**
   * 거래 패턴 분석
   */
  async analyzeTransactionPatterns(userId: string): Promise<{
    mostActiveDay: string;
    mostActiveHour: number;
    averageTransactionAmount: number;
    preferredEarnMethods: Array<{ reason: string; percentage: number }>;
    spendingCategories: Array<{ category: string; amount: number; percentage: number }>;
    seasonalTrends: Array<{ month: number; earnAmount: number; spendAmount: number }>;
  }> {
    const transactions = await this.getUserTransactions(userId);
    
    // 요일별 활동 분석
    const dayActivity = new Map<number, number>();
    const hourActivity = new Map<number, number>();
    
    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      const day = date.getDay();
      const hour = date.getHours();
      
      dayActivity.set(day, (dayActivity.get(day) || 0) + 1);
      hourActivity.set(hour, (hourActivity.get(hour) || 0) + 1);
    });
    
    // 가장 활발한 요일/시간 찾기
    const mostActiveDay = this.findMaxKey(dayActivity);
    const mostActiveHour = this.findMaxKey(hourActivity);
    
    // 평균 거래 금액
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const averageTransactionAmount = transactions.length > 0 ? totalAmount / transactions.length : 0;
    
    // 선호 적립 방법
    const earnTransactions = transactions.filter(t => t.type === PointTransactionType.EARN);
    const earnMethodCounts = new Map<string, number>();
    
    earnTransactions.forEach(t => {
      earnMethodCounts.set(t.reason, (earnMethodCounts.get(t.reason) || 0) + 1);
    });
    
    const totalEarnTransactions = earnTransactions.length;
    const preferredEarnMethods = Array.from(earnMethodCounts.entries())
      .map(([reason, count]) => ({
        reason,
        percentage: totalEarnTransactions > 0 ? (count / totalEarnTransactions) * 100 : 0
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // 사용 카테고리 분석
    const spendTransactions = transactions.filter(t => t.type === PointTransactionType.SPEND);
    const categorySpending = new Map<string, number>();
    
    spendTransactions.forEach(t => {
      const category = t.metadata?.category || 'uncategorized';
      categorySpending.set(category, (categorySpending.get(category) || 0) + Math.abs(t.amount));
    });
    
    const totalSpending = Array.from(categorySpending.values()).reduce((sum, amount) => sum + amount, 0);
    const spendingCategories = Array.from(categorySpending.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // 계절별 트렌드
    const monthlyData = new Map<number, { earn: number; spend: number }>();
    
    transactions.forEach(t => {
      const month = new Date(t.createdAt).getMonth();
      const data = monthlyData.get(month) || { earn: 0, spend: 0 };
      
      if (t.type === PointTransactionType.EARN) {
        data.earn += t.amount;
      } else if (t.type === PointTransactionType.SPEND) {
        data.spend += Math.abs(t.amount);
      }
      
      monthlyData.set(month, data);
    });
    
    const seasonalTrends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month: month + 1,
        earnAmount: data.earn,
        spendAmount: data.spend
      }))
      .sort((a, b) => a.month - b.month);

    return {
      mostActiveDay: ['일', '월', '화', '수', '목', '금', '토'][mostActiveDay],
      mostActiveHour,
      averageTransactionAmount,
      preferredEarnMethods,
      spendingCategories,
      seasonalTrends
    };
  }

  /**
   * 포인트 예측
   */
  async forecastPoints(userId: string, days: number = 90): Promise<PointForecast> {
    const transactions = await this.getUserTransactions(userId);
    const balance = await this.getCurrentBalance(userId);
    
    // 과거 데이터 기반 예측
    const historicalData = this.analyzeHistoricalTrends(transactions, 180); // 6개월 데이터
    
    // 예상 적립액
    const expectedEarnings = historicalData.dailyAverageEarn * days;
    
    // 예상 사용액
    const expectedSpending = historicalData.dailyAverageSpend * days;
    
    // 예상 만료액
    const expiringTransactions = transactions.filter(t => {
      if (t.type !== PointTransactionType.EARN || !t.expiresAt) return false;
      const expiryDate = new Date(t.expiresAt);
      return expiryDate <= addDays(new Date(), days);
    });
    const expectedExpiry = expiringTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // 예상 잔액
    const expectedBalance = balance.availablePoints + expectedEarnings - expectedSpending - expectedExpiry;
    
    // 추천 액션 생성
    const recommendations = this.generateRecommendations(
      balance.availablePoints,
      expectedExpiry,
      expiringTransactions
    );

    return {
      userId,
      forecastDate: addDays(new Date(), days),
      expectedBalance,
      expectedExpiry,
      expectedEarnings,
      recommendations
    };
  }

  /**
   * 상세 리포트 생성
   */
  async generateDetailedReport(userId: string, startDate: Date, endDate: Date): Promise<{
    period: { start: Date; end: Date };
    summary: {
      openingBalance: number;
      closingBalance: number;
      totalEarned: number;
      totalSpent: number;
      totalExpired: number;
      netChange: number;
    };
    dailyBreakdown: Array<{
      date: string;
      earned: number;
      spent: number;
      expired: number;
      balance: number;
    }>;
    topEarningReasons: Array<{ reason: string; amount: number; count: number }>;
    topSpendingReasons: Array<{ reason: string; amount: number; count: number }>;
  }> {
    const transactions = await this.getUserTransactions(userId);
    
    // 기간 내 거래 필터링
    const periodTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date >= startDate && date <= endDate;
    });

    // 기간 시작 잔액 계산
    const openingBalance = await this.getBalanceAtDate(userId, startDate);
    
    // 일별 분석
    const dailyBreakdown = this.calculateDailyBreakdown(periodTransactions, startDate, endDate);
    
    // 요약 계산
    const summary = {
      openingBalance,
      closingBalance: openingBalance + this.calculateSummary(periodTransactions).netChange,
      ...this.calculateSummary(periodTransactions)
    };
    
    // 상위 적립/사용 사유
    const topEarningReasons = this.getTopReasons(
      periodTransactions.filter(t => t.type === PointTransactionType.EARN)
    );
    
    const topSpendingReasons = this.getTopReasons(
      periodTransactions.filter(t => t.type === PointTransactionType.SPEND)
    );

    return {
      period: { start: startDate, end: endDate },
      summary,
      dailyBreakdown,
      topEarningReasons,
      topSpendingReasons
    };
  }

  /**
   * Private methods
   */
  private async getAllTransactions(): Promise<PointTransaction[]> {
    return await this.storage.get<PointTransaction[]>(this.TRANSACTION_KEY) || [];
  }

  private async getUserTransactions(userId: string): Promise<PointTransaction[]> {
    const all = await this.getAllTransactions();
    return all.filter(t => t.userId === userId);
  }

  private applyFilters(transactions: PointTransaction[], filter: PointHistoryFilter): PointTransaction[] {
    let filtered = transactions.filter(t => t.userId === filter.userId);

    if (filter.types?.length) {
      filtered = filtered.filter(t => filter.types!.includes(t.type));
    }

    if (filter.status?.length) {
      filtered = filtered.filter(t => filter.status!.includes(t.status));
    }

    if (filter.startDate) {
      filtered = filtered.filter(t => new Date(t.createdAt) >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter(t => new Date(t.createdAt) <= filter.endDate!);
    }

    if (filter.minAmount !== undefined) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= filter.minAmount!);
    }

    if (filter.maxAmount !== undefined) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= filter.maxAmount!);
    }

    if (filter.orderId) {
      filtered = filtered.filter(t => t.orderId === filter.orderId);
    }

    return filtered;
  }

  private sortTransactions(
    transactions: PointTransaction[],
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): PointTransaction[] {
    return [...transactions].sort((a, b) => {
      const aValue = a[sortBy as keyof PointTransaction] as any;
      const bValue = b[sortBy as keyof PointTransaction] as any;
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  }

  private paginate<T>(items: T[], page: number, limit: number): {
    items: T[];
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const totalPages = Math.ceil(items.length / limit);
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return {
      items: paged,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  private calculateSummary(transactions: PointTransaction[]): {
    totalEarned: number;
    totalSpent: number;
    totalExpired: number;
    netChange: number;
  } {
    const summary = transactions.reduce((acc, t) => {
      switch (t.type) {
        case PointTransactionType.EARN:
        case PointTransactionType.REFUND:
          acc.totalEarned += t.amount;
          break;
        case PointTransactionType.SPEND:
          acc.totalSpent += Math.abs(t.amount);
          break;
        case PointTransactionType.EXPIRE:
          acc.totalExpired += Math.abs(t.amount);
          break;
      }
      acc.netChange += t.amount;
      return acc;
    }, {
      totalEarned: 0,
      totalSpent: 0,
      totalExpired: 0,
      netChange: 0
    });

    return summary;
  }

  private filterByPeriod(
    transactions: PointTransaction[],
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    date: Date
  ): PointTransaction[] {
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = startOfDay(date);
        break;
      case 'weekly':
        startDate = subDays(date, 7);
        break;
      case 'monthly':
        startDate = subDays(date, 30);
        break;
      case 'yearly':
        startDate = subDays(date, 365);
        break;
    }

    return transactions.filter(t => new Date(t.createdAt) >= startDate);
  }

  private calculateEarnStatistics(transactions: PointTransaction[]): PointStatistics['earnStats'] {
    const earnTransactions = transactions.filter(t => 
      t.type === PointTransactionType.EARN || t.type === PointTransactionType.REFUND
    );

    const reasonCounts = new Map<string, { amount: number; count: number }>();
    
    earnTransactions.forEach(t => {
      const current = reasonCounts.get(t.reason) || { amount: 0, count: 0 };
      current.amount += t.amount;
      current.count += 1;
      reasonCounts.set(t.reason, current);
    });

    const totalAmount = earnTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = earnTransactions.length;

    return {
      totalAmount,
      transactionCount,
      averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
      topReasons: Array.from(reasonCounts.entries())
        .map(([reason, data]) => ({
          reason: reason as PointEarnReason,
          amount: data.amount,
          count: data.count
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    };
  }

  private calculateSpendStatistics(transactions: PointTransaction[]): PointStatistics['spendStats'] {
    const spendTransactions = transactions.filter(t => t.type === PointTransactionType.SPEND);

    const reasonCounts = new Map<string, { amount: number; count: number }>();
    
    spendTransactions.forEach(t => {
      const current = reasonCounts.get(t.reason) || { amount: 0, count: 0 };
      current.amount += Math.abs(t.amount);
      current.count += 1;
      reasonCounts.set(t.reason, current);
    });

    const totalAmount = spendTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const transactionCount = spendTransactions.length;

    return {
      totalAmount,
      transactionCount,
      averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
      topReasons: Array.from(reasonCounts.entries())
        .map(([reason, data]) => ({
          reason: reason as PointSpendReason,
          amount: data.amount,
          count: data.count
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    };
  }

  private calculateExpiryStatistics(transactions: PointTransaction[]): PointStatistics['expiryStats'] {
    const expiredTransactions = transactions.filter(t => t.type === PointTransactionType.EXPIRE);
    const totalAmount = expiredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // 만료 예정 계산
    const now = new Date();
    const upcomingExpiry = transactions.filter(t => {
      if (t.type !== PointTransactionType.EARN || !t.expiresAt) return false;
      const expiryDate = new Date(t.expiresAt);
      return expiryDate > now && expiryDate <= addDays(now, 30);
    });

    const upcomingAmount = upcomingExpiry.reduce((sum, t) => sum + t.amount, 0);

    // 평균 만료 기간
    const expiryDays = transactions
      .filter(t => t.earnedAt && t.expiresAt)
      .map(t => {
        const earned = new Date(t.earnedAt!);
        const expired = new Date(t.expiresAt!);
        return Math.floor((expired.getTime() - earned.getTime()) / (1000 * 60 * 60 * 24));
      });

    const averageExpiryDays = expiryDays.length > 0
      ? expiryDays.reduce((sum, days) => sum + days, 0) / expiryDays.length
      : 365;

    return {
      totalAmount,
      upcomingAmount,
      averageExpiryDays
    };
  }

  private findMaxKey(map: Map<number, number>): number {
    let maxKey = 0;
    let maxValue = 0;

    map.forEach((value, key) => {
      if (value > maxValue) {
        maxValue = value;
        maxKey = key;
      }
    });

    return maxKey;
  }

  private analyzeHistoricalTrends(transactions: PointTransaction[], days: number): {
    dailyAverageEarn: number;
    dailyAverageSpend: number;
  } {
    const startDate = subDays(new Date(), days);
    const recentTransactions = transactions.filter(t => new Date(t.createdAt) >= startDate);

    const earnTotal = recentTransactions
      .filter(t => t.type === PointTransactionType.EARN)
      .reduce((sum, t) => sum + t.amount, 0);

    const spendTotal = recentTransactions
      .filter(t => t.type === PointTransactionType.SPEND)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      dailyAverageEarn: earnTotal / days,
      dailyAverageSpend: spendTotal / days
    };
  }

  private generateRecommendations(
    currentBalance: number,
    expectedExpiry: number,
    expiringTransactions: PointTransaction[]
  ): Array<{ action: 'USE' | 'SAVE' | 'CONVERT'; amount: number; reason: string; deadline?: Date }> {
    const recommendations = [];

    // 만료 예정 포인트가 있으면 사용 권장
    if (expectedExpiry > 0) {
      const nearestExpiry = expiringTransactions
        .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())[0];

      recommendations.push({
        action: 'USE' as const,
        amount: expectedExpiry,
        reason: `${expectedExpiry.toLocaleString()}포인트가 곧 만료됩니다`,
        deadline: nearestExpiry?.expiresAt ? new Date(nearestExpiry.expiresAt) : undefined
      });
    }

    // 잔액이 많으면 일부 사용 권장
    if (currentBalance > 50000) {
      recommendations.push({
        action: 'USE' as const,
        amount: Math.floor(currentBalance * 0.3),
        reason: '포인트를 적절히 사용하여 만료 위험을 줄이세요'
      });
    }

    // 잔액이 적으면 적립 권장
    if (currentBalance < 5000) {
      recommendations.push({
        action: 'SAVE' as const,
        amount: 5000 - currentBalance,
        reason: '포인트를 더 적립하여 사용 가능한 금액을 늘리세요'
      });
    }

    return recommendations;
  }

  private async getCurrentBalance(userId: string): Promise<{ availablePoints: number }> {
    // 실제로는 BalanceService를 통해 조회
    const balances = await this.storage.get<any[]>('point_balances') || [];
    const userBalance = balances.find(b => b.userId === userId);
    return userBalance || { availablePoints: 0 };
  }

  private async getBalanceAtDate(userId: string, date: Date): Promise<number> {
    const transactions = await this.getUserTransactions(userId);
    const transactionsBeforeDate = transactions.filter(t => new Date(t.createdAt) < date);
    
    return transactionsBeforeDate.reduce((balance, t) => {
      if (t.type === PointTransactionType.EARN || t.type === PointTransactionType.REFUND) {
        return balance + t.amount;
      } else if (t.type === PointTransactionType.SPEND || t.type === PointTransactionType.EXPIRE) {
        return balance - Math.abs(t.amount);
      }
      return balance;
    }, 0);
  }

  private calculateDailyBreakdown(
    transactions: PointTransaction[],
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; earned: number; spent: number; expired: number; balance: number }> {
    const breakdown = [];
    let currentDate = new Date(startDate);
    let runningBalance = 0;

    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      
      const dayTransactions = transactions.filter(t => {
        const date = new Date(t.createdAt);
        return date >= dayStart && date <= dayEnd;
      });

      const dayStats = {
        date: format(currentDate, 'yyyy-MM-dd'),
        earned: 0,
        spent: 0,
        expired: 0,
        balance: 0
      };

      dayTransactions.forEach(t => {
        switch (t.type) {
          case PointTransactionType.EARN:
          case PointTransactionType.REFUND:
            dayStats.earned += t.amount;
            runningBalance += t.amount;
            break;
          case PointTransactionType.SPEND:
            dayStats.spent += Math.abs(t.amount);
            runningBalance -= Math.abs(t.amount);
            break;
          case PointTransactionType.EXPIRE:
            dayStats.expired += Math.abs(t.amount);
            runningBalance -= Math.abs(t.amount);
            break;
        }
      });

      dayStats.balance = runningBalance;
      breakdown.push(dayStats);

      currentDate = addDays(currentDate, 1);
    }

    return breakdown;
  }

  private getTopReasons(transactions: PointTransaction[]): Array<{
    reason: string;
    amount: number;
    count: number;
  }> {
    const reasonStats = new Map<string, { amount: number; count: number }>();

    transactions.forEach(t => {
      const current = reasonStats.get(t.reason) || { amount: 0, count: 0 };
      current.amount += Math.abs(t.amount);
      current.count += 1;
      reasonStats.set(t.reason, current);
    });

    return Array.from(reasonStats.entries())
      .map(([reason, stats]) => ({ reason, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  private async saveStatistics(userId: string, period: string, stats: PointStatistics): Promise<void> {
    const allStats = await this.storage.get<any[]>(this.STATS_KEY) || [];
    const key = `${userId}_${period}`;
    const index = allStats.findIndex(s => s.key === key);

    const statsWithKey = { key, ...stats, updatedAt: new Date() };

    if (index >= 0) {
      allStats[index] = statsWithKey;
    } else {
      allStats.push(statsWithKey);
    }

    await this.storage.set(this.STATS_KEY, allStats);
  }
}