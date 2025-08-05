import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (개발 환경에서는 임시로 우회)
    const session = await getServerSession();
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment && (!session || session.user.type !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DB에서 UI 설정 조회
    const uiConfig = await prisma.siteConfig.findUnique({
      where: { key: 'ui-config' }
    });

    if (!uiConfig) {
      // 기본 설정 반환
      const defaultConfig = {
        header: {
          logo: {
            text: 'LinkPick',
            imageUrl: null
          },
          menus: [
            { id: 'menu-1', label: '캠페인', href: '/campaigns', order: 1, visible: true },
            { id: 'menu-2', label: '인플루언서', href: '/influencers', order: 2, visible: true },
            { id: 'menu-3', label: '커뮤니티', href: '/community', order: 3, visible: true },
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
        },
        sidebar: {
          mainMenu: [
            { id: 'home', label: '홈', href: '/', icon: 'Home', order: 1, visible: true, section: 'main' },
            { id: 'live', label: '라이브', href: '/live', icon: 'Tv', order: 2, visible: true, section: 'main' },
            { id: 'videos', label: '동영상', href: '/videos', icon: 'Video', order: 3, visible: true, section: 'main' },
            { id: 'trending', label: '인기 영상', href: '/trending', icon: 'Fire', order: 4, visible: true, section: 'main' },
            { id: 'new', label: '신규 영상', href: '/new', icon: 'Plus', order: 5, visible: true, section: 'main' },
          ],
          categoryMenu: [
            { id: 'realestate', label: '부동산', href: '/category/realestate', icon: 'Building', order: 1, visible: true, section: 'category' },
            { id: 'stock', label: '주식', href: '/category/stock', icon: 'TrendingUp', order: 2, visible: true, section: 'category' },
            { id: 'car', label: '자동차', href: '/category/car', icon: 'Car', order: 3, visible: true, section: 'category' },
            { id: 'food', label: '음식', href: '/category/food', icon: 'UtensilsCrossed', order: 4, visible: true, section: 'category' },
            { id: 'travel', label: '여행', href: '/category/travel', icon: 'Plane', order: 5, visible: true, section: 'category' },
            { id: 'game', label: '게임', href: '/category/game', icon: 'Gamepad2', order: 6, visible: true, section: 'category' },
          ],
          settingsMenu: [
            { id: 'settings', label: '설정', href: '/settings', icon: 'Settings', order: 1, visible: true, section: 'settings' },
            { id: 'help', label: '도움말', href: '/help', icon: 'HelpCircle', order: 2, visible: true, section: 'settings' },
            { id: 'feedback', label: '의견 보내기', href: '/feedback', icon: 'MessageSquare', order: 3, visible: true, section: 'settings' },
          ],
          subscribedChannels: [
            { id: 'channel1', name: '지창경', avatar: 'https://i.pravatar.cc/24?img=2', isLive: true, order: 1, visible: true },
            { id: 'channel2', name: '자랑맨', avatar: 'https://i.pravatar.cc/24?img=3', isLive: false, order: 2, visible: true },
            { id: 'channel3', name: '인순효그', avatar: 'https://i.pravatar.cc/24?img=4', isLive: false, order: 3, visible: true },
            { id: 'channel4', name: '주식왕', avatar: 'https://i.pravatar.cc/24?img=5', isLive: false, order: 4, visible: true },
          ],
        },
        mainPage: {
          heroSlides: [
            {
              id: 'slide-1',
              type: 'blue' as const,
              tag: '캠페인 혜택',
              title: '브랜드와 함께하는\\n완벽한 캠페인',
              subtitle: '최대 500만원 캠페인 참여 기회',
              bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
              order: 1,
              visible: true,
            },
            {
              id: 'slide-2',
              type: 'dark' as const,
              title: '이번달, 어떤 캠페인이\\n당신을 기다릴까요?',
              subtitle: '다양한 브랜드와의 만남',
              bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
              order: 2,
              visible: true,
            },
            {
              id: 'slide-3',
              type: 'green' as const,
              title: '인플루언서 매칭 시작',
              subtitle: 'AI가 찾아주는 최적의 파트너',
              bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
              order: 3,
              visible: true,
            },
          ],
          categoryMenus: [
            { id: 'cat-1', name: '뷰티', categoryId: 'beauty', icon: '', order: 1, visible: true },
            { id: 'cat-2', name: '패션', categoryId: 'fashion', icon: '', order: 2, visible: true },
            { id: 'cat-3', name: '푸드', categoryId: 'food', icon: '', badge: 'HOT', order: 3, visible: true },
            { id: 'cat-4', name: '여행', categoryId: 'travel', icon: '', order: 4, visible: true },
            { id: 'cat-5', name: '테크', categoryId: 'tech', icon: '', order: 5, visible: true },
            { id: 'cat-6', name: '피트니스', categoryId: 'fitness', icon: '', order: 6, visible: true },
            { id: 'cat-7', name: '라이프스타일', categoryId: 'lifestyle', icon: '', order: 7, visible: true },
            { id: 'cat-8', name: '펫', categoryId: 'pet', icon: '', order: 8, visible: true },
          ],
          quickLinks: [
            { id: 'quick-1', title: '이벤트', icon: '🎁', link: '/events', order: 1, visible: true },
            { id: 'quick-2', title: '쿠폰팩', icon: '🎟️', link: '/coupons', order: 2, visible: true },
            { id: 'quick-3', title: '랭킹', icon: '🏆', link: '/ranking', order: 3, visible: true },
          ],
          promoBanner: {
            title: '처음이니까, 수수료 50% 할인',
            subtitle: '첫 캠페인을 더 가볍게 시작하세요!',
            icon: '📦',
            visible: true,
          },
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
    // 인증 확인 (개발 환경에서는 임시로 우회)
    const session = await getServerSession();
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment && (!session || session.user.type !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { config } = await request.json();

    // 중복 섹션 ID 정리
    if (config.mainPage?.sectionOrder) {
      // sectionOrder에서 중복 제거
      const seenIds = new Set<string>();
      const cleanedSectionOrder = config.mainPage.sectionOrder.filter((section: any) => {
        if (seenIds.has(section.id)) {
          console.log(`Removing duplicate section ID: ${section.id}`);
          return false;
        }
        seenIds.add(section.id);
        return true;
      });
      config.mainPage.sectionOrder = cleanedSectionOrder;
    }

    if (config.mainPage?.customSections) {
      // customSections에서 중복 제거
      const seenCustomIds = new Set<string>();
      const cleanedCustomSections = config.mainPage.customSections.filter((section: any) => {
        if (seenCustomIds.has(section.id)) {
          console.log(`Removing duplicate custom section ID: ${section.id}`);
          return false;
        }
        seenCustomIds.add(section.id);
        return true;
      });
      config.mainPage.customSections = cleanedCustomSections;
    }

    // DB에 UI 설정 저장 - JSON을 문자열로 변환
    await prisma.siteConfig.upsert({
      where: { key: 'ui-config' },
      update: { value: JSON.stringify(config) },
      create: { key: 'ui-config', value: JSON.stringify(config) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('UI config save error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}