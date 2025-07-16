import { Decimal } from 'decimal.js';
import { PointBalance as IPointBalance } from '../types';

export class PointBalance {
  private _userId: string;
  private _totalPoints: Decimal;
  private _availablePoints: Decimal;
  private _pendingPoints: Decimal;
  private _expiringPoints: Decimal;
  private _totalEarned: Decimal;
  private _totalSpent: Decimal;
  private _totalExpired: Decimal;
  private _lastTransactionAt: Date;
  private _lastCalculatedAt: Date;

  constructor(data: Partial<IPointBalance>) {
    this._userId = data.userId || '';
    this._totalPoints = new Decimal(data.totalPoints || 0);
    this._availablePoints = new Decimal(data.availablePoints || 0);
    this._pendingPoints = new Decimal(data.pendingPoints || 0);
    this._expiringPoints = new Decimal(data.expiringPoints || 0);
    this._totalEarned = new Decimal(data.totalEarned || 0);
    this._totalSpent = new Decimal(data.totalSpent || 0);
    this._totalExpired = new Decimal(data.totalExpired || 0);
    this._lastTransactionAt = data.lastTransactionAt || new Date();
    this._lastCalculatedAt = data.lastCalculatedAt || new Date();
  }

  // Getters
  get userId(): string { return this._userId; }
  get totalPoints(): number { return this._totalPoints.toNumber(); }
  get availablePoints(): number { return this._availablePoints.toNumber(); }
  get pendingPoints(): number { return this._pendingPoints.toNumber(); }
  get expiringPoints(): number { return this._expiringPoints.toNumber(); }
  get totalEarned(): number { return this._totalEarned.toNumber(); }
  get totalSpent(): number { return this._totalSpent.toNumber(); }
  get totalExpired(): number { return this._totalExpired.toNumber(); }
  get lastTransactionAt(): Date { return this._lastTransactionAt; }
  get lastCalculatedAt(): Date { return this._lastCalculatedAt; }

  // 포인트 적립
  earn(amount: number, isPending: boolean = false): void {
    const earnAmount = new Decimal(amount);
    
    if (earnAmount.lessThanOrEqualTo(0)) {
      throw new Error('Earn amount must be positive');
    }

    this._totalEarned = this._totalEarned.plus(earnAmount);
    
    if (isPending) {
      this._pendingPoints = this._pendingPoints.plus(earnAmount);
    } else {
      this._availablePoints = this._availablePoints.plus(earnAmount);
      this._totalPoints = this._totalPoints.plus(earnAmount);
    }
    
    this.updateTransactionTime();
  }

  // 포인트 사용
  spend(amount: number): void {
    const spendAmount = new Decimal(amount);
    
    if (spendAmount.lessThanOrEqualTo(0)) {
      throw new Error('Spend amount must be positive');
    }
    
    if (spendAmount.greaterThan(this._availablePoints)) {
      throw new Error('Insufficient available points');
    }

    this._availablePoints = this._availablePoints.minus(spendAmount);
    this._totalPoints = this._totalPoints.minus(spendAmount);
    this._totalSpent = this._totalSpent.plus(spendAmount);
    
    this.updateTransactionTime();
  }

  // 포인트 만료
  expire(amount: number): void {
    const expireAmount = new Decimal(amount);
    
    if (expireAmount.lessThanOrEqualTo(0)) {
      throw new Error('Expire amount must be positive');
    }
    
    if (expireAmount.greaterThan(this._availablePoints)) {
      throw new Error('Expire amount exceeds available points');
    }

    this._availablePoints = this._availablePoints.minus(expireAmount);
    this._totalPoints = this._totalPoints.minus(expireAmount);
    this._totalExpired = this._totalExpired.plus(expireAmount);
    
    // 만료 예정 포인트에서도 차감
    if (this._expiringPoints.greaterThan(0)) {
      const deductFromExpiring = Decimal.min(expireAmount, this._expiringPoints);
      this._expiringPoints = this._expiringPoints.minus(deductFromExpiring);
    }
    
    this.updateTransactionTime();
  }

  // 대기 포인트 활성화
  activatePending(amount: number): void {
    const activateAmount = new Decimal(amount);
    
    if (activateAmount.lessThanOrEqualTo(0)) {
      throw new Error('Activate amount must be positive');
    }
    
    if (activateAmount.greaterThan(this._pendingPoints)) {
      throw new Error('Activate amount exceeds pending points');
    }

    this._pendingPoints = this._pendingPoints.minus(activateAmount);
    this._availablePoints = this._availablePoints.plus(activateAmount);
    this._totalPoints = this._totalPoints.plus(activateAmount);
    
    this.updateTransactionTime();
  }

  // 만료 예정 포인트 업데이트
  updateExpiringPoints(amount: number): void {
    const expiringAmount = new Decimal(amount);
    
    if (expiringAmount.lessThan(0)) {
      throw new Error('Expiring amount cannot be negative');
    }
    
    this._expiringPoints = expiringAmount;
    this._lastCalculatedAt = new Date();
  }

  // 포인트 취소 (적립 취소)
  cancelEarn(amount: number, wasPending: boolean = false): void {
    const cancelAmount = new Decimal(amount);
    
    if (cancelAmount.lessThanOrEqualTo(0)) {
      throw new Error('Cancel amount must be positive');
    }

    this._totalEarned = this._totalEarned.minus(cancelAmount);
    
    if (wasPending) {
      this._pendingPoints = this._pendingPoints.minus(cancelAmount);
    } else {
      if (cancelAmount.greaterThan(this._availablePoints)) {
        throw new Error('Cancel amount exceeds available points');
      }
      this._availablePoints = this._availablePoints.minus(cancelAmount);
      this._totalPoints = this._totalPoints.minus(cancelAmount);
    }
    
    this.updateTransactionTime();
  }

  // 포인트 환불 (사용 취소)
  refund(amount: number): void {
    const refundAmount = new Decimal(amount);
    
    if (refundAmount.lessThanOrEqualTo(0)) {
      throw new Error('Refund amount must be positive');
    }

    this._availablePoints = this._availablePoints.plus(refundAmount);
    this._totalPoints = this._totalPoints.plus(refundAmount);
    this._totalSpent = this._totalSpent.minus(refundAmount);
    
    this.updateTransactionTime();
  }

  // 잔액 재계산 (전체 거래 내역 기반)
  recalculate(calculations: {
    totalPoints: number;
    availablePoints: number;
    pendingPoints: number;
    expiringPoints: number;
    totalEarned: number;
    totalSpent: number;
    totalExpired: number;
  }): void {
    this._totalPoints = new Decimal(calculations.totalPoints);
    this._availablePoints = new Decimal(calculations.availablePoints);
    this._pendingPoints = new Decimal(calculations.pendingPoints);
    this._expiringPoints = new Decimal(calculations.expiringPoints);
    this._totalEarned = new Decimal(calculations.totalEarned);
    this._totalSpent = new Decimal(calculations.totalSpent);
    this._totalExpired = new Decimal(calculations.totalExpired);
    this._lastCalculatedAt = new Date();
  }

  // 사용 가능 여부 확인
  canSpend(amount: number): boolean {
    return new Decimal(amount).lessThanOrEqualTo(this._availablePoints);
  }

  // 포인트 부족분 계산
  getShortfall(amount: number): number {
    const required = new Decimal(amount);
    if (required.lessThanOrEqualTo(this._availablePoints)) {
      return 0;
    }
    return required.minus(this._availablePoints).toNumber();
  }

  // 직렬화
  toJSON(): IPointBalance {
    return {
      userId: this._userId,
      totalPoints: this.totalPoints,
      availablePoints: this.availablePoints,
      pendingPoints: this.pendingPoints,
      expiringPoints: this.expiringPoints,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
      totalExpired: this.totalExpired,
      lastTransactionAt: this._lastTransactionAt,
      lastCalculatedAt: this._lastCalculatedAt
    };
  }

  // Private methods
  private updateTransactionTime(): void {
    this._lastTransactionAt = new Date();
    this._lastCalculatedAt = new Date();
  }
}