/**
 * Revu Platform Payment Gateway Module
 * Extends payment-gateway module for escrow and settlement features
 */

const stripe = require('stripe');
const paypal = require('paypal-rest-sdk');

class RevuPaymentGateway {
  constructor(config) {
    this.config = config;
    this.stripe = stripe(config.stripe.secretKey);
    this.paypal = paypal;
    this.paypal.configure(config.paypal);
    
    // 에스크로 계정 설정
    this.escrowConfig = config.escrow;
    this.feeStructure = config.fees || this.getDefaultFeeStructure();
  }

  // 기본 결제 처리
  async createPayment(data) {
    try {
      const { campaignId, businessId, amount, currency, description, paymentMethod } = data;
      
      // 수수료 계산
      const fees = await this.calculateFees(amount, this.feeStructure);
      const totalAmount = amount + fees.platformFee + fees.processingFee;

      const payment = {
        id: this.generatePaymentId(),
        campaignId,
        businessId,
        amount,
        fees,
        totalAmount,
        currency: currency || 'USD',
        description,
        status: 'pending',
        paymentMethod: paymentMethod || 'stripe',
        createdAt: new Date(),
        metadata: data.metadata || {}
      };

      // 결제 데이터 저장
      await this.savePayment(payment);

      this.emit('payment.created', { paymentId: payment.id, amount: totalAmount });

      return payment;
    } catch (error) {
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  async processPayment(paymentId, paymentMethodData) {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      let result;
      
      switch (payment.paymentMethod) {
        case 'stripe':
          result = await this.processStripePayment(payment, paymentMethodData);
          break;
        case 'paypal':
          result = await this.processPayPalPayment(payment, paymentMethodData);
          break;
        default:
          throw new Error(`Unsupported payment method: ${payment.paymentMethod}`);
      }

      // 결제 성공 시 에스크로 계정 생성
      if (result.success) {
        await this.createEscrowForPayment(payment);
        payment.status = 'completed';
        payment.processedAt = new Date();
        payment.transactionId = result.transactionId;
        
        this.emit('payment.completed', { 
          paymentId, 
          campaignId: payment.campaignId,
          amount: payment.totalAmount 
        });
      } else {
        payment.status = 'failed';
        payment.errorMessage = result.error;
        
        this.emit('payment.failed', { 
          paymentId, 
          error: result.error 
        });
      }

      await this.updatePayment(payment);
      return result;
    } catch (error) {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  // 에스크로 시스템
  async createEscrow(campaignId, amount, terms) {
    try {
      const escrow = {
        id: this.generateEscrowId(),
        campaignId,
        amount,
        terms: {
          releaseConditions: terms.releaseConditions || ['content_approved', 'campaign_completed'],
          disputeWindow: terms.disputeWindow || 14, // 14일
          autoReleaseDate: terms.autoReleaseDate,
          milestones: terms.milestones || []
        },
        status: 'created',
        balance: 0,
        transactions: [],
        createdAt: new Date()
      };

      await this.saveEscrow(escrow);

      this.emit('escrow.created', { escrowId: escrow.id, campaignId, amount });

      return escrow;
    } catch (error) {
      throw new Error(`Escrow creation failed: ${error.message}`);
    }
  }

  async createEscrowForPayment(payment) {
    try {
      const escrow = await this.createEscrow(payment.campaignId, payment.amount, {});
      
      // 결제에서 에스크로로 자금 이동
      await this.fundEscrow(escrow.id, {
        paymentId: payment.id,
        amount: payment.amount
      });

      return escrow;
    } catch (error) {
      throw new Error(`Escrow funding failed: ${error.message}`);
    }
  }

  async fundEscrow(escrowId, fundingData) {
    try {
      const escrow = await this.getEscrow(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const transaction = {
        id: this.generateTransactionId(),
        type: 'fund',
        amount: fundingData.amount,
        paymentId: fundingData.paymentId,
        timestamp: new Date(),
        status: 'completed'
      };

      escrow.balance += fundingData.amount;
      escrow.transactions.push(transaction);
      escrow.status = 'funded';

      await this.updateEscrow(escrow);

      this.emit('escrow.funded', { 
        escrowId, 
        amount: fundingData.amount,
        balance: escrow.balance 
      });

      return transaction;
    } catch (error) {
      throw new Error(`Escrow funding failed: ${error.message}`);
    }
  }

  async releaseEscrow(escrowId, releaseData) {
    try {
      const escrow = await this.getEscrow(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== 'funded') {
        throw new Error('Escrow is not in funded status');
      }

      // 릴리즈 조건 확인
      const conditionsMet = await this.checkReleaseConditions(escrow, releaseData);
      if (!conditionsMet.valid) {
        throw new Error(`Release conditions not met: ${conditionsMet.reason}`);
      }

      const releaseAmount = releaseData.amount || escrow.balance;
      
      if (releaseAmount > escrow.balance) {
        throw new Error('Insufficient escrow balance');
      }

      // 인플루언서에게 정산 처리
      const payout = await this.processPayout({
        escrowId,
        influencerId: releaseData.influencerId,
        amount: releaseAmount,
        reason: releaseData.reason || 'Campaign completion'
      });

      const transaction = {
        id: this.generateTransactionId(),
        type: 'release',
        amount: releaseAmount,
        payoutId: payout.id,
        influencerId: releaseData.influencerId,
        timestamp: new Date(),
        status: 'completed'
      };

      escrow.balance -= releaseAmount;
      escrow.transactions.push(transaction);
      
      if (escrow.balance === 0) {
        escrow.status = 'completed';
      }

      await this.updateEscrow(escrow);

      this.emit('escrow.released', { 
        escrowId, 
        amount: releaseAmount,
        influencerId: releaseData.influencerId 
      });

      return transaction;
    } catch (error) {
      throw new Error(`Escrow release failed: ${error.message}`);
    }
  }

  // 정산 시스템
  async calculatePayout(campaignId, influencerId) {
    try {
      const campaign = await this.getCampaign(campaignId);
      const influencer = await this.getInfluencer(influencerId);
      const participation = await this.getParticipation(campaignId, influencerId);

      if (!participation || participation.status !== 'completed') {
        throw new Error('Campaign participation not completed');
      }

      const grossAmount = participation.agreedAmount || campaign.budget.perInfluencer;
      const fees = await this.calculateInfluencerFees(grossAmount);

      const calculation = {
        campaignId,
        influencerId,
        grossAmount,
        platformFee: fees.platformFee,
        processingFee: fees.processingFee,
        taxAmount: fees.taxAmount || 0,
        netAmount: grossAmount - fees.platformFee - fees.processingFee - (fees.taxAmount || 0),
        breakdown: [
          { type: 'gross', amount: grossAmount, description: 'Campaign payment' },
          { type: 'platform_fee', amount: -fees.platformFee, description: 'Platform commission' },
          { type: 'processing_fee', amount: -fees.processingFee, description: 'Payment processing' },
          { type: 'tax', amount: -(fees.taxAmount || 0), description: 'Tax withholding' }
        ],
        currency: campaign.budget.currency || 'USD',
        calculatedAt: new Date()
      };

      return calculation;
    } catch (error) {
      throw new Error(`Payout calculation failed: ${error.message}`);
    }
  }

  async processPayout(payoutData) {
    try {
      const calculation = await this.calculatePayout(payoutData.campaignId, payoutData.influencerId);
      
      const payout = {
        id: this.generatePayoutId(),
        escrowId: payoutData.escrowId,
        influencerId: payoutData.influencerId,
        campaignId: payoutData.campaignId,
        amount: calculation.netAmount,
        currency: calculation.currency,
        method: payoutData.method || 'bank_transfer',
        status: 'processing',
        calculation,
        createdAt: new Date(),
        scheduledDate: payoutData.scheduledDate || new Date()
      };

      // 인플루언서 결제 정보 확인
      const influencer = await this.getInfluencer(payoutData.influencerId);
      const paymentMethod = influencer.paymentMethods?.find(pm => pm.isDefault) || influencer.paymentMethods?.[0];
      
      if (!paymentMethod) {
        throw new Error('Influencer payment method not found');
      }

      // 실제 정산 처리
      const payoutResult = await this.executePayoutTransfer(payout, paymentMethod);
      
      if (payoutResult.success) {
        payout.status = 'completed';
        payout.completedAt = new Date();
        payout.transactionId = payoutResult.transactionId;
        
        this.emit('payout.processed', { 
          payoutId: payout.id,
          influencerId: payoutData.influencerId,
          amount: calculation.netAmount 
        });
      } else {
        payout.status = 'failed';
        payout.errorMessage = payoutResult.error;
        
        this.emit('payout.failed', { 
          payoutId: payout.id,
          error: payoutResult.error 
        });
      }

      await this.savePayout(payout);
      return payout;
    } catch (error) {
      throw new Error(`Payout processing failed: ${error.message}`);
    }
  }

  // 분쟁 처리
  async disputeEscrow(escrowId, disputeData) {
    try {
      const escrow = await this.getEscrow(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const dispute = {
        id: this.generateDisputeId(),
        escrowId,
        campaignId: escrow.campaignId,
        initiatorId: disputeData.initiatorId,
        respondentId: disputeData.respondentId,
        reason: disputeData.reason,
        description: disputeData.description,
        evidence: disputeData.evidence || [],
        status: 'open',
        amount: disputeData.amount || escrow.balance,
        createdAt: new Date(),
        responses: []
      };

      // 에스크로 상태를 분쟁 중으로 변경
      escrow.status = 'disputed';
      escrow.disputeId = dispute.id;

      await this.saveDispute(dispute);
      await this.updateEscrow(escrow);

      this.emit('dispute.created', { 
        disputeId: dispute.id,
        escrowId,
        amount: dispute.amount 
      });

      return dispute;
    } catch (error) {
      throw new Error(`Dispute creation failed: ${error.message}`);
    }
  }

  // 인보이스 생성
  async generateInvoice(transactionId, invoiceData) {
    try {
      const transaction = await this.getTransaction(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const invoice = {
        id: this.generateInvoiceId(),
        transactionId,
        businessId: invoiceData.businessId,
        amount: transaction.amount,
        currency: transaction.currency,
        description: invoiceData.description || transaction.description,
        items: invoiceData.items || [
          {
            description: 'Influencer Marketing Campaign',
            amount: transaction.amount,
            quantity: 1
          }
        ],
        fees: transaction.fees,
        tax: invoiceData.tax || 0,
        dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        status: 'pending',
        createdAt: new Date(),
        metadata: invoiceData.metadata || {}
      };

      await this.saveInvoice(invoice);

      this.emit('invoice.generated', { 
        invoiceId: invoice.id,
        businessId: invoiceData.businessId,
        amount: invoice.amount 
      });

      return invoice;
    } catch (error) {
      throw new Error(`Invoice generation failed: ${error.message}`);
    }
  }

  // 수수료 계산
  async calculateFees(amount, feeStructure) {
    const platformFeeRate = feeStructure.platformFeeRate || 0.15; // 15%
    const processingFeeRate = feeStructure.processingFeeRate || 0.029; // 2.9%
    const processingFeeFixed = feeStructure.processingFeeFixed || 30; // $0.30

    return {
      platformFee: Math.round(amount * platformFeeRate),
      processingFee: Math.round(amount * processingFeeRate + processingFeeFixed),
      taxAmount: feeStructure.taxRate ? Math.round(amount * feeStructure.taxRate) : 0
    };
  }

  async calculateInfluencerFees(amount) {
    // 인플루언서에게 부과되는 수수료 (일반적으로 낮음)
    return {
      platformFee: Math.round(amount * 0.05), // 5%
      processingFee: Math.round(amount * 0.029 + 30), // Stripe 표준 수수료
      taxAmount: 0 // 세금은 별도 처리
    };
  }

  // Stripe 결제 처리
  async processStripePayment(payment, paymentMethodData) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(payment.totalAmount * 100), // cents
        currency: payment.currency.toLowerCase(),
        payment_method: paymentMethodData.paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: payment.description,
        metadata: {
          campaignId: payment.campaignId,
          businessId: payment.businessId
        }
      });

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          transactionId: paymentIntent.id,
          amount: payment.totalAmount
        };
      } else {
        return {
          success: false,
          error: 'Payment requires additional authentication',
          clientSecret: paymentIntent.client_secret
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // PayPal 결제 처리
  async processPayPalPayment(payment, paymentMethodData) {
    try {
      const paymentConfig = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        redirect_urls: {
          return_url: paymentMethodData.returnUrl,
          cancel_url: paymentMethodData.cancelUrl
        },
        transactions: [{
          amount: {
            currency: payment.currency,
            total: payment.totalAmount.toFixed(2)
          },
          description: payment.description
        }]
      };

      return new Promise((resolve, reject) => {
        this.paypal.payment.create(paymentConfig, (error, payment) => {
          if (error) {
            resolve({
              success: false,
              error: error.message
            });
          } else {
            resolve({
              success: true,
              transactionId: payment.id,
              approvalUrl: payment.links.find(link => link.rel === 'approval_url').href
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 정산 실행
  async executePayoutTransfer(payout, paymentMethod) {
    try {
      switch (paymentMethod.type) {
        case 'bank_account':
          return await this.processBankTransfer(payout, paymentMethod);
        case 'paypal':
          return await this.processPayPalPayout(payout, paymentMethod);
        case 'stripe':
          return await this.processStripePayout(payout, paymentMethod);
        default:
          throw new Error(`Unsupported payout method: ${paymentMethod.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processBankTransfer(payout, paymentMethod) {
    // 실제 은행 이체 처리 로직
    // 실제 구현에서는 은행 API 또는 결제 서비스 API 사용
    return {
      success: true,
      transactionId: `bank_${this.generateTransactionId()}`,
      estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2일 후
    };
  }

  // 릴리즈 조건 확인
  async checkReleaseConditions(escrow, releaseData) {
    try {
      const campaign = await this.getCampaign(escrow.campaignId);
      const conditions = escrow.terms.releaseConditions;

      for (const condition of conditions) {
        switch (condition) {
          case 'content_approved':
            const contentApproved = await this.isContentApproved(escrow.campaignId, releaseData.influencerId);
            if (!contentApproved) {
              return { valid: false, reason: 'Content not yet approved' };
            }
            break;
          
          case 'campaign_completed':
            if (campaign.status !== 'completed') {
              return { valid: false, reason: 'Campaign not yet completed' };
            }
            break;
          
          case 'performance_met':
            const performanceMet = await this.checkPerformanceTargets(escrow.campaignId, releaseData.influencerId);
            if (!performanceMet) {
              return { valid: false, reason: 'Performance targets not met' };
            }
            break;
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  // 유틸리티 메서드
  getDefaultFeeStructure() {
    return {
      platformFeeRate: 0.15, // 15%
      processingFeeRate: 0.029, // 2.9%
      processingFeeFixed: 30, // $0.30
      taxRate: 0 // 세율은 지역별로 다름
    };
  }

  generatePaymentId() {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEscrowId() {
    return `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generatePayoutId() {
    return `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDisputeId() {
    return `disp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateInvoiceId() {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 이벤트 시스템
  emit(eventName, data) {
    console.log(`Payment Event: ${eventName}`, data);
  }

  // 데이터베이스 상호작용 메서드 (실제 구현 필요)
  async savePayment(payment) {
    // MongoDB에 결제 정보 저장
  }

  async updatePayment(payment) {
    // MongoDB에서 결제 정보 업데이트
  }

  async getPayment(paymentId) {
    // MongoDB에서 결제 정보 조회
  }

  async saveEscrow(escrow) {
    // MongoDB에 에스크로 정보 저장
  }

  async updateEscrow(escrow) {
    // MongoDB에서 에스크로 정보 업데이트
  }

  async getEscrow(escrowId) {
    // MongoDB에서 에스크로 정보 조회
  }
}

module.exports = RevuPaymentGateway;