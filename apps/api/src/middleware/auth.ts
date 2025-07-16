/**
 * Authentication Middleware
 * JWT 토큰 검증 및 사용자 인증
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        type: string;
      };
    }
  }
}

export function authMiddleware(allowedRoles?: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Bearer 토큰 추출
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);

      // 토큰 검증
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        type: string;
      };

      // 사용자 확인
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          type: true,
          status: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({ error: 'Invalid user' });
      }

      // 역할 확인
      if (allowedRoles && !allowedRoles.includes(user.type)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Request에 사용자 정보 추가
      req.user = {
        id: user.id,
        email: user.email,
        type: user.type,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}

// 선택적 인증 미들웨어 (로그인하지 않아도 접근 가능)
export function optionalAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        type: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          type: true,
          status: true,
        },
      });

      if (user && user.status === 'ACTIVE') {
        req.user = {
          id: user.id,
          email: user.email,
          type: user.type,
        };
      }

      next();
    } catch (error) {
      // 토큰이 유효하지 않아도 계속 진행
      return next();
    }
  };
}