import { UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';
import { signJWT, verifyJWT } from '@/lib/auth/jwt';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  userType: z.enum(['BUSINESS', 'INFLUENCER']),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

class AuthService {
  async register(data: RegisterDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('이미 사용 중인 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        type: data.userType as UserType,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        createdAt: true,
      }
    });

    const tokens = await this.generateTokens(user);
    
    return {
      user,
      ...tokens
    };
  }

  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        password: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const { password, ...userWithoutPassword } = user;
    const tokens = await this.generateTokens(userWithoutPassword);

    return {
      user: userWithoutPassword,
      ...tokens
    };
  }

  async logout(userId: string) {
    if (redis) {
      await redis.del(`refresh:${userId}`);
      await redis.del(`session:${userId}`);
    }
    return { success: true };
  }

  async refreshToken(refreshToken: string) {
    const payload = await verifyJWT<{ id: string }>(refreshToken, true);
    
    const storedToken = redis ? await redis.get(`refresh:${payload.id}`) : null;
    if (redis && storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tokens = await this.generateTokens(user);
    
    return {
      user,
      ...tokens
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        createdAt: true,
        profile: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private async generateTokens(user: { id: string; email: string; type: UserType }) {
    const accessToken = await signJWT(
      { id: user.id, email: user.email, type: user.type },
      { expiresIn: '15m' }
    );

    const refreshToken = await signJWT(
      { id: user.id },
      { expiresIn: '7d' }
    );

    // Store refresh token in Redis
    if (redis) {
      await redis.set(
        `refresh:${user.id}`,
        refreshToken,
        'EX',
        7 * 24 * 60 * 60 // 7 days
      );

      // Store session data
      await redis.set(
        `session:${user.id}`,
        JSON.stringify(user),
        'EX',
        15 * 60 // 15 minutes
      );
    }

    return {
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();

export async function verifyToken(token: string) {
  try {
    const payload = await verifyJWT(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
      }
    });
    return user;
  } catch (error) {
    return null;
  }
}