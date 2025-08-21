import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/business/profile - 비즈니스 프로필 조회
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

    // 비즈니스 사용자만 접근 가능
    if (userType !== 'BUSINESS') {
      return NextResponse.json(
        { error: '비즈니스 계정만 접근할 수 있습니다' },
        { status: 403 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        business_profiles: {
          select: {
            id: true,
            companyName: true,
            businessNumber: true,
            representativeName: true,
            businessAddress: true,
            businessCategory: true,
            isVerified: true,
            verificationNotes: true,
            verifiedAt: true,
            businessFileName: true,
            businessFileSize: true,
            businessRegistration: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        _count: {
          select: {
            campaigns: true,
            videos: true,
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

    // 비즈니스 프로필이 없는 경우 기본 프로필 생성
    if (!user.business_profiles) {
      const newProfile = await prisma.business_profiles.create({
        data: {
          userId: userId,
          companyName: '',
          businessNumber: '',
          representativeName: user.name || '',
          businessAddress: '',
          businessCategory: '',
          isVerified: false,
        }
      });

      user.business_profiles = newProfile;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        businessProfile: user.business_profiles,
        stats: {
          campaigns: user._count.campaigns,
          videos: user._count.videos,
        }
      }
    });

  } catch (error) {
    console.error('GET /api/business/profile error:', error);
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 프로필 업데이트 스키마
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  companyName: z.string().min(1).max(100).optional(),
  businessNumber: z.string().max(20).optional(),
  representativeName: z.string().min(1).max(100).optional(),
  businessAddress: z.string().max(200).optional(),
  businessCategory: z.string().max(100).optional(),
});

// PUT /api/business/profile - 비즈니스 프로필 업데이트
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

    // 비즈니스 사용자만 접근 가능
    if (userType !== 'BUSINESS') {
      return NextResponse.json(
        { error: '비즈니스 계정만 접근할 수 있습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // 사용자 기본 정보와 비즈니스 프로필 정보 분리
    const { name, ...businessData } = validatedData;

    const result = await prisma.$transaction(async (tx) => {
      // 사용자 기본 정보 업데이트
      if (name) {
        await tx.users.update({
          where: { id: userId },
          data: { name }
        });
      }

      // 비즈니스 프로필 업데이트 (upsert 사용)
      const updatedProfile = await tx.business_profiles.upsert({
        where: { userId },
        update: {
          ...businessData,
          updatedAt: new Date(),
        },
        create: {
          userId,
          companyName: businessData.companyName || '',
          businessNumber: businessData.businessNumber || '',
          representativeName: businessData.representativeName || name || '',
          businessAddress: businessData.businessAddress || '',
          businessCategory: businessData.businessCategory || '',
          isVerified: false,
          ...businessData,
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

    console.error('PUT /api/business/profile error:', error);
    return NextResponse.json(
      { error: '프로필 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}