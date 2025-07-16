import { Decimal } from 'decimal.js';
import { 
  PointTransaction, 
  PointTransactionType, 
  PointStatus,
  PointEarnReason,
  PointSpendReason 
} from '../types';

export class Point {
  private _id: string;
  private _userId: string;
  private _type: PointTransactionType;
  private _amount: Decimal;
  private _balance: Decimal;
  private _reason: PointEarnReason | PointSpendReason | string;
  private _description: string;
  private _status: PointStatus;
  private _earnedAt?: Date;
  private _expiresAt?: Date;
  private _orderId?: string;
  private _metadata: Record<string, any>;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(data: Partial<PointTransaction>) {
    this._id = data.id || this.generateId();
    this._userId = data.userId || '';
    this._type = data.type || PointTransactionType.EARN;
    this._amount = new Decimal(data.amount || 0);
    this._balance = new Decimal(data.balance || 0);
    this._reason = data.reason || '';
    this._description = data.description || '';
    this._status = data.status || PointStatus.PENDING;
    this._earnedAt = data.earnedAt;
    this._expiresAt = data.expiresAt;
    this._orderId = data.orderId;
    this._metadata = data.metadata || {};
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();
  }

  // Getters
  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get type(): PointTransactionType { return this._type; }
  get amount(): number { return this._amount.toNumber(); }
  get balance(): number { return this._balance.toNumber(); }
  get reason(): PointEarnReason | PointSpendReason | string { return this._reason; }
  get description(): string { return this._description; }
  get status(): PointStatus { return this._status; }
  get earnedAt(): Date | undefined { return this._earnedAt; }
  get expiresAt(): Date | undefined { return this._expiresAt; }
  get orderId(): string | undefined { return this._orderId; }
  get metadata(): Record<string, any> { return this._metadata; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // 포인트 활성화
  activate(): void {
    if (this._status !== PointStatus.PENDING) {
      throw new Error('Only pending points can be activated');
    }
    this._status = PointStatus.AVAILABLE;
    this._earnedAt = new Date();
    this.updateTimestamp();
  }

  // 포인트 사용
  use(): void {
    if (this._status !== PointStatus.AVAILABLE) {
      throw new Error('Only available points can be used');
    }
    this._status = PointStatus.USED;
    this.updateTimestamp();
  }

  // 포인트 만료
  expire(): void {
    if (this._status !== PointStatus.AVAILABLE) {
      throw new Error('Only available points can expire');
    }
    this._status = PointStatus.EXPIRED;
    this.updateTimestamp();
  }

  // 포인트 취소
  cancel(): void {
    if (this._status === PointStatus.CANCELLED) {
      throw new Error('Points are already cancelled');
    }
    this._status = PointStatus.CANCELLED;
    this.updateTimestamp();
  }

  // 포인트 잠금
  lock(): void {
    if (this._status !== PointStatus.AVAILABLE) {
      throw new Error('Only available points can be locked');
    }
    this._status = PointStatus.LOCKED;
    this.updateTimestamp();
  }

  // 포인트 잠금 해제
  unlock(): void {
    if (this._status !== PointStatus.LOCKED) {
      throw new Error('Only locked points can be unlocked');
    }
    this._status = PointStatus.AVAILABLE;
    this.updateTimestamp();
  }

  // 만료 여부 확인
  isExpired(): boolean {
    if (!this._expiresAt) return false;
    return new Date() > this._expiresAt;
  }

  // 만료 예정 여부 확인 (days 이내)
  isExpiringSoon(days: number = 30): boolean {
    if (!this._expiresAt) return false;
    const expiryDate = new Date(this._expiresAt);
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + days);
    return expiryDate <= checkDate && expiryDate > new Date();
  }

  // 사용 가능 여부 확인
  isAvailable(): boolean {
    return this._status === PointStatus.AVAILABLE && !this.isExpired();
  }

  // 메타데이터 추가
  addMetadata(key: string, value: any): void {
    this._metadata[key] = value;
    this.updateTimestamp();
  }

  // 설명 업데이트
  updateDescription(description: string): void {
    this._description = description;
    this.updateTimestamp();
  }

  // 만료일 연장
  extendExpiry(months: number): void {
    if (!this._expiresAt) {
      throw new Error('No expiry date to extend');
    }
    if (this._status !== PointStatus.AVAILABLE) {
      throw new Error('Only available points can have expiry extended');
    }
    
    const newExpiry = new Date(this._expiresAt);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    this._expiresAt = newExpiry;
    this.updateTimestamp();
  }

  // 포인트 분할 (부분 사용을 위해)
  split(amount: number): Point {
    const splitAmount = new Decimal(amount);
    
    if (splitAmount.greaterThan(this._amount)) {
      throw new Error('Split amount cannot exceed total amount');
    }
    
    // 원본 포인트 금액 감소
    this._amount = this._amount.minus(splitAmount);
    this.updateTimestamp();
    
    // 새로운 포인트 생성
    return new Point({
      userId: this._userId,
      type: this._type,
      amount: splitAmount.toNumber(),
      balance: 0, // 잔액은 서비스에서 계산
      reason: this._reason,
      description: `Split from ${this._id}`,
      status: this._status,
      earnedAt: this._earnedAt,
      expiresAt: this._expiresAt,
      orderId: this._orderId,
      metadata: { ...this._metadata, originalId: this._id }
    });
  }

  // 직렬화
  toJSON(): PointTransaction {
    return {
      id: this._id,
      userId: this._userId,
      type: this._type,
      amount: this.amount,
      balance: this.balance,
      reason: this._reason,
      description: this._description,
      status: this._status,
      earnedAt: this._earnedAt,
      expiresAt: this._expiresAt,
      orderId: this._orderId,
      metadata: this._metadata,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  // Private methods
  private generateId(): string {
    return `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }
}