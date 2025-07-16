import { EventEmitter } from '@modules/core';
import { StorageManager } from '@modules/storage';
import { 
  PointTransaction, 
  PointTransactionType, 
  PointStatus,
  PointEarnRequest,
  PointSpendRequest,
  PointHistoryFilter
} from '../types';
import { Point } from '../entities/Point';
import { PointBalanceService } from './PointBalanceService';
import { PointPolicyEngine } from './PointPolicyEngine';

export class PointTransactionService extends EventEmitter {
  private storage: StorageManager;
  private balanceService: PointBalanceService;
  private policyEngine: PointPolicyEngine;
  private readonly STORAGE_KEY = 'point_transactions';

  constructor(
    storage: StorageManager,
    balanceService: PointBalanceService,
    policyEngine: PointPolicyEngine
  ) {
    super();
    this.storage = storage;
    this.balanceService = balanceService;
    this.policyEngine = policyEngine;
  }

  /**
   * 포인트 적립
   */
  async earnPoints(request: PointEarnRequest): Promise<PointTransaction> {
    // 정책 검증
    const validation = await this.policyEngine.validateEarnRequest(request);
    if (!validation.isValid) {
      throw new Error(`Policy validation failed: ${validation.errors.join(', ')}`);
    }

    // 현재 잔액 조회
    const balance = await this.balanceService.getBalance(request.userId);

    // 포인트 거래 생성
    const transaction = new Point({
      userId: request.userId,
      type: PointTransactionType.EARN,
      amount: request.amount,
      balance: balance.totalPoints + request.amount,
      reason: request.reason,
      description: request.description,
      status: PointStatus.PENDING,
      orderId: request.orderId,
      expiresAt: request.expiresAt || this.calculateExpiryDate(),
      metadata: request.metadata
    });

    // 저장
    await this.saveTransaction(transaction);

    // 잔액 업데이트
    await this.balanceService.updateBalance(request.userId, {
      type: 'earn',
      amount: request.amount,
      isPending: true
    });

    // 이벤트 발생
    this.emit('points:earned', transaction.toJSON());

    return transaction.toJSON();
  }

  /**
   * 포인트 사용
   */
  async spendPoints(request: PointSpendRequest): Promise<PointTransaction> {
    // 정책 검증
    const validation = await this.policyEngine.validateSpendRequest(request);
    if (!validation.isValid) {
      throw new Error(`Policy validation failed: ${validation.errors.join(', ')}`);
    }

    // 잔액 확인
    const balance = await this.balanceService.getBalance(request.userId);
    if (balance.availablePoints < request.amount) {
      throw new Error('Insufficient points');
    }

    // 사용할 포인트 선택 (FIFO)
    const pointsToUse = await this.selectPointsToUse(request.userId, request.amount);

    // 포인트 사용 처리
    const usedTransactions: PointTransaction[] = [];
    let remainingAmount = request.amount;

    for (const point of pointsToUse) {
      const useAmount = Math.min(remainingAmount, point.amount);
      
      if (useAmount === point.amount) {
        // 전체 사용
        point.use();
      } else {
        // 부분 사용 - 분할
        const usedPoint = point.split(useAmount);
        usedPoint.use();
        await this.saveTransaction(point); // 남은 포인트 저장
        point = usedPoint;
      }

      // 사용 거래 생성
      const transaction = new Point({
        userId: request.userId,
        type: PointTransactionType.SPEND,
        amount: -useAmount,
        balance: balance.totalPoints - (request.amount - remainingAmount + useAmount),
        reason: request.reason,
        description: request.description,
        status: PointStatus.AVAILABLE,
        orderId: request.orderId,
        metadata: { ...request.metadata, sourceTransactionId: point.id }
      });

      await this.saveTransaction(transaction);
      usedTransactions.push(transaction.toJSON());

      remainingAmount -= useAmount;
      if (remainingAmount <= 0) break;
    }

    // 잔액 업데이트
    await this.balanceService.updateBalance(request.userId, {
      type: 'spend',
      amount: request.amount
    });

    // 이벤트 발생
    this.emit('points:spent', {
      userId: request.userId,
      amount: request.amount,
      transactions: usedTransactions
    });

    // 메인 거래 반환
    return usedTransactions[0];
  }

  /**
   * 포인트 활성화 (적립 확정)
   */
  async activatePoints(transactionId: string): Promise<void> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const point = new Point(transaction);
    point.activate();
    await this.saveTransaction(point);

    // 잔액 업데이트
    await this.balanceService.updateBalance(transaction.userId, {
      type: 'activate',
      amount: transaction.amount
    });

    this.emit('points:activated', transaction);
  }

  /**
   * 포인트 취소
   */
  async cancelPoints(transactionId: string, reason: string): Promise<void> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const point = new Point(transaction);
    point.cancel();
    await this.saveTransaction(point);

    // 취소 거래 생성
    const cancelTransaction = new Point({
      userId: transaction.userId,
      type: PointTransactionType.CANCEL,
      amount: -transaction.amount,
      balance: 0, // 잔액은 별도 계산
      reason: 'CANCEL',
      description: reason,
      status: PointStatus.AVAILABLE,
      relatedTransactionId: transactionId,
      metadata: { originalTransaction: transaction }
    });

    await this.saveTransaction(cancelTransaction);

    // 잔액 업데이트
    const wasPending = transaction.status === PointStatus.PENDING;
    await this.balanceService.updateBalance(transaction.userId, {
      type: 'cancel',
      amount: Math.abs(transaction.amount),
      wasPending
    });

    this.emit('points:cancelled', { original: transaction, cancel: cancelTransaction.toJSON() });
  }

  /**
   * 포인트 환불
   */
  async refundPoints(orderId: string, amount: number, reason: string): Promise<PointTransaction> {
    // 주문 관련 사용 거래 조회
    const spentTransactions = await this.findTransactionsByOrder(orderId, PointTransactionType.SPEND);
    
    const totalSpent = spentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    if (amount > totalSpent) {
      throw new Error('Refund amount exceeds spent amount');
    }

    // 환불 거래 생성
    const balance = await this.balanceService.getBalance(spentTransactions[0].userId);
    const refundTransaction = new Point({
      userId: spentTransactions[0].userId,
      type: PointTransactionType.REFUND,
      amount: amount,
      balance: balance.totalPoints + amount,
      reason: 'REFUND',
      description: reason,
      status: PointStatus.AVAILABLE,
      orderId: orderId,
      metadata: { 
        originalTransactions: spentTransactions.map(t => t.id),
        refundReason: reason 
      }
    });

    await this.saveTransaction(refundTransaction);

    // 잔액 업데이트
    await this.balanceService.updateBalance(refundTransaction.userId, {
      type: 'refund',
      amount: amount
    });

    this.emit('points:refunded', refundTransaction.toJSON());

    return refundTransaction.toJSON();
  }

  /**
   * 포인트 히스토리 조회
   */
  async getHistory(filter: PointHistoryFilter): Promise<{
    transactions: PointTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const allTransactions = await this.getAllTransactions();
    
    // 필터링
    let filtered = allTransactions.filter(t => t.userId === filter.userId);

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

    if (filter.orderId) {
      filtered = filtered.filter(t => t.orderId === filter.orderId);
    }

    // 정렬
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      const aValue = a[sortBy] as any;
      const bValue = b[sortBy] as any;
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // 페이징
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      transactions: paged,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit)
    };
  }

  /**
   * Private methods
   */
  private async saveTransaction(point: Point): Promise<void> {
    const transactions = await this.getAllTransactions();
    const index = transactions.findIndex(t => t.id === point.id);
    
    if (index >= 0) {
      transactions[index] = point.toJSON();
    } else {
      transactions.push(point.toJSON());
    }
    
    await this.storage.set(this.STORAGE_KEY, transactions);
  }

  private async getTransaction(id: string): Promise<PointTransaction | null> {
    const transactions = await this.getAllTransactions();
    return transactions.find(t => t.id === id) || null;
  }

  private async getAllTransactions(): Promise<PointTransaction[]> {
    return await this.storage.get<PointTransaction[]>(this.STORAGE_KEY) || [];
  }

  private async findTransactionsByOrder(orderId: string, type?: PointTransactionType): Promise<PointTransaction[]> {
    const transactions = await this.getAllTransactions();
    return transactions.filter(t => 
      t.orderId === orderId && 
      (!type || t.type === type)
    );
  }

  private async selectPointsToUse(userId: string, amount: number): Promise<Point[]> {
    const transactions = await this.getAllTransactions();
    
    // FIFO 방식으로 사용 가능한 포인트 선택
    const availablePoints = transactions
      .filter(t => 
        t.userId === userId && 
        t.type === PointTransactionType.EARN &&
        t.status === PointStatus.AVAILABLE &&
        t.amount > 0
      )
      .sort((a, b) => new Date(a.earnedAt || a.createdAt).getTime() - new Date(b.earnedAt || b.createdAt).getTime())
      .map(t => new Point(t));

    const selectedPoints: Point[] = [];
    let remaining = amount;

    for (const point of availablePoints) {
      if (remaining <= 0) break;
      
      selectedPoints.push(point);
      remaining -= point.amount;
    }

    if (remaining > 0) {
      throw new Error('Insufficient available points');
    }

    return selectedPoints;
  }

  private calculateExpiryDate(): Date {
    const policy = this.policyEngine.getActivePolicy();
    const expiryMonths = policy?.expiryRules.defaultExpiryMonths || 12;
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    
    // 한국 포인트 정책: 보통 연도 말일로 설정
    expiryDate.setMonth(11); // 12월
    expiryDate.setDate(31);
    expiryDate.setHours(23, 59, 59, 999);
    
    return expiryDate;
  }
}