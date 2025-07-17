// Edge Runtime 호환 JWT 함수들
import { UserType } from '@prisma/client';
import { jwtVerify } from 'jose';

interface JWTPayload {
  id: string;
  email: string;
  type: UserType;
}

interface RefreshPayload {
  id: string;
}

// Edge Runtime에서 jose 라이브러리를 사용한 실제 JWT 검증
export async function verifyJWTEdge<T extends JWTPayload | RefreshPayload>(
  token: string,
  isRefreshToken = false
): Promise<T | null> {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    
    const { payload } = await jwtVerify(token, secretKey);
    
    return payload as T;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export function getTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}