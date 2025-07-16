import { EventEmitter } from '@modules/core';
import { StorageManager } from '@modules/storage';
import {
  PointPolicy,
  PointEarnRequest,
  PointSpendRequest,
  PolicyValidationResult,
  PointEarnReason
} from '../types';

export class PointPolicyEngine extends EventEmitter {
  private storage: StorageManager;
  private readonly STORAGE_KEY = 'point_policies';
  private activePolicy: PointPolicy | null = null;

  constructor(storage: StorageManager) {
    super();
    this.storage = storage;
    this.loadActivePolicy();
  }

  /**
   * 활성 정책 조회
   */
  getActivePolicy(): PointPolicy | null {
    return this.activePolicy;
  }

  /**
   * 정책 생성
   */
  async createPolicy(policy: Omit<PointPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<PointPolicy> {
    const newPolicy: PointPolicy = {
      ...policy,
      id: this.generatePolicyId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const policies = await this.getAllPolicies();
    
    // 활성화할 경우 기존 활성 정책 비활성화
    if (newPolicy.isActive) {
      policies.forEach(p => p.isActive = false);
    }

    policies.push(newPolicy);
    await this.storage.set(this.STORAGE_KEY, policies);

    if (newPolicy.isActive) {
      this.activePolicy = newPolicy;
      this.emit('policy:activated', newPolicy);
    }

    return newPolicy;
  }

  /**
   * 정책 업데이트
   */
  async updatePolicy(id: string, updates: Partial<PointPolicy>): Promise<PointPolicy> {
    const policies = await this.getAllPolicies();
    const index = policies.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('Policy not found');
    }

    const updatedPolicy = {
      ...policies[index],
      ...updates,
      id: policies[index].id,
      createdAt: policies[index].createdAt,
      updatedAt: new Date()
    };

    // 활성화 상태 변경 시 처리
    if (updates.isActive === true) {
      policies.forEach((p, i) => {
        if (i !== index) p.isActive = false;
      });
      this.activePolicy = updatedPolicy;
      this.emit('policy:activated', updatedPolicy);
    } else if (updates.isActive === false && this.activePolicy?.id === id) {
      this.activePolicy = null;
      this.emit('policy:deactivated', updatedPolicy);
    }

    policies[index] = updatedPolicy;
    await this.storage.set(this.STORAGE_KEY, policies);

    return updatedPolicy;
  }

  /**
   * 적립 요청 검증
   */
  async validateEarnRequest(request: PointEarnRequest): Promise<PolicyValidationResult> {
    const result: PolicyValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      appliedRules: []
    };

    if (!this.activePolicy) {
      result.isValid = false;
      result.errors.push('No active policy found');
      return result;
    }

    const { earnRules } = this.activePolicy;

    // 최소 구매 금액 검증
    if (earnRules.minPurchaseAmount && request.reason === PointEarnReason.PURCHASE) {
      if (!request.metadata?.purchaseAmount || 
          request.metadata.purchaseAmount < earnRules.minPurchaseAmount) {
        result.isValid = false;
        result.errors.push(`Minimum purchase amount is ${earnRules.minPurchaseAmount}`);
      }
    }

    // 제외 카테고리 검증
    if (earnRules.excludedCategories?.length && request.metadata?.category) {
      if (earnRules.excludedCategories.includes(request.metadata.category)) {
        result.isValid = false;
        result.errors.push(`Category ${request.metadata.category} is excluded from earning points`);
      }
    }

    // 적립률 계산 및 검증
    if (request.reason === PointEarnReason.PURCHASE && request.metadata?.purchaseAmount) {
      const earnRate = this.calculateEarnRate(request);
      const expectedPoints = Math.floor(request.metadata.purchaseAmount * earnRate / 100);
      
      if (request.amount !== expectedPoints) {
        result.warnings.push(`Expected points: ${expectedPoints}, requested: ${request.amount}`);
      }

      result.appliedRules.push(`Earn rate: ${earnRate}%`);
    }

    // 더블 포인트 데이 확인
    const today = new Date().getDay();
    if (earnRules.doublePointDays?.includes(today)) {
      result.appliedRules.push('Double points day applied');
    }

    // 등급별 혜택 확인
    if (this.activePolicy.gradeBonus && request.metadata?.userGrade) {
      const gradeBonus = this.activePolicy.gradeBonus[request.metadata.userGrade];
      if (gradeBonus) {
        result.appliedRules.push(`Grade ${request.metadata.userGrade} multiplier: ${gradeBonus.earnRateMultiplier}x`);
      }
    }

    return result;
  }

  /**
   * 사용 요청 검증
   */
  async validateSpendRequest(request: PointSpendRequest): Promise<PolicyValidationResult> {
    const result: PolicyValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      appliedRules: []
    };

    if (!this.activePolicy) {
      result.isValid = false;
      result.errors.push('No active policy found');
      return result;
    }

    const { useRules } = this.activePolicy;

    // 최소 사용 포인트 검증
    if (request.amount < useRules.minPoints) {
      result.isValid = false;
      result.errors.push(`Minimum points to use is ${useRules.minPoints}`);
    }

    // 사용 단위 검증
    if (request.amount % useRules.unitOfUse !== 0) {
      result.isValid = false;
      result.errors.push(`Points must be used in units of ${useRules.unitOfUse}`);
    }

    // 주문당 최대 사용 포인트 검증
    if (useRules.maxPointsPerOrder && request.amount > useRules.maxPointsPerOrder) {
      result.isValid = false;
      result.errors.push(`Maximum points per order is ${useRules.maxPointsPerOrder}`);
    }

    // 최대 사용률 검증
    if (useRules.maxUsageRate && request.metadata?.orderAmount) {
      const maxAllowed = Math.floor(request.metadata.orderAmount * useRules.maxUsageRate / 100);
      if (request.amount > maxAllowed) {
        result.isValid = false;
        result.errors.push(`Maximum ${useRules.maxUsageRate}% of order amount can be paid with points (${maxAllowed} points)`);
      }
      result.appliedRules.push(`Max usage rate: ${useRules.maxUsageRate}%`);
    }

    // 제외 상품 검증
    if (useRules.excludedProducts?.length && request.metadata?.productIds) {
      const excludedFound = request.metadata.productIds.some((id: string) => 
        useRules.excludedProducts!.includes(id)
      );
      if (excludedFound) {
        result.isValid = false;
        result.errors.push('Order contains products excluded from point payment');
      }
    }

    return result;
  }

  /**
   * 적립률 계산
   */
  calculateEarnRate(request: PointEarnRequest): number {
    if (!this.activePolicy) return 0;

    const { earnRules, gradeBonus } = this.activePolicy;
    let rate = earnRules.baseRate;

    // 더블 포인트 데이
    const today = new Date().getDay();
    if (earnRules.doublePointDays?.includes(today)) {
      rate *= 2;
    }

    // 등급별 배수
    if (gradeBonus && request.metadata?.userGrade) {
      const bonus = gradeBonus[request.metadata.userGrade];
      if (bonus) {
        rate *= bonus.earnRateMultiplier;
      }
    }

    // 최대 적립률 제한
    return Math.min(rate, earnRules.maxRate);
  }

  /**
   * 만료 기간 계산
   */
  calculateExpiryDate(earnDate: Date = new Date()): Date {
    if (!this.activePolicy) {
      // 기본값: 1년
      const expiry = new Date(earnDate);
      expiry.setFullYear(expiry.getFullYear() + 1);
      return expiry;
    }

    const { defaultExpiryMonths } = this.activePolicy.expiryRules;
    const expiry = new Date(earnDate);
    expiry.setMonth(expiry.getMonth() + defaultExpiryMonths);

    // 한국식: 연말 만료로 조정
    if (this.activePolicy.metadata?.koreanStyle) {
      expiry.setMonth(11); // 12월
      expiry.setDate(31);
      expiry.setHours(23, 59, 59, 999);
    }

    return expiry;
  }

  /**
   * 등급별 혜택 조회
   */
  getGradeBenefits(grade: string): {
    earnRateMultiplier: number;
    birthdayPoints?: number;
    monthlyBonus?: number;
  } | null {
    if (!this.activePolicy?.gradeBonus) return null;
    return this.activePolicy.gradeBonus[grade] || null;
  }

  /**
   * 정책 목록 조회
   */
  async getAllPolicies(): Promise<PointPolicy[]> {
    return await this.storage.get<PointPolicy[]>(this.STORAGE_KEY) || [];
  }

  /**
   * 정책 삭제
   */
  async deletePolicy(id: string): Promise<void> {
    const policies = await this.getAllPolicies();
    const filtered = policies.filter(p => p.id !== id);
    
    if (this.activePolicy?.id === id) {
      this.activePolicy = null;
      this.emit('policy:deactivated', { id });
    }
    
    await this.storage.set(this.STORAGE_KEY, filtered);
  }

  /**
   * 기본 정책 생성
   */
  async createDefaultPolicy(): Promise<PointPolicy> {
    return this.createPolicy({
      name: '기본 포인트 정책',
      description: '한국 이커머스 표준 포인트 정책',
      earnRules: {
        baseRate: 1, // 1% 기본 적립
        maxRate: 5,  // 최대 5% 적립
        minPurchaseAmount: 1000, // 최소 1,000원 이상 구매
        excludedCategories: ['gift-card', 'shipping'],
        doublePointDays: [5, 6] // 금,토 더블 포인트
      },
      useRules: {
        minPoints: 1000,      // 최소 1,000 포인트부터 사용
        maxUsageRate: 70,     // 결제 금액의 최대 70%까지 사용
        unitOfUse: 10,        // 10포인트 단위로 사용
        excludedProducts: []
      },
      expiryRules: {
        defaultExpiryMonths: 12,        // 12개월 유효기간
        extendableExpiryMonths: 6,      // 6개월 연장 가능
        expiryNotificationDays: [30, 7, 1], // 30일, 7일, 1일 전 알림
        gracePeroidDays: 30            // 30일 유예기간
      },
      gradeBonus: {
        'VIP': {
          earnRateMultiplier: 2,    // 2배 적립
          birthdayPoints: 5000,     // 생일 5,000 포인트
          monthlyBonus: 1000        // 월 1,000 포인트
        },
        'GOLD': {
          earnRateMultiplier: 1.5,  // 1.5배 적립
          birthdayPoints: 3000,     // 생일 3,000 포인트
          monthlyBonus: 500         // 월 500 포인트
        },
        'SILVER': {
          earnRateMultiplier: 1.2,  // 1.2배 적립
          birthdayPoints: 1000      // 생일 1,000 포인트
        }
      },
      isActive: true,
      metadata: {
        koreanStyle: true // 한국식 만료일 (연말) 적용
      }
    });
  }

  /**
   * Private methods
   */
  private async loadActivePolicy(): Promise<void> {
    const policies = await this.getAllPolicies();
    this.activePolicy = policies.find(p => p.isActive) || null;
    
    // 활성 정책이 없으면 기본 정책 생성
    if (!this.activePolicy && policies.length === 0) {
      this.activePolicy = await this.createDefaultPolicy();
    }
  }

  private generatePolicyId(): string {
    return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}