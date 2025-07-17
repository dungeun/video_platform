import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/utils/errors';
import crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

// 파일 업로드 스키마
export const uploadFileSchema = z.object({
  file: z.any(), // FormData File 객체
  type: z.enum(['profile', 'campaign', 'content', 'document']),
  metadata: z.record(z.any()).optional().default({}),
});

// 이미지 리사이즈 옵션 스키마
export const imageResizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  quality: z.number().min(1).max(100).default(80),
});

export type UploadFileDto = z.infer<typeof uploadFileSchema>;
export type ImageResizeDto = z.infer<typeof imageResizeSchema>;

// 업로드 설정
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  uploadDir: process.env.UPLOAD_DIR || 'public/uploads',
  cdnUrl: process.env.CDN_URL || '/uploads',
};

// 이미지 사이즈 프리셋
const IMAGE_PRESETS = {
  profile: {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  },
  campaign: {
    thumbnail: { width: 300, height: 200 },
    medium: { width: 600, height: 400 },
    large: { width: 1200, height: 800 },
  },
  content: {
    thumbnail: { width: 400, height: 400 },
    medium: { width: 800, height: 800 },
    large: { width: 1600, height: 1600 },
  },
};

class UploadService {
  // 파일 업로드
  async uploadFile(file: File, userId: string, type: string, metadata?: any) {
    // 파일 크기 검증
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      throw new ApiError('파일 크기가 너무 큽니다. (최대 10MB)', 400);
    }

    // 파일 타입 검증
    const isImage = UPLOAD_CONFIG.allowedImageTypes.includes(file.type);
    const isDocument = UPLOAD_CONFIG.allowedDocumentTypes.includes(file.type);

    if (!isImage && !isDocument) {
      throw new ApiError('지원하지 않는 파일 형식입니다.', 400);
    }

    // 파일명 생성
    const ext = file.name.split('.').pop();
    const filename = `${type}_${userId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filepath = join(type, filename);

    // 디렉토리 생성
    const uploadPath = join(process.cwd(), UPLOAD_CONFIG.uploadDir, type);
    await mkdir(uploadPath, { recursive: true });

    // 파일 저장
    const buffer = Buffer.from(await file.arrayBuffer());
    const fullPath = join(uploadPath, filename);

    if (isImage) {
      // 이미지 처리 및 리사이즈
      await this.processImage(buffer, fullPath, type);
    } else {
      // 일반 파일 저장
      await writeFile(fullPath, buffer);
    }

    // DB에 파일 정보 저장
    const uploadedFile = await prisma.file.create({
      data: {
        userId,
        filename,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        path: filepath,
        url: `${UPLOAD_CONFIG.cdnUrl}/${filepath}`,
        type,
        metadata: metadata || {},
      }
    });

    // 이미지인 경우 썸네일 URL 추가
    if (isImage) {
      const thumbnailUrl = `${UPLOAD_CONFIG.cdnUrl}/${type}/thumb_${filename}`;
      const mediumUrl = `${UPLOAD_CONFIG.cdnUrl}/${type}/medium_${filename}`;
      
      await prisma.file.update({
        where: { id: uploadedFile.id },
        data: {
          metadata: JSON.stringify({
            ...(uploadedFile.metadata ? JSON.parse(uploadedFile.metadata) : {}),
            thumbnailUrl,
            mediumUrl,
            originalUrl: uploadedFile.url,
          })
        }
      });

      return {
        ...uploadedFile,
        thumbnailUrl,
        mediumUrl,
      };
    }

    return uploadedFile;
  }

  // 이미지 처리
  private async processImage(buffer: Buffer, fullPath: string, type: string) {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // 원본 이미지 저장 (최적화)
    await image
      .jpeg({ quality: 90 })
      .toFile(fullPath);

    // 프리셋에 따라 리사이즈 버전 생성
    const presets = IMAGE_PRESETS[type as keyof typeof IMAGE_PRESETS] || IMAGE_PRESETS.content;
    
    for (const [size, dimensions] of Object.entries(presets)) {
      const resizedPath = fullPath.replace(
        /([^/]+)\.(\w+)$/,
        `${size}_$1.$2`
      );

      await sharp(buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(resizedPath);
    }
  }

  // 파일 삭제
  async deleteFile(fileId: string, userId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw new ApiError('파일을 찾을 수 없습니다.', 404);
    }

    if (file.userId !== userId) {
      throw new ApiError('파일 삭제 권한이 없습니다.', 403);
    }

    // 실제 파일 삭제 (선택적)
    // 보통은 soft delete 또는 스케줄러로 처리
    
    // DB에서 삭제
    await prisma.file.delete({
      where: { id: fileId }
    });

    return { success: true };
  }

  // 파일 목록 조회
  async getFiles(userId: string, filters: {
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.file.count({ where })
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 파일 정보 조회
  async getFile(fileId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw new ApiError('파일을 찾을 수 없습니다.', 404);
    }

    return file;
  }

  // 프로필 이미지 업데이트
  async updateProfileImage(userId: string, file: File) {
    const uploadedFile = await this.uploadFile(file, userId, 'profile');

    // 프로필 업데이트
    await prisma.profile.upsert({
      where: { userId },
      update: {
        avatar: uploadedFile.url,
        avatarId: uploadedFile.id,
      },
      create: {
        userId,
        avatar: uploadedFile.url,
        avatarId: uploadedFile.id,
      }
    });

    return uploadedFile;
  }

  // 캠페인 이미지 업로드
  async uploadCampaignImage(campaignId: string, userId: string, file: File) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.businessId !== userId) {
      throw new ApiError('캠페인을 찾을 수 없습니다.', 404);
    }

    const uploadedFile = await this.uploadFile(file, userId, 'campaign', {
      campaignId
    });

    // 캠페인 업데이트
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        imageUrl: uploadedFile.url,
        imageId: uploadedFile.id,
      }
    });

    return uploadedFile;
  }

  // 컨텐츠 미디어 업로드
  async uploadContentMedia(contentId: string, userId: string, files: File[]) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        application: true
      }
    });

    if (!content || content.application.influencerId !== userId) {
      throw new ApiError('컨텐츠를 찾을 수 없습니다.', 404);
    }

    const uploadedFiles = [];

    for (const file of files) {
      const uploadedFile = await this.uploadFile(file, userId, 'content', {
        contentId
      });

      uploadedFiles.push(uploadedFile);

      // 컨텐츠 미디어 관계 생성
      await prisma.contentMedia.create({
        data: {
          contentId,
          fileId: uploadedFile.id,
          type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
          order: uploadedFiles.length,
        }
      });
    }

    return uploadedFiles;
  }

  // 파일 사용량 통계
  async getStorageStats(userId: string) {
    const stats = await prisma.file.groupBy({
      by: ['type'],
      where: { userId },
      _sum: {
        size: true,
      },
      _count: true,
    });

    const totalSize = stats.reduce((sum, stat) => sum + (stat._sum.size || 0), 0);
    const totalFiles = stats.reduce((sum, stat) => sum + stat._count, 0);

    return {
      totalSize,
      totalFiles,
      byType: stats.map(stat => ({
        type: stat.type,
        count: stat._count,
        size: stat._sum.size || 0,
      })),
      limit: 1024 * 1024 * 1024, // 1GB limit per user
      used: totalSize,
      available: 1024 * 1024 * 1024 - totalSize,
    };
  }
}

export const uploadService = new UploadService();