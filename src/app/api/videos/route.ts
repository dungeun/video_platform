import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, createAuthResponse, createErrorResponse } from '@/lib/auth-middleware';
import { validateRequest, paginationSchema, formatValidationErrors } from '@/lib/validation';
import { z } from 'zod';
import { 
  transformCampaignListToVideoResponse, 
  buildVideoQueryFilters,
  transformVideoRequestToCampaign,
  isValidVideoCampaign 
} from '@/lib/utils/video-transform';
import { VideoCreateRequest, VideoFilters } from '@/lib/types/video';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to build sort order
function buildSortOrder(sortBy: string) {
  switch (sortBy) {
    case 'popular':
    case 'views':
      return [
        { viewCount: 'desc' as const },
        { createdAt: 'desc' as const }
      ];
    case 'likes':
      return [
        // { likeCount: 'desc' as const }, // Field doesn't exist yet
        { viewCount: 'desc' as const }, // Use viewCount as fallback
        { createdAt: 'desc' as const }
      ];
    case 'duration':
      return [
        // { duration: 'desc' as const }, // Field doesn't exist yet
        { createdAt: 'desc' as const } // Use createdAt as fallback
      ];
    case 'oldest':
      return [
        { createdAt: 'asc' as const }
      ];
    case 'latest':
    default:
      return [
        { createdAt: 'desc' as const }
      ];
  }
}

// Video creation schema
const videoCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  thumbnailUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  isLive: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'private']).default('draft'),
  
  // Live streaming fields
  streamKey: z.string().optional(),
  isRecording: z.boolean().default(true),
});

// GET /api/videos - 비디오 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate pagination params
    const paginationResult = await validateRequest(
      {
        page: searchParams.get('page'),
        limit: searchParams.get('limit')
      },
      paginationSchema
    );
    
    if (!paginationResult.success) {
      return createErrorResponse('Invalid pagination parameters', 400, formatValidationErrors(paginationResult.errors));
    }
    
    const { page, limit } = paginationResult.data;
    const offset = (page - 1) * limit;

    // Build video-specific filters with enhanced search capabilities
    const searchQuery = searchParams.get('search') || '';
    const category = searchParams.get('category') || undefined;
    const sortBy = searchParams.get('sort') || 'latest';
    const minViews = searchParams.get('minViews') ? parseInt(searchParams.get('minViews')!) : undefined;
    const minDuration = searchParams.get('minDuration') ? parseInt(searchParams.get('minDuration')!) : undefined;
    const maxDuration = searchParams.get('maxDuration') ? parseInt(searchParams.get('maxDuration')!) : undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    
    const filters: VideoFilters = {
      status: searchParams.get('status') || undefined,
      category: category,
      platform: searchParams.get('platform') || undefined,
      isLive: searchParams.get('isLive') === 'true' ? true : searchParams.get('isLive') === 'false' ? false : undefined,
      channelId: searchParams.get('channelId') || undefined,
      search: searchQuery,
      minViews: minViews,
      minDuration: minDuration,
      maxDuration: maxDuration,
      tags: tags,
    };

    // Build comprehensive where clause
    const where: any = {
      // Only include campaigns that can be treated as videos
      OR: [
        { imageUrl: { not: null } }, // Has image content (fallback for videoUrl)
        { status: 'ACTIVE' } // Just ensure it's active for now
      ],
      status: { in: ['ACTIVE', 'COMPLETED'] }, // Active or completed campaigns
    };

    // Add search functionality
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { hashtags: { some: { contains: searchQuery.replace('#', ''), mode: 'insensitive' } } },
        { 
          business: {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { businessProfile: { companyName: { contains: searchQuery, mode: 'insensitive' } } }
            ]
          }
        }
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      where.businessProfile = {
        businessCategory: { contains: category, mode: 'insensitive' }
      };
    }

    // Add view count filter
    if (minViews) {
      where.viewCount = { gte: minViews };
    }

    // Add duration filters
    if (minDuration || maxDuration) {
      where.duration = {};
      if (minDuration) where.duration.gte = minDuration;
      if (maxDuration) where.duration.lte = maxDuration;
    }

    // Add tag filters
    if (tags.length > 0) {
      where.hashtags = {
        some: {
          in: tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        }
      };
    }

    // Query campaigns that can be treated as videos
    const campaigns = await prisma.campaigns.findMany({
      where,
      select: {
        id: true,
        businessId: true,
        title: true,
        description: true,
        platform: true,
        budget: true,
        targetFollowers: true,
        startDate: true,
        endDate: true,
        requirements: true,
        hashtags: true,
        imageUrl: true,
        // videoUrl: true, // Field doesn't exist yet in DB
        // duration: true, // Field doesn't exist yet in DB
        viewCount: true,
        // likeCount: true, // Field doesn't exist yet in DB
        // dislikeCount: true, // Field doesn't exist yet in DB
        // isLive: true, // Field doesn't exist yet in DB
        // streamKey: true, // Field doesn't exist yet in DB
        status: true,
        isPaid: true,
        maxApplicants: true,
        rewardAmount: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            campaign_applications: true // Keep for backward compatibility
          }
        }
      },
      orderBy: buildSortOrder(sortBy),
      skip: offset,
      take: limit
    });

    // Filter out campaigns that are not valid videos
    const validVideoCampaigns = campaigns.filter(isValidVideoCampaign);

    // Get total count
    const total = await prisma.campaigns.count({ where });

    // Transform to video format
    const response = transformCampaignListToVideoResponse(
      validVideoCampaigns as any,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    );

    return createAuthResponse(response);
  } catch (error) {
    console.error('비디오 목록 조회 오류:', error);
    return createErrorResponse(
      '비디오 목록을 불러오는데 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// POST /api/videos - 새 비디오 생성
export async function POST(request: NextRequest) {
  try {
    // Authenticate user - allow both BUSINESS and INFLUENCER types
    const authResult = await requireAuth(request, ['BUSINESS', 'INFLUENCER']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const body = await request.json();
    
    // Validate the data
    const validationResult = await validateRequest(body, videoCreateSchema);
    
    if (!validationResult.success) {
      return createErrorResponse(
        'Invalid video data',
        400,
        formatValidationErrors(validationResult.errors)
      );
    }
    
    const validatedData = validationResult.data;

    // Validate video requirements
    if (!validatedData.isLive && !validatedData.videoUrl) {
      return createErrorResponse(
        'Either videoUrl is required for VOD or isLive must be true for live streams',
        400
      );
    }

    // Transform video data to campaign format for database storage
    const campaignData = transformVideoRequestToCampaign(validatedData, user.id);

    // Create video (as campaign with video fields)
    const campaign = await prisma.campaigns.create({
      data: {
        id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        updatedAt: new Date(),
        ...campaignData,
        // Override with video-specific fields
        streamKey: validatedData.streamKey,
      }
    });

    // If this is a live stream, we might want to create a LiveStream record as well
    // This is for future enhancement when we fully separate the models
    
    return createAuthResponse(
      {
        message: '비디오가 성공적으로 생성되었습니다.',
        video: {
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          status: validatedData.status,
          isLive: validatedData.isLive,
          createdAt: campaign.createdAt.toISOString(),
        }
      },
      201
    );
  } catch (error) {
    console.error('비디오 생성 오류:', error);
    return createErrorResponse(
      '비디오 생성에 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// PUT /api/videos - 비디오 정보 업데이트 (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['BUSINESS', 'INFLUENCER']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const body = await request.json();
    const { videoIds, updates } = body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return createErrorResponse('videoIds array is required', 400);
    }

    // Validate updates
    const allowedUpdates = ['status', 'title', 'description', 'thumbnailUrl', 'tags'];
    const validUpdates: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'status') {
          // Map video status to campaign status
          validUpdates.status = value === 'published' ? 'ACTIVE' : 'DRAFT';
        } else if (key === 'thumbnailUrl') {
          validUpdates.imageUrl = value;
        } else if (key === 'tags') {
          validUpdates.hashtags = Array.isArray(value) ? JSON.stringify(value.map((tag: string) => `#${tag}`)) : null;
        } else {
          validUpdates[key] = value;
        }
      }
    }

    // Update campaigns (videos) owned by the user
    const updateResult = await prisma.campaigns.updateMany({
      where: {
        id: { in: videoIds },
        businessId: user.id, // Ensure user owns the videos
        OR: [
          { imageUrl: { not: null } }, // Use imageUrl instead of videoUrl for now
          { status: 'ACTIVE' } // Just ensure it's active for now
        ]
      },
      data: {
        ...validUpdates,
        updatedAt: new Date(),
      }
    });

    return createAuthResponse({
      message: `${updateResult.count}개의 비디오가 업데이트되었습니다.`,
      updated: updateResult.count
    });

  } catch (error) {
    console.error('비디오 업데이트 오류:', error);
    return createErrorResponse(
      '비디오 업데이트에 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// DELETE /api/videos - 비디오 삭제 (bulk delete)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['BUSINESS', 'INFLUENCER']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const body = await request.json();
    const { videoIds } = body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return createErrorResponse('videoIds array is required', 400);
    }

    // Soft delete by updating status
    const deleteResult = await prisma.campaigns.updateMany({
      where: {
        id: { in: videoIds },
        businessId: user.id, // Ensure user owns the videos
        OR: [
          { imageUrl: { not: null } }, // Use imageUrl instead of videoUrl for now
          { status: 'ACTIVE' } // Just ensure it's active for now
        ]
      },
      data: {
        status: 'COMPLETED', // Mark as completed instead of hard delete
        updatedAt: new Date(),
      }
    });

    return createAuthResponse({
      message: `${deleteResult.count}개의 비디오가 삭제되었습니다.`,
      deleted: deleteResult.count
    });

  } catch (error) {
    console.error('비디오 삭제 오류:', error);
    return createErrorResponse(
      '비디오 삭제에 실패했습니다.',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}