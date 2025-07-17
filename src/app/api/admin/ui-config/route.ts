import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 미들웨어에서 설정한 헤더에서 사용자 정보 가져오기
    const userType = request.headers.get('x-user-type');
    const userId = request.headers.get('x-user-id');
    
    if (!userType || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // UI 설정 조회 - siteConfig 테이블이 없으므로 다른 방법 사용
    // TODO: Implement siteConfig table or use a different storage method
    const uiConfig = null;

    if (!uiConfig) {
      // 기본 설정 반환
      const defaultConfig = {
        header: {
          logo: {
            text: 'LinkPick',
            imageUrl: null
          },
          menus: [
            { id: 'menu-1', label: '홈', href: '/', order: 1, visible: true },
            { id: 'menu-2', label: '인플루언서', href: '/influencers', order: 2, visible: true },
            { id: 'menu-3', label: '캠페인', href: '/campaigns', order: 3, visible: true },
            { id: 'menu-4', label: '커뮤니티', href: '/community', order: 4, visible: true },
          ],
          ctaButton: {
            text: '시작하기',
            href: '/register',
            visible: true
          }
        },
        footer: {
          columns: [
            {
              id: 'column-1',
              title: '서비스',
              order: 1,
              links: [
                { id: 'link-1', label: '인플루언서 찾기', href: '/influencers', order: 1, visible: true },
                { id: 'link-2', label: '캠페인 만들기', href: '/campaigns/create', order: 2, visible: true },
              ]
            },
            {
              id: 'column-2',
              title: '회사',
              order: 2,
              links: [
                { id: 'link-3', label: '회사 소개', href: '/about', order: 1, visible: true },
                { id: 'link-4', label: '문의하기', href: '/contact', order: 2, visible: true },
              ]
            },
            {
              id: 'column-3',
              title: '법적 정보',
              order: 3,
              links: [
                { id: 'link-5', label: '이용약관', href: '/terms', order: 1, visible: true },
                { id: 'link-6', label: '개인정보처리방침', href: '/privacy', order: 2, visible: true },
              ]
            }
          ],
          copyright: '© 2024 LinkPick. All rights reserved.'
        }
      };
      
      return NextResponse.json({ config: defaultConfig });
    }

    return NextResponse.json({ config: JSON.parse(uiConfig.value) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 미들웨어에서 설정한 헤더에서 사용자 정보 가져오기
    const userType = request.headers.get('x-user-type');
    const userId = request.headers.get('x-user-id');
    
    if (!userType || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { config } = await request.json();

    // UI 설정 저장 - siteConfig 테이블이 없으므로 다른 방법 사용
    // TODO: Implement siteConfig table or use a different storage method
    console.log('UI config update requested:', config);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}