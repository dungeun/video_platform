import { EventEmitter } from '@modules/core';
import { StorageManager } from '@modules/storage';
import { PointBalance as IPointBalance } from '../types';
import { PointBalance } from '../entities/PointBalance';

interface BalanceUpdate {
  type: 'earn' | 'spend' | 'expire' | 'activate' | 'cancel' | 'refund';
  amount: number;
  isPending?: boolean;
  wasPending?: boolean;
}

export class PointBalanceService extends EventEmitter {
  private storage: StorageManager;
  private readonly STORAGE_KEY = 'point_balances';
  private balanceCache: Map<string, PointBalance>;

  constructor(storage: StorageManager) {
    super();
    this.storage = storage;
    this.balanceCache = new Map();
  }

  /**
   * 포인트 잔액 조회
   */
  async getBalance(userId: string): Promise<IPointBalance> {
    // 캐시 확인
    if (this.balanceCache.has(userId)) {
      return this.balanceCache.get(userId)!.toJSON();
    }

    // 스토리지에서 조회
    const balances = await this.getAllBalances();
    const balanceData = balances.find(b => b.userId === userId);

    if (balanceData) {
      const balance = new PointBalance(balanceData);
      this.balanceCache.set(userId, balance);
      return balance.toJSON();
    }

    // 새 잔액 생성
    const newBalance = new PointBalance({ userId });
    await this.saveBalance(newBalance);
    return newBalance.toJSON();
  }

  /**
   * 잔액 업데이트
   */
  async updateBalance(userId: string, update: BalanceUpdate): Promise<IPointBalance> {
    const balance = await this.getBalanceEntity(userId);

    switch (update.type) {
      case 'earn':
        balance.earn(update.amount, update.isPending);
        break;
      
      case 'spend':
        balance.spend(update.amount);
        break;
      
      case 'expire':
        balance.expire(update.amount);
        break;
      
      case 'activate':
        balance.activatePending(update.amount);
        break;
      
      case 'cancel':
        balance.cancelEarn(update.amount, update.wasPending);
        break;
      
      case 'refund':
        balance.refund(update.amount);
        break;
    }

    await this.saveBalance(balance);
    
    // 이벤트 발생
    this.emit('balance:updated', {
      userId,
      type: update.type,
      amount: update.amount,
      newBalance: balance.toJSON()
    });

    return balance.toJSON();
  }

  /**
   * 만료 예정 포인트 업데이트
   */
  async updateExpiringPoints(userId: string, amount: number): Promise<void> {
    const balance = await this.getBalanceEntity(userId);
    balance.updateExpiringPoints(amount);
    await this.saveBalance(balance);
  }

  /**
   * 여러 사용자의 잔액 조회
   */
  async getMultipleBalances(userIds: string[]): Promise<IPointBalance[]> {
    const balances = await Promise.all(
      userIds.map(userId => this.getBalance(userId))
    );
    return balances;
  }

  /**
   * 잔액 재계산
   */
  async recalculateBalance(userId: string, calculations: {
    totalPoints: number;
    availablePoints: number;
    pendingPoints: number;
    expiringPoints: number;
    totalEarned: number;
    totalSpent: number;
    totalExpired: number;
  }): Promise<IPointBalance> {
    const balance = await this.getBalanceEntity(userId);
    balance.recalculate(calculations);
    await this.saveBalance(balance);
    
    this.emit('balance:recalculated', {
      userId,
      balance: balance.toJSON()
    });
    
    return balance.toJSON();
  }

  /**
   * 포인트 사용 가능 여부 확인
   */
  async canSpend(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance.availablePoints >= amount;
  }

  /**
   * 포인트 부족분 계산
   */
  async getShortfall(userId: string, amount: number): Promise<number> {
    const balance = await this.getBalanceEntity(userId);
    return balance.getShortfall(amount);
  }

  /**
   * 잔액 통계 조회
   */
  async getBalanceStatistics(): Promise<{
    totalUsers: number;
    totalPoints: number;
    totalAvailable: number;
    totalPending: number;
    totalExpiring: number;
    averageBalance: number;
  }> {
    const balances = await this.getAllBalances();
    
    const stats = balances.reduce((acc, balance) => {
      acc.totalPoints += balance.totalPoints;
      acc.totalAvailable += balance.availablePoints;
      acc.totalPending += balance.pendingPoints;
      acc.totalExpiring += balance.expiringPoints;
      return acc;
    }, {
      totalPoints: 0,
      totalAvailable: 0,
      totalPending: 0,
      totalExpiring: 0
    });

    return {
      totalUsers: balances.length,
      ...stats,
      averageBalance: balances.length > 0 ? stats.totalPoints / balances.length : 0
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.balanceCache.delete(userId);
    } else {
      this.balanceCache.clear();
    }
  }

  /**
   * Private methods
   */
  private async getBalanceEntity(userId: string): Promise<PointBalance> {
    if (this.balanceCache.has(userId)) {
      return this.balanceCache.get(userId)!;
    }

    const balanceData = await this.getBalance(userId);
    const balance = new PointBalance(balanceData);
    this.balanceCache.set(userId, balance);
    
    return balance;
  }

  private async saveBalance(balance: PointBalance): Promise<void> {
    const balances = await this.getAllBalances();
    const index = balances.findIndex(b => b.userId === balance.userId);
    
    if (index >= 0) {
      balances[index] = balance.toJSON();
    } else {
      balances.push(balance.toJSON());
    }
    
    await this.storage.set(this.STORAGE_KEY, balances);
    this.balanceCache.set(balance.userId, balance);
  }

  private async getAllBalances(): Promise<IPointBalance[]> {
    return await this.storage.get<IPointBalance[]>(this.STORAGE_KEY) || [];
  }
}