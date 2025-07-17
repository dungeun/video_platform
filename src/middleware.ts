import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWTEdge, getTokenFromHeader } from '@/lib/auth/jwt-edge';

// 인증이 필요없는 public 경로들
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
  '/api/influencers', // 인플루언서 검색은 공개
  '/api/payments/confirm', // Toss 결제 콜백
  '/api/payments/callback', // 결제 콜백
  '/api/posts', // 커뮤니티 게시글 조회는 공개
  '/api/setup', // 초기 설정 API
  '/api/home', // 홈페이지 데이터 API는 공개
  '/api/ui-config', // UI 설정은 공개
];

// 인증이 필요없는 페이지 경로들
const publicPagePaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/',
  '/about',
  '/pricing',
  '/influencers',
  '/campaigns',
  '/community',
];

// GET 요청만 공개인 경로들
const publicGetPaths = [
  '/api/campaigns', // 캠페인 목록 조회는 공개
];

// 인증이 필요한 페이지 경로들
const protectedPagePaths = [
  '/admin',
  '/business',
  '/influencer',
  '/campaigns/create',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[Middleware] Request to:', pathname);

  // Public 페이지는 인증 체크 스킵
  if (publicPagePaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // API 라우트 보호
  if (pathname.startsWith('/api/')) {
    // Public API는 통과
    if (publicPaths.some(path => pathname.startsWith(path))) {
      // 하지만 게시글 관련 API는 GET만 허용
      if (pathname.startsWith('/api/posts')) {
        // GET 요청은 공개, 나머지는 인증 필요
        if (request.method !== 'GET') {
          const token = getTokenFromHeader(request.headers.get('authorization'));
          
          if (!token) {
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }

          try {
            const payload = await verifyJWTEdge<{id: string, email: string, type: string}>(token!);
            
            if (!payload) {
              return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
              );
            }
            
            // Edge Runtime에서는 DB 접근 불가, API 라우트에서 상태 확인
            // 요청 헤더에 사용자 정보 추가
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', payload.id);
            requestHeaders.set('x-user-email', payload.email);
            requestHeaders.set('x-user-type', payload.type);
            
            return NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
          } catch (error) {
            return NextResponse.json(
              { error: 'Invalid token' },
              { status: 401 }
            );
          }
        }
      }
      return NextResponse.next();
    }

    // GET 요청만 공개인 경로들 확인
    if (publicGetPaths.some(path => pathname.startsWith(path))) {
      if (request.method === 'GET') {
        return NextResponse.next();
      }
      // GET이 아닌 요청은 인증 필요
    }

    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value;
    const token = getTokenFromHeader(authHeader) || cookieToken;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      // 개발 환경에서 mock 토큰 처리
      if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
        console.log('[Middleware] Mock token detected:', token);
        
        // mock 토큰에서 타입 추출
        let userType = 'INFLUENCER';
        let userId = 'mock-user-id';
        let userEmail = 'mock@example.com';
        
        if (token === 'mock-admin-access-token') {
          userType = 'ADMIN';
          userId = 'mock-admin-id';
          userEmail = 'admin@example.com';
        } else if (token === 'mock-business-access-token') {
          userType = 'BUSINESS';
          userId = 'mock-business-id';
          userEmail = 'business@example.com';
        }
        
        // 요청 헤더에 사용자 정보 추가
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', userId);
        requestHeaders.set('x-user-email', userEmail);
        requestHeaders.set('x-user-type', userType);
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
      
      const payload = await verifyJWTEdge<{id: string, email: string, type: string}>(token!);
      
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      // Edge Runtime에서는 DB 접근 불가, API 라우트에서 상태 확인
      // 요청 헤더에 사용자 정보 추가
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload!.id);
      requestHeaders.set('x-user-email', payload!.email);
      requestHeaders.set('x-user-type', payload!.type);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  }

  // 페이지 라우트 보호
  if (protectedPagePaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 개발 환경에서 mock 토큰 처리
    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
      console.log('[Middleware] Mock token detected:', token);
      
      // mock 토큰에서 타입 추출
      let userType = 'INFLUENCER';
      if (token === 'mock-admin-access-token') {
        userType = 'ADMIN';
      } else if (token === 'mock-business-access-token') {
        userType = 'BUSINESS';
      }
      
      // 역할 기반 접근 제어 (mock 토큰용)
      if (pathname.startsWith('/admin') && userType !== 'ADMIN') {
        console.log('[Middleware] Access denied: Not admin');
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      if (pathname.startsWith('/business') && userType !== 'BUSINESS') {
        console.log('[Middleware] Access denied: Not business');
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      if (pathname.startsWith('/influencer') && userType !== 'INFLUENCER') {
        console.log('[Middleware] Access denied: Not influencer');
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      console.log('[Middleware] Mock token access granted for', userType);
      return NextResponse.next();
    }

    try {
      const payload = await verifyJWTEdge<{id: string, email: string, type: string}>(token!);
      
      if (!payload) {
        console.error('[Middleware] Invalid token');
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // 역할 기반 접근 제어
      if (pathname.startsWith('/admin') && payload!.type !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      if (pathname.startsWith('/business') && payload!.type !== 'BUSINESS') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      if (pathname.startsWith('/influencer') && payload!.type !== 'INFLUENCER') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
    } catch (error) {
      console.error('[Middleware] JWT verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};