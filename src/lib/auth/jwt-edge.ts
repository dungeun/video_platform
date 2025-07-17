// Edge Runtime 호환 JWT 함수들
import { UserType } from '@prisma/client';

interface JWTPayload {
  id: string;
  email: string;
  type: UserType;
}

interface RefreshPayload {
  id: string;
}

// Edge Runtime에서는 jose 라이브러리를 사용해야 함
export async function verifyJWTEdge<T extends JWTPayload | RefreshPayload>(
  token: string,
  isRefreshToken = false
): Promise<T | null> {
  try {
    // Edge Runtime에서는 간단한 검증만 수행
    // 실제 JWT 검증은 API 라우트에서 수행
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Base64 디코딩
    const payload = JSON.parse(atob(parts[1]));
    
    // 만료 시간 체크
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
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