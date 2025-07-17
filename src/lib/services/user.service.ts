// UserType enum definition
enum UserType {
  ADMIN = 'ADMIN',
  BUSINESS = 'BUSINESS',
  INFLUENCER = 'INFLUENCER'
}
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/utils/errors';

// 프로필 업데이트 스키마
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

// 비밀번호 변경 스키마
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

// 비즈니스 프로필 스키마
export const profileSchema = z.object({
  companyName: z.string().min(2),
  businessNumber: z.string(),
  representativeName: z.string(),
  businessAddress: z.string(),
  businessCategory: z.string(),
});

// 인플루언서 통계 스키마
export const influencerStatsSchema = z.object({
  followerCount: z.number().optional(),
  followerCount: z.number().optional(),
  followerCount: z.number().optional(),
  followerCount: z.number().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type BusinessProfileDto = z.infer<typeof profileSchema>;
export type InfluencerStatsDto = z.infer<typeof influencerStatsSchema>;

class UserService {
  // 사용자 프로필 조회
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        createdAt: true,
        profile: true,
        _count: {
          select: {
            campaigns: true,
            applications: true,
          }
        }
      }
    });

    if (!user) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    return user;
  }

  // 공개 프로필 조회
  async getPublicProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            avatar: true,
            instagram: true,
            youtube: true,
            tiktok: true,
            categories: true,
            avatar: true,
          }
        },
        profile: true,
        _count: {
          select: {
            campaigns: true,
          }
        }
      }
    });

    if (!user) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    return user;
  }

  // 프로필 업데이트
  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    // name 업데이트
    if (data.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.name }
      });
    }

    // profile 업데이트 또는 생성
    const profileData = {
      bio: data.bio,
      avatar: data.avatar,
      phone: data.phone,
      instagram: data.instagram,
      youtube: data.youtube,
      tiktok: data.tiktok,
      categories: data.categories ? JSON.stringify(data.categories) : undefined,
    };

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });

    return {
      ...user,
      name: data.name || user.name,
      profile
    };
  }

  // 비밀번호 변경
  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError('현재 비밀번호가 일치하지 않습니다.', 400);
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { success: true };
  }

  // 비즈니스 프로필 생성/업데이트
  async updateBusinessProfile(userId: string, data: BusinessProfileDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.type !== UserType.BUSINESS) {
      throw new ApiError('비즈니스 계정만 이용할 수 있습니다.', 403);
    }

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });

    return profile;
  }

  // 인플루언서 통계 업데이트
  async updateInfluencerStats(userId: string, data: InfluencerStatsDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.type !== UserType.INFLUENCER) {
      throw new ApiError('인플루언서만 이용할 수 있습니다.', 403);
    }

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });

    return profile;
  }

  // 사용자 목록 조회 (관리자용)
  async getUsers(filters: {
    type?: UserType;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          type: true,
          createdAt: true,
          profile: {
            select: {
              avatar: true,
              avatar: true,
            }
          },
          profile: {
            select: {
              companyName: true,
              avatar: true,
            }
          },
          _count: {
            select: {
              campaigns: true,
              applications: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 계정 삭제
  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('비밀번호가 일치하지 않습니다.', 400);
    }

    // 관련 데이터 삭제는 Prisma cascade 설정에 따름
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true };
  }

  // 사용자 상태 확인
  async checkUserStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        statusReason: true,
        statusUpdatedAt: true
      }
    });

    if (!user) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    if (user.status === 'BANNED') {
      throw new ApiError('차단된 계정입니다.', 403);
    }

    if (user.status === 'SUSPENDED') {
      throw new ApiError(`일시 정지된 계정입니다. 사유: ${user.statusReason || '정책 위반'}`, 403);
    }

    return user;
  }

  // 팔로우 기능
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ApiError('자기 자신을 팔로우할 수 없습니다.', 400);
    }

    const following = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!following) {
      throw new ApiError('사용자를 찾을 수 없습니다.', 404);
    }

    // 이미 팔로우 중인지 확인
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      throw new ApiError('이미 팔로우 중입니다.', 400);
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatar: true
              }
            }
          }
        }
      }
    });

    return follow;
  }

  // 언팔로우
  async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (!follow) {
      throw new ApiError('팔로우 관계가 없습니다.', 404);
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    return { success: true };
  }

  // 팔로워 목록
  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              type: true,
              profile: {
                select: {
                  bio: true,
                  avatar: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.follow.count({ where: { followingId: userId } })
    ]);

    return {
      followers: followers.map(f => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 팔로잉 목록
  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        include: {
          following: {
            select: {
              id: true,
              name: true,
              type: true,
              profile: {
                select: {
                  bio: true,
                  avatar: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.follow.count({ where: { followerId: userId } })
    ]);

    return {
      following: following.map(f => f.following),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // 인플루언서 검색
  async searchInfluencers(filters: {
    search?: string;
    categories?: string[];
    minFollowers?: number;
    platform?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, categories, minFollowers, platform, verified, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      type: UserType.INFLUENCER
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { profile: { bio: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (categories && categories.length > 0) {
      where.profile = {
        categories: {
          hasSome: categories
        }
      };
    }

    if (verified !== undefined) {
      where.profile = {
        ...where.profile,
        avatar: verified
      };
    }

    if (minFollowers) {
      where.profile = {
        ...where.profile,
        OR: [
          { followerCount: { gte: minFollowers } },
          { followerCount: { gte: minFollowers } },
          { followerCount: { gte: minFollowers } }
        ]
      };
    }

    const [influencers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          createdAt: true,
          profile: {
            select: {
              bio: true,
              avatar: true,
              categories: true,
              avatar: true,
              followerCount: true
            }
          },
          _count: {
            select: {
              applications: {
                where: {
                  status: 'APPROVED'
                }
              }
            }
          }
        },
        orderBy: [
          { profile: { followerCount: 'desc' } }
        ]
      }),
      prisma.user.count({ where })
    ]);

    return {
      influencers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const userService = new UserService();