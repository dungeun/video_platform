import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 인증 미들웨어
async function authenticate(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/admin/users/[id] - 특정 사용자 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자만 접근 가능
    const userType = user.type?.toLowerCase();
    if (userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 사용자 상세 정보 조회
    const userDetail = await prisma.users.findUnique({
      where: { id: params.id },
      include: {
        profiles: true,
        business_profiles: true,
        campaigns: {
          select: {
            id: true
          }
        },
        channels: {
          select: {
            id: true,
            name: true,
            handle: true
          }
        }
      }
    });

    if (!userDetail) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 응답 데이터 포맷팅
    const formattedUser = {
      id: userDetail.id,
      name: userDetail.name,
      email: userDetail.email,
      type: userDetail.type.toLowerCase(),
      status: userDetail.status?.toLowerCase() || 'active',
      createdAt: userDetail.createdAt.toISOString().split('T')[0],
      lastLogin: userDetail.lastLogin ? userDetail.lastLogin.toISOString().split('T')[0] : '미접속',
      verified: userDetail.verified || false,
      channels: Array.isArray(userDetail.channels) ? userDetail.channels.length : (userDetail.channels ? 1 : 0),
      phone: userDetail.profiles?.phone || '미등록',
      address: userDetail.profiles?.address || '미등록',
      profile: userDetail.profiles ? {
        bio: userDetail.profiles.bio,
        instagram: userDetail.profiles.instagram,
        youtube: userDetail.profiles.youtube,
        phone: userDetail.profiles.phone,
        profileImage: userDetail.profiles.profileImage
      } : undefined
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('사용자 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '사용자 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/admin/users/[id] - 사용자 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자만 접근 가능
    const userType = user.type?.toLowerCase();
    if (userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, status, type, phone, verified, statusReason } = body;

    // 사용자 기본 정보 업데이트
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (status !== undefined) {
      updateData.status = status.toUpperCase();
      updateData.statusUpdatedAt = new Date();
    }
    
    if (type !== undefined) {
      updateData.type = type.toUpperCase();
    }
    
    if (verified !== undefined) {
      updateData.verified = verified;
    }
    
    if (statusReason !== undefined) {
      updateData.statusReason = statusReason;
    }

    // 트랜잭션으로 사용자와 프로필 업데이트
    const updatedUser = await prisma.$transaction(async (prisma) => {
      // 사용자 기본 정보 업데이트
      const user = await prisma.users.update({
        where: { id: params.id },
        data: updateData,
        include: {
          profiles: true
        }
      });

      // 전화번호가 포함된 경우 프로필 업데이트
      if (phone !== undefined) {
        // 프로필이 없으면 생성
        await prisma.profiles.upsert({
          where: { userId: params.id },
          update: { phone },
          create: {
            id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: params.id,
            phone,
            updatedAt: new Date()
          }
        });
      }

      // 업데이트된 정보 다시 조회
      return await prisma.users.findUnique({
        where: { id: params.id },
        include: {
          profiles: true
        }
      });
    });

    return NextResponse.json({
      message: '사용자 정보가 업데이트되었습니다.',
      user: updatedUser
    });
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    return NextResponse.json(
      { error: '사용자 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}