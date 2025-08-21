import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/influencer/profile - 인플루언서 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { id: userId, type: userType } = authResult.payload;

    // 인플루언서만 접근 가능
    if (userType !== 'INFLUENCER') {
      return NextResponse.json(
        { error: '인플루언서만 접근할 수 있습니다' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        profiles: {
          select: {
            id: true,
            bio: true,
            profileImage: true,
            profileImageId: true,
            phone: true,
            instagram: true,
            instagramFollowers: true,
            youtube: true,
            youtubeSubscribers: true,
            tiktok: true,
            tiktokFollowers: true,
            averageEngagementRate: true,
            categories: true,
            isVerified: true,
            verificationNotes: true,
            verifiedAt: true,
            followerCount: true,
            naverBlog: true,
            address: true,
            bankAccountHolder: true,
            bankAccountNumber: true,
            bankName: true,
            birthYear: true,
            gender: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        _count: {
          select: {
            videos: true,
            posts: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 인플루언서 프로필이 없는 경우 기본 프로필 생성
    if (!user.profiles) {
      const newProfile = await prisma.profiles.create({
        data: {
          userId: userId,
          bio: '',
          followerCount: 0,
          isVerified: false,
        }
      });

      user.profiles = newProfile;
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('GET /api/influencer/profile error:', error);
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 프로필 업데이트 스키마
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  phone: z.string().max(20).optional(),
  instagram: z.string().max(100).optional(),
  instagramFollowers: z.number().int().min(0).optional(),
  youtube: z.string().max(100).optional(),
  youtubeSubscribers: z.number().int().min(0).optional(),
  tiktok: z.string().max(100).optional(),
  tiktokFollowers: z.number().int().min(0).optional(),
  naverBlog: z.string().max(100).optional(),
  categories: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  bankAccountHolder: z.string().max(50).optional(),
  bankAccountNumber: z.string().max(50).optional(),
  bankName: z.string().max(50).optional(),
  birthYear: z.number().int().min(1900).max(2010).optional(),
  gender: z.string().max(10).optional(),
});

// PUT /api/influencer/profile - 인플루언서 프로필 업데이트
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { id: userId, type: userType } = authResult.payload;

    // 인플루언서만 접근 가능
    if (userType !== 'INFLUENCER') {
      return NextResponse.json(
        { error: '인플루언서만 접근할 수 있습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // 사용자 기본 정보와 프로필 정보 분리
    const { name, ...profileData } = validatedData;

    const result = await prisma.$transaction(async (tx) => {
      // 사용자 기본 정보 업데이트
      if (name) {
        await tx.users.update({
          where: { id: userId },
          data: { name }
        });
      }

      // 프로필 업데이트 (upsert 사용)
      const updatedProfile = await tx.profiles.upsert({
        where: { userId },
        update: {
          ...profileData,
          updatedAt: new Date(),
        },
        create: {
          userId,
          bio: profileData.bio || '',
          phone: profileData.phone || '',
          followerCount: 0,
          isVerified: false,
          ...profileData,
        }
      });

      return updatedProfile;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: '프로필이 성공적으로 업데이트되었습니다'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      );
    }

    console.error('PUT /api/influencer/profile error:', error);
    return NextResponse.json(
      { error: '프로필 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

