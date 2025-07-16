import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PointTransactionService,
  PointBalanceService,
  PointPolicyEngine,
  PointExpiryService,
  PointHistoryService,
  PointEarnReason,
  PointSpendReason,
  PointTransactionType,
  PointStatus
} from '../src';
import { StorageManager } from '@modules/storage';

describe('Points Module', () => {
  let storage: StorageManager;
  let balanceService: PointBalanceService;
  let policyEngine: PointPolicyEngine;
  let transactionService: PointTransactionService;
  let expiryService: PointExpiryService;
  let historyService: PointHistoryService;

  beforeEach(() => {
    storage = new StorageManager();
    balanceService = new PointBalanceService(storage);
    policyEngine = new PointPolicyEngine(storage);
    transactionService = new PointTransactionService(storage, balanceService, policyEngine);
    expiryService = new PointExpiryService(storage);
    historyService = new PointHistoryService(storage);
  });

  describe('PointTransactionService', () => {
    it('should earn points successfully', async () => {
      const earnRequest = {
        userId: 'user123',
        amount: 1000,
        reason: PointEarnReason.PURCHASE,
        description: '상품 구매 적립',
        orderId: 'order123'
      };

      const transaction = await transactionService.earnPoints(earnRequest);

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(1000);
      expect(transaction.type).toBe(PointTransactionType.EARN);
      expect(transaction.status).toBe(PointStatus.PENDING);
    });

    it('should spend points successfully', async () => {
      // 먼저 포인트 적립
      await transactionService.earnPoints({
        userId: 'user123',
        amount: 5000,
        reason: PointEarnReason.PURCHASE,
        description: '초기 적립'
      });

      // 포인트 활성화
      const history = await historyService.getTransactionHistory({ userId: 'user123' });
      await transactionService.activatePoints(history.transactions[0].id);

      // 포인트 사용
      const spendRequest = {
        userId: 'user123',
        amount: 3000,
        reason: PointSpendReason.ORDER_PAYMENT,
        description: '주문 결제',
        orderId: 'order456'
      };

      const transaction = await transactionService.spendPoints(spendRequest);

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(-3000);
      expect(transaction.type).toBe(PointTransactionType.SPEND);
    });

    it('should handle insufficient points', async () => {
      const spendRequest = {
        userId: 'user123',
        amount: 10000,
        reason: PointSpendReason.ORDER_PAYMENT,
        description: '주문 결제'
      };

      await expect(transactionService.spendPoints(spendRequest))
        .rejects.toThrow('Insufficient points');
    });
  });

  describe('PointBalanceService', () => {
    it('should track balance correctly', async () => {
      const userId = 'user123';

      // 초기 잔액
      let balance = await balanceService.getBalance(userId);
      expect(balance.totalPoints).toBe(0);
      expect(balance.availablePoints).toBe(0);

      // 포인트 적립 (대기중)
      await balanceService.updateBalance(userId, {
        type: 'earn',
        amount: 1000,
        isPending: true
      });

      balance = await balanceService.getBalance(userId);
      expect(balance.pendingPoints).toBe(1000);
      expect(balance.availablePoints).toBe(0);

      // 포인트 활성화
      await balanceService.updateBalance(userId, {
        type: 'activate',
        amount: 1000
      });

      balance = await balanceService.getBalance(userId);
      expect(balance.pendingPoints).toBe(0);
      expect(balance.availablePoints).toBe(1000);
      expect(balance.totalPoints).toBe(1000);
    });

    it('should handle multiple transactions', async () => {
      const userId = 'user123';

      // 여러 거래 처리
      await balanceService.updateBalance(userId, { type: 'earn', amount: 5000 });
      await balanceService.updateBalance(userId, { type: 'spend', amount: 2000 });
      await balanceService.updateBalance(userId, { type: 'earn', amount: 1000 });
      await balanceService.updateBalance(userId, { type: 'expire', amount: 500 });

      const balance = await balanceService.getBalance(userId);
      expect(balance.totalPoints).toBe(3500); // 5000 - 2000 + 1000 - 500
      expect(balance.totalEarned).toBe(6000); // 5000 + 1000
      expect(balance.totalSpent).toBe(2000);
      expect(balance.totalExpired).toBe(500);
    });
  });

  describe('PointPolicyEngine', () => {
    it('should create default policy', async () => {
      const policy = await policyEngine.createDefaultPolicy();

      expect(policy).toBeDefined();
      expect(policy.earnRules.baseRate).toBe(1);
      expect(policy.useRules.minPoints).toBe(1000);
      expect(policy.expiryRules.defaultExpiryMonths).toBe(12);
      expect(policy.isActive).toBe(true);
    });

    it('should validate earn request', async () => {
      await policyEngine.createDefaultPolicy();

      const earnRequest = {
        userId: 'user123',
        amount: 100,
        reason: PointEarnReason.PURCHASE,
        description: '구매 적립',
        metadata: {
          purchaseAmount: 10000,
          category: 'electronics'
        }
      };

      const validation = await policyEngine.validateEarnRequest(earnRequest);
      expect(validation.isValid).toBe(true);
    });

    it('should calculate earn rate with grade bonus', async () => {
      await policyEngine.createDefaultPolicy();

      const earnRequest = {
        userId: 'user123',
        amount: 100,
        reason: PointEarnReason.PURCHASE,
        description: '구매 적립',
        metadata: {
          userGrade: 'VIP'
        }
      };

      const rate = policyEngine.calculateEarnRate(earnRequest);
      expect(rate).toBe(2); // 기본 1% × VIP 2배 = 2%
    });
  });

  describe('PointExpiryService', () => {
    it('should track expiring points', async () => {
      const userId = 'user123';
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15); // 15일 후

      // 만료 예정 포인트 생성
      await storage.set('point_transactions', [{
        id: 'tx1',
        userId,
        type: PointTransactionType.EARN,
        amount: 1000,
        status: PointStatus.AVAILABLE,
        expiresAt: expiryDate,
        createdAt: new Date()
      }]);

      const expiring = await expiryService.getExpiringPoints(userId, 30);
      
      expect(expiring.totalAmount).toBe(1000);
      expect(expiring.points.length).toBe(1);
      expect(expiring.points[0].points).toBe(1000);
    });

    it('should get expiry summary', async () => {
      const userId = 'user123';
      
      // 다양한 만료일의 포인트 생성
      const transactions = [
        {
          id: 'tx1',
          userId,
          type: PointTransactionType.EARN,
          amount: 1000,
          status: PointStatus.AVAILABLE,
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15일 후
          createdAt: new Date()
        },
        {
          id: 'tx2',
          userId,
          type: PointTransactionType.EARN,
          amount: 2000,
          status: PointStatus.AVAILABLE,
          expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45일 후
          createdAt: new Date()
        },
        {
          id: 'tx3',
          userId,
          type: PointTransactionType.EARN,
          amount: 3000,
          status: PointStatus.AVAILABLE,
          expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75일 후
          createdAt: new Date()
        }
      ];

      await storage.set('point_transactions', transactions);

      const summary = await expiryService.getExpirySummary(userId);
      
      expect(summary.next30Days).toBe(1000);
      expect(summary.next60Days).toBe(3000); // 1000 + 2000
      expect(summary.next90Days).toBe(6000); // 1000 + 2000 + 3000
    });
  });

  describe('PointHistoryService', () => {
    it('should get transaction history with filters', async () => {
      const userId = 'user123';
      
      // 여러 거래 생성
      const transactions = [
        {
          id: 'tx1',
          userId,
          type: PointTransactionType.EARN,
          amount: 1000,
          status: PointStatus.AVAILABLE,
          reason: PointEarnReason.PURCHASE,
          createdAt: new Date()
        },
        {
          id: 'tx2',
          userId,
          type: PointTransactionType.SPEND,
          amount: -500,
          status: PointStatus.AVAILABLE,
          reason: PointSpendReason.ORDER_PAYMENT,
          createdAt: new Date()
        }
      ];

      await storage.set('point_transactions', transactions);

      // 전체 조회
      const allHistory = await historyService.getTransactionHistory({ userId });
      expect(allHistory.transactions.length).toBe(2);
      expect(allHistory.summary.totalEarned).toBe(1000);
      expect(allHistory.summary.totalSpent).toBe(500);

      // 적립만 조회
      const earnHistory = await historyService.getTransactionHistory({
        userId,
        types: [PointTransactionType.EARN]
      });
      expect(earnHistory.transactions.length).toBe(1);
      expect(earnHistory.transactions[0].type).toBe(PointTransactionType.EARN);
    });

    it('should calculate statistics', async () => {
      const userId = 'user123';
      
      const transactions = Array.from({ length: 10 }, (_, i) => ({
        id: `tx${i}`,
        userId,
        type: i % 2 === 0 ? PointTransactionType.EARN : PointTransactionType.SPEND,
        amount: i % 2 === 0 ? 1000 : -500,
        status: PointStatus.AVAILABLE,
        reason: i % 2 === 0 ? PointEarnReason.PURCHASE : PointSpendReason.ORDER_PAYMENT,
        createdAt: new Date()
      }));

      await storage.set('point_transactions', transactions);

      const stats = await historyService.getStatistics(userId, 'monthly');
      
      expect(stats.earnStats.totalAmount).toBe(5000); // 5 × 1000
      expect(stats.earnStats.transactionCount).toBe(5);
      expect(stats.spendStats.totalAmount).toBe(2500); // 5 × 500
      expect(stats.spendStats.transactionCount).toBe(5);
    });
  });
});