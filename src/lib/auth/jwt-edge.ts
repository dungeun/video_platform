import { NextRequest } from 'next/server';

/**
 * Edge Runtime에서 사용 가능한 JWT 검증 함수
 * middleware.ts에서 사용됩니다
 */

/**
 * 헤더에서 JWT 토큰 추출
 */
export function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Edge Runtime에서 JWT 검증
 * 개발 환경에서는 mock 토큰도 지원
 */
export async function verifyJWTEdge<T = any>(token: string): Promise<T | null> {
  try {
    // 개발 환경에서 mock 토큰 처리
    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
      if (token === 'mock-admin-access-token') {
        return {
          id: 'mock-admin-id',
          email: 'admin@linkpick.co.kr',
          type: 'ADMIN',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24시간
        } as T;
      }
      if (token === 'mock-business-access-token') {
        return {
          id: 'mock-business-id',
          email: 'business@company.com',
          type: 'BUSINESS',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
        } as T;
      }
      if (token === 'mock-influencer-access-token') {
        return {
          id: 'mock-influencer-id',
          email: 'influencer@example.com',
          type: 'INFLUENCER',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
        } as T;
      }
    }

    // Edge Runtime에서는 jose 라이브러리 사용
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch (error) {
    console.error('[JWT Edge] Verification failed:', error);
    return null;
  }
}

/**
 * 토큰에서 사용자 정보 추출 (Edge Runtime용)
 */
export async function getUserFromToken(token: string | null): Promise<{
  id: string;
  email: string;
  type: string;
} | null> {
  if (!token) return null;

  try {
    const payload = await verifyJWTEdge<{
      id: string;
      email: string;
      type: string;
    }>(token);

    return payload;
  } catch {
    return null;
  }
}