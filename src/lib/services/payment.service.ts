// Payment status and type enums
enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

enum PaymentType {
  CAMPAIGN_PROMOTION = 'CAMPAIGN_PROMOTION',
  SETTLEMENT = 'SETTLEMENT'
}
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/utils/errors';
import crypto from 'crypto';

// 결제 요청 스키마
export const createPaymentSchema = z.object({
  campaignId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER']),
});

// 결제 승인 스키마
export const confirmPaymentSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number(),
});

// 정산 요청 스키마
export const requestSettlementSchema = z.object({
  applicationIds: z.array(z.string()).min(1),
  bankAccount: z.object({
    bank: z.string(),
    accountNumber: z.string(),
    accountHolder: z.string(),
  }),
});

// 환불 요청 스키마
export const refundPaymentSchema = z.object({
  reason: z.string().min(10),
  refundAmount: z.number().positive().optional(),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
export type RequestSettlementDto = z.infer<typeof requestSettlementSchema>;
export type RefundPaymentDto = z.infer<typeof refundPaymentSchema>;

class PaymentService {
  private readonly tossSecretKey = process.env.TOSS_SECRET_KEY!;
  private readonly tossApiUrl = 'https://api.tosspayments.com/v1';

  // 결제 요청 생성
  async createPayment(businessId: string, data: CreatePaymentDto) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
      include: { business: true }
    });

    if (!campaign) {
      throw new ApiError('캠페인을 찾을 수 없습니다.', 404);
    }

    if (campaign.businessId !== businessId) {
      throw new ApiError('권한이 없습니다.', 403);
    }

    // 주문 ID 생성
    const orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 결제 정보 저장
    const payment = await prisma.payment.create({
      data: {
        orderId,
        campaignId: data.campaignId,
        userId: businessId,
        amount: data.amount,
        type: PaymentType.CAMPAIGN_PROMOTION,
        status: PaymentStatus.PENDING,
        paymentMethod: data.paymentMethod,
        metadata: JSON.stringify({
          campaignTitle: campaign.title,
          businessName: campaign.business.name,
        })
      }
    });

    // Toss Payments 결제 요청 데이터
    const paymentRequest = {
      amount: data.amount,
      orderId: payment.orderId,
      orderName: `캠페인: ${campaign.title}`,
      customerName: campaign.business.name,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback/success`,
      failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback/fail`,
    };

    return {
      payment,
      paymentRequest,
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    };
  }

  // 결제 승인
  async confirmPayment(data: ConfirmPaymentDto) {
    const payment = await prisma.payment.findUnique({
      where: { orderId: data.orderId }
    });

    if (!payment) {
      throw new ApiError('결제 정보를 찾을 수 없습니다.', 404);
    }

    if (payment.amount !== data.amount) {
      throw new ApiError('결제 금액이 일치하지 않습니다.', 400);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ApiError('이미 처리된 결제입니다.', 400);
    }

    try {
      // Toss Payments API 호출
      const response = await fetch(`${this.tossApiUrl}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey: data.paymentKey,
          orderId: data.orderId,
          amount: data.amount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new ApiError(result.message || '결제 승인 실패', 400);
      }

      // 결제 정보 업데이트
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.APPROVED,
          paymentKey: data.paymentKey,
          approvedAt: new Date(),
          receipt: result.receipt,
          metadata: JSON.stringify({
            ...(payment.metadata ? JSON.parse(payment.metadata) : {}),
            tossPaymentData: result,
          })
        }
      });

      // 캠페인 상태 업데이트
      if (payment.type === PaymentType.CAMPAIGN_PROMOTION) {
        await prisma.campaign.update({
          where: { id: payment.campaignId! },
          data: { isPaid: true }
        });
      }

      return updatedPayment;
    } catch (error) {
      // 결제 실패 처리
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failReason: error instanceof Error ? error.message : '결제 실패'
        }
      });

      throw error;
    }
  }

  // 결제 취소
  async cancelPayment(paymentId: string, userId: string, data: RefundPaymentDto) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { campaign: true }
    });

    if (!payment) {
      throw new ApiError('결제 정보를 찾을 수 없습니다.', 404);
    }

    if (payment.userId !== userId && payment.campaign?.businessId !== userId) {
      throw new ApiError('권한이 없습니다.', 403);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new ApiError('완료된 결제만 취소할 수 있습니다.', 400);
    }

    const cancelAmount = data.refundAmount || payment.amount;

    if (cancelAmount > payment.amount) {
      throw new ApiError('환불 금액이 결제 금액보다 클 수 없습니다.', 400);
    }

    try {
      // Toss Payments 취소 API 호출
      const response = await fetch(
        `${this.tossApiUrl}/payments/${payment.paymentKey}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(this.tossSecretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancelReason: data.reason,
            cancelAmount,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new ApiError(result.message || '결제 취소 실패', 400);
      }

      // 환불 정보 생성
      const refund = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: cancelAmount,
          reason: data.reason,
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: result,
        }
      });

      // 결제 상태 업데이트
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: cancelAmount === payment.amount 
            ? PaymentStatus.REFUNDED 
            : PaymentStatus.PARTIAL_REFUNDED,
          refundedAmount: {
            increment: cancelAmount
          }
        }
      });

      return { payment: updatedPayment, refund };
    } catch (error) {
      throw error;
    }
  }

  // 인플루언서 정산 요청
  async requestSettlement(influencerId: string, data: RequestSettlementDto) {
    // 정산 가능한 컨텐츠 확인
    const applications = await prisma.campaignApplication.findMany({
      where: {
        id: { in: data.applicationIds },
        influencerId,
        status: 'APPROVED',
      },
      include: {
        campaign: true,
        contents: {
          where: { status: 'APPROVED' }
        }
      }
    });

    if (applications.length !== data.applicationIds.length) {
      throw new ApiError('정산 가능한 컨텐츠가 없습니다.', 400);
    }

    // 이미 정산된 항목 확인
    const settledApplicationIds = await prisma.settlement.findMany({
      where: {
        items: {
          some: {
            applicationId: { in: data.applicationIds }
          }
        },
        status: { in: ['PENDING', 'COMPLETED'] }
      },
      select: { id: true }
    });

    if (settledApplicationIds.length > 0) {
      throw new ApiError('이미 정산 요청된 항목이 있습니다.', 400);
    }

    // 정산 금액 계산
    const totalAmount = applications.reduce((sum, app) => {
      return sum + (app.proposedPrice || app.campaign.budget);
    }, 0);

    // 정산 요청 생성
    const settlement = await prisma.settlement.create({
      data: {
        influencerId,
        totalAmount,
        status: 'PENDING',
        bankAccount: JSON.stringify(data.bankAccount),
        items: {
          create: applications.map(app => ({
            applicationId: app.id,
            amount: app.proposedPrice || app.campaign.budget,
            campaignTitle: app.campaign.title,
          }))
        }
      },
      include: {
        items: true
      }
    });

    return settlement;
  }

  // 정산 처리 (관리자)
  async processSettlement(settlementId: string, approved: boolean, adminNotes?: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        influencer: true,
        items: true
      }
    });

    if (!settlement) {
      throw new ApiError('정산 요청을 찾을 수 없습니다.', 404);
    }

    if (settlement.status !== 'PENDING') {
      throw new ApiError('이미 처리된 정산입니다.', 400);
    }

    if (approved) {
      // 실제 송금 처리 (Toss Payments 정산 API 또는 계좌이체 API 연동)
      // 여기서는 예시로 상태만 변경
      await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          adminNotes,
        }
      });

      // 정산 완료 결제 기록 생성
      await prisma.payment.create({
        data: {
          orderId: `SETTLEMENT_${settlementId}`,
          userId: settlement.influencerId,
          amount: settlement.totalAmount,
          type: PaymentType.SETTLEMENT,
          status: PaymentStatus.APPROVED,
          paymentMethod: 'BANK_TRANSFER',
          approvedAt: new Date(),
          metadata: JSON.stringify({
            settlementId,
            bankAccount: settlement.bankAccount,
          })
        }
      });
    } else {
      await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          adminNotes,
        }
      });
    }

    return settlement;
  }

  // 결제 내역 조회
  async getPaymentHistory(userId: string, filters: {
    type?: PaymentType;
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { type, status, startDate, endDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (type) where.type = type;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
            }
          },
          refunds: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 정산 내역 조회
  async getSettlements(influencerId: string, status?: string) {
    const where: any = { influencerId };
    
    if (status) where.status = status;

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        items: {
          include: {
            application: {
              include: {
                campaign: {
                  select: {
                    id: true,
                    title: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return settlements;
  }
}

export const paymentService = new PaymentService();