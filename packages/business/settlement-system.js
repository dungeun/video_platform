/**
 * Revu Platform Settlement System Module
 * 정산 처리, 수수료 계산, 세금 처리, 스케줄링
 */

const EventEmitter = require('events');

// 정산 상태 정의
const SettlementStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
};

// 정산 주기 정의
const SettlementPeriod = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom'
};

// 세금 유형 정의
const TaxType = {
  VAT: 'vat',           // 부가세
  INCOME_TAX: 'income_tax', // 소득세
  BUSINESS_TAX: 'business_tax', // 사업소득세
  WITHHOLDING_TAX: 'withholding_tax' // 원천징수세
};

class SettlementSystemModule extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.settlements = new Map(); // settlementId -> settlement
    this.settlementSchedules = new Map(); // userId -> schedule
    this.pendingTransactions = new Map(); // transactionId -> transaction
    this.taxRules = new Map(); // ruleId -> taxRule
    this.feeStructure = config.feeStructure || this.getDefaultFeeStructure();
    this.eventBus = null;
    
    // 기본 세금 규칙 설정
    this.setupDefaultTaxRules();
    
    // 정산 스케줄러 시작
    this.startSettlementScheduler();
  }

  // 의존성 주입
  connectEventBus(eventBus) {
    this.eventBus = eventBus;
    this.setupEventHandlers();
  }

  // 정산 생성
  async createSettlement(settlementData) {
    try {
      const {
        userId,
        userType, // 'business' | 'influencer'
        period,
        startDate,
        endDate,
        transactions = [],
        metadata = {}
      } = settlementData;

      // 거래 데이터 수집
      const settlementTransactions = transactions.length > 0 
        ? transactions 
        : await this.collectTransactionsForPeriod(userId, startDate, endDate);

      if (settlementTransactions.length === 0) {
        throw new Error('No transactions found for settlement period');
      }

      // 총액 계산
      const grossAmount = settlementTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // 수수료 계산
      const fees = await this.calculateSettlementFees(grossAmount, userType, settlementTransactions);

      // 세금 계산
      const taxes = await this.calculateTaxes(grossAmount, fees, userType, userId);

      // 최종 정산 금액 계산
      const netAmount = grossAmount - fees.total - taxes.total;

      const settlement = {
        id: this.generateSettlementId(),
        userId,
        userType,
        period: {
          type: period,
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        grossAmount,
        fees,
        taxes,
        netAmount,
        status: SettlementStatus.PENDING,
        transactions: settlementTransactions.map(tx => tx.id),
        bankAccount: null, // 사용자 계좌 정보
        paymentMethod: null,
        metadata: {
          ...metadata,
          createdAt: new Date(),
          lastUpdated: new Date(),
          currency: 'KRW'
        },
        processing: {
          initiatedAt: null,
          completedAt: null,
          failedAt: null,
          retryCount: 0,
          errorMessage: null
        },
        audit: {
          createdBy: 'system',
          approvedBy: null,
          reviewedBy: null,
          notes: []
        }
      };

      this.settlements.set(settlement.id, settlement);

      // 이벤트 발행
      this.emit('settlement.created', { settlementId: settlement.id, userId, amount: netAmount });
      await this.publishEvent('settlement.created', {
        settlementId: settlement.id,
        userId,
        userType,
        grossAmount,
        netAmount,
        period: settlement.period
      });

      console.log(`Settlement created: ${settlement.id} for user ${userId}`);
      return settlement;

    } catch (error) {
      console.error('Failed to create settlement:', error);
      throw error;
    }
  }

  // 정산 처리 실행
  async processSettlement(settlementId, processingData = {}) {
    try {
      const settlement = this.settlements.get(settlementId);
      if (!settlement) {
        throw new Error(`Settlement not found: ${settlementId}`);
      }

      if (settlement.status !== SettlementStatus.PENDING) {
        throw new Error(`Settlement ${settlementId} is not in pending status`);
      }

      // 처리 상태로 변경
      settlement.status = SettlementStatus.PROCESSING;
      settlement.processing.initiatedAt = new Date();
      settlement.metadata.lastUpdated = new Date();

      // 사용자 계좌 정보 확인
      const bankAccount = processingData.bankAccount || await this.getUserBankAccount(settlement.userId);
      if (!bankAccount) {
        throw new Error(`Bank account not found for user ${settlement.userId}`);
      }

      settlement.bankAccount = bankAccount;
      settlement.paymentMethod = processingData.paymentMethod || 'bank_transfer';

      // 실제 정산 처리 (외부 결제 시스템 연동)
      const paymentResult = await this.executePayment(settlement);

      if (paymentResult.success) {
        // 성공 처리
        settlement.status = SettlementStatus.COMPLETED;
        settlement.processing.completedAt = new Date();
        settlement.metadata.paymentId = paymentResult.paymentId;
        settlement.metadata.transactionId = paymentResult.transactionId;

        // 관련 거래들을 정산 완료로 마킹
        await this.markTransactionsAsSettled(settlement.transactions, settlementId);

        // 이벤트 발행
        this.emit('settlement.completed', { 
          settlementId, 
          userId: settlement.userId, 
          amount: settlement.netAmount 
        });
        await this.publishEvent('settlement.completed', {
          settlementId,
          userId: settlement.userId,
          userType: settlement.userType,
          amount: settlement.netAmount,
          paymentId: paymentResult.paymentId
        });

        console.log(`Settlement completed: ${settlementId} - ${settlement.netAmount} KRW`);

      } else {
        // 실패 처리
        settlement.status = SettlementStatus.FAILED;
        settlement.processing.failedAt = new Date();
        settlement.processing.errorMessage = paymentResult.error || 'Payment failed';
        settlement.processing.retryCount++;

        // 재시도 로직
        if (settlement.processing.retryCount < 3) {
          setTimeout(() => {
            this.retrySettlement(settlementId);
          }, 60000 * settlement.processing.retryCount); // 점진적 지연
        }

        // 실패 이벤트 발행
        this.emit('settlement.failed', { 
          settlementId, 
          userId: settlement.userId, 
          error: paymentResult.error 
        });
        await this.publishEvent('settlement.failed', {
          settlementId,
          userId: settlement.userId,
          error: paymentResult.error,
          retryCount: settlement.processing.retryCount
        });

        console.error(`Settlement failed: ${settlementId} - ${paymentResult.error}`);
      }

      await this.saveSettlement(settlement);
      return settlement;

    } catch (error) {
      console.error(`Failed to process settlement ${settlementId}:`, error);
      
      // 오류 상태로 업데이트
      const settlement = this.settlements.get(settlementId);
      if (settlement) {
        settlement.status = SettlementStatus.FAILED;
        settlement.processing.failedAt = new Date();
        settlement.processing.errorMessage = error.message;
        await this.saveSettlement(settlement);
      }

      throw error;
    }
  }

  // 수수료 계산
  async calculateSettlementFees(grossAmount, userType, transactions) {
    try {
      const fees = {
        platformFee: 0,
        processingFee: 0,
        withdrawalFee: 0,
        internationalFee: 0,
        total: 0,
        breakdown: []
      };

      // 플랫폼 수수료 (이미 차감되었을 수 있음)
      const platformFeeRate = this.feeStructure.platformFeeRate || 0.15;
      fees.platformFee = grossAmount * platformFeeRate;
      fees.breakdown.push({
        type: 'platform_fee',
        rate: platformFeeRate,
        amount: fees.platformFee,
        description: '플랫폼 이용 수수료'
      });

      // 결제 처리 수수료
      const processingFeeRate = this.feeStructure.processingFeeRate || 0.029;
      fees.processingFee = grossAmount * processingFeeRate;
      fees.breakdown.push({
        type: 'processing_fee',
        rate: processingFeeRate,
        amount: fees.processingFee,
        description: '결제 처리 수수료'
      });

      // 출금 수수료
      const withdrawalFee = this.feeStructure.withdrawalFee || 1000; // 고정 수수료
      fees.withdrawalFee = withdrawalFee;
      fees.breakdown.push({
        type: 'withdrawal_fee',
        amount: withdrawalFee,
        description: '출금 수수료'
      });

      // 해외 송금 수수료 (필요시)
      const hasInternationalTransactions = transactions.some(tx => tx.currency !== 'KRW');
      if (hasInternationalTransactions) {
        const internationalFeeRate = this.feeStructure.internationalFeeRate || 0.01;
        fees.internationalFee = grossAmount * internationalFeeRate;
        fees.breakdown.push({
          type: 'international_fee',
          rate: internationalFeeRate,
          amount: fees.internationalFee,
          description: '해외 거래 수수료'
        });
      }

      fees.total = fees.platformFee + fees.processingFee + fees.withdrawalFee + fees.internationalFee;

      return fees;

    } catch (error) {
      console.error('Failed to calculate settlement fees:', error);
      throw error;
    }
  }

  // 세금 계산
  async calculateTaxes(grossAmount, fees, userType, userId) {
    try {
      const taxes = {
        vat: 0,
        incomeTax: 0,
        businessTax: 0,
        withholdingTax: 0,
        total: 0,
        breakdown: []
      };

      // 사용자 세금 정보 조회
      const taxInfo = await this.getUserTaxInfo(userId);
      const taxableAmount = grossAmount - fees.total;

      // 부가세 계산 (사업자만)
      if (userType === 'business' && taxInfo.vatRegistered) {
        const vatRate = 0.1; // 10%
        taxes.vat = taxableAmount * vatRate;
        taxes.breakdown.push({
          type: TaxType.VAT,
          rate: vatRate,
          amount: taxes.vat,
          description: '부가가치세'
        });
      }

      // 소득세/사업소득세 계산
      if (userType === 'influencer') {
        // 개인 소득세 (원천징수)
        const incomeTaxRate = this.calculateIncomeTaxRate(taxableAmount, taxInfo);
        taxes.incomeTax = taxableAmount * incomeTaxRate;
        taxes.breakdown.push({
          type: TaxType.INCOME_TAX,
          rate: incomeTaxRate,
          amount: taxes.incomeTax,
          description: '소득세 (원천징수)'
        });

      } else if (userType === 'business') {
        // 사업소득세
        const businessTaxRate = this.calculateBusinessTaxRate(taxableAmount, taxInfo);
        taxes.businessTax = taxableAmount * businessTaxRate;
        taxes.breakdown.push({
          type: TaxType.BUSINESS_TAX,
          rate: businessTaxRate,
          amount: taxes.businessTax,
          description: '사업소득세'
        });
      }

      taxes.total = taxes.vat + taxes.incomeTax + taxes.businessTax + taxes.withholdingTax;

      return taxes;

    } catch (error) {
      console.error('Failed to calculate taxes:', error);
      throw error;
    }
  }

  // 소득세율 계산
  calculateIncomeTaxRate(taxableAmount, taxInfo) {
    // 2024년 기준 개인소득세율 (간이 계산)
    if (taxableAmount <= 12000000) return 0.06; // 6%
    if (taxableAmount <= 46000000) return 0.15; // 15%
    if (taxableAmount <= 88000000) return 0.24; // 24%
    if (taxableAmount <= 150000000) return 0.35; // 35%
    return 0.38; // 38%
  }

  // 사업소득세율 계산
  calculateBusinessTaxRate(taxableAmount, taxInfo) {
    // 사업소득세율 (간이 계산)
    if (taxInfo.corporateType === 'corporation') {
      if (taxableAmount <= 200000000) return 0.10; // 10%
      if (taxableAmount <= 20000000000) return 0.20; // 20%
      return 0.22; // 22%
    } else {
      // 개인사업자
      return this.calculateIncomeTaxRate(taxableAmount, taxInfo);
    }
  }

  // 정산 스케줄 설정
  async setupSettlementSchedule(userId, scheduleData) {
    try {
      const {
        period = SettlementPeriod.MONTHLY,
        dayOfWeek = 1, // 월요일 (주간 정산용)
        dayOfMonth = 1, // 매월 1일 (월간 정산용)
        autoProcess = true,
        minimumAmount = 10000,
        metadata = {}
      } = scheduleData;

      const schedule = {
        id: this.generateScheduleId(),
        userId,
        period,
        dayOfWeek,
        dayOfMonth,
        autoProcess,
        minimumAmount,
        enabled: true,
        lastProcessed: null,
        nextScheduled: this.calculateNextScheduleDate(period, dayOfWeek, dayOfMonth),
        metadata: {
          ...metadata,
          createdAt: new Date(),
          lastUpdated: new Date()
        }
      };

      this.settlementSchedules.set(userId, schedule);

      // 이벤트 발행
      await this.publishEvent('settlement.schedule.created', {
        userId,
        schedule: schedule
      });

      console.log(`Settlement schedule created for user ${userId}`);
      return schedule;

    } catch (error) {
      console.error('Failed to setup settlement schedule:', error);
      throw error;
    }
  }

  // 다음 스케줄 날짜 계산
  calculateNextScheduleDate(period, dayOfWeek, dayOfMonth) {
    const now = new Date();
    let nextDate = new Date(now);

    switch (period) {
      case SettlementPeriod.DAILY:
        nextDate.setDate(now.getDate() + 1);
        break;

      case SettlementPeriod.WEEKLY:
        const daysUntilNext = (dayOfWeek - now.getDay() + 7) % 7;
        nextDate.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        break;

      case SettlementPeriod.MONTHLY:
        nextDate.setMonth(now.getMonth() + 1);
        nextDate.setDate(dayOfMonth);
        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
    }

    nextDate.setHours(9, 0, 0, 0); // 오전 9시에 실행
    return nextDate;
  }

  // 정산 스케줄러 시작
  startSettlementScheduler() {
    // 매시간 스케줄 확인
    setInterval(() => {
      this.executeScheduledSettlements();
    }, 60 * 60 * 1000); // 1시간마다 실행
  }

  // 스케줄된 정산 실행
  async executeScheduledSettlements() {
    try {
      const now = new Date();

      for (const [userId, schedule] of this.settlementSchedules) {
        if (!schedule.enabled) continue;

        // 스케줄 시간 확인
        if (schedule.nextScheduled <= now) {
          await this.executeScheduledSettlement(userId, schedule);
        }
      }

    } catch (error) {
      console.error('Error in settlement scheduler:', error);
    }
  }

  // 개별 스케줄 정산 실행
  async executeScheduledSettlement(userId, schedule) {
    try {
      console.log(`Executing scheduled settlement for user ${userId}`);

      // 정산 기간 계산
      const endDate = new Date();
      const startDate = this.calculatePeriodStartDate(schedule.period, endDate, schedule);

      // 해당 기간의 거래 조회
      const transactions = await this.collectTransactionsForPeriod(userId, startDate, endDate);
      
      if (transactions.length === 0) {
        console.log(`No transactions found for user ${userId} in period ${startDate} - ${endDate}`);
        this.updateNextScheduleDate(schedule);
        return;
      }

      // 최소 금액 확인
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      if (totalAmount < schedule.minimumAmount) {
        console.log(`Total amount ${totalAmount} below minimum ${schedule.minimumAmount} for user ${userId}`);
        this.updateNextScheduleDate(schedule);
        return;
      }

      // 사용자 타입 조회
      const userType = await this.getUserType(userId);

      // 정산 생성
      const settlement = await this.createSettlement({
        userId,
        userType,
        period: schedule.period,
        startDate,
        endDate,
        transactions,
        metadata: {
          scheduled: true,
          scheduleId: schedule.id
        }
      });

      // 자동 처리 옵션 확인
      if (schedule.autoProcess) {
        await this.processSettlement(settlement.id);
      }

      // 스케줄 업데이트
      schedule.lastProcessed = new Date();
      this.updateNextScheduleDate(schedule);

      console.log(`Scheduled settlement completed for user ${userId}: ${settlement.id}`);

    } catch (error) {
      console.error(`Failed to execute scheduled settlement for user ${userId}:`, error);
      
      // 오류 발생 시 다음 스케줄로 이동
      this.updateNextScheduleDate(schedule);
    }
  }

  // 다음 스케줄 날짜 업데이트
  updateNextScheduleDate(schedule) {
    schedule.nextScheduled = this.calculateNextScheduleDate(
      schedule.period,
      schedule.dayOfWeek,
      schedule.dayOfMonth
    );
    schedule.metadata.lastUpdated = new Date();
  }

  // 정산 기간 시작일 계산
  calculatePeriodStartDate(period, endDate, schedule) {
    const startDate = new Date(endDate);

    switch (period) {
      case SettlementPeriod.DAILY:
        startDate.setDate(endDate.getDate() - 1);
        break;

      case SettlementPeriod.WEEKLY:
        startDate.setDate(endDate.getDate() - 7);
        break;

      case SettlementPeriod.MONTHLY:
        startDate.setMonth(endDate.getMonth() - 1);
        startDate.setDate(schedule.dayOfMonth);
        break;
    }

    return startDate;
  }

  // 정산 리포트 생성
  async generateSettlementReport(settlementId, format = 'json') {
    try {
      const settlement = this.settlements.get(settlementId);
      if (!settlement) {
        throw new Error(`Settlement not found: ${settlementId}`);
      }

      const report = {
        settlement: {
          id: settlement.id,
          userId: settlement.userId,
          userType: settlement.userType,
          period: settlement.period,
          status: settlement.status
        },
        financial: {
          grossAmount: settlement.grossAmount,
          fees: settlement.fees,
          taxes: settlement.taxes,
          netAmount: settlement.netAmount,
          currency: settlement.metadata.currency
        },
        transactions: settlement.transactions,
        processing: settlement.processing,
        generatedAt: new Date()
      };

      // 사용자 정보 추가
      const userInfo = await this.getUserInfo(settlement.userId);
      report.user = {
        name: userInfo.name,
        email: userInfo.email,
        businessNumber: userInfo.businessNumber,
        bankAccount: settlement.bankAccount
      };

      // 포맷별 처리
      switch (format) {
        case 'pdf':
          return await this.generatePDFReport(report);
        case 'excel':
          return await this.generateExcelReport(report);
        case 'csv':
          return await this.generateCSVReport(report);
        default:
          return report;
      }

    } catch (error) {
      console.error('Failed to generate settlement report:', error);
      throw error;
    }
  }

  // 정산 분쟁 처리
  async createSettlementDispute(settlementId, disputeData) {
    try {
      const settlement = this.settlements.get(settlementId);
      if (!settlement) {
        throw new Error(`Settlement not found: ${settlementId}`);
      }

      const { reason, description, evidence = [], requestedAmount } = disputeData;

      const dispute = {
        id: this.generateDisputeId(),
        settlementId,
        reason,
        description,
        evidence,
        requestedAmount,
        status: 'open',
        createdAt: new Date(),
        resolvedAt: null,
        resolution: null
      };

      // 정산 상태를 분쟁으로 변경
      settlement.status = SettlementStatus.DISPUTED;
      settlement.metadata.disputeId = dispute.id;
      settlement.metadata.lastUpdated = new Date();

      // 분쟁 이벤트 발행
      await this.publishEvent('settlement.dispute.created', {
        settlementId,
        disputeId: dispute.id,
        userId: settlement.userId,
        reason
      });

      console.log(`Settlement dispute created: ${dispute.id} for settlement ${settlementId}`);
      return dispute;

    } catch (error) {
      console.error('Failed to create settlement dispute:', error);
      throw error;
    }
  }

  // 기본 수수료 구조
  getDefaultFeeStructure() {
    return {
      platformFeeRate: 0.15,      // 15% 플랫폼 수수료
      processingFeeRate: 0.029,   // 2.9% 결제 처리 수수료
      withdrawalFee: 1000,        // 1,000원 출금 수수료
      internationalFeeRate: 0.01, // 1% 해외 거래 수수료
      minimumFee: 100,            // 최소 수수료
      maximumFee: 100000          // 최대 수수료
    };
  }

  // 기본 세금 규칙 설정
  setupDefaultTaxRules() {
    // 개인 소득세 규칙
    this.taxRules.set('personal_income_tax', {
      type: TaxType.INCOME_TAX,
      userType: 'influencer',
      brackets: [
        { min: 0, max: 12000000, rate: 0.06 },
        { min: 12000000, max: 46000000, rate: 0.15 },
        { min: 46000000, max: 88000000, rate: 0.24 },
        { min: 88000000, max: 150000000, rate: 0.35 },
        { min: 150000000, max: Infinity, rate: 0.38 }
      ]
    });

    // 법인세 규칙
    this.taxRules.set('corporate_tax', {
      type: TaxType.BUSINESS_TAX,
      userType: 'business',
      brackets: [
        { min: 0, max: 200000000, rate: 0.10 },
        { min: 200000000, max: 20000000000, rate: 0.20 },
        { min: 20000000000, max: Infinity, rate: 0.22 }
      ]
    });

    // 부가세 규칙
    this.taxRules.set('vat', {
      type: TaxType.VAT,
      userType: 'business',
      rate: 0.10
    });
  }

  // 외부 시스템 연동 메서드들 (Mock)
  async collectTransactionsForPeriod(userId, startDate, endDate) {
    // 실제 구현에서는 거래 데이터베이스에서 조회
    return [
      {
        id: 'tx_001',
        campaignId: 'campaign_001',
        amount: 100000,
        currency: 'KRW',
        date: new Date(),
        type: 'campaign_payment'
      }
    ];
  }

  async getUserBankAccount(userId) {
    // 실제 구현에서는 사용자 계좌 정보 조회
    return {
      bankName: '국민은행',
      accountNumber: '123456-12-123456',
      accountHolder: '홍길동'
    };
  }

  async getUserTaxInfo(userId) {
    // 실제 구현에서는 사용자 세금 정보 조회
    return {
      vatRegistered: false,
      corporateType: 'individual',
      taxYear: new Date().getFullYear()
    };
  }

  async getUserType(userId) {
    // 실제 구현에서는 사용자 타입 조회
    return 'influencer';
  }

  async getUserInfo(userId) {
    // 실제 구현에서는 사용자 정보 조회
    return {
      name: '홍길동',
      email: 'hong@example.com',
      businessNumber: null
    };
  }

  async executePayment(settlement) {
    // 실제 구현에서는 외부 결제 시스템 연동
    return {
      success: true,
      paymentId: 'pay_' + Date.now(),
      transactionId: 'tx_' + Date.now()
    };
  }

  async markTransactionsAsSettled(transactionIds, settlementId) {
    // 실제 구현에서는 거래 상태 업데이트
    console.log(`Marked ${transactionIds.length} transactions as settled for ${settlementId}`);
  }

  async retrySettlement(settlementId) {
    // 정산 재시도
    console.log(`Retrying settlement: ${settlementId}`);
    return this.processSettlement(settlementId);
  }

  // 이벤트 핸들러 설정
  setupEventHandlers() {
    if (!this.eventBus) return;

    this.eventBus.subscribe('campaign.completed', this.handleCampaignCompleted.bind(this));
    this.eventBus.subscribe('settlement.trigger', this.handleSettlementTrigger.bind(this));
  }

  async handleCampaignCompleted(event) {
    const { campaignId, businessId, influencerId } = event.data;
    
    // 캠페인 완료 시 자동 정산 트리거
    console.log(`Triggering settlements for completed campaign: ${campaignId}`);
    
    // 비즈니스와 인플루언서 각각 정산 처리
    await this.triggerCampaignSettlement(campaignId, businessId, influencerId);
  }

  async handleSettlementTrigger(event) {
    const { campaignId, businessId, influencerId } = event.data;
    
    await this.triggerCampaignSettlement(campaignId, businessId, influencerId);
  }

  async triggerCampaignSettlement(campaignId, businessId, influencerId) {
    try {
      // 인플루언서 정산 생성
      if (influencerId) {
        const influencerTransactions = await this.getCampaignTransactions(campaignId, influencerId);
        if (influencerTransactions.length > 0) {
          await this.createSettlement({
            userId: influencerId,
            userType: 'influencer',
            period: SettlementPeriod.CUSTOM,
            startDate: new Date(Math.min(...influencerTransactions.map(tx => tx.date))),
            endDate: new Date(),
            transactions: influencerTransactions,
            metadata: {
              campaignId,
              type: 'campaign_completion'
            }
          });
        }
      }

      // 비즈니스 수익 정산 (플랫폼 수수료 제외한 부분)
      if (businessId) {
        const businessTransactions = await this.getCampaignTransactions(campaignId, businessId);
        if (businessTransactions.length > 0) {
          await this.createSettlement({
            userId: businessId,
            userType: 'business',
            period: SettlementPeriod.CUSTOM,
            startDate: new Date(Math.min(...businessTransactions.map(tx => tx.date))),
            endDate: new Date(),
            transactions: businessTransactions,
            metadata: {
              campaignId,
              type: 'campaign_completion'
            }
          });
        }
      }

    } catch (error) {
      console.error('Failed to trigger campaign settlement:', error);
    }
  }

  async getCampaignTransactions(campaignId, userId) {
    // 실제 구현에서는 특정 캠페인의 거래 조회
    return [
      {
        id: `tx_${campaignId}_${userId}`,
        campaignId,
        userId,
        amount: 50000,
        currency: 'KRW',
        date: new Date(),
        type: 'campaign_earning'
      }
    ];
  }

  // 리포트 생성 메서드들 (Mock)
  async generatePDFReport(report) {
    // 실제 구현에서는 PDF 생성 라이브러리 사용
    return { type: 'pdf', data: 'mock_pdf_data', filename: `settlement_${report.settlement.id}.pdf` };
  }

  async generateExcelReport(report) {
    // 실제 구현에서는 Excel 생성 라이브러리 사용
    return { type: 'excel', data: 'mock_excel_data', filename: `settlement_${report.settlement.id}.xlsx` };
  }

  async generateCSVReport(report) {
    // 실제 구현에서는 CSV 생성
    return { type: 'csv', data: 'mock_csv_data', filename: `settlement_${report.settlement.id}.csv` };
  }

  // API 메서드들
  async getSettlement(settlementId) {
    return this.settlements.get(settlementId);
  }

  async getUserSettlements(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    const userSettlements = Array.from(this.settlements.values())
      .filter(settlement => settlement.userId === userId)
      .filter(settlement => !status || settlement.status === status)
      .sort((a, b) => b.metadata.createdAt - a.metadata.createdAt)
      .slice(offset, offset + limit);

    return userSettlements;
  }

  async getSettlementStats(userId, period = 'month') {
    const settlements = await this.getUserSettlements(userId);
    
    const stats = {
      totalSettlements: settlements.length,
      totalAmount: settlements.reduce((sum, s) => sum + s.netAmount, 0),
      completedSettlements: settlements.filter(s => s.status === SettlementStatus.COMPLETED).length,
      pendingSettlements: settlements.filter(s => s.status === SettlementStatus.PENDING).length,
      failedSettlements: settlements.filter(s => s.status === SettlementStatus.FAILED).length
    };

    return stats;
  }

  // 저장 메서드
  async saveSettlement(settlement) {
    // 실제 구현에서는 데이터베이스에 저장
    console.log(`Settlement saved: ${settlement.id}`);
  }

  // 이벤트 발행 헬퍼
  async publishEvent(eventName, data) {
    if (this.eventBus) {
      await this.eventBus.publish(eventName, data);
    }
  }

  // ID 생성기
  generateSettlementId() {
    return `sttl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateScheduleId() {
    return `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDisputeId() {
    return `disp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 헬스체크
  async healthCheck() {
    return {
      status: 'healthy',
      activeSettlements: this.settlements.size,
      pendingSettlements: Array.from(this.settlements.values()).filter(s => s.status === SettlementStatus.PENDING).length,
      scheduledUsers: this.settlementSchedules.size,
      timestamp: new Date()
    };
  }

  // 정리
  async shutdown() {
    console.log('Settlement System Module shutting down...');
    this.removeAllListeners();
  }
}

// 상수 내보내기
SettlementSystemModule.SettlementStatus = SettlementStatus;
SettlementSystemModule.SettlementPeriod = SettlementPeriod;
SettlementSystemModule.TaxType = TaxType;

module.exports = SettlementSystemModule;