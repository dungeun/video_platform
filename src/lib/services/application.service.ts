import { ApplicationStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/utils/errors';

// 지원 상태 변경 스키마
export const updateApplicationStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});

// 컨텐츠 제출 스키마
export const submitContentSchema = z.object({
  contentUrl: z.string().url(),
  description: z.string().optional(),
  platform: z.string(),
});

// 컨텐츠 리뷰 스키마
export const reviewContentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
  feedback: z.string().optional(),
});

export type UpdateApplicationStatusDto = z.infer<typeof updateApplicationStatusSchema>;
export type SubmitContentDto = z.infer<typeof submitContentSchema>;
export type ReviewContentDto = z.infer<typeof reviewContentSchema>;

class ApplicationService {
  // 캠페인 지원 목록 조회
  async getApplications(campaignId: string, businessId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.businessId !== businessId) {
      throw new ApiError('권한이 없습니다.', 403);
    }

    const applications = await prisma.campaignApplication.findMany({
      where: { campaignId },
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                avatar: true,
                instagram: true,
                youtube: true,
                tiktok: true,
              }
            }
          }
        },
        contents: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return applications;
  }

  // 지원 상태 변경 (비즈니스 전용)
  async updateApplicationStatus(
    applicationId: string,
    businessId: string,
    data: UpdateApplicationStatusDto
  ) {
    const application = await prisma.campaignApplication.findUnique({
      where: { id: applicationId },
      include: {
        campaign: true
      }
    });

    if (!application) {
      throw new ApiError('지원을 찾을 수 없습니다.', 404);
    }

    if (application.campaign.businessId !== businessId) {
      throw new ApiError('권한이 없습니다.', 403);
    }

    if (application.status !== 'PENDING') {
      throw new ApiError('이미 처리된 지원입니다.', 400);
    }

    const updated = await prisma.campaignApplication.update({
      where: { id: applicationId },
      data: {
        status: data.status as ApplicationStatus,
        reviewedAt: new Date(),
        rejectionReason: data.reason
      },
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        campaign: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    // TODO: 인플루언서에게 알림 전송

    return updated;
  }

  // 컨텐츠 제출 (인플루언서 전용)
  async submitContent(
    applicationId: string,
    influencerId: string,
    data: SubmitContentDto
  ) {
    const application = await prisma.campaignApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      throw new ApiError('지원을 찾을 수 없습니다.', 404);
    }

    if (application.influencerId !== influencerId) {
      throw new ApiError('권한이 없습니다.', 403);
    }

    if (application.status !== 'APPROVED') {
      throw new ApiError('승인된 지원만 컨텐츠를 제출할 수 있습니다.', 400);
    }

    const content = await prisma.content.create({
      data: {
        applicationId,
        contentUrl: data.contentUrl,
        description: (data as any).description,
        platform: data.platform,
        status: 'PENDING_REVIEW'
      },
      include: {
        application: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                businessId: true,
              }
            }
          }
        }
      }
    });

    // TODO: 비즈니스에게 알림 전송

    return content;
  }

  // 컨텐츠 리뷰 (비즈니스 전용)
  async reviewContent(
    contentId: string,
    businessId: string,
    data: ReviewContentDto
  ) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        application: {
          include: {
            campaign: true,
            influencer: true
          }
        }
      }
    });

    if (!content) {
      throw new ApiError('컨텐츠를 찾을 수 없습니다.', 404);
    }

    if (content.application.campaign.businessId !== businessId) {
      throw new ApiError('권한이 없습니다.', 403);
    }

    if (content.status !== 'PENDING_REVIEW') {
      throw new ApiError('이미 검토된 컨텐츠입니다.', 400);
    }

    const updated = await prisma.content.update({
      where: { id: contentId },
      data: {
        status: data.status as any,
        reviewedAt: new Date(),
        feedback: data.feedback
      }
    });

    // 승인된 경우 결제 처리 준비
    if (data.status === 'APPROVED') {
      // TODO: 결제 프로세스 시작
    }

    // TODO: 인플루언서에게 알림 전송

    return updated;
  }

  // 내 지원 목록 조회 (인플루언서 전용)
  async getMyApplications(influencerId: string, status?: ApplicationStatus) {
    const applications = await prisma.campaignApplication.findMany({
      where: {
        influencerId,
        ...(status && { status })
      },
      include: {
        campaign: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                profile: true,
              }
            }
          }
        },
        contents: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return applications;
  }
}

export const applicationService = new ApplicationService();